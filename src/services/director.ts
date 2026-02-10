import { CREATIVE_DIRECTOR_SYSTEM_PROMPT, DIRECTOR_FUNCTION_DECLARATIONS } from '../prompts/templates'
import { ChatMessage, FormData } from '../types'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface GeminiMessage {
    role: 'user' | 'model'
    parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }>
}

interface FunctionCallResult {
    name: string
    args: Record<string, any>
}

// Build the current settings string for the system prompt
function buildSettingsContext(formData: FormData): string {
    return `
- หัวข้อ: ${formData.topic || '(ยังไม่ได้กำหนด)'}
- ประเภท: ${formData.genre || '(ยังไม่ได้เลือก)'}
- โทน: ${formData.tone || '(ยังไม่ได้เลือก)'}
- แนววิดีโอ: ${formData.orientation || '(ยังไม่ได้เลือก)'}
- ความยาว: ${formData.duration || '(ยังไม่ได้เลือก)'}
- สไตล์ภาพ: ${formData.artStyle?.name || '(ยังไม่ได้เลือก)'}
`
}

// Convert our ChatMessage format to Gemini format
function toGeminiHistory(messages: ChatMessage[]): GeminiMessage[] {
    return messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
            role: m.role === 'assistant' ? 'model' as const : 'user' as const,
            parts: [{ text: m.content }]
        }))
}

export async function chatWithDirector(
    apiKey: string,
    userMessage: string,
    chatHistory: ChatMessage[],
    formData: FormData
): Promise<{ text: string; functionCalls: FunctionCallResult[] }> {
    const systemPrompt = CREATIVE_DIRECTOR_SYSTEM_PROMPT.replace(
        '{currentSettings}',
        buildSettingsContext(formData)
    )

    // Use last 10 messages for context
    const recentHistory = chatHistory.slice(-10)
    const geminiHistory = toGeminiHistory(recentHistory)

    // Add the new user message
    geminiHistory.push({
        role: 'user',
        parts: [{ text: userMessage }]
    })

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: geminiHistory,
            tools: [{
                function_declarations: DIRECTOR_FUNCTION_DECLARATIONS
            }],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 1024,
            }
        })
    })

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as any)?.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]?.content
    const parts = candidate?.parts || []

    let text = ''
    const functionCalls: FunctionCallResult[] = []

    for (const part of parts) {
        if (part.text) {
            text += part.text
        }
        if (part.functionCall) {
            functionCalls.push({
                name: part.functionCall.name,
                args: part.functionCall.args || {}
            })
        }
    }

    return { text, functionCalls }
}
