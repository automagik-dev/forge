import React, { useState } from 'react';
import { ChatMessage, WorkflowDefinition, SkillDefinition, SubGenieConfig } from './types';
import { WorkflowButton } from './WorkflowButton';
import { SkillToggle } from './SkillToggle';

interface SubGenieWidgetProps {
  config: SubGenieConfig;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  onWorkflowClick: (workflowId: string) => void;
  onSkillToggle: (skillId: string, enabled: boolean) => void;
  chatHistory?: ChatMessage[];
  skillsState?: Record<string, boolean>;
  isLoading?: boolean;
}

export const SubGenieWidget: React.FC<SubGenieWidgetProps> = ({
  config,
  isOpen,
  onClose,
  onSendMessage,
  onWorkflowClick,
  onSkillToggle,
  chatHistory = [],
  skillsState = {},
  isLoading = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <config.icon size={20} />
          <span className="font-semibold">{config.name}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close widget"
        >
          ✕
        </button>
      </div>

      {/* Chat Display */}
      <div className="flex-1 bg-gray-50 rounded p-3 max-h-48 overflow-y-auto">
        {chatHistory.length === 0 ? (
          <p className="text-gray-400 text-sm">No messages yet...</p>
        ) : (
          chatHistory.map((msg) => (
            <div key={msg.id} className="mb-2">
              <p className="text-xs text-gray-500 font-semibold">
                {msg.sender === 'user' ? 'You' : config.name}
              </p>
              <p className="text-sm text-gray-800">{msg.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Ask ${config.name}...`}
          className="flex-1 p-2 border border-gray-300 rounded text-sm resize-none"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 text-sm font-medium"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>

      {/* Workflows */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">Workflows</p>
        <div className="flex flex-wrap gap-2">
          {config.workflows.map((workflow) => (
            <WorkflowButton
              key={workflow.id}
              workflow={workflow}
              onClick={() => onWorkflowClick(workflow.id)}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Skills */}
      {config.skills.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Skills</p>
          <div className="flex flex-wrap gap-2">
            {config.skills.map((skill) => (
              <SkillToggle
                key={skill.id}
                skill={skill}
                isEnabled={skillsState[skill.id] || skill.defaultEnabled || false}
                onChange={(enabled) => onSkillToggle(skill.id, enabled)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
