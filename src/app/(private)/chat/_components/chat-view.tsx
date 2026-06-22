'use client';

import {
  X,
  Users,
  Trash2,
  Loader2,
  Settings,
  MoreVertical,
  MessageCircle,
  ArrowRightLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChat } from '@/hooks/use-chat';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import * as chatService from '@/services/chat';
import { Button } from '@/components/ui/button';
import { chatQueryKeys } from '@/lib/chat-query-keys';
import { usePresence } from '@/providers/presence-provider';
import type { Conversation, ChatUser } from '@/types/api/chat';
import { UserAvatarWithStatus } from '@/components/user-avatar-with-status';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useCurrentUserStore } from '@/stores/current-user/current-user-provider';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getApiError(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as { message?: string; errors?: Array<{ message: string }> };
    return apiError.errors?.[0]?.message ?? apiError.message ?? fallback;
  }

  return fallback;
}

function displayName(conversation: Conversation, currentUserId?: string) {
  if (conversation.type === 'GROUP') {
    return conversation.name ?? 'Group chat';
  }

  const other = conversation.participants.find(
    (participant) => participant.userId !== currentUserId,
  );
  return other?.user.fullName ?? other?.user.username ?? other?.user.email ?? 'Chat';
}

function isGroupAdmin(conversation: Conversation, currentUserId?: string) {
  return conversation.participants.some(
    (participant) => participant.userId === currentUserId && participant.isAdmin,
  );
}

function canDeleteConversation(conversation: Conversation, currentUserId?: string) {
  if (conversation.type === 'DIRECT') return true;
  return isGroupAdmin(conversation, currentUserId);
}

function participantLabel(participant: Conversation['participants'][number]) {
  return participant.user.fullName ?? participant.user.username ?? participant.user.email;
}

function senderDisplayName(sender: ChatUser) {
  return sender.fullName ?? sender.username ?? sender.email;
}

function senderAvatarFallback(sender: ChatUser) {
  return senderDisplayName(sender).slice(0, 1).toUpperCase();
}

function getDirectChatPartner(conversation: Conversation, currentUserId?: string) {
  if (conversation.type !== 'DIRECT') return null;

  return conversation.participants.find((participant) => participant.userId !== currentUserId)
    ?.user;
}

export function ChatView() {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUserStore((state) => state.currentUser);
  const { fetchPresence, getPresenceLabel } = usePresence();
  const currentUserId = currentUser?.id;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [directDialogOpen, setDirectDialogOpen] = useState(false);
  const [directEmail, setDirectEmail] = useState('');

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMemberEmail, setGroupMemberEmail] = useState('');
  const [groupMemberEmails, setGroupMemberEmails] = useState<string[]>([]);

  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [settingsGroupName, setSettingsGroupName] = useState('');
  const [settingsAddMemberEmail, setSettingsAddMemberEmail] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const messagesViewportRef = useRef<HTMLDivElement>(null);

  const handleConversationDeleted = useCallback(
    (conversationId: string) => {
      if (selectedId === conversationId) {
        setSelectedId(null);
      }
    },
    [selectedId],
  );

  const { sendMessage, joinConversation, leaveConversation } = useChat({
    enabled: Boolean(currentUserId),
    currentUserId,
    onConversationDeleted: handleConversationDeleted,
  });

  const conversationsQuery = useInfiniteQuery({
    queryKey: chatQueryKeys.conversations(),
    queryFn: ({ pageParam }) => chatService.listConversations({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(currentUserId),
  });

  const messagesQuery = useInfiniteQuery({
    queryKey: chatQueryKeys.messages(selectedId ?? ''),
    queryFn: ({ pageParam }) => chatService.getMessages(selectedId!, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(selectedId),
  });

  const conversations = useMemo(
    () => conversationsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [conversationsQuery.data],
  );

  const displayMessages = useMemo(() => {
    const items = messagesQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return [...items].reverse();
  }, [messagesQuery.data]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const selectedIsGroupAdmin = selectedConversation
    ? isGroupAdmin(selectedConversation, currentUserId)
    : false;

  const directChatPartnerIds = useMemo(
    () =>
      conversations
        .filter((conversation) => conversation.type === 'DIRECT')
        .map((conversation) => getDirectChatPartner(conversation, currentUserId)?.id)
        .filter((userId): userId is string => Boolean(userId)),
    [conversations, currentUserId],
  );

  useEffect(() => {
    if (directChatPartnerIds.length) {
      void fetchPresence(directChatPartnerIds);
    }
  }, [directChatPartnerIds, fetchPresence]);

  const selectedDirectPartner = selectedConversation
    ? getDirectChatPartner(selectedConversation, currentUserId)
    : null;

  useEffect(() => {
    if (!selectedId) return;
    joinConversation(selectedId);
    return () => leaveConversation(selectedId);
  }, [selectedId, joinConversation, leaveConversation]);

  useLayoutEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!selectedId || !displayMessages.length || !viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [selectedId, displayMessages.length]);

  const invalidateConversations = () => {
    void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
  };

  const createDirectMutation = useMutation({
    mutationFn: (email: string) =>
      chatService.createDirectConversation({ participantEmail: normalizeEmail(email) }),
    onSuccess: (conversation) => {
      invalidateConversations();
      setSelectedId(conversation.id);
      setDirectEmail('');
      setDirectDialogOpen(false);
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to create conversation')),
  });

  const createGroupMutation = useMutation({
    mutationFn: ({ name, memberEmails }: { name: string; memberEmails: string[] }) =>
      chatService.createGroupConversation({ name: name.trim(), memberEmails }),
    onSuccess: (conversation) => {
      invalidateConversations();
      setSelectedId(conversation.id);
      setGroupName('');
      setGroupMemberEmail('');
      setGroupMemberEmails([]);
      setGroupDialogOpen(false);
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to create group')),
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (conversationId: string) => chatService.deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      invalidateConversations();
      if (selectedId === conversationId) {
        setSelectedId(null);
      }
      setGroupSettingsOpen(false);
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to delete conversation')),
  });

  const updateConversationMutation = useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: Parameters<typeof chatService.updateConversation>[1];
    }) => chatService.updateConversation(conversationId, data),
    onSuccess: (result, variables) => {
      if ('deleted' in result && result.deleted) {
        invalidateConversations();
        if (selectedId === variables.conversationId) {
          setSelectedId(null);
        }
        setGroupSettingsOpen(false);
        return;
      }

      invalidateConversations();
      setSettingsAddMemberEmail('');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to update conversation')),
  });

  const handleConversationsScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (
      distanceFromBottom < 80 &&
      conversationsQuery.hasNextPage &&
      !conversationsQuery.isFetchingNextPage
    ) {
      void conversationsQuery.fetchNextPage();
    }
  };

  const handleMessagesScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;

    if (element.scrollTop > 80 || !messagesQuery.hasNextPage || messagesQuery.isFetchingNextPage) {
      return;
    }

    const previousHeight = element.scrollHeight;
    void messagesQuery.fetchNextPage().then(() => {
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight - previousHeight;
      });
    });
  };

  const handleSend = async () => {
    if (!selectedId || !draft.trim() || isSending) return;

    const content = draft.trim();
    setDraft('');
    setIsSending(true);

    try {
      await sendMessage(selectedId, content);
    } catch (error) {
      setDraft(content);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleAddGroupMemberEmail = () => {
    const email = normalizeEmail(groupMemberEmail);
    if (!isValidEmail(email)) return;

    if (email === normalizeEmail(currentUser?.email ?? '')) {
      toast.error('You cannot add yourself to the group');
      return;
    }

    if (groupMemberEmails.includes(email)) {
      toast.error('Email is already in the member list');
      return;
    }

    setGroupMemberEmails((members) => [...members, email]);
    setGroupMemberEmail('');
  };

  const handleDirectCreate = () => {
    const email = normalizeEmail(directEmail);
    if (!isValidEmail(email)) return;

    if (email === normalizeEmail(currentUser?.email ?? '')) {
      toast.error('Cannot start a direct chat with yourself');
      return;
    }

    createDirectMutation.mutate(email);
  };

  const openGroupSettings = () => {
    if (!selectedConversation || selectedConversation.type !== 'GROUP') return;
    setSettingsGroupName(selectedConversation.name ?? '');
    setSettingsAddMemberEmail('');
    setGroupSettingsOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedId) return;
    deleteConversationMutation.mutate(selectedId, {
      onSettled: () => setDeleteConfirmOpen(false),
    });
  };

  const showConversationMenu =
    selectedConversation &&
    ((selectedConversation.type === 'GROUP' && selectedIsGroupAdmin) ||
      canDeleteConversation(selectedConversation, currentUserId));

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chat</h1>
          <p className="text-muted-foreground text-sm">Realtime messaging</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            title="New direct chat"
            onClick={() => setDirectDialogOpen(true)}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            title="New group chat"
            onClick={() => setGroupDialogOpen(true)}
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={directDialogOpen} onOpenChange={setDirectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New direct chat</DialogTitle>
            <DialogDescription>Enter a user email to start a conversation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="direct-email">Email</Label>
            <Input
              id="direct-email"
              type="email"
              placeholder="user@example.com"
              value={directEmail}
              onChange={(event) => setDirectEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleDirectCreate();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDirectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!isValidEmail(directEmail) || createDirectMutation.isPending}
              onClick={handleDirectCreate}
            >
              Start chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create group chat</DialogTitle>
            <DialogDescription>Add a group name and member emails.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                placeholder="Team chat"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-member-email">Members</Label>
              <div className="flex gap-2">
                <Input
                  id="group-member-email"
                  type="email"
                  placeholder="user@example.com"
                  value={groupMemberEmail}
                  onChange={(event) => setGroupMemberEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddGroupMemberEmail();
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  disabled={!isValidEmail(groupMemberEmail)}
                  onClick={handleAddGroupMemberEmail}
                >
                  Add
                </Button>
              </div>
              {groupMemberEmails.length > 0 && (
                <div className="space-y-2">
                  {groupMemberEmails.map((email) => (
                    <div
                      key={email}
                      className="bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <span className="truncate text-sm">{email}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setGroupMemberEmails((members) =>
                            members.filter((item) => item !== email),
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !groupName.trim() || groupMemberEmails.length === 0 || createGroupMutation.isPending
              }
              onClick={() =>
                createGroupMutation.mutate({ name: groupName, memberEmails: groupMemberEmails })
              }
            >
              Create group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupSettingsOpen} onOpenChange={setGroupSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage group</DialogTitle>
            <DialogDescription>Update group details, members, and admin role.</DialogDescription>
          </DialogHeader>
          {selectedConversation?.type === 'GROUP' && selectedIsGroupAdmin && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-group-name">Group name</Label>
                <div className="flex gap-2">
                  <Input
                    id="settings-group-name"
                    value={settingsGroupName}
                    onChange={(event) => setSettingsGroupName(event.target.value)}
                  />
                  <Button
                    disabled={!settingsGroupName.trim() || updateConversationMutation.isPending}
                    onClick={() =>
                      selectedId &&
                      updateConversationMutation.mutate({
                        conversationId: selectedId,
                        data: { name: settingsGroupName.trim() },
                      })
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-add-member">Add member</Label>
                <div className="flex gap-2">
                  <Input
                    id="settings-add-member"
                    type="email"
                    value={settingsAddMemberEmail}
                    onChange={(event) => setSettingsAddMemberEmail(event.target.value)}
                  />
                  <Button
                    disabled={
                      !isValidEmail(settingsAddMemberEmail) || updateConversationMutation.isPending
                    }
                    onClick={() =>
                      selectedId &&
                      updateConversationMutation.mutate({
                        conversationId: selectedId,
                        data: { addMemberEmail: normalizeEmail(settingsAddMemberEmail) },
                      })
                    }
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Members</Label>
                <div className="h-80 min-h-0 overflow-y-auto rounded-md border p-2">
                  <div className="space-y-2">
                    {selectedConversation.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {participantLabel(participant)}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {participant.user.email}
                            {participant.isAdmin ? ' · Admin' : ''}
                          </p>
                        </div>
                        {!participant.isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={updateConversationMutation.isPending}
                                onClick={() =>
                                  selectedId &&
                                  updateConversationMutation.mutate({
                                    conversationId: selectedId,
                                    data: { transferAdminEmail: participant.user.email },
                                  })
                                }
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                                Transfer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={updateConversationMutation.isPending}
                                onClick={() =>
                                  selectedId &&
                                  updateConversationMutation.mutate({
                                    conversationId: selectedId,
                                    data: { removeMemberEmail: participant.user.email },
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The conversation and all messages will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteConversationMutation.isPending}
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[280px_1fr]">
        <div
          className="min-h-0 overflow-y-auto rounded-lg border p-2"
          onScroll={handleConversationsScroll}
        >
          {conversationsQuery.isLoading && (
            <div className="text-muted-foreground p-3 text-sm">Loading conversations...</div>
          )}
          {conversationsQuery.isError && (
            <div className="text-destructive p-3 text-sm">Failed to load conversations</div>
          )}
          {!conversationsQuery.isLoading && conversations.length === 0 && (
            <div className="text-muted-foreground p-3 text-sm">No conversations yet</div>
          )}
          {conversations.map((conversation) => {
            const directPartner = getDirectChatPartner(conversation, currentUserId);

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                className={`hover:bg-muted flex w-full items-center gap-3 rounded-md p-3 text-left ${
                  selectedId === conversation.id ? 'bg-muted' : ''
                }`}
              >
                <UserAvatarWithStatus
                  userId={directPartner?.id}
                  src={conversation.avatar}
                  fallback={displayName(conversation, currentUserId).slice(0, 1)}
                  className="h-9 w-9"
                  showStatus={conversation.type === 'DIRECT'}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {displayName(conversation, currentUserId)}
                    </span>
                    {conversation.type === 'GROUP' && (
                      <span className="text-muted-foreground text-xs">
                        ({conversation.participants.length})
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {conversation.lastMessage?.content ?? 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })}
          {conversationsQuery.isFetchingNextPage && (
            <div className="text-muted-foreground flex justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border">
          {selectedConversation ? (
            <>
              <div className="flex shrink-0 items-center justify-between border-b p-4">
                <div>
                  <h2 className="font-medium">
                    {displayName(selectedConversation, currentUserId)}
                  </h2>
                  {selectedConversation.type === 'DIRECT' && selectedDirectPartner && (
                    <p className="text-muted-foreground text-xs">
                      {getPresenceLabel(selectedDirectPartner.id)}
                    </p>
                  )}
                  {selectedConversation.type === 'GROUP' && (
                    <p className="text-muted-foreground text-xs">
                      {selectedConversation.participants.length} members
                    </p>
                  )}
                </div>
                {showConversationMenu && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" title="Conversation options">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {selectedConversation.type === 'GROUP' && selectedIsGroupAdmin && (
                        <DropdownMenuItem onClick={openGroupSettings}>
                          <Settings className="h-4 w-4" />
                          Manage group
                        </DropdownMenuItem>
                      )}
                      {canDeleteConversation(selectedConversation, currentUserId) && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteConfirmOpen(true)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div
                ref={messagesViewportRef}
                className="min-h-0 flex-1 overflow-y-auto p-4"
                onScroll={handleMessagesScroll}
              >
                {messagesQuery.isFetchingNextPage && (
                  <div className="text-muted-foreground mb-3 flex justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {displayMessages.map((message) => {
                    const isMine = message.senderId === currentUserId;
                    const avatarSrc = isMine
                      ? (currentUser?.avatar ?? message.sender.avatar)
                      : message.sender.avatar;

                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {!isMine && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={avatarSrc ?? undefined} />
                            <AvatarFallback>{senderAvatarFallback(message.sender)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                            isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}
                        >
                          <p>{message.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex shrink-0 gap-2 border-t p-4">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button onClick={() => void handleSend()} disabled={!draft.trim() || isSending}>
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
