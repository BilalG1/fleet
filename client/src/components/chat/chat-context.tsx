import { createContext, useState, type ReactNode } from "react";
import type { ChatMessage } from "./ui/types";

interface ChatContextValue {
  getMessages: (taskId: string) => ChatMessage[];
  setMessages: (taskId: string, messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
}

export const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});

  const getMessages = (taskId: string): ChatMessage[] => {
    return messagesMap[taskId] || [
      { id: "default_user_msg", role: "user", content: [{ type: "text", text: "" }] },
      { id: "default_assistant_msg", role: "assistant", content: [{ type: "tool_input", tool_id: "setup_tool_id", tool_name: "setup", tool_input: "Starting container" }] }
    ];
  };

  const setMessages = (taskId: string, messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setMessagesMap(prev => {
      const currentMessages = prev[taskId] || [
        { id: "default_user_msg", role: "user", content: [{ type: "text", text: "" }] },
        { id: "default_assistant_msg", role: "assistant", content: [{ type: "tool_input", tool_id: "setup_tool_id", tool_name: "setup", tool_input: "Starting container" }] }
      ];
      
      const newMessages = typeof messages === 'function' ? messages(currentMessages) : messages;
      
      return {
        ...prev,
        [taskId]: newMessages
      };
    });
  };

  return (
    <ChatContext.Provider value={{ getMessages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
}