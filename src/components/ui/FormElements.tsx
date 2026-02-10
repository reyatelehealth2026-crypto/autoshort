import React from 'react'
import { SelectOption } from '../../types'

// ==================== Option Button ====================

interface OptionButtonProps {
    option: SelectOption & { icon?: string }
    selected: boolean
    onClick: () => void
    showDesc?: boolean
}

export function OptionButton({ option, selected, onClick, showDesc = true }: OptionButtonProps) {
    return (
        <button
            className={`option-btn ${selected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <div className="option-label">
                <span className="option-icon">{option.icon}</span>
                {option.label}
            </div>
            {showDesc && option.desc && (
                <div className="option-desc">{option.desc}</div>
            )}
        </button>
    )
}

// ==================== Option Grid ====================

interface OptionGridProps {
    options: (SelectOption & { icon?: string })[]
    selected: string
    onSelect: (id: string) => void
    columns?: number
    showDesc?: boolean
}

export function OptionGrid({ options, selected, onSelect, columns = 2, showDesc = true }: OptionGridProps) {
    return (
        <div className={`option-grid cols-${columns}`}>
            {options.map((opt) => (
                <OptionButton
                    key={opt.id}
                    option={opt}
                    selected={selected === opt.id}
                    onClick={() => onSelect(opt.id)}
                    showDesc={showDesc}
                />
            ))}
        </div>
    )
}

// ==================== Form Section ====================

interface FormSectionProps {
    icon: string
    title: string
    children: React.ReactNode
    required?: boolean
    className?: string
}

export function FormSection({ icon, title, children, required = false, className = '' }: FormSectionProps) {
    return (
        <div className={`form-section ${className}`}>
            <h3 className="section-title">
                <span className="section-icon">{icon}</span>
                {title}
                {required && <span className="required-mark">*</span>}
            </h3>
            {children}
        </div>
    )
}
