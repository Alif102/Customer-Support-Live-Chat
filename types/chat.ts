export type StreamMessage = {
  id: string;
  body: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
};

export type SendMessageBody = {
  conversationId: string;
  body: string;
};