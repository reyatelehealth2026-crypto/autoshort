import { useState, useEffect, useRef } from 'react'
import { useAutomationStore } from '../stores/useAutomationStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import type { PipelineStep, MediaOutputItem } from '../types'
import './AutomationPipeline.css'

export default function AutomationPipeline() {
    const [topic, setTopic] = useState('')

    const {
        pipelineId,
        pipelineStatus,
        steps,
        mediaOutputs,
        agentMessages,
        researchResult,
        planResult,
        scriptResult,
        pipelineError,
        pipelineMode,
        enabledProviders,
        providerKeys,
        isRunning,
        setPipelineMode,
        setEnabledProviders,
        setProviderKey,
        startPipeline,
        approveStep,
        resetPipeline,
    } = useAutomationStore()

    const { apiKey: geminiKey } = useSettingsStore()

    // Sync Gemini key from main settings
    useEffect(() => {
        if (geminiKey && !providerKeys.gemini) {
            setProviderKey('gemini', geminiKey)
        }
    }, [geminiKey])

    const messagesEndRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [agentMessages])

    const handleStart = () => {
        if (!topic.trim()) return
        startPipeline(topic.trim(), {
            genre: 'comedy',
            orientation: 'vertical',
            targetAudience: 'general',
            duration: '8sec',
            tone: 'funny',
            voice: 'thai-female',
            music: 'upbeat',
            artStyle: { name: 'Cinematic' },
        })
    }

    const handleReset = () => {
        resetPipeline()
        setTopic('')
    }

    const awaitingStep = steps.find(s => s.status === 'awaiting_approval')

    return (
        <div className="automation-page">
            {/* Header */}
            <div className="automation-header">
                <h1>🤖 Automation Pipeline</h1>
                <p>ระบบสร้างวิดีโอแบบ Full Automation — จาก Topic สู่ Video</p>
            </div>

            {/* Config */}
            {pipelineStatus === 'idle' && (
                <div className="automation-config">
                    {/* API Keys */}
                    <div className="config-card">
                        <h3>🔑 API Keys</h3>
                        <div className="config-row">
                            <div className="config-field">
                                <label>
                                    Gemini API Key
                                    {providerKeys.gemini && <span className="key-status connected">● Connected</span>}
                                </label>
                                <input
                                    type="password"
                                    value={providerKeys.gemini}
                                    onChange={(e) => setProviderKey('gemini', e.target.value)}
                                    placeholder="AIza..."
                                />
                            </div>
                            <div className="config-field">
                                <label>
                                    Leonardo AI Key
                                    {providerKeys.leonardo && <span className="key-status connected">● Set</span>}
                                    {!providerKeys.leonardo && <span className="key-status not-set">Optional</span>}
                                </label>
                                <input
                                    type="password"
                                    value={providerKeys.leonardo}
                                    onChange={(e) => setProviderKey('leonardo', e.target.value)}
                                    placeholder="ข้ามได้ — ถ้ายังไม่มี"
                                />
                            </div>
                            <div className="config-field">
                                <label>
                                    ElevenLabs Key
                                    {providerKeys.elevenlabs && <span className="key-status connected">● Set</span>}
                                    {!providerKeys.elevenlabs && <span className="key-status not-set">Optional</span>}
                                </label>
                                <input
                                    type="password"
                                    value={providerKeys.elevenlabs}
                                    onChange={(e) => setProviderKey('elevenlabs', e.target.value)}
                                    placeholder="ข้ามได้ — ถ้ายังไม่มี"
                                />
                            </div>
                            <div className="config-field">
                                <label>
                                    Kling AI Key
                                    {providerKeys.kling && <span className="key-status connected">● Set</span>}
                                    {!providerKeys.kling && <span className="key-status not-set">Optional</span>}
                                </label>
                                <input
                                    type="password"
                                    value={providerKeys.kling}
                                    onChange={(e) => setProviderKey('kling', e.target.value)}
                                    placeholder="ข้ามได้ — ถ้ายังไม่มี"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="config-card">
                        <h3>⚙️ ตั้งค่า Pipeline</h3>

                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>
                            โหมดการทำงาน
                        </label>
                        <div className="mode-toggle">
                            <button
                                className={`mode-btn ${pipelineMode === 'full_auto' ? 'active' : ''}`}
                                onClick={() => setPipelineMode('full_auto')}
                            >
                                🚀 Full Auto
                            </button>
                            <button
                                className={`mode-btn ${pipelineMode === 'semi_auto' ? 'active' : ''}`}
                                onClick={() => setPipelineMode('semi_auto')}
                            >
                                🎯 Semi Auto (Approve ทีละ Step)
                            </button>
                        </div>

                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block', marginTop: '0.8rem' }}>
                            เลือก Providers
                        </label>
                        <div className="provider-toggles">
                            <div className="provider-toggle">
                                <span>🖼️ ภาพ</span>
                                <select
                                    value={enabledProviders.image}
                                    onChange={(e) => setEnabledProviders({
                                        ...enabledProviders,
                                        image: e.target.value as any,
                                    })}
                                >
                                    <option value="leonardo">Leonardo AI</option>
                                    <option value="none">ไม่ใช้</option>
                                </select>
                            </div>
                            <div className="provider-toggle">
                                <span>🗣️ เสียง</span>
                                <select
                                    value={enabledProviders.voice}
                                    onChange={(e) => setEnabledProviders({
                                        ...enabledProviders,
                                        voice: e.target.value as any,
                                    })}
                                >
                                    <option value="elevenlabs">ElevenLabs</option>
                                    <option value="none">ไม่ใช้</option>
                                </select>
                            </div>
                            <div className="provider-toggle">
                                <span>📹 วิดีโอ</span>
                                <select
                                    value={enabledProviders.video}
                                    onChange={(e) => setEnabledProviders({
                                        ...enabledProviders,
                                        video: e.target.value as any,
                                    })}
                                >
                                    <option value="kling">Kling AI</option>
                                    <option value="leonardo_motion">Leonardo Motion</option>
                                    <option value="none">ไม่ใช้</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Start / Topic Input */}
            <div className="start-section">
                <div className="topic-input-row">
                    <input
                        className="topic-input"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleStart()}
                        placeholder="🔍 ใส่หัวข้อหรือ Topic ที่ต้องการ เช่น AI ที่กำลังเปลี่ยนโลก"
                        disabled={isRunning}
                    />
                    {!isRunning && pipelineStatus === 'idle' && (
                        <button
                            className="start-btn"
                            onClick={handleStart}
                            disabled={!topic.trim() || !providerKeys.gemini}
                        >
                            🚀 เริ่ม Pipeline
                        </button>
                    )}
                    {isRunning && (
                        <button className="start-btn running" disabled>
                            ⏳ กำลังทำงาน...
                        </button>
                    )}
                    {(pipelineStatus === 'completed' || pipelineStatus === 'error') && (
                        <button className="start-btn" onClick={handleReset}>
                            🔄 เริ่มใหม่
                        </button>
                    )}
                </div>
            </div>

            {/* Error */}
            {pipelineError && (
                <div className="pipeline-error">
                    <span className="error-icon">❌</span>
                    <span className="error-text">{pipelineError}</span>
                </div>
            )}

            {/* Pipeline Steps Visualizer */}
            {steps.length > 0 && (
                <div className="pipeline-visualizer">
                    <div className="pipeline-steps">
                        {steps.map((step, idx) => (
                            <PipelineStepView key={step.id} step={step} idx={idx} totalSteps={steps.length} />
                        ))}
                    </div>
                </div>
            )}

            {/* Approval Banner */}
            {awaitingStep && (
                <div className="approval-banner">
                    <span className="banner-text">
                        ⏸️ รอการอนุมัติ: {awaitingStep.name} — ตรวจสอบผลลัพธ์ด้านล่างแล้วกด Approve
                    </span>
                    <button className="approve-btn" onClick={() => approveStep(awaitingStep.id)}>
                        ✅ Approve & ดำเนินการต่อ
                    </button>
                </div>
            )}

            {/* Agent Messages */}
            {agentMessages.length > 0 && (
                <div className="agent-messages">
                    <h3>📋 Agent Activity Log</h3>
                    {agentMessages.map((msg, i) => (
                        <div key={i} className="agent-msg">
                            <span className="time">{msg.time}</span>
                            <span className="msg-text">{msg.message}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Results Grid */}
            <div className="results-grid">
                {/* Research Result */}
                {researchResult && (
                    <div className="result-card">
                        <h3>🔍 Research Result</h3>
                        <div className="trends-list">
                            {researchResult.trends?.map((trend: any, i: number) => (
                                <div key={i} className="trend-item">
                                    <div className={`viral-score ${trend.viralScore >= 75 ? 'high' : trend.viralScore >= 50 ? 'medium' : 'low'}`}>
                                        {trend.viralScore}
                                    </div>
                                    <div className="trend-info">
                                        <h4>{trend.title}</h4>
                                        <p>{trend.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Plan Result */}
                {planResult && (
                    <div className="result-card">
                        <h3>📋 Content Plan</h3>
                        <div className="detail-json">{JSON.stringify(planResult, null, 2)}</div>
                    </div>
                )}

                {/* Script Result */}
                {scriptResult && (
                    <div className="result-card full-width">
                        <h3>✍️ Script</h3>
                        <div className="detail-json">{JSON.stringify(scriptResult, null, 2)}</div>
                    </div>
                )}
            </div>

            {/* Media Outputs */}
            {mediaOutputs.length > 0 && (
                <div className="result-card full-width" style={{ gridColumn: 'unset' }}>
                    <h3>🎨 Generated Media ({mediaOutputs.length} items)</h3>
                    <div className="media-grid">
                        {mediaOutputs.map((media, i) => (
                            <MediaItem key={media.id || i} media={media} />
                        ))}
                    </div>
                </div>
            )}

            {/* Complete State */}
            {pipelineStatus === 'completed' && (
                <div className="pipeline-complete">
                    <h2>🎉 Pipeline เสร็จสมบูรณ์!</h2>
                    <p>ทุกขั้นตอนทำงานสำเร็จ — ตรวจสอบ Media outputs ด้านบน</p>
                </div>
            )}
        </div>
    )
}

// ==================== Sub-components ====================

function PipelineStepView({ step, idx, totalSteps }: { step: PipelineStep; idx: number; totalSteps: number }) {
    return (
        <>
            <div className="pipeline-step">
                <div className={`step-icon ${step.status}`}>
                    {step.status === 'completed' ? '✅' :
                        step.status === 'running' ? '⏳' :
                            step.status === 'error' ? '❌' :
                                step.status === 'awaiting_approval' ? '⏸️' :
                                    step.status === 'skipped' ? '⏭️' :
                                        step.icon}
                </div>
                <span className="step-name">{step.name}</span>
            </div>
            {idx < totalSteps - 1 && (
                <div className={`step-connector ${step.status === 'completed' ? 'done' :
                        step.status === 'running' ? 'active' : ''
                    }`} />
            )}
        </>
    )
}

function MediaItem({ media }: { media: MediaOutputItem }) {
    if (media.status === 'error') {
        return (
            <div className="media-item" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <div className="media-item-info">
                    <span className={`provider-badge ${media.provider}`}>{media.provider}</span>
                    <span style={{ color: '#fca5a5', marginTop: '0.3rem', display: 'block' }}>
                        ❌ {media.error}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="media-item">
            {media.imageUrl && (
                <img src={media.imageUrl} alt={`Scene ${media.sceneNumber}`} loading="lazy" />
            )}
            {media.audioUrl && (
                <div style={{ padding: '1rem' }}>
                    <audio controls style={{ width: '100%' }}>
                        <source src={media.audioUrl} type="audio/mpeg" />
                    </audio>
                </div>
            )}
            {media.videoUrl && (
                <video controls>
                    <source src={media.videoUrl} type="video/mp4" />
                </video>
            )}
            <div className="media-item-info">
                <span className={`provider-badge ${media.provider}`}>{media.provider}</span>
                <span>Scene {media.sceneNumber}</span>
            </div>
        </div>
    )
}
