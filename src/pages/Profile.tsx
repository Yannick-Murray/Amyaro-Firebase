import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DeleteAccountModal, ProfileEditModal } from '../components/business';
import { ManageShopModal } from '../components/business/ManageShopModal';
import { ManageTemplateModal } from '../components/business/ManageTemplateModal';
import type { TemplateModalResult } from '../components/business/ManageTemplateModal';
import { Modal, Toast } from '../components/ui';
import { ShopService } from '../services/shopService';
import { TemplateService } from '../services/templateService';
import type { Shop } from '../types/todoList';
import type { ListTemplate } from '../types/listTemplate';

const Profile = () => {
  const { user, logout, refreshUserData } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopModalMode, setShopModalMode] = useState<'create' | 'edit'>('create');
  const [editingShop, setEditingShop] = useState<Shop | undefined>();
  const [userShops, setUserShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);
  const [templates, setTemplates] = useState<ListTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateToRename, setTemplateToRename] = useState<ListTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ListTemplate | null>(null);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Lade User-Shops
  useEffect(() => {
    if (user) {
      loadUserShops();
      loadTemplates();
    }
  }, [user]);

  const loadUserShops = async () => {
    setIsLoadingShops(true);
    try {
      const shops = await ShopService.getUserShops();
      setUserShops(shops);
    } catch (error) {
      console.error('Fehler beim Laden der Shops:', error);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      setTemplates(await TemplateService.getUserTemplates());
    } catch (error) {
      console.error('Fehler beim Laden der Vorlagen:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileUpdated = async () => {
    setShowProfileEditModal(false);
    try {
      await refreshUserData();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const handleCreateShop = () => {
    setShopModalMode('create');
    setEditingShop(undefined);
    setShowShopModal(true);
  };

  const handleEditShop = (shop: Shop) => {
    setShopModalMode('edit');
    setEditingShop(shop);
    setShowShopModal(true);
  };

  const handleDeleteShop = (shop: Shop) => {
    setShopToDelete(shop);
  };

  const performDeleteShop = async () => {
    if (!shopToDelete) return;

    const shop = shopToDelete;
    setShopToDelete(null);

    try {
      await ShopService.deleteUserShop(shop.id);
      await loadUserShops();
      showToast(`Shop "${shop.displayName}" wurde gelöscht`, 'success');
    } catch (error) {
      console.error('Fehler beim Löschen des Shops:', error);
      showToast('Fehler beim Löschen des Shops', 'error');
    }
  };

  const handleSaveShop = async (displayName: string, category?: string, order?: number) => {
    try {
      if (shopModalMode === 'create') {
        await ShopService.createUserShop(displayName, category);
      } else if (editingShop) {
        await ShopService.updateUserShop(editingShop.id, {
          displayName,
          category,
          order
        });
      }
      await loadUserShops();
      setShowShopModal(false);
    } catch (error) {
      console.error('Fehler beim Speichern des Shops:', error);
      throw error;
    }
  };

  const handleRenameTemplate = async (result: TemplateModalResult) => {
    if (result.action !== 'rename' || !templateToRename) return;

    await TemplateService.renameTemplate(templateToRename.id, result.name);
    await loadTemplates();
    showToast('Vorlage wurde umbenannt', 'success');
  };

  const performDeleteTemplate = async () => {
    if (!templateToDelete) return;

    const template = templateToDelete;
    setTemplateToDelete(null);

    try {
      await TemplateService.deleteTemplate(template.id);
      await loadTemplates();
      showToast(`Vorlage "${template.name}" wurde gelöscht`, 'success');
    } catch (error) {
      console.error('Fehler beim Löschen der Vorlage:', error);
      showToast('Fehler beim Löschen der Vorlage', 'error');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="amyaro-card p-4">
            <div className="text-center mb-4">
              <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profil" className="rounded-circle" style={{width: '80px', height: '80px'}} />
                ) : (
                  <i className="bi bi-person-circle display-4"></i>
                )}
              </div>
              <h2>{user.displayName || 'Unbekannter Benutzer'}</h2>
              <p className="text-muted">{user.email}</p>
            </div>

            <div className="mb-4">
              <h5 className="mb-3">Account-Informationen</h5>
              <div className="row">
                <div className="col-sm-4">
                  <strong>Name:</strong>
                </div>
                <div className="col-sm-8">
                  {user.displayName || 'Nicht angegeben'}
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-sm-4">
                  <strong>E-Mail:</strong>
                </div>
                <div className="col-sm-8">
                  {user.email}
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-sm-4">
                  <strong>Registriert:</strong>
                </div>
                <div className="col-sm-8">
                  {new Date(user.createdAt).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Meine Shops Section */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Meine Shops</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleCreateShop}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Shop hinzufügen
                </button>
              </div>
              
              {isLoadingShops ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Lädt...</span>
                  </div>
                </div>
              ) : userShops.length === 0 ? (
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Du hast noch keine eigenen Shops angelegt. Shops können beim Abschließen einer Liste gespeichert werden oder hier manuell hinzugefügt werden.
                </div>
              ) : (
                <div className="list-group">
                  {userShops.map(shop => (
                    <div 
                      key={shop.id} 
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{shop.displayName}</strong>
                        {shop.category && (
                          <span className="badge bg-secondary ms-2">
                            {shop.category === 'discount' && 'Discounter'}
                            {shop.category === 'supermarket' && 'Supermarkt'}
                            {shop.category === 'drugstore' && 'Drogerie'}
                            {shop.category === 'specialty' && 'Fachgeschäft'}
                            {shop.category === 'online' && 'Online-Shop'}
                            {shop.category === 'other' && 'Sonstiges'}
                          </span>
                        )}
                      </div>
                      <div>
                        <button 
                          className="btn btn-sm btn-outline-secondary me-2"
                          onClick={() => handleEditShop(shop)}
                          title="Bearbeiten"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteShop(shop)}
                          title="Löschen"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Meine Vorlagen Section */}
            <div className="mb-4">
              <h5 className="mb-3">Meine Vorlagen</h5>

              {isLoadingTemplates ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Lädt...</span>
                  </div>
                </div>
              ) : templates.length === 0 ? (
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Du hast noch keine Vorlagen. Öffne eine Einkaufsliste und wähle im Menü
                  "Als Vorlage speichern", um ihre Kategorien und Artikel zu sichern.
                </div>
              ) : (
                <div className="list-group">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div className="me-2 text-truncate">
                        <strong className="d-block text-truncate">{template.name}</strong>
                        <small className="text-muted">
                          {template.categories.length}{' '}
                          {template.categories.length === 1 ? 'Kategorie' : 'Kategorien'}
                          {' · '}
                          {template.items.length} Artikel
                        </small>
                      </div>
                      <div className="text-nowrap">
                        <button
                          className="btn btn-sm btn-outline-secondary me-2"
                          onClick={() => setTemplateToRename(template)}
                          title="Umbenennen"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setTemplateToDelete(template)}
                          title="Löschen"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="d-grid gap-2">
              <button 
                className="btn btn-outline-primary"
                onClick={() => setShowProfileEditModal(true)}
              >
                <i className="bi bi-person-gear me-2"></i>
                Profil bearbeiten
              </button>
              <button className="btn btn-outline-secondary" disabled>
                <i className="bi bi-key me-2"></i>
                Passwort ändern (Coming Soon)
              </button>
              <hr />
              
              {/* 🔒 GDPR: Account Deletion */}
              <button
                className="btn btn-outline-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="bi bi-trash me-2"></i>
                Account permanent löschen
              </button>
              
              <hr />
              <button 
                className="btn btn-danger"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        user={user}
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
        user={user}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Manage Shop Modal */}
      <ManageShopModal
        isOpen={showShopModal}
        onClose={() => setShowShopModal(false)}
        onSave={handleSaveShop}
        mode={shopModalMode}
        existingShop={editingShop}
      />

      {/* Delete Shop Confirmation Modal */}
      <Modal
        isOpen={shopToDelete !== null}
        onClose={() => setShopToDelete(null)}
        size="sm"
      >
        <div className="modal-header border-0">
          <h5 className="modal-title d-flex align-items-center text-danger">
            <i className="bi bi-trash3-fill me-2"></i>
            Shop löschen
          </h5>
        </div>
        <div className="modal-body">
          <p className="mb-0">
            <strong>Shop "{shopToDelete?.displayName}" wirklich löschen?</strong>
          </p>
        </div>
        <div className="modal-footer border-0">
          <div className="d-flex gap-2 w-100">
            <button
              type="button"
              className="btn btn-outline-secondary flex-fill"
              onClick={() => setShopToDelete(null)}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className="btn btn-danger flex-fill"
              onClick={performDeleteShop}
            >
              <i className="bi bi-trash3 me-1"></i>
              Löschen
            </button>
          </div>
        </div>
      </Modal>

      {/* Vorlage umbenennen */}
      <ManageTemplateModal
        isOpen={templateToRename !== null}
        onClose={() => setTemplateToRename(null)}
        mode="rename"
        template={templateToRename ?? undefined}
        onSave={handleRenameTemplate}
      />

      {/* Delete Template Confirmation Modal */}
      <Modal
        isOpen={templateToDelete !== null}
        onClose={() => setTemplateToDelete(null)}
        size="sm"
      >
        <div className="modal-header border-0">
          <h5 className="modal-title d-flex align-items-center text-danger">
            <i className="bi bi-trash3-fill me-2"></i>
            Vorlage löschen
          </h5>
        </div>
        <div className="modal-body">
          <p className="mb-0">
            <strong>Vorlage "{templateToDelete?.name}" wirklich löschen?</strong>
          </p>
          <small className="text-muted">
            Bereits erstellte Listen bleiben davon unberührt.
          </small>
        </div>
        <div className="modal-footer border-0">
          <div className="d-flex gap-2 w-100">
            <button
              type="button"
              className="btn btn-outline-secondary flex-fill"
              onClick={() => setTemplateToDelete(null)}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className="btn btn-danger flex-fill"
              onClick={performDeleteTemplate}
            >
              <i className="bi bi-trash3 me-1"></i>
              Löschen
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default Profile;