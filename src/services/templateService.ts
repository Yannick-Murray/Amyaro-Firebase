import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { logger } from '../utils/logger';
import { CategoryService, ItemService, ListService } from './listService';
import { TEMPLATE_LIMITS } from '../types/listTemplate';
import type {
  ListTemplate,
  ListTemplateCategory,
  ListTemplateItem
} from '../types/listTemplate';

export class TemplateService {
  private static readonly COLLECTION = 'listTemplates';

  private static requireUserId(): string {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('Benutzer muss angemeldet sein');
    }
    return userId;
  }

  /**
   * Alle Vorlagen des angemeldeten Users, alphabetisch sortiert.
   * Sortierung bewusst clientseitig, um keinen Composite Index zu benötigen.
   */
  static async getUserTemplates(): Promise<ListTemplate[]> {
    try {
      const userId = this.requireUserId();

      const snapshot = await getDocs(
        query(collection(db, this.COLLECTION), where('userId', '==', userId))
      );

      const templates = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as ListTemplate));

      return templates.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    } catch (error) {
      logger.error('Fehler beim Laden der Vorlagen:', error);
      throw error;
    }
  }

  /**
   * Liest Kategorien und Artikel einer Liste und baut daraus den Vorlagen-Snapshot.
   * Der Abhak-Status wird bewusst nicht übernommen, eine Vorlage startet immer offen.
   */
  private static async buildSnapshotFromList(listId: string): Promise<{
    categories: ListTemplateCategory[];
    items: ListTemplateItem[];
  }> {
    const [categories, items] = await Promise.all([
      CategoryService.getListCategories(listId),
      ItemService.getListItems(listId)
    ]);

    if (categories.length > TEMPLATE_LIMITS.MAX_CATEGORIES) {
      throw new Error(
        `Eine Vorlage darf maximal ${TEMPLATE_LIMITS.MAX_CATEGORIES} Kategorien enthalten`
      );
    }

    if (items.length > TEMPLATE_LIMITS.MAX_ITEMS) {
      throw new Error(
        `Eine Vorlage darf maximal ${TEMPLATE_LIMITS.MAX_ITEMS} Artikel enthalten`
      );
    }

    if (categories.length === 0 && items.length === 0) {
      throw new Error('Die Liste ist leer und kann nicht als Vorlage gespeichert werden');
    }

    const categoryIdToName = new Map<string, string>();
    categories.forEach(category => categoryIdToName.set(category.id, category.name));

    const templateCategories: ListTemplateCategory[] = categories.map((category, index) => ({
      name: category.name,
      color: category.color || '#6c757d',
      order: index
    }));

    const templateItems: ListTemplateItem[] = items.map((item, index) => {
      const templateItem: ListTemplateItem = {
        name: item.name,
        quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
        order: index
      };

      const categoryName = item.categoryId ? categoryIdToName.get(item.categoryId) : undefined;
      if (categoryName) {
        templateItem.categoryName = categoryName;
      }

      return templateItem;
    });

    return { categories: templateCategories, items: templateItems };
  }

  /**
   * Legt eine neue Vorlage aus einer bestehenden Einkaufsliste an.
   */
  static async createTemplateFromList(listId: string, name: string): Promise<string> {
    try {
      const userId = this.requireUserId();
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error('Bitte gib einen Namen für die Vorlage ein');
      }

      if (trimmedName.length > TEMPLATE_LIMITS.MAX_NAME_LENGTH) {
        throw new Error(
          `Der Name darf maximal ${TEMPLATE_LIMITS.MAX_NAME_LENGTH} Zeichen lang sein`
        );
      }

      const existingTemplates = await this.getUserTemplates();

      if (existingTemplates.length >= TEMPLATE_LIMITS.MAX_TEMPLATES_PER_USER) {
        throw new Error(
          `Du kannst maximal ${TEMPLATE_LIMITS.MAX_TEMPLATES_PER_USER} Vorlagen speichern`
        );
      }

      const nameTaken = existingTemplates.some(
        template => template.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (nameTaken) {
        throw new Error('Eine Vorlage mit diesem Namen existiert bereits');
      }

      const snapshot = await this.buildSnapshotFromList(listId);
      const now = Timestamp.now();

      const docRef = await addDoc(collection(db, this.COLLECTION), {
        userId,
        name: trimmedName,
        type: 'shopping',
        categories: snapshot.categories,
        items: snapshot.items,
        createdAt: now,
        updatedAt: now
      });

      logger.log('Vorlage erstellt:', docRef.id);
      return docRef.id;
    } catch (error) {
      logger.error('Fehler beim Erstellen der Vorlage:', error);
      throw error;
    }
  }

  /**
   * Überschreibt den Inhalt einer bestehenden Vorlage mit dem aktuellen Stand einer Liste.
   */
  static async overwriteTemplateFromList(templateId: string, listId: string): Promise<void> {
    try {
      this.requireUserId();

      const snapshot = await this.buildSnapshotFromList(listId);

      await updateDoc(doc(db, this.COLLECTION, templateId), {
        categories: snapshot.categories,
        items: snapshot.items,
        updatedAt: Timestamp.now()
      });

      logger.log('Vorlage aktualisiert:', templateId);
    } catch (error) {
      logger.error('Fehler beim Aktualisieren der Vorlage:', error);
      throw error;
    }
  }

  static async renameTemplate(templateId: string, name: string): Promise<void> {
    try {
      this.requireUserId();
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error('Bitte gib einen Namen für die Vorlage ein');
      }

      if (trimmedName.length > TEMPLATE_LIMITS.MAX_NAME_LENGTH) {
        throw new Error(
          `Der Name darf maximal ${TEMPLATE_LIMITS.MAX_NAME_LENGTH} Zeichen lang sein`
        );
      }

      const existingTemplates = await this.getUserTemplates();
      const nameTaken = existingTemplates.some(
        template =>
          template.id !== templateId &&
          template.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (nameTaken) {
        throw new Error('Eine Vorlage mit diesem Namen existiert bereits');
      }

      await updateDoc(doc(db, this.COLLECTION, templateId), {
        name: trimmedName,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      logger.error('Fehler beim Umbenennen der Vorlage:', error);
      throw error;
    }
  }

  /**
   * Löscht eine Vorlage endgültig. Anders als bei Shops referenziert nichts
   * auf Vorlagen, ein Soft Delete wäre hier also nur toter Ballast.
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      this.requireUserId();
      await deleteDoc(doc(db, this.COLLECTION, templateId));
      logger.log('Vorlage gelöscht:', templateId);
    } catch (error) {
      logger.error('Fehler beim Löschen der Vorlage:', error);
      throw error;
    }
  }

  /**
   * Legt Kategorien und Artikel einer Vorlage in einer Liste an.
   * Wird nur ausgeführt, wenn die Liste noch leer ist, damit ein doppelter
   * Aufruf keine Duplikate erzeugt.
   */
  static async applyTemplateToList(listId: string, template: ListTemplate): Promise<void> {
    try {
      const currentUserId = this.requireUserId();

      const listDoc = await getDoc(doc(db, 'lists', listId));
      if (!listDoc.exists()) {
        throw new Error('Liste wurde nicht gefunden');
      }

      const listData = listDoc.data() as { userId?: string; sharedWith?: string[] };
      const hasAccess =
        listData.userId === currentUserId ||
        (Array.isArray(listData.sharedWith) && listData.sharedWith.includes(currentUserId));

      if (!hasAccess) {
        throw new Error('Keine Berechtigung für diese Liste');
      }

      const existingItemsSnap = await getDocs(
        query(collection(db, 'todoItems'), where('listId', '==', listId), limit(1))
      );
      if (!existingItemsSnap.empty) {
        return;
      }

      const categoryNameToId = new Map<string, string>();
      const sortedCategories = [...template.categories].sort((a, b) => a.order - b.order);

      for (const category of sortedCategories) {
        const newId = await CategoryService.createListCategory(
          listId,
          category.name,
          category.color
        );
        categoryNameToId.set(category.name.toLowerCase().trim(), newId);
      }

      if (template.items.length === 0) {
        return;
      }

      const batch = writeBatch(db);
      const now = Timestamp.now();
      const sortedItems = [...template.items].sort((a, b) => a.order - b.order);

      sortedItems.forEach((item, index) => {
        const docRef = doc(collection(db, 'todoItems'));
        const categoryId = item.categoryName
          ? categoryNameToId.get(item.categoryName.toLowerCase().trim())
          : undefined;

        const itemData: Record<string, unknown> = {
          listId,
          name: item.name,
          quantity: item.quantity,
          isCompleted: false,
          priority: 'medium',
          createdAt: now,
          updatedAt: now,
          order: (index + 1) * 1000
        };
        if (categoryId) itemData.categoryId = categoryId;

        batch.set(docRef, itemData);
      });

      await batch.commit();
      await ListService.updateListItemCount(listId);
    } catch (error) {
      logger.error('Fehler beim Anwenden der Vorlage:', error);
      throw error;
    }
  }
}
