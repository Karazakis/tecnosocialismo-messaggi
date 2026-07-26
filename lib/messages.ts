export type ConversationMember = {
  id: string;
  name: string;
  email: string;
};

export type ConversationSummary = {
  id: string;
  kind: "direct" | "group" | "notes";
  title: string;
  members: ConversationMember[];
  updatedAt: string;
  unreadCount: number;
  lastMessage: {
    body: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  } | null;
};

export type PublicMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
};
