// ==================== Multi-Agent System ====================
// Three agents that work in sequence: Research → Planner → Scriptwriter
// Each agent uses Gemini as its LLM backbone

import type { PipelineConfig, ResearchResult, PlanResult, ScriptResult } from './providers/types'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// ==================== Helper ====================
async function callGemini(
    apiKey: string,
    prompt: string,
    options: {
        model?: string
        temperature?: number
        maxTokens?: number
        jsonMode?: boolean
    } = {}
): Promise<string> {
    const model = options.model || 'gemini-2.0-flash'
    const response = await fetch(
        `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: options.temperature ?? 0.8,
                    maxOutputTokens: options.maxTokens ?? 8192,
                    ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
                },
            }),
        }
    )

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(`Gemini error: ${(err as any)?.error?.message || response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini returned empty response')
    return text
}

function parseJsonSafely<T>(text: string): T {
    try {
        return JSON.parse(text) as T
    } catch {
        // Try cleaning markdown code blocks
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        return JSON.parse(cleaned) as T
    }
}

// ==================== Research Agent ====================
export async function runResearchAgent(
    apiKey: string,
    config: PipelineConfig,
    onStatus?: (msg: string) => void
): Promise<ResearchResult> {
    onStatus?.('🔍 Research Agent: กำลังวิเคราะห์เทรนด์และข้อมูล...')

    const prompt = `คุณเป็น "Research Agent" ผู้เชี่ยวชาญด้านวิเคราะห์เทรนด์ไวรัลจาก TikTok, Instagram Reels, YouTube Shorts

งาน: วิเคราะห์หัวข้อ "${config.topic}" สำหรับทำวิดีโอสั้น

ข้อมูลเพิ่มเติม:
- ประเภท: ${config.formData.genre}
- โทน: ${config.formData.tone}
- กลุ่มเป้าหมาย: ${config.formData.targetAudience}

ให้ตอบเป็น JSON ตาม schema นี้:
{
    "trends": [
        {
            "title": "ชื่อเทรนด์ (ภาษาไทย)",
            "description": "อธิบายทำไมเทรนด์นี้กำลังมา (ภาษาไทย)",
            "viralScore": 85,
            "angle": "มุมมองที่แตกต่าง",
            "tone": "funny"
        }
    ],
    "facts": ["ข้อเท็จจริงที่น่าสนใจ 1", "ข้อเท็จจริง 2", "ข้อเท็จจริง 3"],
    "suggestedAngles": ["มุมมอง A", "มุมมอง B", "มุมมอง C"]
}

สร้าง 3 เทรนด์, 3-5 ข้อเท็จจริง, และ 3 มุมมอง
viralScore ตั้งแต่ 1-100 ยิ่งสูงยิ่ง viral
ตอบเป็น JSON เท่านั้น ห้ามมี markdown หรือคำอธิบาย`

    const text = await callGemini(apiKey, prompt, {
        temperature: 1.0,
        jsonMode: true,
    })

    onStatus?.('✅ Research Agent: วิเคราะห์เสร็จแล้ว!')
    return parseJsonSafely<ResearchResult>(text)
}

// ==================== Content Planner Agent ====================
export async function runPlannerAgent(
    apiKey: string,
    config: PipelineConfig,
    research: ResearchResult,
    onStatus?: (msg: string) => void
): Promise<PlanResult> {
    onStatus?.('📋 Planner Agent: กำลังวางโครงสร้างสคริปต์...')

    // Use the trend with highest viral score
    const bestTrend = research.trends.reduce((best, t) =>
        t.viralScore > best.viralScore ? t : best, research.trends[0])

    const durationMap: Record<string, number> = {
        '8sec': 8, '15sec': 15, '30sec': 30, '45sec': 45, '60sec': 60,
    }
    const totalDuration = durationMap[config.formData.duration] || 8

    const prompt = `คุณเป็น "Content Planner Agent" ผู้เชี่ยวชาญด้านวางโครงสร้างวิดีโอสั้น

จาก Research Result:
- เทรนด์ที่เลือก: ${bestTrend.title}
- รายละเอียด: ${bestTrend.description}
- โทน: ${bestTrend.tone}
- ข้อเท็จจริง: ${research.facts.join(', ')}

ข้อมูลโปรเจค:
- ความยาวรวม: ${totalDuration} วินาที
- ประเภท: ${config.formData.genre}
- สไตล์ภาพ: ${config.formData.artStyleName}
- แนว: ${config.formData.orientation === 'vertical' ? '9:16 แนวตั้ง' : '16:9 แนวนอน'}

วางโครงสร้างเป็น 1 ฉากหลักที่ครอบคลุม ${totalDuration} วินาที

ตอบเป็น JSON:
{
    "sceneCount": 1,
    "totalDuration": ${totalDuration},
    "scenes": [
        {
            "sceneNumber": 1,
            "duration": ${totalDuration},
            "description": "อธิบายฉากภาษาไทย",
            "visualConcept": "concept ภาพ - สั้นๆ ภาษาอังกฤษ",
            "narrationOutline": "โครงร่างบทพากย์ภาษาไทย"
        }
    ],
    "hook": "ประโยค hook เปิดเรื่อง (ภาษาไทย)",
    "callToAction": "CTA ปิดท้าย (ภาษาไทย)"
}

ตอบเป็น JSON เท่านั้น`

    const text = await callGemini(apiKey, prompt, {
        temperature: 0.8,
        jsonMode: true,
    })

    onStatus?.('✅ Planner Agent: วางโครงสร้างเสร็จแล้ว!')
    return parseJsonSafely<PlanResult>(text)
}

// ==================== Scriptwriter Agent ====================
export async function runScriptwriterAgent(
    apiKey: string,
    config: PipelineConfig,
    research: ResearchResult,
    plan: PlanResult,
    onStatus?: (msg: string) => void
): Promise<ScriptResult> {
    onStatus?.('✍️ Scriptwriter Agent: กำลังเขียนบทเต็มรูปแบบ...')

    const bestTrend = research.selectedTrend || research.trends.reduce((best, t) =>
        t.viralScore > best.viralScore ? t : best, research.trends[0])

    const scenesDesc = plan.scenes.map(s =>
        `ฉาก ${s.sceneNumber} (${s.duration}s): ${s.description} | Visual: ${s.visualConcept} | Narration: ${s.narrationOutline}`
    ).join('\n')

    const prompt = `คุณเป็น "Scriptwriter Agent" มืออาชีพด้านเขียนสคริปต์วิดีโอสั้นที่ทำยอด viral

ข้อมูลที่ได้จาก Research & Planning:
- เทรนด์: ${bestTrend.title} — ${bestTrend.description}
- Hook: ${plan.hook}
- CTA: ${plan.callToAction}
- โครงสร้าง:\n${scenesDesc}

ข้อมูลโปรเจค:
- ประเภท: ${config.formData.genre}
- โทน: ${config.formData.tone}
- สไตล์ภาพ: ${config.formData.artStyleName}
- เสียงพากย์: ${config.formData.voice}
- เพลง: ${config.formData.music}
${config.formData.additionalInfo ? `- เพิ่มเติม: ${config.formData.additionalInfo}` : ''}
${config.formData.negativePrompt ? `- ❌ Negative: ${config.formData.negativePrompt}` : ''}

เขียนสคริปต์เต็มรูปแบบ ตอบเป็น JSON:
{
    "scenes": [
        {
            "sceneNumber": 1,
            "timeRange": { "start": 0, "end": ${plan.totalDuration}, "duration": ${plan.totalDuration} },
            "imagePrompt": "Detailed English prompt for ${config.formData.artStyleName} style AI image generation, single continuous scene, high quality, dynamic composition...",
            "negativePrompt": "blurry, low quality, text, watermark, ugly, deformed...",
            "narration": "บทพากย์ภาษาไทยเต็ม",
            "voiceTone": "อารมณ์เสียง",
            "camera": { "angle": "Medium Close-up", "movement": "Slow push-in" },
            "visuals": { "colorTone": "Warm", "mood": "${config.formData.tone}", "style": "${config.formData.artStyleName}" },
            "musicCue": "${config.formData.music} style background",
            "soundEffects": ["sfx1", "sfx2"]
        }
    ],
    "summary": {
        "theme": "ธีมหลัก",
        "mood": "อารมณ์รวม",
        "hook": "${plan.hook}",
        "callToAction": "${plan.callToAction}",
        "hashtags": ["#shorts", "#viral", "#ai"]
    },
    "rawScript": "สคริปต์ดิบแบบอ่านได้"
}

สำคัญ:
- imagePrompt ต้องเป็นภาษาอังกฤษ ยาวและละเอียด เหมาะสำหรับ AI image generator
- narration ต้องเป็นภาษาไทย ความยาวเหมาะกับ ${plan.totalDuration} วินาที
- สร้างฉากตาม plan ที่ได้รับ

ตอบเป็น JSON เท่านั้น`

    const text = await callGemini(apiKey, prompt, {
        temperature: 0.85,
        maxTokens: 8192,
        jsonMode: true,
    })

    onStatus?.('✅ Scriptwriter Agent: เขียนบทเสร็จแล้ว!')
    return parseJsonSafely<ScriptResult>(text)
}
