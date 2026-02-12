// ==================== Prompt Templates ====================

export const CREATIVE_DIRECTOR_SYSTEM_PROMPT = `คุณคือ "AI Creative Director" ผู้เชี่ยวชาญด้านการสร้างคอนเทนต์วิดีโอสั้น
คุณช่วยผู้ใช้วางแผน ปรับแต่ง และสร้างสคริปต์วิดีโอสั้นที่มีคุณภาพสูง

บทบาทของคุณ:
- ให้คำแนะนำเรื่องหัวข้อ ไอเดีย และแนวทางในการทำวิดีโอ
- ปรับแต่งการตั้งค่าต่างๆ ตามคำขอของผู้ใช้ (โทน, ประเภท, สไตล์ภาพ ฯลฯ)
- วิเคราะห์เทรนด์และแนะนำสิ่งที่กำลังเป็นกระแส
- ช่วยปรับปรุงสคริปต์ที่สร้างแล้ว

กฎ:
- ตอบเป็นภาษาไทยเสมอ
- กระชับและตรงประเด็น (ไม่เกิน 3 ประโยค ถ้าเป็นไปได้)
- เมื่อผู้ใช้ขอเปลี่ยนการตั้งค่า ให้ใช้ Function Calling เพื่ออัปเดตค่าจริง
- แสดงความกระตือรือร้นและสร้างสรรค์

ข้อมูลการตั้งค่าปัจจุบันของผู้ใช้:
{currentSettings}`

// Function declarations for Gemini Function Calling
export const DIRECTOR_FUNCTION_DECLARATIONS = [
    {
        name: 'updateTone',
        description: 'อัปเดตโทน/อารมณ์ของวิดีโอ เช่น friendly, funny, serious, exciting, calm, mysterious',
        parameters: {
            type: 'OBJECT',
            properties: {
                tone: {
                    type: 'STRING',
                    description: 'โทนที่ต้องการ: friendly, professional, funny, serious, exciting, calm, mysterious, romantic'
                }
            },
            required: ['tone']
        }
    },
    {
        name: 'updateGenre',
        description: 'อัปเดตประเภทของวิดีโอ เช่น education, comedy, review, howto, story, lifestyle, motivation, news, entertainment',
        parameters: {
            type: 'OBJECT',
            properties: {
                genre: {
                    type: 'STRING',
                    description: 'ประเภทวิดีโอ: education, comedy, review, howto, story, lifestyle, motivation, news, entertainment'
                }
            },
            required: ['genre']
        }
    },
    {
        name: 'updateTopic',
        description: 'อัปเดตหัวข้อ/ไอเดียของวิดีโอ',
        parameters: {
            type: 'OBJECT',
            properties: {
                topic: {
                    type: 'STRING',
                    description: 'หัวข้อหรือไอเดียใหม่'
                }
            },
            required: ['topic']
        }
    },
    {
        name: 'updateDuration',
        description: 'อัปเดตความยาวของวิดีโอ',
        parameters: {
            type: 'OBJECT',
            properties: {
                duration: {
                    type: 'STRING',
                    description: 'ความยาว: 15s, 30s, 60s'
                }
            },
            required: ['duration']
        }
    },
    {
        name: 'generateScript',
        description: 'เริ่มสร้างสคริปต์วิดีโอทันที',
        parameters: {
            type: 'OBJECT',
            properties: {
                confirm: {
                    type: 'BOOLEAN',
                    description: 'ยืนยันการสร้าง'
                }
            },
            required: ['confirm']
        }
    },
    {
        name: 'suggestIdeas',
        description: 'แนะนำไอเดียสำหรับวิดีโอ',
        parameters: {
            type: 'OBJECT',
            properties: {
                category: {
                    type: 'STRING',
                    description: 'หมวดหมู่ที่ต้องการ เช่น trending, educational, entertainment'
                }
            },
            required: ['category']
        }
    }
]

export interface ScriptPromptParams {
    topic: string
    genre: string
    artStyleName: string
    orientation: string
    audience: string
    totalSeconds: number
    tone: string
    voice: string
    music: string
    additionalInfo?: string
    negativePrompt?: string
    hasProductRef?: boolean
    hasCharacterRef?: boolean
    customStylePrompt?: string
}

function buildPromptStrategyLayer(params: ScriptPromptParams): string {
    return `
[STRATEGY LAYER]
คุณคือผู้กำกับวิดีโอสั้นระดับมืออาชีพ + strategist ที่เข้าใจ retention ของ Shorts/Reels/TikTok
เป้าหมาย: สร้างสคริปต์ที่มี Hook ชัดภายใน 1-2 วินาทีแรก, เดินเรื่องลื่น, ปิดท้ายด้วย CTA ที่ชวนลงมือทำ
กลุ่มเป้าหมาย: ${params.audience}
โทน: ${params.tone}
ประเภท: ${params.genre}
ความยาวรวม: ${params.totalSeconds} วินาที
`.trim()
}

function buildPromptScriptLayer(params: ScriptPromptParams): string {
    return `
[SCRIPT LAYER]
สร้าง narrative สำหรับคลิปเดียวแบบกระชับ แต่ครบ: hook -> value/story beat -> payoff -> CTA
ข้อกำหนดบทพูด:
- บทพูด/พากย์เป็นภาษาไทย ฟังเป็นธรรมชาติ
- ยาวพอดีกับ ${params.totalSeconds} วินาที
- ใส่ subtitle_lines สำหรับตัดซับให้อ่านง่าย (แต่ละบรรทัดสั้น)
`.trim()
}

function buildPromptVisualLayer(params: ScriptPromptParams): string {
    return `
[VISUAL LAYER]
สไตล์ภาพหลัก: ${params.artStyleName}
${params.customStylePrompt ? `สไตล์กำหนดเองจากผู้ใช้: ${params.customStylePrompt}` : ''}
แนววิดีโอ/เฟรม: ${params.orientation}
เสียงพากย์: ${params.voice}
เพลงประกอบ: ${params.music}
กำหนดภาพให้ cinematic, ชัดเจน, มี movement ต่อเนื่องในฉากเดียว
${params.negativePrompt ? `หลีกเลี่ยง: ${params.negativePrompt}` : ''}
${params.hasProductRef ? '- มีภาพสินค้าแนบเป็น reference: ให้คงรูปลักษณ์สินค้าให้ใกล้เคียงต้นฉบับ' : ''}
${params.hasCharacterRef ? '- มีภาพตัวละครแนบเป็น reference: ให้คงตัวตน/คาแรกเตอร์และความต่อเนื่องของหน้าตา' : ''}
`.trim()
}

function buildPromptPolishLayer(params: ScriptPromptParams): string {
    return `
[POLISH LAYER]
หัวข้อหลัก: ${params.topic}
${params.additionalInfo ? `ข้อมูลเสริมจากผู้ใช้: ${params.additionalInfo}` : ''}
ตรวจคุณภาพก่อนส่งออก:
- title_options น่าสนใจและสั้น
- hook คมและไม่ทั่วไป
- hashtags ใช้งานได้จริง
- edit_notes ใช้เป็นคำสั่งตัดต่อได้เลย
`.trim()
}

function buildOutputContract(params: ScriptPromptParams): string {
    return `
[OUTPUT CONTRACT - JSON ONLY]
ตอบกลับเป็น JSON object เท่านั้น ห้ามมี markdown/code fence/คำอธิบายนอก JSON
โครงสร้างต้องเป็นดังนี้:
{
  "title_options": ["...", "...", "..."],
  "hook": "...",
  "script": "...",
  "scenes": [
    {
      "scene_number": 1,
      "time_range": { "start": 0, "end": ${params.totalSeconds}, "duration": ${params.totalSeconds} },
      "image_prompt": "English visual prompt for AI video generation",
      "negative_prompt": "English negative prompt",
      "camera": { "angle": "...", "movement": "..." },
      "visuals": { "color_tone": "...", "mood": "...", "style": "..." },
      "dialogue": "Thai narration/dialogue",
      "voice_tone": "...",
      "music": "...",
      "subtitle_lines": ["...", "..."],
      "edit_notes": ["...", "..."]
    }
  ],
  "cta": "...",
  "hashtags": ["#...", "#..."],
  "edit_notes": ["global note 1", "global note 2"]
}
ข้อบังคับ: สร้างเพียง 1 scene และให้ครอบคลุมเวลาทั้งหมด
`.trim()
}

export function buildScriptPrompt(params: ScriptPromptParams): string {
    return [
        'คุณเป็นผู้กำกับวิดีโอมืออาชีพและผู้เชี่ยวชาญด้านการสร้างคอนเทนต์วิดีโอสั้น',
        '📋 ข้อมูลโปรเจค',
        `- หัวข้อ: ${params.topic}`,
        `- ประเภท: ${params.genre}`,
        `- สไตล์ภาพ: ${params.artStyleName}`,
        `- แนววิดีโอ: ${params.orientation}`,
        `- กลุ่มเป้าหมาย: ${params.audience}`,
        `- ความยาวทั้งหมด: ${params.totalSeconds} วินาที`,
        `- โทน/อารมณ์: ${params.tone}`,
        `- เสียงพากย์: ${params.voice}`,
        `- เพลงประกอบ: ${params.music}`,
        params.customStylePrompt ? `- สไตล์กำหนดเอง: ${params.customStylePrompt}` : '',
        params.additionalInfo ? `- รายละเอียดเพิ่มเติม: ${params.additionalInfo}` : '',
        params.negativePrompt ? `- Negative Prompt: ${params.negativePrompt}` : '',
        params.hasProductRef ? '- มี Product Reference: ใช่' : '',
        params.hasCharacterRef ? '- มี Character Reference: ใช่' : '',
        '',
        buildPromptStrategyLayer(params),
        '',
        buildPromptScriptLayer(params),
        '',
        buildPromptVisualLayer(params),
        '',
        buildPromptPolishLayer(params),
        '',
        buildOutputContract(params)
    ].filter(Boolean).join('\n')
}

// Trend analysis prompt template
export function buildTrendPrompt(topic: string): string {
    return `คุณเป็นนักวิเคราะห์ Viral Trend ระดับโลก เจาะลึกกระแสล่าสุดจาก TikTok, Reels, และ Shorts
  
  ช่วยคิด 3 ไอเดียสำหรับทำวิดีโอสั้นที่เกี่ยวข้องกับหัวข้อ: "${topic}" 
  โดยแต่ละไอเดียต้องมีความ "ไวรัล" สูง และแตกต่างกันในแง่ของมุมมอง
  
  ตอบเป็น JSON Array เท่านั้น (ห้ามมี Markdown หรือคำอธิบายอื่น) โดยแต่ละ Object มี properties ดังนี้:
  - title: ชื่อหัวข้อที่ดึงดูด (ภาษาไทย)
  - desc: อธิบายสั้นๆ ว่าทำไมเทรนด์นี้ถึงกำลังมา (ภาษาไทย)
  - tone: เลือกโทนที่เหมาะที่สุด (friendly, professional, funny, serious, exciting, calm, mysterious, romantic)
  
  ตัวอย่าง:
  [{"title": "...", "desc": "...", "tone": "..."}]`
}
