import { useNavigate } from 'react-router-dom'
import './ToolsHub.css'

interface Tool {
  path: string
  title: string
  desc: string
  icon: string
  color: string
  badge?: string
  badgeType?: 'popular' | 'new'
}

const tools: Tool[] = [
  {
    path: '/create',
    title: 'สร้างคลิปสั้น',
    desc: 'สร้างสคริปต์สำหรับ TikTok, Reels, Shorts',
    icon: '🎬',
    color: 'red',
    badge: 'ยอดนิยม',
    badgeType: 'popular'
  },
  {
    path: '/studio',
    title: 'สตูดิโอแมนนวล',
    desc: 'เขียนเนื้อเรื่องและสร้างสคริปต์แบบ Manual',
    icon: '✏️',
    color: 'blue',
    badge: 'ใหม่',
    badgeType: 'new'
  },
  {
    path: '/long-video',
    title: 'วิดีโอยาว',
    desc: 'สร้างสคริปต์สำหรับ YouTube หรือ Facebook',
    icon: '🎥',
    color: 'green'
  },
  {
    path: '/podcast',
    title: 'พ็อดแคสต์',
    desc: 'สร้างสคริปต์สำหรับ AI Voice และ Podcast',
    icon: '🎙️',
    color: 'purple'
  },
  {
    path: '/social',
    title: 'โซเชียลโพสต์',
    desc: 'สร้างโพสต์โซเชียลมีเดียพร้อมแคปชั่น',
    icon: '📱',
    color: 'pink'
  },
]

export default function ToolsHub() {
  const navigate = useNavigate()

  return (
    <div className="tools-hub">
      <section className="section">
        <div className="section-header">
          <span className="section-icon">🔍</span>
          <div>
            <div className="section-title">ค้นพบ</div>
            <div className="section-subtitle">ค้นหาคลิปที่กำลัง Trending และเป็นที่นิยม</div>
          </div>
        </div>

        <div className="featured-card" onClick={() => navigate('/trends')}>
          <span className="featured-card-badge">
            <span className="badge badge-hot">🔥 ฮอต</span>
          </span>
          <div className="featured-icon">📈</div>
          <h3 className="featured-title">เทรนด์ยอดนิยม</h3>
          <p className="featured-desc">ค้นหาคลิปที่กำลัง Viral และเป็นที่นิยม</p>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="section-icon">✨</span>
          <div>
            <div className="section-title">สร้างคอนเทนต์</div>
            <div className="section-subtitle">สร้างสคริปต์คอนเทนต์ด้วย AI</div>
          </div>
        </div>

        <div className="tools-grid">
          {tools.map((tool) => (
            <div
              key={tool.path}
              className="tool-card"
              onClick={() => navigate(tool.path)}
            >
              {tool.badge && (
                <span className="tool-card-badge">
                  <span className={`badge badge-${tool.badgeType}`}>
                    {tool.badgeType === 'popular' && '⭐ '}
                    {tool.badgeType === 'new' && '✨ '}
                    {tool.badge}
                  </span>
                </span>
              )}
              <div className={`tool-card-icon ${tool.color}`}>
                {tool.icon}
              </div>
              <h4 className="tool-card-title">{tool.title}</h4>
              <p className="tool-card-desc">{tool.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
