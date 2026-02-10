import { FormData, TrendIdea } from '../types'
import { buildScriptPrompt, buildTrendPrompt } from '../prompts/templates'
import {
    genreOptions,
    orientationOptions,
    targetAudienceOptions,
    durationMap,
    voiceOptions,
    musicOptions
} from '../data/constants'
import toast from 'react-hot-toast'

// ==================== API Config ====================
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

// ==================== Retry Helper ====================
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = MAX_RETRIES
): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, options)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMsg = (errorData as any)?.error?.message || `HTTP ${response.status}`

                if (response.status === 429 || response.status >= 500) {
                    lastError = new Error(errorMsg)
                    if (attempt < retries) {
                        const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500
                        toast(`⏳ Retrying... (${attempt + 1}/${retries})`, { icon: '🔄', duration: 2000 })
                        await new Promise(r => setTimeout(r, delay))
                        continue
                    }
                }
                throw new Error(errorMsg)
            }

            return response
        } catch (err: any) {
            if (err.message && !err.message.startsWith('HTTP')) {
                lastError = err
                if (attempt < retries) {
                    const delay = BASE_DELAY_MS * Math.pow(2, attempt)
                    await new Promise(r => setTimeout(r, delay))
                    continue
                }
            }
            throw err
        }
    }

    throw lastError || new Error('Max retries exceeded')
}

// ==================== Generate Script ====================
export async function generateWithGemini(apiKey: string, formData: FormData): Promise<string> {
    const totalSeconds = durationMap[formData.duration] || 8

    const genreLabel = genreOptions.find(g => g.id === formData.genre)?.label || formData.genre
    const orientationLabel = orientationOptions.find(o => o.id === formData.orientation)?.label || formData.orientation
    const audienceLabel = targetAudienceOptions.find(t => t.id === formData.targetAudience)?.label || formData.targetAudience
    const voiceLabel = voiceOptions.find(v => v.id === formData.voice)?.label || formData.voice
    const musicLabel = musicOptions.find(m => m.id === formData.music)?.label || formData.music

    const prompt = buildScriptPrompt({
        topic: formData.topic,
        genre: genreLabel,
        artStyleName: formData.artStyle.name,
        orientation: orientationLabel,
        audience: audienceLabel,
        totalSeconds,
        tone: formData.tone,
        voice: voiceLabel,
        music: musicLabel,
        additionalInfo: formData.additionalInfo
    })

    const response = await fetchWithRetry(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.85,
                    maxOutputTokens: 8192,
                }
            })
        }
    )

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) throw new Error('ไม่ได้รับข้อมูลจาก API')

    return text
}

// ==================== Fetch Trends ====================
export async function fetchTrendsWithGemini(apiKey: string, topic: string): Promise<TrendIdea[]> {
    const prompt = buildTrendPrompt(topic)

    const response = await fetchWithRetry(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 1,
                    responseMimeType: "application/json",
                }
            })
        }
    )

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    try {
        return JSON.parse(text) as TrendIdea[]
    } catch {
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
        return JSON.parse(cleanJson) as TrendIdea[]
    }
}

// ==================== Streaming Support ====================
export async function* streamGenerateWithGemini(
    apiKey: string,
    formData: FormData
): AsyncGenerator<string, void, unknown> {
    const STREAM_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent'
    const totalSeconds = durationMap[formData.duration] || 8

    const genreLabel = genreOptions.find(g => g.id === formData.genre)?.label || formData.genre
    const orientationLabel = orientationOptions.find(o => o.id === formData.orientation)?.label || formData.orientation
    const audienceLabel = targetAudienceOptions.find(t => t.id === formData.targetAudience)?.label || formData.targetAudience
    const voiceLabel = voiceOptions.find(v => v.id === formData.voice)?.label || formData.voice
    const musicLabel = musicOptions.find(m => m.id === formData.music)?.label || formData.music

    const prompt = buildScriptPrompt({
        topic: formData.topic,
        genre: genreLabel,
        artStyleName: formData.artStyle.name,
        orientation: orientationLabel,
        audience: audienceLabel,
        totalSeconds,
        tone: formData.tone,
        voice: voiceLabel,
        music: musicLabel,
        additionalInfo: formData.additionalInfo
    })

    const response = await fetch(
        `${STREAM_URL}?key=${apiKey}&alt=sse`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.85,
                    maxOutputTokens: 8192,
                }
            })
        }
    )

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as any)?.error?.message || `HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No stream reader available')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim()
                if (jsonStr === '[DONE]') return
                try {
                    const data = JSON.parse(jsonStr)
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
                    if (text) yield text
                } catch {
                    // skip malformed JSON
                }
            }
        }
    }
}
