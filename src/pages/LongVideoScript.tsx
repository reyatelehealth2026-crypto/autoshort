import { useState } from 'react'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import toast from 'react-hot-toast'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export default function LongVideoScript() {
    const apiKey = useSettingsStore(s => s.apiKey)
    const [topic, setTopic] = useState('')
    const [chapters, setChapters] = useState(5)
    const [targetLength, setTargetLength] = useState('10min')
    const [result, setResult] = useState('')
    const [loading, setLoading] = useState(false)

    const handleGenerate = async () => {
        if (!apiKey) { toast.error('กรุณาใส่ API Key'); useUIStore.getState().setShowApiKeyModal(true); return }
        if (!topic.trim()) { toast.error('กรุณาใส่หัวข้อ'); return }

        setLoading(true)
        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `สร้างสคริปต์วิดีโอยาวเรื่อง: ${topic}

จำนวนบท: ${chapters} บท
ความยาว: ${targetLength}

รูปแบบ:
สำหรับแต่ละบท ให้ระบุ:
1. ชื่อบท + ช่วงเวลา (Timestamp)
2. เนื้อหาบทพูด
3. B-Roll Suggestions (3 ข้อ)
4. SEO Keywords ที่เกี่ยวข้อง

เริ่มด้วย:
🎯 Title: [ชื่อวิดีโอที่ดึงดูด]
📝 Description: [คำอธิบายวิดีโอสำหรับ YouTube]
🏷️ Tags: [แท็ก 5-10 อัน]

แล้วตามด้วยสคริปต์แต่ละบท` }]
                    }],
                    generationConfig: { temperature: 0.85, maxOutputTokens: 8192 }
                })
            })

            const data = await response.json()
            setResult(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
            toast.success('สร้างสคริปต์เสร็จ! 🎬')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div className="page-header">
                <h1>🎥 Long Video Script</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>สร้างสคริปต์วิดีโอยาวแบบ Chapter-based พร้อม SEO</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
                    <div className="form-section">
                        <label className="form-section-title">📝 หัวข้อวิดีโอ</label>
                        <input type="text" className="input" placeholder="เช่น 10 สิ่งที่ AI จะเปลี่ยนโลก" value={topic} onChange={e => setTopic(e.target.value)} style={{ marginTop: 8 }} />
                    </div>

                    <div className="form-section">
                        <label className="form-section-title">📖 จำนวนบท</label>
                        <input type="number" className="input" min={2} max={15} value={chapters} onChange={e => setChapters(Number(e.target.value))} style={{ marginTop: 8 }} />
                    </div>

                    <div className="form-section">
                        <label className="form-section-title">⏱️ ความยาว</label>
                        <select className="select" value={targetLength} onChange={e => setTargetLength(e.target.value)} style={{ marginTop: 8 }}>
                            <option value="5min">5 นาที</option>
                            <option value="10min">10 นาที</option>
                            <option value="15min">15 นาที</option>
                            <option value="20min">20 นาที</option>
                        </select>
                    </div>

                    <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={loading} style={{ width: '100%', marginTop: 16 }}>
                        {loading ? '⏳ กำลังสร้าง...' : '🎬 สร้างสคริปต์'}
                    </button>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: 28, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3>📋 สคริปต์</h3>
                        {result && <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(result); toast.success('คัดลอกแล้ว!') }}>📋 Copy</button>}
                    </div>
                    {result ? (
                        <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.875rem', fontFamily: 'inherit' }}>{result}</pre>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16, opacity: 0.5 }}>📝</span>
                            <p>สคริปต์จะแสดงที่นี่...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
