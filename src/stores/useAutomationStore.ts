import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PipelineStatus, PipelineStep, MediaOutputItem, ProviderKeys } from '../types'

const BACKEND_URL = 'http://localhost:3001'

interface AutomationState {
    // Pipeline state
    pipelineId: string | null
    pipelineStatus: PipelineStatus
    steps: PipelineStep[]
    mediaOutputs: MediaOutputItem[]
    agentMessages: Array<{ agent: string; message: string; time: string }>
    // Agent outputs
    researchResult: any | null
    planResult: any | null
    scriptResult: any | null
    pipelineError: string | null
    // Config
    pipelineMode: 'full_auto' | 'semi_auto'
    enabledProviders: {
        image: 'leonardo' | 'none'
        voice: 'elevenlabs' | 'none'
        video: 'kling' | 'leonardo_motion' | 'none'
    }
    providerKeys: ProviderKeys
    providerStatus: Record<string, boolean>
    // UI
    isRunning: boolean
    expandedStep: string | null

    // Actions
    setPipelineMode: (mode: 'full_auto' | 'semi_auto') => void
    setEnabledProviders: (providers: AutomationState['enabledProviders']) => void
    setProviderKey: (provider: keyof ProviderKeys, key: string) => void
    setExpandedStep: (stepId: string | null) => void
    startPipeline: (topic: string, formData: any) => Promise<void>
    approveStep: (stepId: string) => Promise<void>
    retryStep: (stepId: string) => Promise<void>
    checkProviderStatus: () => Promise<void>
    resetPipeline: () => void
}

export const useAutomationStore = create<AutomationState>()(
    persist(
        (set, get) => ({
            // State
            pipelineId: null,
            pipelineStatus: 'idle',
            steps: [],
            mediaOutputs: [],
            agentMessages: [],
            researchResult: null,
            planResult: null,
            scriptResult: null,
            pipelineError: null,
            pipelineMode: 'semi_auto',
            enabledProviders: {
                image: 'leonardo',
                voice: 'elevenlabs',
                video: 'kling',
            },
            providerKeys: {
                gemini: '',
                leonardo: '',
                elevenlabs: '',
                kling: '',
            },
            providerStatus: {},
            isRunning: false,
            expandedStep: null,

            // Simple setters
            setPipelineMode: (mode) => set({ pipelineMode: mode }),
            setEnabledProviders: (providers) => set({ enabledProviders: providers }),
            setProviderKey: (provider, key) => set((s) => ({
                providerKeys: { ...s.providerKeys, [provider]: key }
            })),
            setExpandedStep: (stepId) => set({ expandedStep: stepId }),

            // Start Pipeline
            startPipeline: async (topic, formData) => {
                const state = get()
                const { providerKeys, pipelineMode, enabledProviders } = state

                if (!providerKeys.gemini) {
                    set({ pipelineError: 'กรุณาใส่ Gemini API Key ก่อน' })
                    return
                }

                set({
                    isRunning: true,
                    pipelineError: null,
                    steps: [],
                    mediaOutputs: [],
                    agentMessages: [],
                    researchResult: null,
                    planResult: null,
                    scriptResult: null,
                    pipelineStatus: 'researching',
                })

                try {
                    const response = await fetch(`${BACKEND_URL}/api/pipeline/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            topic,
                            mode: pipelineMode,
                            providers: enabledProviders,
                            formData: {
                                genre: formData.genre || 'comedy',
                                orientation: formData.orientation || 'vertical',
                                targetAudience: formData.targetAudience || 'general',
                                duration: formData.duration || '8sec',
                                tone: formData.tone || 'funny',
                                voice: formData.voice || 'thai-female',
                                music: formData.music || 'upbeat',
                                artStyleName: formData.artStyle?.name || 'Cinematic',
                                additionalInfo: formData.additionalInfo || '',
                                negativePrompt: formData.negativePrompt || '',
                            },
                            apiKeys: {
                                gemini: providerKeys.gemini,
                                leonardo: providerKeys.leonardo || undefined,
                                elevenlabs: providerKeys.elevenlabs || undefined,
                                kling: providerKeys.kling || undefined,
                            },
                        }),
                    })

                    const data = await response.json()

                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to start pipeline')
                    }

                    set({ pipelineId: data.jobId })

                    // Start SSE stream
                    connectToStream(data.jobId)

                } catch (err: any) {
                    set({
                        isRunning: false,
                        pipelineStatus: 'error',
                        pipelineError: err.message || 'ไม่สามารถเริ่ม pipeline ได้',
                    })
                }
            },

            // Approve Step
            approveStep: async (stepId) => {
                const { pipelineId } = get()
                if (!pipelineId) return

                try {
                    await fetch(`${BACKEND_URL}/api/pipeline/${pipelineId}/approve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stepId }),
                    })
                } catch (err: any) {
                    console.error('Approve failed:', err)
                }
            },

            // Retry Step
            retryStep: async (stepId) => {
                const { pipelineId, providerKeys } = get()
                if (!pipelineId) return

                try {
                    await fetch(`${BACKEND_URL}/api/pipeline/${pipelineId}/retry`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            stepId,
                            apiKeys: { gemini: providerKeys.gemini },
                        }),
                    })
                } catch (err: any) {
                    console.error('Retry failed:', err)
                }
            },

            // Check Provider Status
            checkProviderStatus: async () => {
                const { providerKeys } = get()

                try {
                    const response = await fetch(`${BACKEND_URL}/api/providers/status`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            apiKeys: {
                                leonardo: providerKeys.leonardo || undefined,
                                elevenlabs: providerKeys.elevenlabs || undefined,
                                kling: providerKeys.kling || undefined,
                            },
                        }),
                    })

                    const data = await response.json()
                    set({ providerStatus: data.providers || {} })
                } catch (err) {
                    console.error('Provider status check failed:', err)
                }
            },

            // Reset
            resetPipeline: () => set({
                pipelineId: null,
                pipelineStatus: 'idle',
                steps: [],
                mediaOutputs: [],
                agentMessages: [],
                researchResult: null,
                planResult: null,
                scriptResult: null,
                pipelineError: null,
                isRunning: false,
                expandedStep: null,
            }),
        }),
        {
            name: 'shorts-factory-automation',
            partialize: (state) => ({
                providerKeys: state.providerKeys,
                pipelineMode: state.pipelineMode,
                enabledProviders: state.enabledProviders,
            }),
        }
    )
)

// SSE stream connection — standalone function
function connectToStream(jobId: string) {
    const eventSource = new EventSource(`${BACKEND_URL}/api/pipeline/${jobId}/stream`)

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data)
            handleSSEEvent(data)
        } catch { /* skip malformed */ }
    }

    eventSource.onerror = () => {
        eventSource.close()
        const state = useAutomationStore.getState()
        if (state.pipelineStatus !== 'completed' && state.pipelineStatus !== 'error') {
            // Try polling as fallback
            pollStatus(jobId)
        }
    }
}

function handleSSEEvent(event: any) {
    const store = useAutomationStore

    switch (event.type) {
        case 'initial_state':
            store.setState({
                steps: event.job?.steps || [],
                mediaOutputs: event.job?.mediaOutputs || [],
                pipelineStatus: event.job?.status || 'idle',
                researchResult: event.job?.researchResult || null,
                planResult: event.job?.planResult || null,
                scriptResult: event.job?.scriptResult || null,
            })
            break

        case 'step_started':
            store.setState((s) => ({
                steps: s.steps.map(step =>
                    step.id === event.stepId
                        ? { ...step, status: 'running' as const, startedAt: new Date().toISOString() }
                        : step
                ),
                agentMessages: [...s.agentMessages, {
                    agent: event.agent,
                    message: `เริ่มทำงาน: ${event.stepName}`,
                    time: new Date().toLocaleTimeString('th-TH'),
                }],
            }))
            break

        case 'step_completed':
            store.setState((s) => {
                const updates: any = {
                    steps: s.steps.map(step =>
                        step.id === event.stepId
                            ? { ...step, status: 'completed' as const, output: event.output, completedAt: new Date().toISOString() }
                            : step
                    ),
                }
                // Also store agent-specific outputs
                if (event.stepId === 'research') updates.researchResult = event.output
                if (event.stepId === 'planning') updates.planResult = event.output
                if (event.stepId === 'scripting') updates.scriptResult = event.output
                return updates
            })
            break

        case 'step_error':
            store.setState((s) => ({
                steps: s.steps.map(step =>
                    step.id === event.stepId
                        ? { ...step, status: 'error' as const, error: event.error }
                        : step
                ),
            }))
            break

        case 'step_awaiting_approval':
            store.setState((s) => ({
                pipelineStatus: 'paused',
                steps: s.steps.map(step =>
                    step.id === event.stepId
                        ? { ...step, status: 'awaiting_approval' as const }
                        : step
                ),
            }))
            break

        case 'media_generated':
            store.setState((s) => ({
                mediaOutputs: [...s.mediaOutputs, event.media],
            }))
            break

        case 'agent_status':
            store.setState((s) => ({
                agentMessages: [...s.agentMessages, {
                    agent: event.agent,
                    message: event.message,
                    time: new Date().toLocaleTimeString('th-TH'),
                }],
            }))
            break

        case 'pipeline_completed':
            store.setState({
                pipelineStatus: 'completed',
                isRunning: false,
            })
            break

        case 'pipeline_error':
            store.setState({
                pipelineStatus: 'error',
                pipelineError: event.error,
                isRunning: false,
            })
            break
    }
}

async function pollStatus(jobId: string) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/pipeline/${jobId}/status`)
        const data = await response.json()

        useAutomationStore.setState({
            steps: data.steps || [],
            mediaOutputs: data.mediaOutputs || [],
            pipelineStatus: data.status || 'error',
            researchResult: data.researchResult || null,
            planResult: data.planResult || null,
            scriptResult: data.scriptResult || null,
            pipelineError: data.error || null,
            isRunning: data.status !== 'completed' && data.status !== 'error',
        })
    } catch (err) {
        console.error('Poll status failed:', err)
    }
}
