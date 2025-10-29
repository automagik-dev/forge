import React, { useState } from 'react';
import { SkillDefinition } from './types';

interface SkillToggleProps {
  skill: SkillDefinition;
  isEnabled: boolean;
  onChange: (enabled: boolean) => void;
}

export const SkillToggle: React.FC<SkillToggleProps> = ({
  skill,
  isEnabled,
  onChange,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = skill.icon;

  return (
    <div className="relative">
      <button
        onClick={() => onChange(!isEnabled)}
        className={`p-2 rounded-lg transition-all ${
          isEnabled
            ? 'bg-blue-100 text-blue-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={skill.description}
      >
        <Icon size={18} />
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
          {skill.name}
        </div>
      )}
    </div>
  );
};
