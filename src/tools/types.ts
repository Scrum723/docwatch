/** Shared MCP tool response: structured JSON + short human string. */

export type ToolPayload = {
  human: string;
  data: Record<string, unknown>;
};

export function toolResult(payload: ToolPayload) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${payload.human}\n\n\`\`\`json\n${JSON.stringify(payload.data, null, 2)}\n\`\`\``,
      },
    ],
    structuredContent: {
      human: payload.human,
      ...payload.data,
    },
  };
}

export function toolError(human: string, details?: Record<string, unknown>) {
  return {
    isError: true as const,
    content: [
      {
        type: "text" as const,
        text: human,
      },
    ],
    structuredContent: {
      human,
      error: true,
      ...details,
    },
  };
}
