import ReactMarkdown, { type Components } from 'react-markdown';

interface Props {
  content: string;
}

export function MarkdownContent({ content }: Props) {

  return (
    <ReactMarkdown components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}

const markdownComponents: Components = {
  a: ({node, ...props}) => (
    <a {...props} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" />
  ),
  h3(props) {
    const { children } = props;
    return (
      <h3 className="mb-2 mt-4 text-xl font-bold" {...props}>
        {children}
      </h3>
    );
  },
  p(props) {
    const { children } = props;

    return (
      <p className="mb-2" {...props}>
        {children}
      </p>
    );
  },
  code(props) {
    const { children, className } = props;
    const match = /language-(\w+)/.exec(className || "");
    if (match) {
      return (
        <div className="my-4 overflow-x-auto rounded-lg bg-black p-4 border border-gray-700">
          <code className="block text-sm">{children}</code>
        </div>
      );
    }
    return (
      <code className="rounded bg-black px-1 py-0.5 text-sm">{children}</code>
    );
  },
  ol(props) {
    return <ol className="mb-5 list-decimal pl-4" {...props} />;
  },
  ul(props) {
    return <ul className="mb-5 pl-4" {...props} />;
  },
  li(props) {
    const { children } = props;
    return (
      <li className="my-2 pl-4" {...props}>
        {children}
      </li>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-slate-8 py-2 pl-4">
        {children}
      </blockquote>
    );
  },
}