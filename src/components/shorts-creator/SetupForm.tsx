import React from 'react'
import { FormData, ArtStyle } from '../../types'
import { OptionGrid, FormSection } from '../ui/FormElements'
import {
    genreOptions,
    orientationOptions,
    toneOptions,
    durationOptions,
    artStyles
} from '../../data/constants'

interface SetupFormProps {
    formData: FormData
    setFormData: (data: FormData) => void
    isGenerating: boolean
    creationMode: 'simple' | 'super'
    filledFields: number
    totalRequired: number
    progressPercent: number
    isFormValid: boolean
    onGenerate: () => void
    onOpenArtModal: () => void
    error?: string | null
}

export function SetupForm({
    formData,
    setFormData,
    isGenerating,
    creationMode,
    filledFields,
    totalRequired,
    progressPercent,
    isFormValid,
    onGenerate,
    onOpenArtModal,
    error
}: SetupFormProps) {
    return (
        <div className="creator-form-panel">
            <div className="form-progress">
                <div className="form-progress-bar">
                    <div className="form-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="form-progress-text">{filledFields}/{totalRequired}</span>
            </div>

            <FormSection icon="📝" title="หัวข้อ/ไอเดีย" required>
                <input
                    type="text"
                    className="input"
                    placeholder="ไอเดียคลิป..."
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                />
            </FormSection>

            <FormSection icon="🎭" title="ประเภท" required>
                <div className="select-wrapper">
                    <select className="select" value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })}>
                        <option value="">เลือกประเภท...</option>
                        {genreOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                </div>
            </FormSection>

            <FormSection icon="⏱️" title="ระยะเวลาคลิป" required>
                <div className="duration-selector">
                    <div className="duration-quick-picks">
                        {['5sec', '6sec', '7sec', '8sec', '9sec', '10sec'].map(dur => (
                            <button
                                key={dur}
                                className={`duration-chip ${formData.duration === dur ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, duration: dur })}
                            >
                                {dur.replace('sec', '')}s
                            </button>
                        ))}
                    </div>
                    <div className="duration-extended">
                        <div className="select-wrapper">
                            <select
                                className="select"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            >
                                {durationOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </FormSection>

            <FormSection icon="📐" title="แนววิดีโอ" required>
                <OptionGrid
                    options={orientationOptions}
                    selected={formData.orientation}
                    onSelect={(val) => setFormData({ ...formData, orientation: val })}
                    columns={3}
                    showDesc={false}
                />
            </FormSection>

            <FormSection icon="😊" title="โทน/อารมณ์" required>
                <div className="select-wrapper">
                    <select className="select" value={formData.tone} onChange={(e) => setFormData({ ...formData, tone: e.target.value })}>
                        <option value="">เลือกโทน...</option>
                        {toneOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                </div>
            </FormSection>

            <FormSection icon="🎨" title="สไตล์ภาพ">
                <button className="art-style-btn" onClick={onOpenArtModal}>
                    <span className="art-style-preview">{formData.artStyle.icon}</span>
                    <div className="art-style-info">
                        <span className="art-style-name">{formData.artStyle.name}</span>
                    </div>
                </button>
            </FormSection>

            {error && (
                <div className="error-banner">
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <div className="form-actions">
                <button
                    className={`btn btn-primary btn-lg ${!isFormValid ? 'btn-disabled' : ''}`}
                    onClick={onGenerate}
                    disabled={isGenerating || !isFormValid}
                >
                    {isGenerating ? '⏳ กำลังสร้าง...' : (creationMode === 'super' ? '🚀 เริ่ม SuperCreate' : '✨ สร้างสคริปต์')}
                </button>
            </div>
        </div>
    )
}
