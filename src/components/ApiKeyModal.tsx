import { useState } from 'react'
import './ApiKeyModal.css'
import { ApiKeyModalProps } from '../types'

export default function ApiKeyModal({ apiKey, onSave, onClose }: ApiKeyModalProps) {
  const [key, setKey] = useState<string>(apiKey || '')
  const [showKey, setShowKey] = useState<boolean>(false)

  const handleSave = () => {
    onSave(key)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal api-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-icon">🔑</span>
            <div>
              <h3 className="modal-title">ตั้งค่า API Key</h3>
              <p className="modal-subtitle">เชื่อมต่อกับ Gemini AI เพื่อสร้างสคริปต์</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="api-form">
            <label className="api-label">
              <span>🤖</span> Gemini API Key
            </label>
            <div className="api-input-row">
              <input
                type={showKey ? 'text' : 'password'}
                className="input"
                placeholder="AIzaSy..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <button
                className="btn btn-secondary"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="api-hint">
              รับ API Key ได้ที่ <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
            </p>
          </div>

          <div className="api-status">
            {key ? (
              <div className="api-status-connected">
                <span>🟢</span> พร้อมใช้งาน
              </div>
            ) : (
              <div className="api-status-disconnected">
                <span>🔴</span> ยังไม่ได้ตั้งค่า
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}
