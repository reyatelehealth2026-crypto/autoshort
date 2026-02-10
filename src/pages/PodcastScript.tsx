import { useState } from 'react'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import toast from 'react-hot-toast'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export default function PodcastScript() {
    const apiKey = useSettingsStore(s => s.apiKey)
    const [topic, setTopic] = useState('')
    const [speakers, setSpeakers] = useState(2)
    const [duration, setDuration] = useState('30min')
    const [format, setFormat] = useState('interview')
    const [result, setResult] = useState('')
    const [loading, setLoading] = useState(false)

    const formats = [
        { id: 'interview', label: '🎤 สัมภาษณ์', desc: 'คนถาม-คนตอบ' },
        { id: 'debate', label: '⚡ ดีเบต', desc: 'ถกเถียง 2 มุม' },
        { id: 'storytelling', label: '📖 เล่าเรื่อง', desc: 'เล่าเรื่องราว' },
        { id: 'educational', label: '🎓 ให้ความรู้', desc: 'สอนเนื้อหา' },
    ]

    const handleGenerate = async () => {
        if (!apiKey) { toast.error('กรุณาใส่ API Key'); useUIStore.getState().setShowApiKeyModal(true); return }
        if (!topic.trim()) { toast.error('กรุณาใส่หัวข้อ'); return }

        setLoading(true)
        try {
            const formatLabel = formats.find(f => f.id === format)?.label || format
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `สร้างสคริปต์พอดแคสต์หัวข้อ: ${topic}

รูปแบบ: ${formatLabel}
จำนวนผู้พูด: ${speakers} คน
ความยาว: ${duration}

ระบุชื่อผู้พูดแต่ละคน แล้วเขียนบทสนทนาแบบธรรมชาติ
รวมถึง:
1. 🎯 Episode Outline (โครงสร้างตอน)
2. 📝 Show Notes (บันทึกรายการ)
3. 🗣️ บทสนทนาทั้งหมด (ระบุชื่อผู้พูด: แต่ละบรรทัด)
4. 🔑 Key Takeaways (สรุปประเด็นสำคัญ 3-5 ข้อ)` }]
                    }],
                    generationConfig: { temperature: 0.9, maxOutputTokens: 8192 }
                })
            })

            const data = await response.json()
            setResult(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
            toast.success('สร้างสคริปต์พอดแคสต์เสร็จ! 🎙️')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div className="page-header">
                <h1>🎙️ Podcast Script</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>สร้างสคริปต์พอดแคสต์แบบหลายผู้พูด</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, marginBottom: 24 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
                    <div className="form-section">
                        <label className="form-section-title">📝 หัวข้อ</label>
                        <input type="text" className="input" placeholder="เช่น AI กับอนาคตการทำงาน" value={topic} onChange={e => setTopic(e.target.value)} style={{ marginTop: 8 }} />
                    </div>

                    <div className="form-section">
                        <label className="form-section-title">🎭 รูปแบบ</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                            {formats.map(f => (
                                <button key={f.id} className={`option-btn ${format === f.id ? 'selected' : ''}`} onClick={() => setFormat(f.id)}>
                                    <span className="option-btn-label">{f.label}</span>
                                    <span className="option-btn-desc">{f.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <label className="form-section-title">👥 จำนวนผู้พูด</label>
                        <input type="number" className="input" min={1} max={5} value={speakers} onChange={e => setSpeakers(Number(e.target.value))} style={{ marginTop: 8 }} />
                    </div>

                    <div className="form-section">
                        <label className="form-section-title">⏱️ ความยาว</label>
                        <select className="select" value={duration} onChange={e => setDuration(e.target.value)} style={{ marginTop: 8 }}>
                            <option value="15min">15 นาที</option>
                            <option value="30min">30 นาที</option>
                            <option value="45min">45 นาที</option>
                            <option value="60min">1 ชั่วโมง</option>
                        </select>
                    </div>

                    <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={loading} style={{ width: '100%', marginTop: 16 }}>
                        {loading ? '⏳ กำลังสร้าง...' : '🎙️ สร้างสคริปต์'}
                    </button>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: 28, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3>🗒️ สคริปต์</h3>
                        {result && <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(result); toast.success('คัดลอกแล้ว!') }}>📋 Copy</button>}
                    </div>
                    {result ? (
                        <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.875rem', fontFamily: 'inherit' }}>{result}</pre>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16, opacity: 0.5 }}>🎙️</span>
                            <p>สคริปต์พอดแคสต์จะแสดงที่นี่...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
