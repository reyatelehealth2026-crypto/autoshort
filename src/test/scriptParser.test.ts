import { describe, it, expect } from 'vitest'
import { generateJsonOutput } from '../utils/scriptParser'
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
    additionalInfo: ''
}

describe('scriptParser', () => {
    describe('generateJsonOutput', () => {
        it('should parse script text into structured JSON', () => {
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
            expect(result.scenes).toBeInstanceOf(Array)
            expect(result.scenes.length).toBeGreaterThan(0)
        })

        it('should handle minimal script text', () => {
            const result = generateJsonOutput(mockFormData, 'Simple script content')

            expect(result).toBeDefined()
            expect(result.automation_ready.project_name).toBe('AI ในชีวิตประจำวัน')
            expect(result.scenes).toBeDefined()
        })

        it('should include automation_ready section', () => {
            const result = generateJsonOutput(mockFormData, 'Test script')

            expect(result.automation_ready).toBeDefined()
            expect(result.automation_ready.sequence).toBeInstanceOf(Array)
        })

        it('should include metadata', () => {
            const result = generateJsonOutput(mockFormData, 'Test script')

            expect(result.metadata).toBeDefined()
            expect(result.metadata.version).toBe('1.0.0')
            expect(result.metadata.generator).toContain('Shorts Factory')
        })
    })
})
