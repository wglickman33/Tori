import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ToriMessageBodyProps = {
  content: string;
};

export function ToriMessageBody({ content }: ToriMessageBodyProps) {
  return (
    <div className="tori-chat__body tori-chat__body--markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
