import { create } from 'zustand';
import { Conversation, Message } from '../types/app.types';

interface ChatStore {
  conversations: Conversation[];
  activeMessages: Message[];
  unreadTotal: number;
  setConversations: (conversations: Conversation[]) => void;
  setActiveMessages: (messages: Message[]) => void;
  setUnreadTotal: (total: number) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  activeMessages: [],
  unreadTotal: 0,
  setConversations: (conversations) => set({ conversations }),
  setActiveMessages: (activeMessages) => set({ activeMessages }),
  setUnreadTotal: (unreadTotal) => set({ unreadTotal }),
}));
