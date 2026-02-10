import { create } from 'zustand'

interface UIState {
    showArtModal: boolean
    showApiKeyModal: boolean
    sidebarOpen: boolean
    setShowArtModal: (val: boolean) => void
    setShowApiKeyModal: (val: boolean) => void
    setSidebarOpen: (val: boolean) => void
    toggleSidebar: () => void
}

export const useUIStore = create<UIState>()((set) => ({
    showArtModal: false,
    showApiKeyModal: false,
    sidebarOpen: false,
    setShowArtModal: (val) => set({ showArtModal: val }),
    setShowApiKeyModal: (val) => set({ showApiKeyModal: val }),
    setSidebarOpen: (val) => set({ sidebarOpen: val }),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen }))
}))
