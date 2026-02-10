import { useState } from 'react'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import toast from 'react-hot-toast'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export default function YouTubeIntegration() {
    const apiKey = useSettingsStore(s => s.apiKey)
    const [videoTitle, setVideoTitle] = useState('')
    const [videoDescription, setVideoDescription] = useState('')
    const [optimizedTitle, setOptimizedTitle] = useState('')
    const [optimizedDesc, setOptimizedDesc] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const handleOptimize = async () => {
        if (!apiKey) { toast.error('กรุณาใส่ API Key'); useUIStore.getState().setShowApiKeyModal(true); return }
        if (!videoTitle.trim()) { toast.error('กรุณาใส่ชื่อวิดีโอ'); return }

        setLoading(true)
        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `คุณเป็น YouTube SEO Expert
                    
ช่วย Optimize ข้อมูลวิดีโอ YouTube:

ชื่อเดิม: ${videoTitle}
${videoDescription ? `คำอธิบายเดิม: ${videoDescription}` : ''}

ตอบเป็น JSON:
{
    "title": "ชื่อวิดีโอใหม่ที่ SEO ดีขึ้น (มี keyword, ดึงดูดคลิก)",
    "description": "คำอธิบายวิดีโอ 300-500 ตัวอักษร (รวม keywords, timestamps, CTA)",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"]
}` }]
                    }],
                    generationConfig: { temperature: 0.8, responseMimeType: "application/json" }
                })
            })

            const data = await response.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text
            const parsed = JSON.parse(text)
            setOptimizedTitle(parsed.title)
            setOptimizedDesc(parsed.description)
            setTags(parsed.tags || [])
            toast.success('Optimize เสร็จ! 🎯')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const copyAll = () => {
        const text = `Title: ${optimizedTitle}\n\nDescription:\n${optimizedDesc}\n\nTags: ${tags.join(', ')}`
        navigator.clipboard.writeText(text)
        toast.success('คัดลอกทั้งหมดแล้ว!')
    }

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div className="page-header">
                <h1>▶️ YouTube Integration</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Optimize Title, Description & Tags สำหรับ YouTube</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
                    <h3 style={{ marginBottom: 20 }}>📝 ข้อมูลวิดีโอ</h3>
                    <div className="form-section">
                        <label className="form-section-title">🏷️ ชื่อวิดีโอ</label>
                        <input type="text" className="input" placeholder="ชื่อวิดีโอที่ต้องการ Optimize" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} style={{ marginTop: 8 }} />
                    </div>

                    <div className="form-section">
                        <label className="form-section-title">📄 คำอธิบาย (ถ้ามี)</label>
                        <textarea className="input textarea" placeholder="คำอธิบายวิดีโอเดิม (ถ้ามี)" value={videoDescription} onChange={e => setVideoDescription(e.target.value)} style={{ marginTop: 8, minHeight: 120 }} />
                    </div>

                    <button className="btn btn-primary btn-lg" onClick={handleOptimize} disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                        {loading ? '⏳ กำลัง Optimize...' : '🚀 Optimize with AI'}
                    </button>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3>✨ ผลลัพธ์</h3>
                        {optimizedTitle && <button className="btn btn-secondary btn-sm" onClick={copyAll}>📋 Copy All</button>}
                    </div>

                    {optimizedTitle ? (
                        <>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</label>
                                <div style={{ background: 'var(--bg-tertiary)', padding: 16, borderRadius: 'var(--radius-md)', marginTop: 6, fontWeight: 600 }}>{optimizedTitle}</div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                                <div style={{ background: 'var(--bg-tertiary)', padding: 16, borderRadius: 'var(--radius-md)', marginTop: 6, whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.875rem' }}>{optimizedDesc}</div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tags</label>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                                    {tags.map((tag, i) => (
                                        <span key={i} style={{
                                            padding: '4px 12px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: 'var(--accent-red)',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '0.8125rem',
                                            cursor: 'pointer'
                                        }} onClick={() => { navigator.clipboard.writeText(tag); toast.success(`Copied: ${tag}`) }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16, opacity: 0.5 }}>▶️</span>
                            <p>ผลลัพธ์จะแสดงที่นี่...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
