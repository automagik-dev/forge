import { NormalizedEntry } from "shared/types";
import MarkdownRenderer from "../ui/markdown-renderer";

const UserMessage = ({ content }: { content: string }) => {
    return (
        <div className="bg-background px-4 py-2 text-sm border-y border-dashed">
            <MarkdownRenderer
                content={content}
                className="whitespace-pre-wrap break-words flex flex-col gap-1 font-light"
            />
        </div>);
};

export default UserMessage;
