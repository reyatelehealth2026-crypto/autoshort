import { useState } from 'react'
import { ScriptJsonOutput } from '../../types'

interface ScriptOutputProps {
    scriptData: ScriptJsonOutput | null
}

type OutputTab = 'flow' | 'gemini' | 'json' | 'automation'

export function ScriptOutput({ scriptData }: ScriptOutputProps) {
    const [activeTab, setActiveTab] = useState<OutputTab>('flow')
    const [copied, setCopied] = useState(false)

    // Extract image prompt from raw script or scenes
    const getImagePrompt = (): string => {
        if (!scriptData) return ''
        // Try to extract from scenes
        if (scriptData.scenes?.length > 0) {
            return scriptData.scenes.map((scene, i) => {
                const lines = [`--- Scene ${i + 1} (${scene.timeRange.start}s–${scene.timeRange.end}s) ---`]
                lines.push(`📸 Image Prompt:\n${scene.imagePrompt}`)
                if (scene.visuals) {
                    lines.push(`🎨 Style: ${scene.visuals.style} | Mood: ${scene.visuals.mood} | Color: ${scene.visuals.colorTone}`)
                }
                if (scene.camera) {
                    lines.push(`🎥 Camera: ${scene.camera.angle} | ${scene.camera.movement}`)
                }
                return lines.join('\n')
            }).join('\n\n')
        }
        return ''
    }

    // Build full Gemini Chat prompt
    const getGeminiChatPrompt = (): string => {
        if (!scriptData) return ''
        const scenes = scriptData.scenes || []
        const lines: string[] = []

        lines.push('=== สคริปต์วิดีโอสั้น ===')
        lines.push(`📋 โปรเจค: ${scriptData.project?.title || ''}`)
        if (scriptData.project?.genre) lines.push(`🎭 ประเภท: ${scriptData.project.genre.label}`)
        if (scriptData.project?.tone) lines.push(`😊 โทน: ${scriptData.project.tone.label}`)
        if (scriptData.project?.duration) lines.push(`⏱️ ระยะเวลา: ${scriptData.project.duration.seconds}s`)
        lines.push('')

        scenes.forEach((scene, i) => {
            lines.push(`━━━ ฉากที่ ${i + 1} (${scene.timeRange.start}s–${scene.timeRange.end}s) ━━━`)
            lines.push(`📸 IMAGE PROMPT:\n${scene.imagePrompt}`)
            lines.push(`🗣️ บทพูด: ${scene.audio.dialogue}`)
            lines.push(`🎤 น้ำเสียง: ${scene.audio.voiceTone}`)
            lines.push(`🎵 เพลง: ${scene.audio.music}`)
            if (scene.camera) lines.push(`🎥 กล้อง: ${scene.camera.angle} | ${scene.camera.movement}`)
            if (scene.visuals) lines.push(`🎨 ภาพ: ${scene.visuals.style} | ${scene.visuals.mood} | ${scene.visuals.colorTone}`)
            lines.push('')
        })

        if (scriptData.summary) {
            lines.push('=== สรุป ===')
            lines.push(`🎯 ธีม: ${scriptData.summary.theme}`)
            lines.push(`🪝 Hook: ${scriptData.summary.hook}`)
            lines.push(`📢 CTA: ${scriptData.summary.callToAction}`)
            if (scriptData.summary.suggestedHashtags?.length) {
                lines.push(`# Hashtags: ${scriptData.summary.suggestedHashtags.join(' ')}`)
            }
        }

        return lines.join('\n')
    }

    const getOutputContent = (): string => {
        if (!scriptData) return 'สคริปต์จะแสดงที่นี่...'
        switch (activeTab) {
            case 'flow': return getImagePrompt()
            case 'gemini': return getGeminiChatPrompt()
            case 'json': return JSON.stringify(scriptData, null, 2)
            case 'automation': return JSON.stringify(scriptData.automation_ready, null, 2)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(getOutputContent())
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const tabs: { id: OutputTab; label: string; icon: string; hint: string }[] = [
        { id: 'flow', label: 'Google Flow', icon: '🎨', hint: 'ก็อปไปวางใน Google Flow เพื่อเจนภาพ/วิดีโอ' },
        { id: 'gemini', label: 'Gemini Chat', icon: '💬', hint: 'ก็อปไปวางใน Gemini Chat หรือ LLM ปกติ' },
        { id: 'json', label: 'Full JSON', icon: '{ }', hint: 'JSON เต็มสำหรับนักพัฒนา' },
        { id: 'automation', label: 'Automation', icon: '🤖', hint: 'ข้อมูลพร้อมใช้สำหรับ automation pipeline' },
    ]

    const currentTab = tabs.find(t => t.id === activeTab)!

    return (
        <div className="creator-output-panel">
            <div className="output-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`output-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        title={tab.hint}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab hint */}
            <div className="output-tab-hint">
                <span className="hint-icon">💡</span>
                <span>{currentTab.hint}</span>
            </div>

            {/* Copy button */}
            {scriptData && (
                <button className="output-copy-btn" onClick={handleCopy}>
                    {copied ? '✅ คัดลอกแล้ว!' : `📋 คัดลอก ${currentTab.label}`}
                </button>
            )}

            {/* Content */}
            <div className={`script-content ${activeTab === 'json' || activeTab === 'automation' ? 'json-content' : ''}`}>
                <pre>{getOutputContent()}</pre>
            </div>
        </div>
    )
}
