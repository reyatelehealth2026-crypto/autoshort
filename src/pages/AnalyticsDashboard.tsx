import { useState, useEffect } from 'react'

interface UsageStat {
    date: string
    scripts: number
    trends: number
    social: number
}

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState<UsageStat[]>([])
    const [totalScripts, setTotalScripts] = useState(0)
    const [totalTrends, setTotalTrends] = useState(0)
    const [totalSocial, setTotalSocial] = useState(0)

    useEffect(() => {
        // Load usage stats from localStorage
        const stored = localStorage.getItem('shorts-factory-analytics')
        if (stored) {
            const data = JSON.parse(stored) as UsageStat[]
            setStats(data)
            setTotalScripts(data.reduce((a, b) => a + b.scripts, 0))
            setTotalTrends(data.reduce((a, b) => a + b.trends, 0))
            setTotalSocial(data.reduce((a, b) => a + b.social, 0))
        }
    }, [])

    const handleExportCSV = () => {
        const headers = 'Date,Scripts,Trends,Social\n'
        const rows = stats.map(s => `${s.date},${s.scripts},${s.trends},${s.social}`).join('\n')
        const blob = new Blob([headers + rows], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'shorts-factory-analytics.csv'
        a.click()
    }

    const statCards = [
        { icon: '🎬', label: 'สคริปต์ทั้งหมด', value: totalScripts, color: 'var(--accent-orange)' },
        { icon: '🔥', label: 'เทรนด์วิเคราะห์', value: totalTrends, color: 'var(--accent-purple)' },
        { icon: '📱', label: 'โพสต์โซเชียล', value: totalSocial, color: 'var(--accent-green)' },
        { icon: '📊', label: 'วันที่ใช้งาน', value: stats.length, color: 'var(--accent-blue)' },
    ]

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1>📊 Analytics Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>สถิติการใช้งานของคุณ</p>
                </div>
                <button className="btn btn-secondary" onClick={handleExportCSV}>📦 Export CSV</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                {statCards.map((card, idx) => (
                    <div key={idx} style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 24,
                        textAlign: 'center',
                    }}>
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }}>{card.icon}</span>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: card.color }}>{card.value}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>{card.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
                <h3 style={{ marginBottom: 16 }}>📈 ประวัติการใช้งาน</h3>
                {stats.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>วันที่</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>🎬 สคริปต์</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>🔥 เทรนด์</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>📱 โซเชียล</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.slice(-10).reverse().map((s, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{s.date}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.875rem' }}>{s.scripts}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.875rem' }}>{s.trends}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.875rem' }}>{s.social}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16, opacity: 0.5 }}>📊</span>
                        <p>ยังไม่มีข้อมูลการใช้งาน</p>
                        <p style={{ fontSize: '0.8125rem', marginTop: 8 }}>เริ่มสร้างสคริปต์เพื่อเก็บสถิติ</p>
                    </div>
                )}
            </div>
        </div>
    )
}
