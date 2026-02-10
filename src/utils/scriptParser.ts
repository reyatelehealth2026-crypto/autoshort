import { FormData, ScriptJsonOutput, SceneData } from '../types'
import {
    genreOptions,
    orientationOptions,
    targetAudienceOptions,
    durationMap,
    voiceOptions,
    musicOptions
} from '../data/constants'

const extractField = (text: string, fieldName: string): string => {
    const regex = new RegExp(`${fieldName}\\s*(?:\\(.*?\\))?:\\s*([\\s\\S]*?)(?=\\n|$)`, 'i')
    const match = text.match(regex)
    return match ? match[1].trim() : ''
}

const cleanDialogue = (text: string): string => {
    return text.replace(/^"|"$/g, '').replace(/\[.*?\]/g, '').trim()
}

export function generateJsonOutput(formData: FormData, scriptText: string): ScriptJsonOutput {
    // Parsing logic
    const imagePrompt = extractField(scriptText, 'IMAGE PROMPT')
    const angle = extractField(scriptText, 'มุมกล้อง')
    const movement = extractField(scriptText, 'การเคลื่อนไหว')
    const colorTone = extractField(scriptText, 'โทนสี')
    const dialogue = cleanDialogue(extractField(scriptText, 'บทพูด/ข้อความ'))
    const voiceTone = extractField(scriptText, 'น้ำเสียง')
    const music = extractField(scriptText, 'เสียง/เพลง')

    const scene: SceneData = {
        sceneNumber: 1,
        timeRange: {
            start: 0,
            end: durationMap[formData.duration] || 8,
            duration: durationMap[formData.duration] || 8
        },
        imagePrompt: imagePrompt,
        camera: {
            angle: angle,
            movement: movement
        },
        visuals: {
            colorTone: colorTone,
            mood: formData.tone,
            style: formData.artStyle.name
        },
        audio: {
            dialogue: dialogue,
            voiceTone: voiceTone,
            music: music,
            soundEffects: []
        },
        visualRefStatus: 'ready'
    }

    const sequence = [
        {
            id: 1,
            timestamp: "00:00:00",
            prompt: scene.imagePrompt,
            narration: scene.audio.dialogue
        }
    ]

    return {
        metadata: {
            version: "1.0.0",
            generatedAt: new Date().toISOString(),
            generator: "Shorts Factory v1",
            pacing: "fast"
        },
        automation_ready: {
            project_name: formData.topic,
            total_duration: durationMap[formData.duration] || 8,
            sequence: sequence
        },
        project: {
            title: formData.topic,
            genre: { id: formData.genre, label: genreOptions.find(g => g.id === formData.genre)?.label || formData.genre },
            orientation: { id: formData.orientation, aspectRatio: formData.orientation === 'vertical' ? '9:16' : '16:9', label: orientationOptions.find(o => o.id === formData.orientation)?.label || formData.orientation },
            duration: { id: formData.duration, seconds: durationMap[formData.duration] || 8, sceneCount: 1 },
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
            hook: scene.audio.dialogue.substring(0, 50) + "...",
            callToAction: "Follow for more",
            suggestedHashtags: ["#shorts", "#ai", "#viral"]
        },
        rawScript: scriptText
    }
}
