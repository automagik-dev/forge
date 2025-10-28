import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ColumnHeaderProps {
  columnName: 'Wish' | 'Forge' | 'Review';
  icon: LucideIcon;
  taskCount: number;
  isWidgetOpen: boolean;
  onIconClick: () => void;
  onMenuClick?: () => void;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  columnName,
  icon: IconComponent,
  taskCount,
  isWidgetOpen,
  onIconClick,
  onMenuClick,
}) => {
  return (
    <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <button
          onClick={onIconClick}
          className={`p-1.5 rounded-lg transition-all ${
            isWidgetOpen
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-gray-200 text-gray-600'
          }`}
          aria-label={`Toggle ${columnName} widget`}
          title={`Click to chat with ${columnName} agent`}
        >
          <IconComponent size={20} />
        </button>
        <span className="font-semibold text-gray-900">{columnName}</span>
        <span className="text-sm text-gray-500">({taskCount})</span>
      </div>
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600"
          aria-label="Column menu"
        >
          ⋮
        </button>
      )}
    </div>
  );
};
