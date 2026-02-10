import { create } from 'zustand'
import { FormData, ScriptJsonOutput, SceneData, TrendIdea } from '../types'
import { artStyles, durationMap } from '../data/constants'

interface ProjectState {
    formData: FormData
    scriptData: ScriptJsonOutput | null
    activeScene: number
    isGenerating: boolean
    progress: number
    error: string | null
    creationMode: 'simple' | 'super'
    superStep: string
    trends: TrendIdea[]
    selectedIdea: TrendIdea | null
    agentStatus: string
    streamingText: string
    isStreaming: boolean
    abortController: AbortController | null
    selectedModel: string

    setFormData: (data: FormData | ((prev: FormData) => FormData)) => void
    setScriptData: (data: ScriptJsonOutput | null | ((prev: ScriptJsonOutput | null) => ScriptJsonOutput | null)) => void
    setActiveScene: (idx: number) => void
    setIsGenerating: (val: boolean) => void
    setProgress: (val: number | ((prev: number) => number)) => void
    setError: (val: string | null) => void
    setCreationMode: (mode: 'simple' | 'super') => void
    setSuperStep: (step: string) => void
    setTrends: (trends: TrendIdea[]) => void
    setSelectedIdea: (idea: TrendIdea | null) => void
    setAgentStatus: (status: string) => void
    setStreamingText: (text: string) => void
    setIsStreaming: (val: boolean) => void
    setAbortController: (ctrl: AbortController | null) => void
    setSelectedModel: (model: string) => void
    updateScene: (idx: number, field: string, value: any) => void
    addScene: () => void
    resetProject: () => void
}

const defaultFormData: FormData = {
    topic: '',
    genre: 'comedy',
    orientation: 'vertical',
    targetAudience: 'general',
    duration: '8sec',
    tone: 'funny',
    voice: 'thai-female',
    music: 'upbeat',
    artStyle: artStyles[0],
    additionalInfo: ''
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
    formData: defaultFormData,
    scriptData: null,
    activeScene: 0,
    isGenerating: false,
    progress: 0,
    error: null,
    creationMode: 'simple',
    superStep: 'input',
    trends: [],
    selectedIdea: null,
    agentStatus: '',
    streamingText: '',
    isStreaming: false,
    abortController: null,
    selectedModel: 'gemini-2.0-flash',

    setFormData: (data) => set((s) => ({
        formData: typeof data === 'function' ? data(s.formData) : data
    })),
    setScriptData: (data) => set((s) => ({
        scriptData: typeof data === 'function' ? data(s.scriptData) : data
    })),
    setActiveScene: (idx) => set({ activeScene: idx }),
    setIsGenerating: (val) => set({ isGenerating: val }),
    setProgress: (val) => set((s) => ({
        progress: typeof val === 'function' ? val(s.progress) : val
    })),
    setError: (val) => set({ error: val }),
    setCreationMode: (mode) => set({ creationMode: mode }),
    setSuperStep: (step) => set({ superStep: step }),
    setTrends: (trends) => set({ trends }),
    setSelectedIdea: (idea) => set({ selectedIdea: idea }),
    setAgentStatus: (status) => set({ agentStatus: status }),
    setStreamingText: (text) => set({ streamingText: text }),
    setIsStreaming: (val) => set({ isStreaming: val }),
    setAbortController: (ctrl) => set({ abortController: ctrl }),
    setSelectedModel: (model) => set({ selectedModel: model }),

    updateScene: (idx, field, value) => {
        const { scriptData } = get()
        if (!scriptData) return
        const newScenes = [...scriptData.scenes]
        const scene = { ...newScenes[idx] }
        if (field === 'imagePrompt') scene.imagePrompt = value
        else if (field === 'audio.dialogue') scene.audio = { ...scene.audio, dialogue: value }
        else if (field === 'camera.angle') scene.camera = { ...scene.camera, angle: value }
        else if (field === 'camera.movement') scene.camera = { ...scene.camera, movement: value }
        else if (field === 'visuals.colorTone') scene.visuals = { ...scene.visuals, colorTone: value }
        else if (field === 'visuals.mood') scene.visuals = { ...scene.visuals, mood: value }
        newScenes[idx] = scene
        set({ scriptData: { ...scriptData, scenes: newScenes } })
    },

    addScene: () => {
        const { scriptData, formData } = get()
        if (!scriptData) return
        const last = scriptData.scenes[scriptData.scenes.length - 1]
        const dur = durationMap[formData.duration] || 8
        const num = last.sceneNumber + 1
        const newScene: SceneData = {
            sceneNumber: num,
            timeRange: { start: last.timeRange.end, end: last.timeRange.end + dur, duration: dur },
            imagePrompt: `${formData.artStyle.name} style, continuing from previous scene...`,
            camera: { angle: 'Medium Shot', movement: 'Static' },
            visuals: { colorTone: last.visuals.colorTone, mood: formData.tone, style: formData.artStyle.name },
            audio: { dialogue: '(เขียนบทพูดต่อที่นี่...)', voiceTone: formData.voice, music: formData.music, soundEffects: [] },
            visualRefStatus: undefined
        }
        set({
            scriptData: {
                ...scriptData,
                scenes: [...scriptData.scenes, newScene],
                automation_ready: {
                    ...scriptData.automation_ready,
                    total_duration: scriptData.automation_ready.total_duration + dur,
                    sequence: [...scriptData.automation_ready.sequence, { id: num, timestamp: `${last.timeRange.end}s`, prompt: newScene.imagePrompt, narration: newScene.audio.dialogue }]
                },
                project: { ...scriptData.project, duration: { ...scriptData.project.duration, seconds: scriptData.project.duration.seconds + dur, sceneCount: scriptData.project.duration.sceneCount + 1 } }
            }
        })
    },

    resetProject: () => set({
        formData: defaultFormData,
        scriptData: null,
        activeScene: 0,
        isGenerating: false,
        progress: 0,
        error: null,
        creationMode: 'simple',
        superStep: 'input',
        streamingText: '',
        isStreaming: false,
        abortController: null,
        trends: [],
        selectedIdea: null,
        agentStatus: ''
    })
}))
