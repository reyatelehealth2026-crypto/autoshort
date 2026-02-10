import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
    apiKey: string
    showApiKeyModal: boolean
    selectedModel: string
    // Provider keys
    leonardoKey: string
    elevenlabsKey: string
    klingKey: string
    setApiKey: (key: string) => void
    setShowApiKeyModal: (show: boolean) => void
    setSelectedModel: (model: string) => void
    setLeonardoKey: (key: string) => void
    setElevenlabsKey: (key: string) => void
    setKlingKey: (key: string) => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            apiKey: '',
            showApiKeyModal: false,
            selectedModel: 'gemini-2.0-flash',
            leonardoKey: '',
            elevenlabsKey: '',
            klingKey: '',
            setApiKey: (key) => set({ apiKey: key }),
            setShowApiKeyModal: (show) => set({ showApiKeyModal: show }),
            setSelectedModel: (model) => set({ selectedModel: model }),
            setLeonardoKey: (key) => set({ leonardoKey: key }),
            setElevenlabsKey: (key) => set({ elevenlabsKey: key }),
            setKlingKey: (key) => set({ klingKey: key }),
        }),
        {
            name: 'shorts-factory-settings',
            partialize: (state) => ({
                apiKey: state.apiKey,
                selectedModel: state.selectedModel,
                leonardoKey: state.leonardoKey,
                elevenlabsKey: state.elevenlabsKey,
                klingKey: state.klingKey,
            }),
        }
    )
)

