// ==================== Art Style ====================
export interface ArtStyle {
    id: string
    name: string
    icon: string
    desc?: string
    params?: string
    image?: string
}

// ==================== Options ====================
export interface SelectOption {
    id: string
    label: string
    desc?: string
    icon?: string
}

// ==================== Scene Data ====================
export interface TimeRange {
    start: number
    end: number
    duration: number
}

export interface CameraSettings {
    angle: string
    movement: string
}

export interface VisualSettings {
    colorTone: string
    mood: string
    style: string
}

export interface AudioSettings {
    dialogue: string
    voiceTone: string
    music: string
    soundEffects: string[]
}

export interface SceneData {
    sceneNumber: number
    timeRange: TimeRange
    imagePrompt: string
    camera: CameraSettings
    visuals: VisualSettings
    audio: AudioSettings
    visualRefUrl?: string
    visualRefStatus?: 'generating' | 'ready' | 'error'
}

// ==================== Automation ====================
export interface AutomationPrompt {
    id: number
    timestamp: string
    prompt: string
    narration: string
}

// ==================== Script JSON Output ====================
export interface ScriptMetadata {
    version: string
    generatedAt: string
    generator: string
    pacing: string
}

export interface AutomationReady {
    project_name: string
    total_duration: number
    sequence: AutomationPrompt[]
}

export interface ProjectInfo {
    title: string
    genre: { id: string; label: string }
    orientation: { id: string; aspectRatio: string; label: string }
    duration: { id: string; seconds: number; sceneCount: number }
    targetAudience: { id: string; label: string }
    tone: { id: string; label: string }
    artStyle: { id: string; name: string }
    voice: { id: string; label: string }
    music: { id: string; label: string }
    additionalInfo: string | null
}

export interface ScriptSummary {
    theme: string
    overallMood: string
    hook: string
    callToAction: string
    suggestedHashtags: string[]
}

export interface ScriptJsonOutput {
    metadata: ScriptMetadata
    automation_ready: AutomationReady
    project: ProjectInfo
    scenes: SceneData[]
    summary: ScriptSummary
    rawScript: string
}

// ==================== Form Data ====================
export interface FormData {
    topic: string
    genre: string
    orientation: string
    targetAudience: string
    duration: string
    tone: string
    voice: string
    music: string
    artStyle: ArtStyle
    additionalInfo: string
    negativePrompt: string
}

// ==================== Chat ====================
export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

// ==================== Trend Ideas ====================
export interface TrendIdea {
    title: string
    desc: string
    tone: string
}

// ==================== SuperCreate Steps ====================
export interface SuperStep {
    id: string
    label: string
    icon: string
}

// ==================== Page Info ====================
export interface PageInfo {
    icon: string
    title: string
    desc: string
}

// ==================== Component Props ====================
export interface SidebarProps {
    currentPage: string
    onNavigate: (page: string) => void
    onOpenApiKey: () => void
    hasApiKey: boolean
}

export interface ApiKeyModalProps {
    apiKey: string
    onSave: (key: string) => void
    onClose: () => void
}

export interface ArtStyleModalProps {
    selectedStyle: ArtStyle
    onSelect: (style: ArtStyle) => void
    onClose: () => void
}

export interface ToolsHubProps {
    onNavigate: (page: string) => void
}

export interface ShortsCreatorProps {
    apiKey: string
}

export interface ComingSoonProps {
    pageId: string
}

// ==================== Pipeline Automation ====================
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

export interface MediaOutputItem {
    id: string
    provider: string
    status: 'pending' | 'processing' | 'completed' | 'error'
    sceneNumber: number
    // Image
    imageUrl?: string
    prompt?: string
    // Audio
    audioUrl?: string
    text?: string
    voiceId?: string
    // Video
    videoUrl?: string
    sourceImageUrl?: string
    durationSec?: number
    // Error
    error?: string
    metadata?: Record<string, any>
}

export interface PipelineConfig {
    topic: string
    mode: 'full_auto' | 'semi_auto'
    providers: {
        image: 'leonardo' | 'none'
        voice: 'elevenlabs' | 'none'
        video: 'kling' | 'leonardo_motion' | 'none'
    }
    formData: FormData
}

export interface ProviderKeys {
    gemini: string
    leonardo: string
    elevenlabs: string
    kling: string
}

