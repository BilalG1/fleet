import type { components } from "@/generated/openapi.d";

export type ContentBlock = 
  components["schemas"]["ToolInputBlock-Input"] | 
  components["schemas"]["ToolResultBlock"] | 
  components["schemas"]["TextBlock"];


export type TextContentBlock = components["schemas"]["TextBlock"]

export type ToolInputContentBlock = components["schemas"]["ToolInputBlock-Input"]

export type ToolResultContentBlock = components["schemas"]["ToolResultBlock"]

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: ContentBlock[];
} 