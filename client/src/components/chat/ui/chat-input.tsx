import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { ArrowUp, AudioLines, ChevronDown } from 'lucide-react';
import { Button } from '../../ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { useScreenSize } from '../../general/use-screen-size';

interface Props {
  onSendMessage: (message: string) => void;
  onStartVoiceMode?: (message: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  defaultHeight?: number;
  autoResize?: boolean;
  includeModeSelector?: boolean;
}

export function ChatInput({
  onSendMessage,
  onStartVoiceMode,
  loading = false,
  disabled = false,
  defaultHeight = 128,
  autoResize = false,
  placeholder = "Type your reply...",
  includeModeSelector = false,
}: Props) {
  const { isMobile } = useScreenSize();
  const [inputText, setInputText] = useState('');
  const [selectedMode, setSelectedMode] = useState<'agent' | 'captain'>('agent');
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
        autoFocus
      />
      <div className="flex justify-between items-center">
        {includeModeSelector && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="bg-gray-600 hover:bg-gray-500 rounded-full px-3 py-1 text-sm capitalize text-gray-200 shadow-none"
              >
                {selectedMode}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="min-w-[100px]">
              <DropdownMenuItem 
                onClick={() => setSelectedMode('agent')}
                className="capitalize"
              >
                Agent
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSelectedMode('captain')}
                className="capitalize"
                disabled={true}
              >
                Captain
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div className={includeModeSelector ? '' : 'ml-auto'}>
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
            <Button size="icon" variant="outline" onClick={() => onStartVoiceMode(inputText)}>
              <AudioLines />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 