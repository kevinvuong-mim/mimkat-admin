'use client';

import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { useChat } from '@/hooks/use-chat';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import * as chatService from '@/services/chat';
import * as usersService from '@/services/users';
import { Button } from '@/components/ui/button';
import type { Conversation } from '@/types/api/chat';
import type { User } from '@/types/user';
import { chatQueryKeys } from '@/lib/chat-query-keys';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useCurrentUserStore } from '@/stores/current-user/current-user-provider';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function ChatView() {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUserStore((s) => s.currentUser);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [directDialogOpen, setDirectDialogOpen] = useState(false);
  const [directEmail, setDirectEmail] = useState('');
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMemberEmail, setGroupMemberEmail] = useState('');
  const [groupSearchResult, setGroupSearchResult] = useState<User | null>(null);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<User[]>([]);

  const { isConnected, sendMessage, joinConversation, leaveConversation } = useChat({
    enabled: Boolean(currentUser),
  });

  const conversationsQuery = useQuery({
    queryKey: chatQueryKeys.conversations(),
    queryFn: chatService.listConversations,
    enabled: Boolean(currentUser),
  });

  const messagesQuery = useQuery({
    queryKey: chatQueryKeys.messages(selectedId ?? ''),
    queryFn: () => chatService.getMessages(selectedId!),
    enabled: Boolean(selectedId),
  });

  const lookupUserMutation = useMutation({
    mutationFn: (email: string) => usersService.lookupUserByEmail({ email }),
  });

  const getLookupErrorMessage = (error: {
    message?: string;
    errors?: Array<{ message: string }>;
  }) => error.errors?.[0]?.message ?? error.message ?? 'User not found';

  const handleDirectSearch = () => {
    lookupUserMutation.mutate(directEmail, {
      onSuccess: (user) => {
        if (user.id === currentUser?.id) {
          setSearchedUser(null);
          toast.error('Cannot start a direct chat with yourself');
          return;
        }

        setSearchedUser(user);
      },
      onError: (error) => {
        setSearchedUser(null);
        toast.error(getLookupErrorMessage(error));
      },
    });
  };

  const handleGroupSearch = () => {
    lookupUserMutation.mutate(groupMemberEmail, {
      onSuccess: (user) => {
        if (user.id === currentUser?.id) {
          setGroupSearchResult(null);
          toast.error('You cannot add yourself to the group');
          return;
        }

        if (selectedGroupMembers.some((member) => member.id === user.id)) {
          setGroupSearchResult(null);
          toast.error('User is already in the member list');
          return;
        }

        setGroupSearchResult(user);
      },
      onError: (error) => {
        setGroupSearchResult(null);
        toast.error(getLookupErrorMessage(error));
      },
    });
  };

  const handleAddGroupMember = () => {
    if (!groupSearchResult) return;

    setSelectedGroupMembers((members) => [...members, groupSearchResult]);
    setGroupSearchResult(null);
    setGroupMemberEmail('');
    lookupUserMutation.reset();
  };

  const createDirectMutation = useMutation({
    mutationFn: (email: string) =>
      chatService.createDirectConversation({ participantEmail: email.trim() }),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      setSelectedId(conversation.id);
      setDirectEmail('');
      setSearchedUser(null);
      setDirectDialogOpen(false);
    },
    onError: (error: { message?: string; errors?: Array<{ message: string }> }) => {
      const detail = error.errors?.[0]?.message ?? error.message ?? 'Failed to create conversation';
      toast.error(detail);
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, members }: { name: string; members: User[] }) => {
      const memberEmails = members.map((member) => member.email);

      return chatService.createGroupConversation({ name: name.trim(), memberEmails });
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      setSelectedId(conversation.id);
      resetGroupDialog();
      setGroupDialogOpen(false);
    },
    onError: (error: { message?: string; errors?: Array<{ message: string }> }) => {
      const detail = error.errors?.[0]?.message ?? error.message ?? 'Failed to create group';
      toast.error(detail);
    },
  });

  const selectedConversation = useMemo(
    () => conversationsQuery.data?.find((c) => c.id === selectedId) ?? null,
    [conversationsQuery.data, selectedId],
  );

  useEffect(() => {
    if (!selectedId) return;
    joinConversation(selectedId);
    return () => leaveConversation(selectedId);
  }, [selectedId, joinConversation, leaveConversation]);

  const [isSending, setIsSending] = useState(false);
  const messagesContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId || !messagesQuery.data?.items.length) return;

    const frame = requestAnimationFrame(() => {
      const viewport = messagesContentRef.current?.closest('[data-slot="scroll-area-viewport"]');
      if (viewport instanceof HTMLElement) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedId, messagesQuery.data?.items]);

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

  const displayName = (conversation: Conversation) => {
    if (conversation.type === 'GROUP') {
      return conversation.name ?? 'Group chat';
    }

    const other = conversation.participants.find((p) => p.userId !== currentUser?.id);
    return other?.user.fullName ?? other?.user.username ?? other?.user.email ?? 'Chat';
  };

  const canCreateGroup = groupName.trim().length > 0 && selectedGroupMembers.length > 0;

  const resetDirectDialog = () => {
    setDirectEmail('');
    setSearchedUser(null);
    lookupUserMutation.reset();
  };

  const resetGroupDialog = () => {
    setGroupName('');
    setGroupMemberEmail('');
    setGroupSearchResult(null);
    setSelectedGroupMembers([]);
    lookupUserMutation.reset();
  };

  const handleDirectDialogChange = (open: boolean) => {
    setDirectDialogOpen(open);
    if (!open) resetDirectDialog();
  };

  const handleGroupDialogChange = (open: boolean) => {
    setGroupDialogOpen(open);
    if (!open) resetGroupDialog();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chat</h1>
          <p className="text-muted-foreground text-sm">
            Realtime via Socket.IO {isConnected ? '(connected)' : '(connecting...)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setDirectDialogOpen(true)}>New direct chat</Button>
          <Button variant="outline" onClick={() => setGroupDialogOpen(true)}>
            New group chat
          </Button>
        </div>
      </div>

      <Dialog open={directDialogOpen} onOpenChange={handleDirectDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New direct chat</DialogTitle>
            <DialogDescription>
              Search for a user by email to start a conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direct-email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="direct-email"
                  type="email"
                  placeholder="user@example.com"
                  value={directEmail}
                  onChange={(e) => {
                    setDirectEmail(e.target.value);
                    setSearchedUser(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isValidEmail(directEmail)) {
                      e.preventDefault();
                      handleDirectSearch();
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  disabled={!isValidEmail(directEmail) || lookupUserMutation.isPending}
                  onClick={handleDirectSearch}
                >
                  {lookupUserMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>

            {searchedUser && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={searchedUser.avatar ?? undefined} />
                  <AvatarFallback>
                    {(searchedUser.fullName ?? searchedUser.email).slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {searchedUser.fullName ?? searchedUser.username ?? searchedUser.email}
                  </p>
                  <p className="text-muted-foreground truncate text-sm">{searchedUser.email}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDirectDialogChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!searchedUser || createDirectMutation.isPending}
              onClick={() => searchedUser && createDirectMutation.mutate(searchedUser.email)}
            >
              Start chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupDialogOpen} onOpenChange={handleGroupDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create group chat</DialogTitle>
            <DialogDescription>
              Add a group name and search members by email to add them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                placeholder="Team chat"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
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
                  onChange={(e) => {
                    setGroupMemberEmail(e.target.value);
                    setGroupSearchResult(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isValidEmail(groupMemberEmail)) {
                      e.preventDefault();
                      handleGroupSearch();
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  disabled={!isValidEmail(groupMemberEmail) || lookupUserMutation.isPending}
                  onClick={handleGroupSearch}
                >
                  {lookupUserMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>

              {groupSearchResult && (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={groupSearchResult.avatar ?? undefined} />
                    <AvatarFallback>
                      {(groupSearchResult.fullName ?? groupSearchResult.email)
                        .slice(0, 1)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {groupSearchResult.fullName ??
                        groupSearchResult.username ??
                        groupSearchResult.email}
                    </p>
                    <p className="text-muted-foreground truncate text-sm">
                      {groupSearchResult.email}
                    </p>
                  </div>
                  <Button size="sm" onClick={handleAddGroupMember}>
                    Add
                  </Button>
                </div>
              )}

              {selectedGroupMembers.length > 0 && (
                <div className="space-y-2">
                  {selectedGroupMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-muted/40 flex items-center gap-3 rounded-lg border p-3"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar ?? undefined} />
                        <AvatarFallback>
                          {(member.fullName ?? member.email).slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {member.fullName ?? member.username ?? member.email}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">{member.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() =>
                          setSelectedGroupMembers((members) =>
                            members.filter((item) => item.id !== member.id),
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
            <Button variant="outline" onClick={() => handleGroupDialogChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canCreateGroup || createGroupMutation.isPending}
              onClick={() =>
                createGroupMutation.mutate({ name: groupName, members: selectedGroupMembers })
              }
            >
              Create group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[280px_1fr]">
        <ScrollArea className="min-h-0 rounded-lg border">
          <div className="p-2">
            {conversationsQuery.data?.map((conversation) => {
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`hover:bg-muted flex w-full items-center gap-3 rounded-md p-3 text-left ${
                    selectedId === conversation.id ? 'bg-muted' : ''
                  }`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={conversation.avatar ?? undefined} />
                    <AvatarFallback>{displayName(conversation).slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{displayName(conversation)}</span>
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
          </div>
        </ScrollArea>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border">
          {selectedConversation ? (
            <>
              <div className="shrink-0 border-b p-4">
                <h2 className="font-medium">{displayName(selectedConversation)}</h2>
                {selectedConversation.type === 'GROUP' && (
                  <p className="text-muted-foreground text-xs">
                    {selectedConversation.participants.length} members
                  </p>
                )}
              </div>

              <ScrollArea className="min-h-0 flex-1 p-4">
                <div ref={messagesContentRef} className="flex flex-col-reverse gap-3">
                  {messagesQuery.data?.items.map((message) => {
                    const isMine = message.senderId === currentUser?.id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
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
              </ScrollArea>

              <div className="flex shrink-0 gap-2 border-t p-4">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
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
