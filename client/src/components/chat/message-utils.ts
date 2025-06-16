import type { TextContentBlock } from "./ui/types";
import type { components } from "@/generated/openapi";

type ContentBlock = 
  | TextContentBlock
  | components["schemas"]["ToolInputBlock-Input"]
  | components["schemas"]["ToolResultBlock"];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: ContentBlock[];
}

type SetMessagesFunction = React.Dispatch<React.SetStateAction<Message[]>>;

export function updateLastMessageOrCreateText(
  setMessages: SetMessagesFunction,
  role: "user" | "assistant",
  deltaText: string
): void {
  setMessages(prev => {
    const updated = [...prev];
    const lastMessageIndex = updated.length - 1;
    const lastMessage = updated[lastMessageIndex];

    if (!lastMessage || lastMessage.role !== role) {
      return [...prev, {
        id: Math.random().toString(),
        role,
        content: [{ type: "text", text: deltaText }]
      }];
    }

    const lastContentBlock = lastMessage.content[lastMessage.content.length - 1];

    if (lastContentBlock?.type === "text") {
      updated[lastMessageIndex] = {
        ...lastMessage,
        content: [
          ...lastMessage.content.slice(0, -1),
          {
            ...lastContentBlock,
            text: lastContentBlock.text + deltaText
          }
        ]
      };
    } else {
      const newTextBlock: TextContentBlock = {
        type: "text",
        text: deltaText
      };
      updated[lastMessageIndex] = {
        ...lastMessage,
        content: [...lastMessage.content, newTextBlock]
      };
    }

    return updated;
  });
}

export function updateLastMessageOrCreateWithContent(
  setMessages: SetMessagesFunction,
  role: "user" | "assistant",
  content: ContentBlock,
  strategy: "add" | "replace" = "add",
  matchFn?: (block: ContentBlock) => boolean
): void {
  setMessages(prev => {
    const updated = [...prev];
    const lastMessageIndex = updated.length - 1;
    const lastMessage = updated[lastMessageIndex];

    if (!lastMessage || lastMessage.role !== role) {
      return [...prev, {
        id: Math.random().toString(),
        role,
        content: [content]
      }];
    }

    if (strategy === "replace" && matchFn) {
      const existingIndex = lastMessage.content.findIndex(matchFn);
      if (existingIndex !== -1) {
        updated[lastMessageIndex] = {
          ...lastMessage,
          content: [
            ...lastMessage.content.slice(0, existingIndex),
            content,
            ...lastMessage.content.slice(existingIndex + 1)
          ]
        };
      } else {
        updated[lastMessageIndex] = {
          ...lastMessage,
          content: [...lastMessage.content, content]
        };
      }
    } else {
      updated[lastMessageIndex] = {
        ...lastMessage,
        content: [...lastMessage.content, content]
      };
    }

    return updated;
  });
}


export function createMessageWithId(
  setMessages: SetMessagesFunction,
  role: "user" | "assistant",
  id: string
): void {
  setMessages(prev => [
    ...prev,
    {
      id,
      role,
      content: [{ type: "text", text: "" }]
    }
  ]);
}

export function updateMessageById(
  setMessages: SetMessagesFunction,
  id: string,
  deltaText: string
): void {
  setMessages(prev => {
    const updated = [...prev];
    const messageIndex = updated.findIndex(msg => msg.id === id);
    
    if (messageIndex === -1) {
      // If message with id not found, log a warning but don't crash
      console.warn(`Message with id ${id} not found`);
      return prev;
    }

    const message = updated[messageIndex];
    const lastContentBlock = message.content[message.content.length - 1];

    if (lastContentBlock?.type === "text") {
      updated[messageIndex] = {
        ...message,
        content: [
          ...message.content.slice(0, -1),
          {
            ...lastContentBlock,
            text: lastContentBlock.text + deltaText
          }
        ]
      };
    } else {
      const newTextBlock: TextContentBlock = {
        type: "text",
        text: deltaText
      };
      updated[messageIndex] = {
        ...message,
        content: [...message.content, newTextBlock]
      };
    }

    return updated;
  });
}


export function addToolInputToMessage(
  setMessages: SetMessagesFunction,
  messageId: string,
  toolInput: components["schemas"]["ToolInputBlock-Input"]
): void {
  setMessages(prev => {
    const updated = [...prev];
    const messageIndex = updated.findIndex(msg => msg.id === messageId);
    
    if (messageIndex === -1) {
      // Create new assistant message if it doesn't exist
      return [...prev, {
        id: messageId,
        role: "assistant" as const,
        content: [toolInput]
      }];
    }

    // Add tool input to existing message
    updated[messageIndex] = {
      ...updated[messageIndex],
      content: [...updated[messageIndex].content, toolInput]
    };

    return updated;
  });
}

export function TEMP_addToolResultsToMessages(
  setMessages: SetMessagesFunction,
  results: components["schemas"]["ToolResultBlock"][]
): void {
  setMessages(prev => {
    const updated = [...prev];
    
    results.forEach(result => {
      // Find message containing the tool call
      for (let i = 0; i < updated.length; i++) {
        const message = updated[i];
        if (message.role === "assistant") {
          // Check if this message has the tool call
          const hasToolCall = message.content.some(block => 
            block.type === "tool_input" && block.tool_id === result.tool_id
          );
          
          if (hasToolCall) {
            // Check if result already exists
            const hasResult = message.content.some(block => 
              block.type === "tool_result" && block.tool_id === result.tool_id
            );
            
            if (!hasResult) {
              updated[i] = {
                ...message,
                content: [...message.content, result]
              };
            }
            break;
          }
        }
      }
    });
    
    return updated;
  });
} 