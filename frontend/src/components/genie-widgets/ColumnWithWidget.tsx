import React from 'react';
import { ColumnHeader, SubGenieWidget, SubGenieConfig } from '@/components/genie-widgets';
import { useSubGenieWidget } from '@/hooks/useSubGenieWidget';

interface ColumnWithWidgetProps {
  config: SubGenieConfig;
  taskCount: number;
  projectId: string; // Required for backend API integration
  children: React.ReactNode; // Tasks in column
}

export const ColumnWithWidget: React.FC<ColumnWithWidgetProps> = ({
  config,
  taskCount,
  projectId,
  children,
}) => {
  const {
    isOpen,
    chatHistory,
    skillsState,
    isLoading,
    toggleWidget,
    closeWidget,
    onSendMessage,
    onWorkflowClick,
    onSkillToggle,
  } = useSubGenieWidget(config.id, projectId);

  // Extract column name from full name (e.g., "Wish (Planner)" -> "Wish")
  const columnName = config.name.split(' ')[0] as 'Wish' | 'Forge' | 'Review' | string;

  return (
    <div className="flex flex-col gap-0 h-full">
      <ColumnHeader
        columnName={columnName as 'Wish' | 'Forge' | 'Review'}
        icon={config.icon}
        taskCount={taskCount}
        isWidgetOpen={isOpen}
        onIconClick={toggleWidget}
      />

      <div className="flex-1 overflow-y-auto p-4">
        {isOpen && (
          <SubGenieWidget
            config={config}
            isOpen={isOpen}
            onClose={closeWidget}
            onSendMessage={onSendMessage}
            onWorkflowClick={onWorkflowClick}
            onSkillToggle={onSkillToggle}
            chatHistory={chatHistory}
            skillsState={skillsState}
            isLoading={isLoading}
          />
        )}

        {/* Tasks column content */}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};
