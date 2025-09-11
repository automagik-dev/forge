// useMessageEdit.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from 'react';

export type MessageId = string;

type EditState = {
  isEditing: boolean;
  messageId: MessageId | null;
  originalText: string;
  draft: string;
};

type Ctx = EditState & {
  startEdit: (id: MessageId, initialText: string) => void;
  updateDraft: (next: string) => void;
  cancelEdit: () => void;
  commitEdit: () => { id: MessageId; text: string } | null; // returns payload to persist
};

const MessageEditContext = createContext<Ctx | null>(null);

export function MessageEditProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<EditState>({
    isEditing: false,
    messageId: null,
    originalText: '',
    draft: '',
  });

  const startEdit = useCallback((id: MessageId, initialText: string) => {
    setState({
      isEditing: true,
      messageId: id,
      originalText: initialText,
      draft: initialText,
    });
  }, []);

  const updateDraft = useCallback((next: string) => {
    setState((s) => ({ ...s, draft: next }));
  }, []);

  const cancelEdit = useCallback(() => {
    setState({
      isEditing: false,
      messageId: null,
      originalText: '',
      draft: '',
    });
  }, []);

  const commitEdit = useCallback(() => {
    if (!state.isEditing || !state.messageId) return null;
    const payload = { id: state.messageId, text: state.draft };
    // reset after commit
    setState({
      isEditing: false,
      messageId: null,
      originalText: '',
      draft: '',
    });
    return payload;
  }, [state]);

  const value = useMemo<Ctx>(
    () => ({ ...state, startEdit, updateDraft, cancelEdit, commitEdit }),
    [state, startEdit, updateDraft, cancelEdit, commitEdit]
  );

  return (
    <MessageEditContext.Provider value={value}>
      {' '}
      {children}{' '}
    </MessageEditContext.Provider>
  );
}
export const useMessageEdit = () => {
  const ctx = useContext(MessageEditContext);
  if (!ctx)
    throw new Error('useMessageEdit must be used within <MessageEditProvider>');
  return ctx;
};
