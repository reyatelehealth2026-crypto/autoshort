import { create } from 'zustand'
import { ChatMessage } from '../types'

interface ChatState {
    messages: ChatMessage[]
    isLoading: boolean
    addMessage: (msg: ChatMessage) => void
    setMessages: (msgs: ChatMessage[]) => void
    setIsLoading: (val: boolean) => void
    clearMessages: () => void
}

const WELCOME_MSG: ChatMessage = {
    role: 'assistant',
    content: 'สวัสดีครับ! ผมคือ Creative Director ประจำโปรเจคนี้ มีอะไรให้ผมช่วยปรับแต่งเกี่ยวกับสคริปต์ไหมครับ?'
}

export const useChatStore = create<ChatState>()((set) => ({
    messages: [WELCOME_MSG],
    isLoading: false,
    addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
    setMessages: (msgs) => set({ messages: msgs }),
    setIsLoading: (val) => set({ isLoading: val }),
    clearMessages: () => set({ messages: [WELCOME_MSG] })
}))
