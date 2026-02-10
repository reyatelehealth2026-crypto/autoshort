import { useState } from 'react'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import toast from 'react-hot-toast'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const platforms = [
    { id: 'facebook', label: 'Facebook', icon: '📘', maxChars: 500 },
    { id: 'instagram', label: 'Instagram', icon: '📸', maxChars: 2200 },
    { id: 'x', label: 'X (Twitter)', icon: '🐦', maxChars: 280 },
    { id: 'line', label: 'LINE', icon: '💚', maxChars: 1000 },
]

export default function SocialPostGenerator() {
    const apiKey = useSettingsStore(s => s.apiKey)
    const [topic, setTopic] = useState('')
    const [selectedPlatform, setSelectedPlatform] = useState('facebook')
    const [tone, setTone] = useState('friendly')
    const [result, setResult] = useState('')
    const [hashtags, setHashtags] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const handleGenerate = async () => {
        if (!apiKey) { toast.error('กรุณาใส่ API Key'); useUIStore.getState().setShowApiKeyModal(true); return }
        if (!topic.trim()) { toast.error('กรุณาใส่หัวข้อ'); return }

        const platform = platforms.find(p => p.id === selectedPlatform)!
        setLoading(true)

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `สร้างโพสต์สำหรับ ${platform.label} เกี่ยวกับ: ${topic}
                    
โทน: ${tone}
จำกัดตัวอักษร: ${platform.maxChars}

ตอบเป็น JSON:
{"post": "ข้อความโพสต์", "hashtags": ["#แฮชแท็ก1", "#แฮชแท็ก2", "#แฮชแท็ก3", "#แฮชแท็ก4", "#แฮชแท็ก5"]}` }]
                    }],
                    generationConfig: { temperature: 0.9, responseMimeType: "application/json" }
                })
            })

            const data = await response.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text
            const parsed = JSON.parse(text)
            setResult(parsed.post)
            setHashtags(parsed.hashtags || [])
            toast.success('สร้างโพสต์สำเร็จ!')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('คัดลอกแล้ว! 📋')
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="page-header">
                <h1>📱 Social Post Generator</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>สร้างโพสต์โซเชียลสำหรับทุกแพลตฟอร์ม</p>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: 28, marginBottom: 24 }}>
                <div className="form-section">
                    <label className="form-section-title">🎯 แพลตฟอร์ม</label>
                    <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                        {platforms.map(p => (
                            <button
                                key={p.id}
                                className={`option-btn ${selectedPlatform === p.id ? 'selected' : ''}`}
                                onClick={() => setSelectedPlatform(p.id)}
                                style={{ minWidth: 120 }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>{p.icon}</span>
                                <span className="option-btn-label">{p.label}</span>
                                <span className="option-btn-desc">สูงสุด {p.maxChars} ตัวอักษร</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-section">
                    <label className="form-section-title">📝 หัวข้อ</label>
                    <input type="text" className="input" placeholder="เขียนเกี่ยวกับอะไร?" value={topic} onChange={e => setTopic(e.target.value)} style={{ marginTop: 8 }} />
                </div>

                <div className="form-section">
                    <label className="form-section-title">😊 โทน</label>
                    <select className="select" value={tone} onChange={e => setTone(e.target.value)} style={{ marginTop: 8 }}>
                        <option value="friendly">🤗 เป็นกันเอง</option>
                        <option value="professional">💼 มืออาชีพ</option>
                        <option value="funny">😂 ตลก</option>
                        <option value="inspiring">✨ สร้างแรงบันดาลใจ</option>
                        <option value="casual">😎 สบายๆ</option>
                    </select>
                </div>

                <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={loading} style={{ width: '100%', marginTop: 16 }}>
                    {loading ? '⏳ กำลังสร้าง...' : '✨ สร้างโพสต์'}
                </button>
            </div>

            {result && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3>📋 ผลลัพธ์</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(result + '\n\n' + hashtags.join(' '))}>📋 Copy</button>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 20, borderRadius: 'var(--radius-lg)', whiteSpace: 'pre-wrap', lineHeight: 1.8, marginBottom: 16 }}>
                        {result}
                    </div>
                    {hashtags.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {hashtags.map((tag, i) => (
                                <span key={i} style={{ padding: '4px 12px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', cursor: 'pointer' }} onClick={() => copyToClipboard(tag)}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
