import React, { createContext, useContext, useState, useCallback } from 'react';
import { ChatMessage } from '@/components/genie-widgets';

interface WidgetState {
  isOpen: boolean;
  chatHistory: ChatMessage[];
  skillsEnabled: Record<string, boolean>;
}

interface SubGenieContextType {
  // State per sub-genie
  widgets: Record<'wish' | 'forge' | 'review', WidgetState>;
  // Actions
  toggleWidget: (genieId: 'wish' | 'forge' | 'review') => void;
  closeWidget: (genieId: 'wish' | 'forge' | 'review') => void;
  addMessage: (
    genieId: 'wish' | 'forge' | 'review',
    message: ChatMessage
  ) => void;
  toggleSkill: (
    genieId: 'wish' | 'forge' | 'review',
    skillId: string,
    enabled: boolean
  ) => void;
}

const SubGenieContext = createContext<SubGenieContextType | undefined>(
  undefined
);

export const SubGenieProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [widgets, setWidgets] = useState<
    Record<'wish' | 'forge' | 'review', WidgetState>
  >({
    wish: { isOpen: false, chatHistory: [], skillsEnabled: {} },
    forge: { isOpen: false, chatHistory: [], skillsEnabled: {} },
    review: { isOpen: false, chatHistory: [], skillsEnabled: {} },
  });

  const toggleWidget = useCallback((genieId: 'wish' | 'forge' | 'review') => {
    setWidgets((prev) => ({
      ...prev,
      [genieId]: {
        ...prev[genieId],
        isOpen: !prev[genieId].isOpen,
      },
    }));
  }, []);

  const closeWidget = useCallback((genieId: 'wish' | 'forge' | 'review') => {
    setWidgets((prev) => ({
      ...prev,
      [genieId]: { ...prev[genieId], isOpen: false },
    }));
  }, []);

  const addMessage = useCallback(
    (genieId: 'wish' | 'forge' | 'review', message: ChatMessage) => {
      setWidgets((prev) => ({
        ...prev,
        [genieId]: {
          ...prev[genieId],
          chatHistory: [...prev[genieId].chatHistory, message],
        },
      }));
    },
    []
  );

  const toggleSkill = useCallback(
    (
      genieId: 'wish' | 'forge' | 'review',
      skillId: string,
      enabled: boolean
    ) => {
      setWidgets((prev) => ({
        ...prev,
        [genieId]: {
          ...prev[genieId],
          skillsEnabled: {
            ...prev[genieId].skillsEnabled,
            [skillId]: enabled,
          },
        },
      }));
    },
    []
  );

  return (
    <SubGenieContext.Provider
      value={{ widgets, toggleWidget, closeWidget, addMessage, toggleSkill }}
    >
      {children}
    </SubGenieContext.Provider>
  );
};

/** @public - Hook for accessing SubGenie context */
export const useSubGenie = () => {
  const context = useContext(SubGenieContext);
  if (!context) {
    throw new Error('useSubGenie must be used within SubGenieProvider');
  }
  return context;
};
