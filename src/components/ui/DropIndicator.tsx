import React from 'react';

interface DropIndicatorProps {
  isVisible: boolean;
  position: 'top' | 'bottom' | 'middle';
  itemName?: string;
}

export const DropIndicator: React.FC<DropIndicatorProps> = ({ 
  isVisible, 
  position, 
  itemName 
}) => {
  if (!isVisible) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'border-top border-primary border-3 mb-2';
      case 'bottom':
        return 'border-bottom border-primary border-3 mt-2';
      case 'middle':
        return 'bg-primary bg-opacity-10 border border-primary border-2 rounded py-3';
    }
  };

  const getIndicatorText = () => {
    switch (position) {
      case 'top':
        return '↑ Hier einfügen';
      case 'bottom':
        return '↓ Hier einfügen';
      case 'middle':
        return `📁 In "${itemName}" verschieben`;
    }
  };

  return (
    <div className={`drop-indicator ${getPositionClasses()}`}>
      {position === 'middle' && (
        <div className="text-center text-primary fw-bold small">
          {getIndicatorText()}
        </div>
      )}
      {position !== 'middle' && (
        <div className="position-relative">
          <div 
            className="position-absolute start-50 translate-middle-x bg-primary text-white px-2 py-1 rounded-pill small"
            style={{ top: position === 'top' ? '-8px' : '8px' }}
          >
            {getIndicatorText()}
          </div>
        </div>
      )}
    </div>
  );
};