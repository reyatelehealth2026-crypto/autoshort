import { z } from 'zod'
import { FormData, ScriptJsonOutput, SceneData, StructuredShortClipOutput } from '../types'
import {
    genreOptions,
    orientationOptions,
    targetAudienceOptions,
    durationMap,
    voiceOptions,
    musicOptions
} from '../data/constants'

const StructuredSceneSchema = z.object({
    scene_number: z.number().int().min(1).default(1),
    time_range: z.object({
        start: z.number().min(0).default(0),
        end: z.number().min(0).default(0),
        duration: z.number().min(0).default(0)
    }).default({ start: 0, end: 0, duration: 0 }),
    image_prompt: z.string().min(1).default(''),
    negative_prompt: z.string().optional().default(''),
    camera: z.object({
        angle: z.string().default('Medium Shot'),
        movement: z.string().default('Static')
    }).default({ angle: 'Medium Shot', movement: 'Static' }),
    visuals: z.object({
        color_tone: z.string().default('Balanced'),
        mood: z.string().default('neutral'),
        style: z.string().default('cinematic')
    }).default({ color_tone: 'Balanced', mood: 'neutral', style: 'cinematic' }),
    dialogue: z.string().default(''),
    voice_tone: z.string().default('natural'),
    music: z.string().default(''),
    subtitle_lines: z.array(z.string()).default([]),
    edit_notes: z.array(z.string()).default([])
})

const ShortClipSchema = z.object({
    title_options: z.array(z.string().min(1)).min(1).max(5),
    hook: z.string().min(1),
    script: z.string().min(1),
    scenes: z.array(StructuredSceneSchema).min(1).max(1),
    cta: z.string().min(1),
    hashtags: z.array(z.string().min(1)).default([]),
    edit_notes: z.array(z.string()).default([])
})

export type ParsedShortClip = z.infer<typeof ShortClipSchema>

const extractField = (text: string, fieldName: string): string => {
    const regex = new RegExp(`${fieldName}\\s*(?:\\(.*?\\))?:\\s*([\\s\\S]*?)(?=\\n|$)`, 'i')
    const match = text.match(regex)
    return match ? match[1].trim() : ''
}

const cleanDialogue = (text: string): string => {
    return text.replace(/^"|"$/g, '').replace(/\[.*?\]/g, '').trim()
}

function stripCodeFence(input: string): string {
    return input.replace(/```json/gi, '').replace(/```/g, '').trim()
}

function safeJsonParse(input: string): unknown | null {
    try {
        return JSON.parse(stripCodeFence(input))
    } catch {
        return null
    }
}

export function parseStructuredShortClip(scriptText: string): ParsedShortClip | null {
    const parsed = safeJsonParse(scriptText)
    if (!parsed) return null

    const result = ShortClipSchema.safeParse(parsed)
    return result.success ? result.data : null
}

function toSceneData(formData: FormData, clip: ParsedShortClip): SceneData {
    const totalSeconds = durationMap[formData.duration] || 8
    const scene = clip.scenes[0]
    const end = scene.time_range.end > 0 ? scene.time_range.end : totalSeconds
    const duration = scene.time_range.duration > 0 ? scene.time_range.duration : totalSeconds

    return {
        sceneNumber: 1,
        timeRange: {
            start: scene.time_range.start,
            end,
            duration
        },
        imagePrompt: scene.image_prompt,
        camera: {
            angle: scene.camera.angle,
            movement: scene.camera.movement
        },
        visuals: {
            colorTone: scene.visuals.color_tone,
            mood: scene.visuals.mood || formData.tone,
            style: scene.visuals.style || formData.artStyle.name
        },
        audio: {
            dialogue: scene.dialogue || clip.script,
            voiceTone: scene.voice_tone,
            music: scene.music,
            soundEffects: []
        },
        visualRefStatus: 'ready'
    }
}

function parseLegacyScene(formData: FormData, scriptText: string): SceneData {
    const imagePrompt = extractField(scriptText, 'IMAGE PROMPT')
    const angle = extractField(scriptText, 'มุมกล้อง')
    const movement = extractField(scriptText, 'การเคลื่อนไหว')
    const colorTone = extractField(scriptText, 'โทนสี')
    const dialogue = cleanDialogue(extractField(scriptText, 'บทพูด/ข้อความ'))
    const voiceTone = extractField(scriptText, 'น้ำเสียง')
    const music = extractField(scriptText, 'เสียง/เพลง')
    const totalSeconds = durationMap[formData.duration] || 8

    return {
        sceneNumber: 1,
        timeRange: {
            start: 0,
            end: totalSeconds,
            duration: totalSeconds
        },
        imagePrompt,
        camera: {
            angle,
            movement
        },
        visuals: {
            colorTone,
            mood: formData.tone,
            style: formData.artStyle.name
        },
        audio: {
            dialogue,
            voiceTone,
            music,
            soundEffects: []
        },
        visualRefStatus: 'ready'
    }
}

export function generateJsonOutput(formData: FormData, scriptText: string): ScriptJsonOutput {
    const totalSeconds = durationMap[formData.duration] || 8
    const parsedClip = parseStructuredShortClip(scriptText)

    const scene = parsedClip
        ? toSceneData(formData, parsedClip)
        : parseLegacyScene(formData, scriptText)

    const sequence = [
        {
            id: 1,
            timestamp: '00:00:00',
            prompt: scene.imagePrompt,
            narration: scene.audio.dialogue
        }
    ]

    const fallbackHook = scene.audio.dialogue
        ? `${scene.audio.dialogue.substring(0, 50)}...`
        : formData.topic

    const suggestedHashtags = parsedClip?.hashtags?.length
        ? parsedClip.hashtags
        : ['#shorts', '#ai', '#viral']

    const callToAction = parsedClip?.cta || 'Follow for more'
    const structuredClip: StructuredShortClipOutput | undefined = parsedClip ? {
        title_options: parsedClip.title_options,
        hook: parsedClip.hook,
        script: parsedClip.script,
        scenes: parsedClip.scenes,
        cta: parsedClip.cta,
        hashtags: parsedClip.hashtags,
        edit_notes: parsedClip.edit_notes
    } : undefined

    return {
        metadata: {
            version: '1.1.0',
            generatedAt: new Date().toISOString(),
            generator: 'Shorts Factory v1',
            pacing: 'fast'
        },
        automation_ready: {
            project_name: formData.topic,
            total_duration: totalSeconds,
            sequence
        },
        project: {
            title: formData.topic,
            genre: { id: formData.genre, label: genreOptions.find(g => g.id === formData.genre)?.label || formData.genre },
            orientation: { id: formData.orientation, aspectRatio: formData.orientation === 'vertical' ? '9:16' : '16:9', label: orientationOptions.find(o => o.id === formData.orientation)?.label || formData.orientation },
            duration: { id: formData.duration, seconds: totalSeconds, sceneCount: 1 },
            targetAudience: { id: formData.targetAudience, label: targetAudienceOptions.find(t => t.id === formData.targetAudience)?.label || formData.targetAudience },
            tone: { id: formData.tone, label: formData.tone },
            artStyle: { id: formData.artStyle.id, name: formData.artStyle.name },
            voice: { id: formData.voice, label: voiceOptions.find(v => v.id === formData.voice)?.label || formData.voice },
            music: { id: formData.music, label: musicOptions.find(v => v.id === formData.music)?.label || formData.music },
            additionalInfo: formData.additionalInfo
        },
        scenes: [scene],
        summary: {
            theme: formData.genre,
            overallMood: formData.tone,
            hook: parsedClip?.hook || fallbackHook,
            callToAction,
            suggestedHashtags
        },
        structuredClip,
        rawScript: scriptText
    }
}
