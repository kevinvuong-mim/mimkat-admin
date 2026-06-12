export type MessageType = 'TEXT' | 'IMAGE';
export type ConversationType = 'GROUP' | 'DIRECT';

export interface ChatUser {
  id: string;
  email: string;
  avatar: string | null;
  fullName: string | null;
  username: string | null;
}

export interface ConversationParticipant {
  id: string;
  user: ChatUser;
  userId: string;
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: ChatUser;
  senderId: string;
  createdAt: string;
  type: MessageType;
  updatedAt: string;
  conversationId: string;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string | null;
  lastMessage: {
    id: string;
    content: string;
    sender: ChatUser;
    createdAt: string;
    type: MessageType;
  } | null;
  avatar: string | null;
  type: ConversationType;
  participants: ConversationParticipant[];
}

export interface MessagesPage {
  items: ChatMessage[];
  nextCursor: string | null;
}

export interface CreateDirectConversationRequest {
  participantEmail: string;
}

export interface CreateGroupConversationRequest {
  name: string;
  avatar?: string;
  memberEmails: string[];
}

export interface UpdateConversationRequest {
  name?: string;
  avatar?: string;
  leave?: boolean;
  addMemberEmail?: string;
  removeMemberEmail?: string;
}

export type GetMessagesResponse = import('./api-response').SuccessResponse<MessagesPage>;
export type GetConversationResponse = import('./api-response').SuccessResponse<Conversation>;
export type CreateConversationResponse = import('./api-response').SuccessResponse<Conversation>;
export type GetConversationsResponse = import('./api-response').SuccessResponse<Conversation[]>;
