import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface QuickAddInputProps {
  onAddItems: (itemNames: string[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export const QuickAddInput: React.FC<QuickAddInputProps> = ({
  onAddItems,
  placeholder = "Milch, Brot, Butter...",
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
    <form onSubmit={handleSubmit} className="d-flex gap-2 mb-3">
      <div className="flex-grow-1">
        <input
          type="text"
          className="form-control"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
        />
        <small className="text-muted mt-1">
          💡 Mehrere Items mit Komma trennen: "Milch, Brot, Butter"
        </small>
      </div>
      <Button
        type="submit"
        variant="primary"
        disabled={disabled || isLoading || !input.trim()}
        isLoading={isLoading}
        style={{ height: '38px' }} // Match form-control height
        className="d-flex align-items-center justify-content-center"
      >
        <i className="bi bi-plus-lg"></i>
      </Button>
    </form>
  );
};