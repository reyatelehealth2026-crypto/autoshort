// ==================== Provider Types ====================

// --- Provider Config ---
export interface ProviderConfig {
    apiKey: string
    baseUrl: string
    enabled: boolean
}

export interface AllProviderConfigs {
    leonardo: ProviderConfig
    elevenlabs: ProviderConfig
    kling: ProviderConfig
    gemini: ProviderConfig
}

// --- Generation Results ---
export interface ImageGenerationResult {
    id: string
    provider: 'leonardo'
    status: 'pending' | 'processing' | 'completed' | 'error'
    imageUrl?: string
    thumbnailUrl?: string
    prompt: string
    sceneNumber: number
    error?: string
    metadata?: Record<string, any>
}

export interface VoiceGenerationResult {
    id: string
    provider: 'elevenlabs'
    status: 'pending' | 'processing' | 'completed' | 'error'
    audioUrl?: string
    text: string
    voiceId: string
    sceneNumber: number
    durationMs?: number
    error?: string
}

export interface VideoGenerationResult {
    id: string
    provider: 'kling' | 'leonardo_motion'
    status: 'pending' | 'processing' | 'completed' | 'error'
    videoUrl?: string
    sourceImageUrl?: string
    sceneNumber: number
    durationSec?: number
    error?: string
    metadata?: Record<string, any>
}

export type MediaOutput = ImageGenerationResult | VoiceGenerationResult | VideoGenerationResult

// --- Pipeline Types ---
export type PipelineStatus =
    | 'idle'
    | 'researching'
    | 'planning'
    | 'scripting'
    | 'generating_images'
    | 'generating_voice'
    | 'generating_video'
    | 'assembling'
    | 'completed'
    | 'error'
    | 'paused'

export interface PipelineStep {
    id: string
    name: string
    status: 'pending' | 'running' | 'completed' | 'error' | 'skipped' | 'awaiting_approval'
    agent: string
    icon: string
    output?: any
    error?: string
    startedAt?: string
    completedAt?: string
    retryCount: number
}

export interface PipelineJob {
    id: string
    status: PipelineStatus
    config: PipelineConfig
    steps: PipelineStep[]
    mediaOutputs: MediaOutput[]
    createdAt: string
    updatedAt: string
    // Agent outputs
    researchResult?: ResearchResult
    planResult?: PlanResult
    scriptResult?: ScriptResult
    error?: string
}

export interface PipelineConfig {
    topic: string
    mode: 'full_auto' | 'semi_auto'
    providers: {
        image: 'leonardo' | 'none'
        voice: 'elevenlabs' | 'none'
        video: 'kling' | 'leonardo_motion' | 'none'
    }
    formData: {
        genre: string
        orientation: string
        targetAudience: string
        duration: string
        tone: string
        voice: string
        music: string
        artStyleName: string
        additionalInfo?: string
        negativePrompt?: string
    }
}

// --- Agent Results ---
export interface ResearchResult {
    trends: Array<{
        title: string
        description: string
        viralScore: number
        angle: string
        tone: string
    }>
    facts: string[]
    suggestedAngles: string[]
    selectedTrend?: {
        title: string
        description: string
        tone: string
    }
}

export interface PlanResult {
    sceneCount: number
    totalDuration: number
    scenes: Array<{
        sceneNumber: number
        duration: number
        description: string
        visualConcept: string
        narrationOutline: string
    }>
    hook: string
    callToAction: string
}

export interface ScriptResult {
    scenes: Array<{
        sceneNumber: number
        timeRange: { start: number; end: number; duration: number }
        imagePrompt: string
        negativePrompt: string
        narration: string
        voiceTone: string
        camera: { angle: string; movement: string }
        visuals: { colorTone: string; mood: string; style: string }
        musicCue: string
        soundEffects: string[]
    }>
    summary: {
        theme: string
        mood: string
        hook: string
        callToAction: string
        hashtags: string[]
    }
    rawScript: string
}

// --- SSE Events ---
export type PipelineEvent =
    | { type: 'job_created'; jobId: string }
    | { type: 'step_started'; stepId: string; stepName: string; agent: string }
    | { type: 'step_completed'; stepId: string; output: any }
    | { type: 'step_error'; stepId: string; error: string }
    | { type: 'step_awaiting_approval'; stepId: string }
    | { type: 'media_generated'; media: MediaOutput }
    | { type: 'pipeline_completed'; jobId: string }
    | { type: 'pipeline_error'; jobId: string; error: string }
    | { type: 'agent_status'; agent: string; message: string }

// --- Leonardo-specific ---
export interface LeonardoGenerationRequest {
    prompt: string
    negativePrompt?: string
    modelId?: string
    width?: number
    height?: number
    numImages?: number
    alchemy?: boolean
    photoReal?: boolean
    presetStyle?: string
}

export interface LeonardoBlueprintInput {
    blueprintVersionId: string
    nodeInputs: Array<{
        value: any
        nodeId: string
        settingName: string
    }>
}

// --- ElevenLabs-specific ---
export interface ElevenLabsTTSRequest {
    text: string
    voiceId: string
    modelId?: string
    stability?: number
    similarityBoost?: number
    style?: number
}

// --- Kling-specific ---
export interface KlingVideoRequest {
    prompt?: string
    imageUrl?: string
    duration?: 5 | 10
    mode?: 'standard' | 'pro'
    aspectRatio?: '16:9' | '9:16' | '1:1'
}
