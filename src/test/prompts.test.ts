import { describe, it, expect } from 'vitest'
import { buildScriptPrompt, buildTrendPrompt, CREATIVE_DIRECTOR_SYSTEM_PROMPT, DIRECTOR_FUNCTION_DECLARATIONS } from '../prompts/templates'

describe('Prompt Templates', () => {
    describe('buildScriptPrompt', () => {
        it('should include all parameters in the prompt', () => {
            const prompt = buildScriptPrompt({
                topic: 'AI กับอนาคต',
                genre: 'Education',
                artStyleName: 'Cinematic Master',
                orientation: 'Portrait (9:16)',
                audience: 'Gen Z',
                totalSeconds: 30,
                tone: 'exciting',
                voice: 'Thai Female',
                music: 'Upbeat Pop',
                additionalInfo: 'เน้นภาพสวยๆ'
            })

            expect(prompt).toContain('AI กับอนาคต')
            expect(prompt).toContain('Education')
            expect(prompt).toContain('Cinematic Master')
            expect(prompt).toContain('30')
            expect(prompt).toContain('exciting')
            expect(prompt).toContain('เน้นภาพสวยๆ')
        })

        it('should contain modular layers and structured output contract', () => {
            const prompt = buildScriptPrompt({
                topic: 'test',
                genre: 'comedy',
                artStyleName: 'Anime',
                orientation: 'landscape',
                audience: 'general',
                totalSeconds: 15,
                tone: 'funny',
                voice: 'male',
                music: 'pop',
            })

            expect(prompt).toContain('[STRATEGY LAYER]')
            expect(prompt).toContain('[SCRIPT LAYER]')
            expect(prompt).toContain('[VISUAL LAYER]')
            expect(prompt).toContain('[POLISH LAYER]')
            expect(prompt).toContain('[OUTPUT CONTRACT - JSON ONLY]')
            expect(prompt).toContain('"title_options"')
            expect(prompt).toContain('"subtitle_lines"')
            expect(prompt).toContain('"edit_notes"')
        })
    })

    describe('buildTrendPrompt', () => {
        it('should include the topic', () => {
            const prompt = buildTrendPrompt('อาหารเกาหลี')
            expect(prompt).toContain('อาหารเกาหลี')
            expect(prompt).toContain('JSON Array')
        })
    })

    describe('CREATIVE_DIRECTOR_SYSTEM_PROMPT', () => {
        it('should have a settings placeholder', () => {
            expect(CREATIVE_DIRECTOR_SYSTEM_PROMPT).toContain('{currentSettings}')
        })

        it('should define the AI role', () => {
            expect(CREATIVE_DIRECTOR_SYSTEM_PROMPT).toContain('AI Creative Director')
        })
    })

    describe('DIRECTOR_FUNCTION_DECLARATIONS', () => {
        it('should have all required functions', () => {
            const names = DIRECTOR_FUNCTION_DECLARATIONS.map(f => f.name)
            expect(names).toContain('updateTone')
            expect(names).toContain('updateGenre')
            expect(names).toContain('updateTopic')
            expect(names).toContain('updateDuration')
            expect(names).toContain('generateScript')
            expect(names).toContain('suggestIdeas')
        })

        it('should have required parameters for each function', () => {
            for (const fn of DIRECTOR_FUNCTION_DECLARATIONS) {
                expect(fn.parameters).toBeDefined()
                expect(fn.parameters.type).toBe('OBJECT')
                expect(fn.parameters.required).toBeInstanceOf(Array)
                expect(fn.parameters.required.length).toBeGreaterThan(0)
            }
        })
    })
})
