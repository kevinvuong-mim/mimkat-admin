import {
  MessagesPage,
  Conversation,
  ConversationsPage,
  GetMessagesResponse,
  GetConversationsResponse,
  UpdateConversationRequest,
  CreateConversationResponse,
  CreateGroupConversationRequest,
  CreateDirectConversationRequest,
} from '@/types/api/chat';
import { apiClient } from '@/lib/api-client';
import { handleApiError } from '@/lib/error-handler';
import type { SuccessResponse } from '@/types/api/api-response';

const getMessages = async (
  conversationId: string,
  params?: { cursor?: string; limit?: number },
): Promise<MessagesPage> => {
  try {
    const response: GetMessagesResponse = await apiClient.get(
      `/conversations/${conversationId}/messages`,
      { params },
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const listConversations = async (params?: {
  cursor?: string;
  limit?: number;
}): Promise<ConversationsPage> => {
  try {
    const response: GetConversationsResponse = await apiClient.get('/conversations', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const deleteConversation = async (
  id: string,
): Promise<{ deleted: boolean; conversationId: string }> => {
  try {
    const response: SuccessResponse<{ deleted: boolean; conversationId: string }> =
      await apiClient.delete(`/conversations/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const updateConversation = async (
  id: string,
  data: UpdateConversationRequest,
): Promise<Conversation | { deleted: boolean; conversationId: string }> => {
  try {
    const response: SuccessResponse<Conversation | { deleted: boolean; conversationId: string }> =
      await apiClient.patch(`/conversations/${id}`, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const createGroupConversation = async (
  data: CreateGroupConversationRequest,
): Promise<Conversation> => {
  try {
    const response: CreateConversationResponse = await apiClient.post('/conversations/group', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const createDirectConversation = async (
  data: CreateDirectConversationRequest,
): Promise<Conversation> => {
  try {
    const response: CreateConversationResponse = await apiClient.post(
      '/conversations/direct',
      data,
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export {
  getMessages,
  listConversations,
  deleteConversation,
  updateConversation,
  createGroupConversation,
  createDirectConversation,
};
