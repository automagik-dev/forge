import React from 'react';
import { WorkflowDefinition } from './types';

interface WorkflowButtonProps {
  workflow: WorkflowDefinition;
  onClick: () => void;
  isLoading?: boolean;
}

export const WorkflowButton: React.FC<WorkflowButtonProps> = ({
  workflow,
  onClick,
  isLoading = false,
}) => {
  const Icon = workflow.icon;

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
      title={workflow.description}
    >
      {Icon && <Icon size={16} />}
      <span>{workflow.label}</span>
    </button>
  );
};
