import { NavLink } from 'react-router-dom'
import './Sidebar.css'

interface MenuItem {
  path: string
  icon: string
  label: string
  badge?: string
}

interface MenuSection {
  section: string
  items: MenuItem[]
}

const menuItems: MenuSection[] = [
  {
    section: 'สตูดิโอ',
    items: [
      { path: '/studio', icon: '✏️', label: 'สตูดิโอแมนนวล' },
      { path: '/create', icon: '🎬', label: 'สร้างคลิปสั้น' },
      { path: '/long-video', icon: '🎥', label: 'วิดีโอยาว' },
      { path: '/podcast', icon: '🎙️', label: 'พ็อดแคสต์' },
    ]
  },
  {
    section: 'ข้อมูลเชิงลึก',
    items: [
      { path: '/trends', icon: '📈', label: 'เทรนด์ยอดนิยม' },
      { path: '/social', icon: '📱', label: 'โซเชียลโพสต์' },
      { path: '/analytics', icon: '📊', label: 'วิเคราะห์ข้อมูล' },
    ]
  },
  {
    section: 'เผยแพร่',
    items: [
      { path: '/youtube', icon: '▶️', label: 'YouTube Studio', badge: '•' },
    ]
  }
]

interface SidebarProps {
  onOpenApiKey: () => void
  hasApiKey: boolean
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ onOpenApiKey, hasApiKey, isOpen, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <div>
            <div className="sidebar-logo-text">Shorts Factory</div>
            <div className="sidebar-logo-sub">AI สร้างสคริปต์</div>
          </div>
        </div>
        <button className="sidebar-close-btn" onClick={onClose}>✕</button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-item-icon">🏠</span>
            <span>ศูนย์เครื่องมือ</span>
          </NavLink>
        </div>

        {menuItems.map((section) => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="nav-item-badge" style={{ color: '#f97316' }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="api-key-btn" onClick={onOpenApiKey}>
          <span>{hasApiKey ? '🟢' : '🔑'}</span>
          <span>{hasApiKey ? 'API Key ตั้งค่าแล้ว' : 'ตั้งค่า API Key'}</span>
        </button>
      </div>
    </aside>
  )
}
