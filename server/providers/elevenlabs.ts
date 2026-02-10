// ==================== ElevenLabs TTS Provider ====================
// Handles: Text-to-Speech, Voice listing
// Docs: https://elevenlabs.io/docs/api-reference

import type { ProviderConfig, VoiceGenerationResult, ElevenLabsTTSRequest } from './types'

const DEFAULT_BASE_URL = 'https://api.elevenlabs.io'

// Default voices for Thai content
export const DEFAULT_VOICES = {
    'thai-female': { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
    'thai-male': { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
    'narrator': { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    'energetic': { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Emily' },
} as const

// ==================== Generate Speech ====================
export async function generateSpeech(
    config: ProviderConfig,
    request: ElevenLabsTTSRequest
): Promise<VoiceGenerationResult> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL
    const voiceId = request.voiceId || DEFAULT_VOICES['thai-female'].id

    const response = await fetch(
        `${baseUrl}/v1/text-to-speech/${voiceId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': config.apiKey,
            },
            body: JSON.stringify({
                text: request.text,
                model_id: request.modelId || 'eleven_multilingual_v2',
                voice_settings: {
                    stability: request.stability ?? 0.5,
                    similarity_boost: request.similarityBoost ?? 0.75,
                    style: request.style ?? 0.5,
                    use_speaker_boost: true,
                },
            }),
        }
    )

    if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        let errorMsg = `ElevenLabs TTS failed: ${response.status}`
        try {
            const errJson = JSON.parse(errorText)
            errorMsg = errJson.detail?.message || errJson.error || errorMsg
        } catch { /* use default */ }

        return {
            id: `el-err-${Date.now()}`,
            provider: 'elevenlabs',
            status: 'error',
            text: request.text,
            voiceId,
            sceneNumber: 0,
            error: errorMsg,
        }
    }

    // Audio is returned directly as binary
    const audioBuffer = await response.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`

    return {
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        provider: 'elevenlabs',
        status: 'completed',
        audioUrl: audioDataUrl,
        text: request.text,
        voiceId,
        sceneNumber: 0,
    }
}

// ==================== Generate Speech to File-like URL ====================
export async function generateSpeechRaw(
    config: ProviderConfig,
    request: ElevenLabsTTSRequest
): Promise<{ buffer: Buffer; contentType: string }> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL
    const voiceId = request.voiceId || DEFAULT_VOICES['thai-female'].id

    const response = await fetch(
        `${baseUrl}/v1/text-to-speech/${voiceId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': config.apiKey,
            },
            body: JSON.stringify({
                text: request.text,
                model_id: request.modelId || 'eleven_multilingual_v2',
                voice_settings: {
                    stability: request.stability ?? 0.5,
                    similarity_boost: request.similarityBoost ?? 0.75,
                    style: request.style ?? 0.5,
                    use_speaker_boost: true,
                },
            }),
        }
    )

    if (!response.ok) {
        throw new Error(`ElevenLabs TTS failed: ${response.status}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    return { buffer, contentType: 'audio/mpeg' }
}

// ==================== List Available Voices ====================
export async function listVoices(
    config: ProviderConfig
): Promise<Array<{ voice_id: string; name: string; category: string }>> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    const response = await fetch(`${baseUrl}/v1/voices`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'xi-api-key': config.apiKey,
        },
    })

    if (!response.ok) {
        throw new Error(`ElevenLabs voices list failed: ${response.status}`)
    }

    const data = await response.json()
    return (data.voices || []).map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category || 'premade',
    }))
}

// ==================== Get Subscription Info ====================
export async function getSubscriptionInfo(config: ProviderConfig): Promise<{
    characterCount: number
    characterLimit: number
    tier: string
}> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    const response = await fetch(`${baseUrl}/v1/user/subscription`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'xi-api-key': config.apiKey,
        },
    })

    if (!response.ok) {
        throw new Error(`ElevenLabs subscription check failed: ${response.status}`)
    }

    const data = await response.json()
    return {
        characterCount: data.character_count || 0,
        characterLimit: data.character_limit || 0,
        tier: data.tier || 'free',
    }
}

// ==================== Health Check ====================
export async function checkConnection(config: ProviderConfig): Promise<boolean> {
    try {
        const baseUrl = config.baseUrl || DEFAULT_BASE_URL
        const response = await fetch(`${baseUrl}/v1/user`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'xi-api-key': config.apiKey,
            },
        })
        return response.ok
    } catch {
        return false
    }
}
