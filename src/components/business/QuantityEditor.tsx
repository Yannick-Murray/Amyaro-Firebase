import React from 'react';
import { Button } from '../ui/Button';

interface QuantityEditorProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const QuantityEditor: React.FC<QuantityEditorProps> = ({
  quantity,
  onQuantityChange,
  disabled = false,
  size = 'sm'
}) => {
  const handleDecrease = async () => {
    if (quantity > 1) {
      await onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = async () => {
    if (quantity < 9) {
      await onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="d-flex align-items-center">
      <Button
        variant="outline-secondary"
        size={size}
        onClick={handleDecrease}
        disabled={disabled || quantity <= 1}
        className="rounded-end-0"
        style={{ minWidth: '32px' }}
      >
        <i className="bi bi-dash"></i>
      </Button>
      
      <span 
        className="px-3 py-1 bg-light border-top border-bottom text-center fw-bold"
        style={{ 
          minWidth: '40px',
          fontSize: size === 'sm' ? '0.875rem' : '1rem'
        }}
      >
        {quantity}
      </span>
      
      <Button
        variant="outline-secondary"
        size={size}
        onClick={handleIncrease}
        disabled={disabled || quantity >= 9}
        className="rounded-start-0"
        style={{ minWidth: '32px' }}
      >
        <i className="bi bi-plus"></i>
      </Button>
    </div>
  );
};