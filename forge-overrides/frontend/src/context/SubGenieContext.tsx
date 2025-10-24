import React, { createContext, useContext, useState, useCallback } from 'react';
import { ChatMessage } from '@/components/genie-widgets';

interface WidgetState {
  isOpen: boolean;
  chatHistory: ChatMessage[];
  skillsEnabled: Record<string, boolean>;
}

interface SubGenieContextType {
  // State per sub-genie
  widgets: Record<'wishh' | 'forge' | 'review', WidgetState>;
  // Actions
  toggleWidget: (genieId: 'wishh' | 'forge' | 'review') => void;
  closeWidget: (genieId: 'wishh' | 'forge' | 'review') => void;
  addMessage: (
    genieId: 'wishh' | 'forge' | 'review',
    message: ChatMessage
  ) => void;
  toggleSkill: (
    genieId: 'wishh' | 'forge' | 'review',
    skillId: string,
    enabled: boolean
  ) => void;
}

const SubGenieContext = createContext<SubGenieContextType | undefined>(undefined);

export const SubGenieProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [widgets, setWidgets] = useState<Record<'wishh' | 'forge' | 'review', WidgetState>>({
    wishh: { isOpen: false, chatHistory: [], skillsEnabled: {} },
    forge: { isOpen: false, chatHistory: [], skillsEnabled: {} },
    review: { isOpen: false, chatHistory: [], skillsEnabled: {} },
  });

  const toggleWidget = useCallback((genieId: 'wishh' | 'forge' | 'review') => {
    setWidgets((prev) => ({
      ...prev,
      [genieId]: {
        ...prev[genieId],
        isOpen: !prev[genieId].isOpen,
      },
    }));
  }, []);

  const closeWidget = useCallback((genieId: 'wishh' | 'forge' | 'review') => {
    setWidgets((prev) => ({
      ...prev,
      [genieId]: { ...prev[genieId], isOpen: false },
    }));
  }, []);

  const addMessage = useCallback(
    (genieId: 'wishh' | 'forge' | 'review', message: ChatMessage) => {
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
    (genieId: 'wishh' | 'forge' | 'review', skillId: string, enabled: boolean) => {
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

export const useSubGenie = () => {
  const context = useContext(SubGenieContext);
  if (!context) {
    throw new Error('useSubGenie must be used within SubGenieProvider');
  }
  return context;
};
