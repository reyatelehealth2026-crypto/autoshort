import './ArtStyleModal.css'
import { ArtStyleModalProps, ArtStyle } from '../types'

const artStyles: ArtStyle[] = [
  {
    id: 'cinematic',
    name: 'Cinematic Master',
    icon: '🎬',
    desc: 'สไตล์ Hollywood ระดับสูง พร้อมเอฟเฟกต์แสงและสี',
    params: '30mm LENS, DRAMATIC LIGHTING, ANAMORPHIC FLARES, COLOR-GRADED',
    image: '🎞️'
  },
  {
    id: 'neo-anime',
    name: 'Neo Anime',
    icon: '🎨',
    desc: 'ภาพ Cel-shaded สดใส สไตล์อนิเมะญี่ปุ่น',
    params: 'CEL SHADED, VIBRANT LINES, ANIME AESTHETIC, STYLIZED TEXTURES',
    image: '🌸'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Edgy',
    icon: '🌆',
    desc: 'อนาคตดิสโทเปีย คอนทราสต์สูง สไตล์ไซเบอร์พังก์',
    params: 'NEON LIGHTS, RAINY STREETS, CYBERPUNK AESTHETIC, HIGH CONTRAST',
    image: '🌃'
  },
  {
    id: 'horror',
    name: 'Atmospheric Horror',
    icon: '👻',
    desc: 'บรรยากาศน่าขนลุก ความมืดและความลึกลับ',
    params: 'DARK ATMOSPHERE, GRAINY TEXTURE, LOW-KEY LIGHTING, SPOOKY VIBE',
    image: '🌑'
  },
  {
    id: 'natgeo',
    name: 'NatGeo Reality',
    icon: '🌿',
    desc: 'สารคดีคุณภาพสูง สมจริงเหมือน National Geographic',
    params: 'NEUTRAL LIGHTING, DOCUMENTARY STYLE, PRIME LENS, REALISTIC TEXTURES',
    image: '🦁'
  },
  {
    id: 'unreal',
    name: 'Unreal Engine 5',
    icon: '🎮',
    desc: 'กราฟิก 3D ระดับเกม Hyper-realistic',
    params: 'UNREAL ENGINE 5 RENDER, 8K RESOLUTION, LUMEN GLOBAL ILLUMINATION',
    image: '💎'
  },
]

export default function ArtStyleModal({ selectedStyle, onSelect, onClose }: ArtStyleModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-icon">🎨</span>
            <div>
              <h3 className="modal-title">ทิศทางศิลปะ</h3>
              <p className="modal-subtitle">เลือกพารามิเตอร์ภาพสำหรับ Neural Generation Engine</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge" style={{ background: 'var(--accent-purple)', color: 'white' }}>
              🎭 6 MULTI-SPECTRAL STYLE KERNELS
            </span>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="style-grid">
            {artStyles.map((style) => (
              <div
                key={style.id}
                className={`style-card ${selectedStyle.id === style.id ? 'selected' : ''}`}
                onClick={() => onSelect(style)}
              >
                <div className="style-card-check">✓</div>
                <div className="style-card-image">{style.image}</div>
                <div className="style-card-content">
                  <h4 className="style-card-title">{style.name}</h4>
                  <div className="style-card-engine">🟢 LENS CORE ACTIVE</div>
                  <p className="style-card-desc">{style.desc}</p>
                  <div className="style-card-params">
                    <div className="style-card-params-title">⚙️ ENGINE PARAMETERS</div>
                    <div>{style.params}</div>
                  </div>
                  <button className="style-card-btn">
                    {selectedStyle.id === style.id ? '✓ เลือกแล้ว' : 'เลือกสไตล์'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-info">
            <span>⚡ HARDWARE ACCELERATION: V4 CLUSTER ACTIVE</span>
            <span>🚀 STYLE TRANSFER OPTIMIZATION: ON</span>
          </div>
          <button className="btn btn-primary" onClick={onClose}>
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  )
}
