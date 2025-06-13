import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import ToolBlock from './tool-block';
import type { ChatMessage as ChatMessageType, ContentBlock } from './types';

interface Props {
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  loadingMessages: boolean;
}

type RenderItem =
  | { type: 'message'; message: ChatMessageType }
  | { type: 'tool'; toolInput: Extract<ContentBlock, { type: "tool_input" }>; toolResult?: Extract<ContentBlock, { type: "tool_result" }>; isRunning: boolean };

export function ChatContainer({ messages, onSendMessage, loadingMessages }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialScrollComplete, setInitialScrollComplete] = useState(false);

  const createRenderItems = (): RenderItem[] => {
    const renderItems: RenderItem[] = [];
    const allToolResults = messages.flatMap(message =>
      message.content.filter((block): block is Extract<ContentBlock, { type: "tool_result" }> =>
        block.type === 'tool_result'
      )
    );

    messages.forEach(message => {
      message.content.forEach(block => {
        if (block.type === 'tool_input') {
          const toolResult = allToolResults.find(result => result.tool_id === block.tool_id);
          renderItems.push({
            type: 'tool',
            toolInput: block,
            toolResult,
            isRunning: toolResult === undefined
          });
        } else if (block.type === 'text') {
          renderItems.push({
            type: 'message',
            message: { ...message, content: [block] }
          });
        }
      });
    });

    return renderItems;
  };

  const renderItems = createRenderItems();

  const isNearBottom = useCallback(() => {
    if (!containerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 80;
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    if (loadingMessages) return
    if (isNearBottom() || !initialScrollComplete) {
      scrollToBottom();
      setInitialScrollComplete(true);
    }
  }, [messages, scrollToBottom, initialScrollComplete, loadingMessages]);

  const handleSendMessage = (message: string) => {
    onSendMessage(message);
    scrollToBottom();
  };

  return (
    <div ref={containerRef} className="flex flex-col flex-1 overflow-y-auto">
      <div className="flex flex-col max-w-3xl mx-auto w-full grow">
        <div className="flex-1 pb-10">
          {renderItems.map((item) => {
            if (item.type === 'message') {
              return (
                <ChatMessage
                  key={item.message.id}
                  message={item.message}
                />
              );
            } else {
              return (
                <ToolBlock
                  key={item.toolInput.tool_id}
                  toolInput={item.toolInput}
                  toolResult={item.toolResult}
                  isRunning={item.isRunning}
                />
              );
            }
          })}
        </div>
        <div className="sticky bottom-0 pb-2">
          <ChatInput onSendMessage={handleSendMessage} defaultHeight={40} autoResize />
        </div>
      </div>
    </div>
  );
} 