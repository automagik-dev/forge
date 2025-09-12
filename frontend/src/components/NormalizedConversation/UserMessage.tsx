import MarkdownRenderer from '../ui/markdown-renderer';
import { Button } from '../ui/button';
import { Mail, Pencil, Send, X } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';

const UserMessage = ({ content, executionProcessId }: { content: string; executionProcessId?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  return (
    <div className="py-2">
      <div className="bg-background px-4 py-2 text-sm border-y border-dashed flex gap-2">
        <div className="flex-1">
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
          ) : (
            <MarkdownRenderer
              content={content}
              className="whitespace-pre-wrap break-words flex flex-col gap-1 font-light py-3"
            />
          )}
        </div>
        {executionProcessId &&
          <div className="flex flex-col">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="ghost"
              className="p-2"
            >
              {isEditing ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            </Button>
            {isEditing && (
              <Button
                variant="ghost"
                className="p-2"
              >
                <Send className="w-3 h-3" />
              </Button>
            )}
          </div>
        }
      </div>
    </div>
  );
};

export default UserMessage;
