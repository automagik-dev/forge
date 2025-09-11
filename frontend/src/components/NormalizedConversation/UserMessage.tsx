import MarkdownRenderer from '../ui/markdown-renderer';
// import { Button } from "../ui/button";
// import { ArrowRightIcon, Pencil } from "lucide-react";

const UserMessage = ({ content }: { content: string }) => {
  // const { startEdit } = useMessageEdit();
  return (
    <div className="bg-background px-4 py-2 text-sm border-y border-dashed flex items-center gap-2">
      <MarkdownRenderer
        content={content}
        className="whitespace-pre-wrap break-words flex flex-col flex-1 gap-1 font-light"
      />
      {/* <Button
                onClick={() => startEdit(content, content)}
                variant="ghost"
                className="p-2">
                <Pencil className="w-3 h-3" />
            </Button> */}
    </div>
  );
};

export default UserMessage;
