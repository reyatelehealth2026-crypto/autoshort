import { describe, it, expect } from 'vitest'
import { generateJsonOutput, parseStructuredShortClip } from '../utils/scriptParser'
import { artStyles } from '../data/constants'

const mockFormData = {
    topic: 'AI ในชีวิตประจำวัน',
    genre: 'education',
    orientation: 'vertical',
    targetAudience: 'general',
    duration: '30sec',
    tone: 'friendly',
    voice: 'thai-female',
    music: 'upbeat',
    artStyle: artStyles[0],
    additionalInfo: '',
    negativePrompt: ''
}

describe('scriptParser', () => {
    describe('parseStructuredShortClip', () => {
        it('should parse valid short clip JSON', () => {
            const jsonText = JSON.stringify({
                title_options: ['AI เปลี่ยนชีวิตใน 30 วิ', 'รู้จัก AI ให้ทันโลก', 'AI ใกล้ตัวกว่าที่คิด'],
                hook: 'คุณกำลังใช้ AI โดยไม่รู้ตัวทุกวัน!',
                script: 'วันนี้เราจะพาไปดูว่า AI อยู่รอบตัวเรามากแค่ไหน',
                scenes: [
                    {
                        scene_number: 1,
                        time_range: { start: 0, end: 30, duration: 30 },
                        image_prompt: 'Cinematic Thai city with AI overlays, dynamic movement',
                        negative_prompt: 'blurry, low quality, watermark, text',
                        camera: { angle: 'Medium Shot', movement: 'Slow push in' },
                        visuals: { color_tone: 'Vibrant', mood: 'Exciting', style: 'Cinematic' },
                        dialogue: 'AI กำลังช่วยเราทำงาน เรียน และใช้ชีวิตให้เร็วขึ้นทุกวัน',
                        voice_tone: 'Friendly and energetic',
                        music: 'Upbeat pop',
                        subtitle_lines: ['AI อยู่ในมือถือของคุณ', 'AI ช่วยคุณตัดสินใจเร็วขึ้น'],
                        edit_notes: ['เปิดด้วยตัวหนังสือใหญ่', 'ใส่ sound hit ต้นคลิป']
                    }
                ],
                cta: 'กดติดตามเพื่อเทคนิค AI ใช้งานจริงทุกวัน',
                hashtags: ['#AI', '#Shorts', '#เทคโนโลยี'],
                edit_notes: ['ตัดเร็วช่วง 0-3 วินาที', 'เร่งจังหวะดนตรีตอนจบ']
            })

            const result = parseStructuredShortClip(jsonText)
            expect(result).toBeTruthy()
            expect(result?.title_options.length).toBe(3)
            expect(result?.scenes[0].subtitle_lines.length).toBeGreaterThan(0)
        })
    })

    describe('generateJsonOutput', () => {
        it('should map structured output into ScriptJsonOutput', () => {
            const scriptText = JSON.stringify({
                title_options: ['หัวข้อ 1', 'หัวข้อ 2', 'หัวข้อ 3'],
                hook: 'ฮุกทดสอบ',
                script: 'สคริปต์ทดสอบ',
                scenes: [{
                    scene_number: 1,
                    time_range: { start: 0, end: 30, duration: 30 },
                    image_prompt: 'Test cinematic image prompt',
                    negative_prompt: 'blurry',
                    camera: { angle: 'Close up', movement: 'Dolly in' },
                    visuals: { color_tone: 'Warm', mood: 'Friendly', style: 'Anime' },
                    dialogue: 'บทพูดทดสอบ',
                    voice_tone: 'Natural',
                    music: 'Upbeat',
                    subtitle_lines: ['ซับ 1', 'ซับ 2'],
                    edit_notes: ['โน้ต 1']
                }],
                cta: 'กดติดตาม',
                hashtags: ['#test'],
                edit_notes: ['global note']
            })

            const result = generateJsonOutput(mockFormData, scriptText)

            expect(result.summary.hook).toBe('ฮุกทดสอบ')
            expect(result.summary.callToAction).toBe('กดติดตาม')
            expect(result.summary.suggestedHashtags).toEqual(['#test'])
            expect(result.structuredClip?.title_options.length).toBe(3)
            expect(result.scenes[0].camera.angle).toBe('Close up')
        })

        it('should fallback to legacy parsing when JSON is invalid', () => {
            const scriptText = `🎬 ฉากที่ 1 (เวลา 0-30 วินาที)

📸 IMAGE PROMPT:
A futuristic city scene with AI elements

🎥 มุมกล้อง: Medium Shot, slow zoom in

🔄 การเคลื่อนไหว: Camera slowly moving

🎨 โทนสี: Warm, cinematic

🗣️ บทพูด/ข้อความ:
"สวัสดีทุกคน วันนี้เราจะมาพูดถึง AI"

🎤 น้ำเสียง: Friendly

🎵 เสียง/เพลง: Upbeat pop`

            const result = generateJsonOutput(mockFormData, scriptText)

            expect(result).toBeDefined()
            expect(result.automation_ready.project_name).toBe('AI ในชีวิตประจำวัน')
            expect(result.scenes.length).toBe(1)
            expect(result.structuredClip).toBeUndefined()
        })

        it('should include metadata and automation section', () => {
            const result = generateJsonOutput(mockFormData, 'Simple script content')

            expect(result.metadata).toBeDefined()
            expect(result.metadata.version).toBe('1.1.0')
            expect(result.automation_ready).toBeDefined()
            expect(result.automation_ready.sequence).toBeInstanceOf(Array)
        })
    })
})
