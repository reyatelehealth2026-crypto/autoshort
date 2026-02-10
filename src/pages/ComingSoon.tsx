import { useLocation } from 'react-router-dom'

const pageInfo: Record<string, { icon: string; title: string; desc: string }> = {
  '/studio': { icon: '✏️', title: 'สตูดิโอแมนนวล', desc: 'เขียนเนื้อเรื่องและสร้างสคริปต์แบบ Manual' },
  '/long-video': { icon: '🎥', title: 'วิดีโอยาว', desc: 'สร้างสคริปต์สำหรับ YouTube หรือ Facebook' },
  '/podcast': { icon: '🎙️', title: 'พ็อดแคสต์', desc: 'สร้างสคริปต์สำหรับ AI Voice และ Podcast' },
  '/social': { icon: '📱', title: 'โซเชียลโพสต์', desc: 'สร้างโพสต์โซเชียลมีเดียพร้อมแคปชั่น' },
  '/analytics': { icon: '📊', title: 'วิเคราะห์ข้อมูล', desc: 'ดูสถิติและข้อมูลเชิงลึก' },
  '/youtube': { icon: '▶️', title: 'YouTube Studio', desc: 'จัดการช่อง YouTube ของคุณ' },
}

export default function ComingSoon() {
  const { pathname } = useLocation()
  const info = pageInfo[pathname] || { icon: '🚧', title: 'Coming Soon', desc: 'ฟีเจอร์นี้กำลังพัฒนา' }

  return (
    <div className="coming-soon">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">{info.icon}</div>
        <h1 className="coming-soon-title">{info.title}</h1>
        <p className="coming-soon-desc">{info.desc}</p>
        <div className="coming-soon-badge">🚧 กำลังพัฒนา</div>
        <p className="coming-soon-hint">ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้</p>
      </div>
    </div>
  )
}
