import { ChatContext } from "./chat-context";
import { useContext } from "react";
import type { ChatMessage } from "./ui/types";

interface UseChatMessagesReturn {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
}

export function useChatMessages(taskId: string): UseChatMessagesReturn {
  const { getMessages, setMessages: setMessagesInContext } = useContext(ChatContext)!;

  const messages = getMessages(taskId);
  
  const setMessages = (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setMessagesInContext(taskId, messages);
  };

  return {
    messages,
    setMessages,
  };
} 