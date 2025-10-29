import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface QuickAddInputProps {
  onAddItems: (itemNames: string[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export const QuickAddInput: React.FC<QuickAddInputProps> = ({
  onAddItems,
  placeholder = "Neue Items",
  disabled = false
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      // Kommata-getrennte Items parsen und trimmen
      const itemNames = input
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      if (itemNames.length > 0) {
        await onAddItems(itemNames);
        setInput(''); // Input nach erfolgreichem Hinzufügen leeren
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="mb-4">
      {/* Mobile-optimiertes Add Input */}
      <form onSubmit={handleSubmit}>
        <div className="d-flex gap-2">
          <div className="flex-grow-1">
            <input
              type="text"
              className="form-control form-control-lg border-2"
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              style={{
                borderRadius: '12px',
                fontSize: '16px', // Verhindert Zoom auf iOS
                paddingLeft: '16px',
                paddingRight: '16px'
              }}
            />
          </div>
          
          {/* Mobile-optimierter Plus Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={disabled || isLoading || !input.trim()}
            isLoading={isLoading}
            className="d-flex align-items-center justify-content-center px-3"
            style={{ 
              height: '48px', // Größer für Touch
              borderRadius: '12px',
              minWidth: '48px'
            }}
          >
            <i className="bi bi-plus-lg fs-5"></i>
          </Button>
        </div>
        
        {/* Mobile-optimierter Hinweis */}
        <div className="mt-2 px-1">
          <small className="text-muted">
            Mehrere Items mit Komma trennen: "Milch, Brot, Butter"
          </small>
        </div>
      </form>
    </div>
  );
};