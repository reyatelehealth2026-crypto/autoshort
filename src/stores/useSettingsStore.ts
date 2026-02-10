import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
    apiKey: string
    showApiKeyModal: boolean
    selectedModel: string
    setApiKey: (key: string) => void
    setShowApiKeyModal: (show: boolean) => void
    setSelectedModel: (model: string) => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            apiKey: '',
            showApiKeyModal: false,
            selectedModel: 'gemini-2.0-flash',
            setApiKey: (key) => set({ apiKey: key }),
            setShowApiKeyModal: (show) => set({ showApiKeyModal: show }),
            setSelectedModel: (model) => set({ selectedModel: model }),
        }),
        {
            name: 'shorts-factory-settings',
            partialize: (state) => ({ apiKey: state.apiKey, selectedModel: state.selectedModel }),
        }
    )
)
