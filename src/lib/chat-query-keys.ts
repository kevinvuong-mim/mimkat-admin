export const chatQueryKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatQueryKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatQueryKeys.all, 'conversation', id] as const,
  messages: (conversationId: string) => [...chatQueryKeys.all, 'messages', conversationId] as const,
};
