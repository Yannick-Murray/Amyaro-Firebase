import React from 'react';
import type { ListTemplate } from '../../types/listTemplate';

export interface TemplateSelectorProps {
  templates: ListTemplate[];
  selectedTemplateId: string | null;
  onSelect: (templateId: string | null) => void;
  loading?: boolean;
  disabled?: boolean;
}

const describeTemplate = (template: ListTemplate): string => {
  const categoryCount = template.categories?.length ?? 0;
  const itemCount = template.items?.length ?? 0;
  const categoryLabel = categoryCount === 1 ? 'Kategorie' : 'Kategorien';
  const itemLabel = itemCount === 1 ? 'Artikel' : 'Artikel';
  return `${categoryCount} ${categoryLabel} · ${itemCount} ${itemLabel}`;
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelect,
  loading = false,
  disabled = false
}) => {
  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 text-muted small">
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Vorlagen werden geladen...
      </div>
    );
  }

  return (
    <div className="list-type-selector" role="radiogroup" aria-label="Vorlage auswählen">
      <button
        type="button"
        role="radio"
        aria-checked={selectedTemplateId === null}
        className={`list-type-option ${selectedTemplateId === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
        disabled={disabled}
      >
        <span className="list-type-icon" aria-hidden="true">
          <i className="bi bi-file-earmark"></i>
        </span>
        <span className="list-type-content">
          <span className="list-type-title">Leere Liste</span>
          <span className="list-type-subtitle">Ohne Kategorien und Artikel starten</span>
        </span>
      </button>

      {templates.map(template => (
        <button
          key={template.id}
          type="button"
          role="radio"
          aria-checked={selectedTemplateId === template.id}
          className={`list-type-option ${selectedTemplateId === template.id ? 'active' : ''}`}
          onClick={() => onSelect(template.id)}
          disabled={disabled}
        >
          <span className="list-type-icon" aria-hidden="true">
            <i className="bi bi-bookmark-fill"></i>
          </span>
          <span className="list-type-content">
            <span className="list-type-title text-truncate">{template.name}</span>
            <span className="list-type-subtitle">{describeTemplate(template)}</span>
          </span>
        </button>
      ))}
    </div>
  );
};
