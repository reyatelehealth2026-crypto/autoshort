import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import { fetchTrendsWithGemini } from '../services/gemini'
import toast from 'react-hot-toast'
import './TrendsDashboard.css'

interface TrendItem {
    title: string
    desc: string
    tone: string
}

export default function TrendsDashboard() {
    const navigate = useNavigate()
    const apiKey = useSettingsStore(s => s.apiKey)
    const [query, setQuery] = useState('')
    const [trends, setTrends] = useState<TrendItem[]>([])
    const [loading, setLoading] = useState(false)
    const [category, setCategory] = useState('all')

    const categories = [
        { id: 'all', label: '🔥 ทั้งหมด' },
        { id: 'tiktok', label: '🎵 TikTok' },
        { id: 'reels', label: '📸 Reels' },
        { id: 'shorts', label: '▶️ Shorts' },
    ]

    const handleSearch = async () => {
        if (!apiKey) {
            toast.error('กรุณาใส่ API Key ก่อน')
            useUIStore.getState().setShowApiKeyModal(true)
            return
        }
        if (!query.trim()) {
            toast.error('กรุณาใส่คำค้นหา')
            return
        }

        setLoading(true)
        try {
            const searchQuery = category !== 'all' ? `${query} (สำหรับ ${category})` : query
            const results = await fetchTrendsWithGemini(apiKey, searchQuery)
            setTrends(results)
            toast.success(`พบ ${results.length} เทรนด์!`)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUseTrend = (trend: TrendItem) => {
        navigate(`/create?topic=${encodeURIComponent(trend.title)}&tone=${trend.tone}`)
    }

    return (
        <div className="trends-page">
            <div className="page-header">
                <div>
                    <h1>🔥 Trends Dashboard</h1>
                    <p className="page-subtitle">วิเคราะห์เทรนด์ล่าสุดจาก AI และสร้างคอนเทนต์ที่กำลัง Viral</p>
                </div>
            </div>

            <div className="trends-search-bar">
                <div className="trends-categories">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-btn ${category === cat.id ? 'active' : ''}`}
                            onClick={() => setCategory(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
                <div className="trends-input-row">
                    <input
                        type="text"
                        className="input trends-input"
                        placeholder="ค้นหาเทรนด์ เช่น อาหาร, เทคโนโลยี, แฟชั่น..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                        {loading ? '⏳ กำลังค้นหา...' : '🔍 ค้นหาเทรนด์'}
                    </button>
                </div>
            </div>

            {trends.length > 0 && (
                <div className="trends-grid">
                    {trends.map((trend, idx) => (
                        <div key={idx} className="trend-card">
                            <div className="trend-card-header">
                                <span className="trend-rank">#{idx + 1}</span>
                                <span className="trend-tone-badge">{trend.tone}</span>
                            </div>
                            <h3 className="trend-title">{trend.title}</h3>
                            <p className="trend-desc">{trend.desc}</p>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleUseTrend(trend)}>
                                🎬 ใช้เทรนด์นี้
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {trends.length === 0 && !loading && (
                <div className="trends-empty">
                    <span className="trends-empty-icon">🔍</span>
                    <h3>ค้นหาเทรนด์ที่กำลังมา</h3>
                    <p>ลองพิมพ์หัวข้อที่สนใจแล้วกด "ค้นหาเทรนด์" เพื่อดูไอเดียจาก AI</p>
                </div>
            )}
        </div>
    )
}
