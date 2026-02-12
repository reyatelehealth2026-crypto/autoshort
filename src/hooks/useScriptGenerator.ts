import { useProjectStore } from '../stores/useProjectStore'
import { useChatStore } from '../stores/useChatStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import { generateWithGemini, fetchTrendsWithGemini } from '../services/gemini'
import { chatWithDirector } from '../services/director'
import { generateJsonOutput } from '../utils/scriptParser'
import { validateScriptOutput } from '../utils/qaValidator'
import { ChatMessage, TrendIdea } from '../types'
import toast from 'react-hot-toast'

export function useScriptGenerator() {
    const apiKey = useSettingsStore((s) => s.apiKey)
    const {
        formData, setFormData, setScriptData, setIsGenerating,
        setProgress, setError, setSuperStep, setTrends,
        setSelectedIdea, setAgentStatus, creationMode
    } = useProjectStore()
    const { messages, addMessage, setIsLoading: setChatLoading } = useChatStore()

    // ==================== Script Generation ====================
    const handleGenerate = async () => {
        if (!apiKey) {
            toast.error('กรุณาใส่ API Key ก่อนเริ่มใช้งาน')
            useUIStore.getState().setShowApiKeyModal(true)
            return
        }
        setIsGenerating(true)
        setError(null)
        setScriptData(null)
        setProgress(0)

        try {
            const interval = setInterval(() => {
                setProgress((prev: number) => {
                    if (prev >= 90) { clearInterval(interval); return 90 }
                    return prev + 10
                })
            }, 500)

            const generatedText = await generateWithGemini(apiKey, formData)
            clearInterval(interval)
            setProgress(100)
            const jsonOutput = generateJsonOutput(formData, generatedText)
            const qa = validateScriptOutput(formData, jsonOutput)

            if (!qa.passed) {
                const topIssue = qa.flags[0]?.message || 'คุณภาพยังไม่ถึงเกณฑ์'
                setError(`QA: ${topIssue} (score ${qa.score}/100)`)
                setIsGenerating(false)
                toast.error(`QA ไม่ผ่าน (${qa.score}/100) — ลองปรับ prompt หรือ regenerate`)
                return
            }

            setScriptData(jsonOutput)
            setIsGenerating(false)
            toast.success(`สร้างสคริปต์เสร็จเรียบร้อย! 🎬 (QA ${qa.score}/100)`)
        } catch (err: any) {
            const msg = err.message || 'เกิดข้อผิดพลาดในการสร้างสคริปต์'
            setError(msg)
            setIsGenerating(false)
            toast.error(msg)
        }
    }

    // ==================== SuperCreate Flow ====================
    const runSuperCreateFlow = async () => {
        if (!apiKey) { toast.error('กรุณาใส่ API Key ก่อน'); useUIStore.getState().setShowApiKeyModal(true); return }
        setIsGenerating(true)
        setSuperStep('researching')
        setAgentStatus('Fact-Checker กำลังวิเคราะห์เทรนด์...')

        try {
            const fetched = await fetchTrendsWithGemini(apiKey, formData.topic)
            setTrends(fetched)
            setSuperStep('selecting')
            setAgentStatus('รอการตัดสินใจจากคุณ...')
        } catch (err: any) {
            setError(err.message)
            setSuperStep('input')
            setIsGenerating(false)
        }
    }

    const handleSelectIdea = async (idea: TrendIdea) => {
        setSelectedIdea(idea)
        setSuperStep('architecting')
        setAgentStatus('Visual Architect กำลังออกแบบฉาก...')

        setFormData((prev) => ({
            ...prev,
            topic: idea.title,
            tone: idea.tone,
            additionalInfo: idea.desc
        }))

        setTimeout(async () => {
            setSuperStep('scripting')
            setAgentStatus('Storyteller กำลังเขียนบท...')

            try {
                const generatedText = await generateWithGemini(apiKey, {
                    ...formData,
                    topic: idea.title,
                    tone: idea.tone,
                    additionalInfo: idea.desc
                })
                setProgress(100)
                const effectiveForm = { ...formData, topic: idea.title, tone: idea.tone, additionalInfo: idea.desc }
                const jsonOutput = generateJsonOutput(effectiveForm, generatedText)
                const qa = validateScriptOutput(effectiveForm, jsonOutput)

                if (!qa.passed) {
                    setError(`QA: ${qa.flags[0]?.message || 'คุณภาพยังไม่ถึงเกณฑ์'} (score ${qa.score}/100)`)
                    setIsGenerating(false)
                    setSuperStep('input')
                    toast.error(`QA ไม่ผ่าน (${qa.score}/100) — กรุณาลองเลือกมุมใหม่`)
                    return
                }

                setScriptData(jsonOutput)
                setIsGenerating(false)
                setSuperStep('input')
                toast.success(`SuperCreate เสร็จสมบูรณ์! 🚀 (QA ${qa.score}/100)`)
            } catch (err: any) {
                setError(err.message)
                setIsGenerating(false)
                setSuperStep('input')
            }
        }, 1500)
    }

    // ==================== AI Creative Director ====================
    const handleAssistantSend = async (message: string) => {
        const userMsg: ChatMessage = { role: 'user', content: message }
        addMessage(userMsg)
        setChatLoading(true)

        if (!apiKey) {
            addMessage({
                role: 'assistant',
                content: '⚠️ กรุณาใส่ API Key ก่อนเริ่มใช้งาน ฉันจะเปิดหน้าต่างตั้งค่าให้นะ'
            })
            setChatLoading(false)
            useUIStore.getState().setShowApiKeyModal(true)
            return
        }

        try {
            const currentMessages = useChatStore.getState().messages
            const { text, functionCalls } = await chatWithDirector(
                apiKey,
                message,
                currentMessages,
                formData
            )

            // Handle function calls
            const actionResults: string[] = []
            for (const fc of functionCalls) {
                switch (fc.name) {
                    case 'updateTone':
                        setFormData((prev) => ({ ...prev, tone: fc.args.tone }))
                        actionResults.push(`✅ ปรับโทนเป็น "${fc.args.tone}"`)
                        break
                    case 'updateGenre':
                        setFormData((prev) => ({ ...prev, genre: fc.args.genre }))
                        actionResults.push(`✅ เปลี่ยนประเภทเป็น "${fc.args.genre}"`)
                        break
                    case 'updateTopic':
                        setFormData((prev) => ({ ...prev, topic: fc.args.topic }))
                        actionResults.push(`✅ อัปเดตหัวข้อเป็น "${fc.args.topic}"`)
                        break
                    case 'updateDuration':
                        setFormData((prev) => ({ ...prev, duration: fc.args.duration }))
                        actionResults.push(`✅ เปลี่ยนความยาวเป็น ${fc.args.duration}`)
                        break
                    case 'generateScript':
                        actionResults.push('🎬 เริ่มสร้างสคริปต์...')
                        setTimeout(() => handleGenerate(), 500)
                        break
                    case 'suggestIdeas':
                        actionResults.push('💡 กำลังค้นหาไอเดียใหม่...')
                        break
                }
            }

            // Build the response
            let responseText = text || ''
            if (actionResults.length > 0) {
                responseText += (responseText ? '\n\n' : '') + actionResults.join('\n')
            }

            if (responseText) {
                addMessage({ role: 'assistant', content: responseText })
            }

            setChatLoading(false)
        } catch (err: any) {
            addMessage({
                role: 'assistant',
                content: `❌ เกิดข้อผิดพลาด: ${err.message}`
            })
            setChatLoading(false)
        }
    }

    // ==================== Main Action ====================
    const handleMainAction = () => {
        if (creationMode === 'super') {
            runSuperCreateFlow()
        } else {
            handleGenerate()
        }
    }

    return {
        handleGenerate,
        runSuperCreateFlow,
        handleSelectIdea,
        handleAssistantSend,
        handleMainAction
    }
}
