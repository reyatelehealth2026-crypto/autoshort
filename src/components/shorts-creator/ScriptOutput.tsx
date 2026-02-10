import { useState } from 'react'
import { ScriptJsonOutput } from '../../types'

interface ScriptOutputProps {
    scriptData: ScriptJsonOutput | null
}

export function ScriptOutput({ scriptData }: ScriptOutputProps) {
    const [activeTab, setActiveTab] = useState<'text' | 'json' | 'automation'>('automation')

    const getOutputContent = () => {
        if (!scriptData) return 'สคริปต์จะแสดงที่นี่...'
        if (activeTab === 'text') return scriptData.rawScript || ''
        if (activeTab === 'json') return JSON.stringify(scriptData, null, 2)
        return JSON.stringify(scriptData.automation_ready, null, 2)
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(getOutputContent())
    }

    return (
        <div className="creator-output-panel">
            <div className="output-tabs">
                <button
                    className={`output-tab ${activeTab === 'text' ? 'active' : ''}`}
                    onClick={() => setActiveTab('text')}
                >
                    📝 Text
                </button>
                <button
                    className={`output-tab ${activeTab === 'json' ? 'active' : ''}`}
                    onClick={() => setActiveTab('json')}
                >
                    {'{ }'} JSON
                </button>
                <button
                    className={`output-tab ${activeTab === 'automation' ? 'active' : ''}`}
                    onClick={() => setActiveTab('automation')}
                >
                    🤖 Automation
                </button>
                {scriptData && (
                    <button className="output-tab copy-btn" onClick={handleCopy} title="Copy to clipboard">
                        📋 Copy
                    </button>
                )}
            </div>
            <div className="script-content">
                <pre>{getOutputContent()}</pre>
            </div>
        </div>
    )
}
