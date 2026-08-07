import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TEMPLATE_LIMITS } from '../../types/listTemplate';
import type { ListTemplate } from '../../types/listTemplate';

export type TemplateModalResult =
  | { action: 'create'; name: string }
  | { action: 'overwrite'; templateId: string }
  | { action: 'rename'; name: string };

interface ManageTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create-from-list' | 'rename';
  onSave: (result: TemplateModalResult) => Promise<void>;
  /** Vorhandene Vorlagen, um im Modus create-from-list überschreiben zu können */
  existingTemplates?: ListTemplate[];
  /** Die umzubenennende Vorlage im Modus rename */
  template?: ListTemplate;
  /** Vorschlag für den Namen einer neuen Vorlage, z.B. der Listenname */
  suggestedName?: string;
}

export function ManageTemplateModal({
  isOpen,
  onClose,
  mode,
  onSave,
  existingTemplates = [],
  template,
  suggestedName
}: ManageTemplateModalProps) {
  const [target, setTarget] = useState<'new' | 'existing'>('new');
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templateCount = existingTemplates.length;
  const firstTemplateId = existingTemplates[0]?.id ?? '';
  const currentName = template?.name ?? '';

  const canOverwrite = mode === 'create-from-list' && templateCount > 0;
  const limitReached =
    mode === 'create-from-list' && templateCount >= TEMPLATE_LIMITS.MAX_TEMPLATES_PER_USER;

  // Abhängigkeiten bewusst auf primitive Werte reduziert, damit eine neue
  // Array-Referenz vom Parent nicht die Eingaben des Nutzers zurücksetzt.
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'rename') {
      setTarget('new');
      setName(currentName);
      setTemplateId('');
    } else {
      const startWithExisting = templateCount >= TEMPLATE_LIMITS.MAX_TEMPLATES_PER_USER;
      setTarget(startWithExisting ? 'existing' : 'new');
      setName(suggestedName?.slice(0, TEMPLATE_LIMITS.MAX_NAME_LENGTH) ?? '');
      setTemplateId(firstTemplateId);
    }

    setError('');
  }, [isOpen, mode, currentName, suggestedName, templateCount, firstTemplateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let result: TemplateModalResult;

    if (mode === 'create-from-list' && target === 'existing') {
      if (!templateId) {
        setError('Bitte wähle die Vorlage aus, die überschrieben werden soll');
        return;
      }
      result = { action: 'overwrite', templateId };
    } else {
      const trimmed = name.trim();
      if (!trimmed) {
        setError('Bitte gib einen Namen für die Vorlage ein');
        return;
      }
      if (trimmed.length > TEMPLATE_LIMITS.MAX_NAME_LENGTH) {
        setError(`Der Name darf maximal ${TEMPLATE_LIMITS.MAX_NAME_LENGTH} Zeichen lang sein`);
        return;
      }
      result = mode === 'rename' ? { action: 'rename', name: trimmed } : { action: 'create', name: trimmed };
    }

    setIsSubmitting(true);
    try {
      await onSave(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern der Vorlage');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'rename' ? 'Vorlage umbenennen' : 'Als Vorlage speichern'}
    >
      <form onSubmit={handleSubmit}>
        {mode === 'create-from-list' && (
          <p className="text-muted small mb-3">
            Die Kategorien und Artikel dieser Liste werden als Vorlage gespeichert.
            Abgehakte Artikel sind beim Anwenden wieder offen.
          </p>
        )}

        {canOverwrite && (
          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="template-target"
                id="template-target-new"
                checked={target === 'new'}
                onChange={() => setTarget('new')}
                disabled={isSubmitting || limitReached}
              />
              <label className="form-check-label" htmlFor="template-target-new">
                Neue Vorlage anlegen
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="template-target"
                id="template-target-existing"
                checked={target === 'existing'}
                onChange={() => setTarget('existing')}
                disabled={isSubmitting}
              />
              <label className="form-check-label" htmlFor="template-target-existing">
                Bestehende Vorlage überschreiben
              </label>
            </div>
            {limitReached && (
              <small className="text-muted d-block mt-1">
                Du hast das Maximum von {TEMPLATE_LIMITS.MAX_TEMPLATES_PER_USER} Vorlagen
                erreicht. Überschreibe eine bestehende Vorlage oder lösche eine im Profil.
              </small>
            )}
          </div>
        )}

        {mode === 'create-from-list' && target === 'existing' ? (
          <div className="mb-3">
            <label htmlFor="template-select" className="form-label">
              Vorlage <span className="text-danger">*</span>
            </label>
            <select
              id="template-select"
              className="form-select"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={isSubmitting}
            >
              {existingTemplates.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mb-3">
            <label htmlFor="template-name" className="form-label">
              Name der Vorlage <span className="text-danger">*</span>
            </label>
            <input
              id="template-name"
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Wocheneinkauf"
              maxLength={TEMPLATE_LIMITS.MAX_NAME_LENGTH}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="d-flex gap-2 justify-content-end">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
