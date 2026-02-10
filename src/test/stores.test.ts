import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectStore } from '../stores/useProjectStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import { useChatStore } from '../stores/useChatStore'

describe('useProjectStore', () => {
    beforeEach(() => {
        useProjectStore.getState().resetProject()
    })

    it('should have correct default state', () => {
        const state = useProjectStore.getState()
        expect(state.formData.topic).toBe('')
        expect(state.formData.genre).toBe('comedy')
        expect(state.isGenerating).toBe(false)
        expect(state.scriptData).toBeNull()
        expect(state.creationMode).toBe('simple')
        expect(state.selectedModel).toBe('gemini-2.0-flash')
    })

    it('should update formData', () => {
        const { setFormData } = useProjectStore.getState()
        act(() => {
            setFormData({ ...useProjectStore.getState().formData, topic: 'AI ในอนาคต' })
        })
        expect(useProjectStore.getState().formData.topic).toBe('AI ในอนาคต')
    })

    it('should update formData with callback', () => {
        const { setFormData } = useProjectStore.getState()
        act(() => {
            setFormData(prev => ({ ...prev, tone: 'serious', genre: 'education' }))
        })
        const { formData } = useProjectStore.getState()
        expect(formData.tone).toBe('serious')
        expect(formData.genre).toBe('education')
    })

    it('should set and clear error', () => {
        const { setError } = useProjectStore.getState()
        act(() => setError('Something went wrong'))
        expect(useProjectStore.getState().error).toBe('Something went wrong')
        act(() => setError(null))
        expect(useProjectStore.getState().error).toBeNull()
    })

    it('should manage generation state', () => {
        const store = useProjectStore.getState()
        act(() => {
            store.setIsGenerating(true)
            store.setProgress(50)
        })
        expect(useProjectStore.getState().isGenerating).toBe(true)
        expect(useProjectStore.getState().progress).toBe(50)
    })

    it('should update progress with callback', () => {
        const { setProgress } = useProjectStore.getState()
        act(() => setProgress(30))
        act(() => setProgress(prev => prev + 20))
        expect(useProjectStore.getState().progress).toBe(50)
    })

    it('should manage streaming state', () => {
        const store = useProjectStore.getState()
        act(() => {
            store.setIsStreaming(true)
            store.setStreamingText('Hello...')
        })
        expect(useProjectStore.getState().isStreaming).toBe(true)
        expect(useProjectStore.getState().streamingText).toBe('Hello...')
    })

    it('should set creation mode', () => {
        act(() => useProjectStore.getState().setCreationMode('super'))
        expect(useProjectStore.getState().creationMode).toBe('super')
    })

    it('should reset all state', () => {
        const store = useProjectStore.getState()
        act(() => {
            store.setFormData(prev => ({ ...prev, topic: 'test' }))
            store.setIsGenerating(true)
            store.setError('error')
            store.resetProject()
        })
        const state = useProjectStore.getState()
        expect(state.formData.topic).toBe('')
        expect(state.isGenerating).toBe(false)
        expect(state.error).toBeNull()
    })
})

describe('useSettingsStore', () => {
    it('should store API key', () => {
        act(() => useSettingsStore.getState().setApiKey('test-key-123'))
        expect(useSettingsStore.getState().apiKey).toBe('test-key-123')
    })

    it('should store model selection', () => {
        act(() => useSettingsStore.getState().setSelectedModel('gemini-1.5-pro'))
        expect(useSettingsStore.getState().selectedModel).toBe('gemini-1.5-pro')
    })
})

describe('useUIStore', () => {
    it('should toggle sidebar', () => {
        expect(useUIStore.getState().sidebarOpen).toBe(false)
        act(() => useUIStore.getState().toggleSidebar())
        expect(useUIStore.getState().sidebarOpen).toBe(true)
        act(() => useUIStore.getState().toggleSidebar())
        expect(useUIStore.getState().sidebarOpen).toBe(false)
    })

    it('should manage modals', () => {
        act(() => useUIStore.getState().setShowApiKeyModal(true))
        expect(useUIStore.getState().showApiKeyModal).toBe(true)
        act(() => useUIStore.getState().setShowArtModal(true))
        expect(useUIStore.getState().showArtModal).toBe(true)
    })
})

describe('useChatStore', () => {
    beforeEach(() => {
        useChatStore.getState().clearMessages()
    })

    it('should add messages', () => {
        act(() => {
            useChatStore.getState().addMessage({ role: 'user', content: 'สวัสดี' })
        })
        const messages = useChatStore.getState().messages
        // Welcome message + new message
        expect(messages.length).toBeGreaterThanOrEqual(1)
        expect(messages[messages.length - 1].content).toBe('สวัสดี')
    })

    it('should manage loading state', () => {
        act(() => useChatStore.getState().setIsLoading(true))
        expect(useChatStore.getState().isLoading).toBe(true)
    })
})
