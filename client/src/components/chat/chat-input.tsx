import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { ArrowUp, AudioLines } from 'lucide-react';
import { Button } from '../ui/button';
import { useScreenSize } from '../general/use-screen-size';

interface Props {
  onSendMessage: (message: string) => void;
  onStartVoiceMode?: () => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  defaultHeight?: number;
  autoResize?: boolean;
}

export function ChatInput({
  onSendMessage,
  onStartVoiceMode,
  loading = false,
  disabled = false,
  defaultHeight = 128,
  autoResize = false,
  placeholder = "Type your reply...",
}: Props) {
  const { isMobile } = useScreenSize();
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200; 
      const minHeight = 40;
      
      textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  };

  useEffect(() => {
    if (autoResize) {
      adjustTextareaHeight();
    }
  }, [inputText, autoResize]);

  const handleSend = () => {
    if (inputText.trim() && !disabled) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled && !isMobile) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 w-full">
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent outline-none border-none overflow-hidden"
        style={{ minHeight: defaultHeight + "px" }}
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      <div className="text-end">
        {inputText || !onStartVoiceMode ? (
          <Button 
            size="icon" 
            onClick={handleSend} 
            loading={loading} 
            disabled={disabled} 
            variant={inputText ? "default" : "outline"}
          >
            <ArrowUp />
          </Button>
        ) : (
          <Button size="icon" variant="outline" onClick={onStartVoiceMode}>
            <AudioLines />
          </Button>
        )}
      </div>
    </div>
  );
} 