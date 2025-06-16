import { cn } from '@/lib/utils';
import { MarkdownContent } from './markdown-content';
import type { ChatMessage as ChatMessageType, ContentBlock } from './types';

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user' && !message.content.some(b => b.type === 'tool_result');

  const renderContentBlock = (block: ContentBlock, index: number) => {
    if (block.type === 'text') {
      return isUser ? (
        <p key={index} className="whitespace-pre-wrap">{block.text}</p>
      ) : (
        <MarkdownContent key={index} content={block.text} />
      );
    }
    return null;
  };

  return (
    <div className={cn('flex px-5', isUser ? 'justify-end py-6' : 'justify-start py-2')}>
      <div className={cn('max-w-2xl rounded-lg', isUser ? 'bg-gray-700 px-4 py-3' : 'bg-transparent')}>
        <div className="text-gray-100">
          {message.content.map((block, index) => renderContentBlock(block, index))}
        </div>
      </div>
    </div>
  );
} 