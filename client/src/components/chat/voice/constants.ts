interface Tool {
  type: "function";
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties?: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      oneOf?: Array<{
        properties: Record<string, {
          type: string;
          description?: string;
          enum?: string[];
          items?: {
            type: string;
          };
        }>;
        required: string[];
      }>;
    }>;
    required?: string[];
    oneOf?: Array<{
      properties: Record<string, {
        type: string;
        description?: string;
        enum?: string[];
        items?: {
          type: string;
        };
      }>;
      required: string[];
    }>;
  };
}

const TOOLS: Tool[] = [
  {
    type: "function",
    name: "bash",
    description: "Execute bash commands in the sandbox environment",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The bash command to execute"
        },
        restart: {
          type: "boolean",
          description: "Whether to restart the bash session"
        }
      },
      required: ["command"]
    }
  },
  {
    type: "function",
    name: "str_replace_based_edit_tool",
    description: "Edit files using string replacement, create new files, or view file contents",
    parameters: {
      type: "object",
      properties: {
        input: {
          type: "object",
          oneOf: [
            {
              properties: {
                command: {
                  type: "string",
                  enum: ["view"]
                },
                path: {
                  type: "string",
                  description: "The file path to view"
                },
                view_range: {
                  type: "array",
                  items: {
                    type: "number"
                  },
                  description: "Optional range of lines to view [start, end]"
                }
              },
              required: ["command", "path"]
            },
            {
              properties: {
                command: {
                  type: "string",
                  enum: ["str_replace"]
                },
                path: {
                  type: "string",
                  description: "The file path to edit"
                },
                old_str: {
                  type: "string",
                  description: "The string to replace"
                },
                new_str: {
                  type: "string",
                  description: "The replacement string"
                }
              },
              required: ["command", "path", "old_str", "new_str"]
            },
            {
              properties: {
                command: {
                  type: "string",
                  enum: ["create"]
                },
                path: {
                  type: "string",
                  description: "The file path to create"
                },
                file_text: {
                  type: "string",
                  description: "The content of the file to create"
                }
              },
              required: ["command", "path", "file_text"]
            },
            {
              properties: {
                command: {
                  type: "string",
                  enum: ["insert"]
                },
                path: {
                  type: "string",
                  description: "The file path to edit"
                },
                insert_line: {
                  type: "number",
                  description: "The line number to insert at"
                },
                insert_text: {
                  type: "string",
                  description: "The text to insert"
                }
              },
              required: ["command", "path", "insert_line", "insert_text"]
            }
          ]
        }
      },
      required: ["input"]
    }
  }
]

const REPO_PATH = "/tmp/repo";

const INSTRUCTIONS = `
You are a helpful programmer. Your job is to help the user with their task by using the tools provided to you.
You are working in a lightweight sandbox environment, so feel free to run any commands you need to without asking.
The sandbox is a Debian based Linux environment with git installed. The user's repository is cloned in the sandbox and is available at ${REPO_PATH}.
Your starting working directory is ${REPO_PATH}. You are in a new git branch.
The user cannot see tool results by default, so make sure to include any necessary information in your response. For example, provide a link to create a new github pr after pushing a branch.

<tools>
Always try to make multiple tool calls at once to avoid round trips to the sandbox server.
All commands timeout after 10 seconds.
Always let the user know you are about to call a tool before doing so.
</tools>
`

export const DEFAULT_SESSION_UPDATE = {
  "type": "session.update",
  "session": {
    "tools": TOOLS,
    "instructions": INSTRUCTIONS,
    "tool_choice": "auto",
    "speed": 1.3
  },
}