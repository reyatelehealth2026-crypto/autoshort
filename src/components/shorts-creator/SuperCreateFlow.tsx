import { TrendIdea } from '../../types'
import { superSteps } from '../../data/constants'

interface SuperCreateFlowProps {
    superStep: string
    agentStatus: string
    trends: TrendIdea[]
    onSelectIdea: (idea: TrendIdea) => void
}

export function SuperCreateFlow({ superStep, agentStatus, trends, onSelectIdea }: SuperCreateFlowProps) {
    const currentStep = superSteps.find(s => s.id === superStep)

    return (
        <div className="super-step-view">
            <div className="super-step-progress">
                {superSteps.map((step, idx) => (
                    <div
                        key={step.id}
                        className={`super-step-dot ${step.id === superStep ? 'active' : ''} ${superSteps.findIndex(s => s.id === superStep) > idx ? 'completed' : ''
                            }`}
                    >
                        <span className="super-step-dot-icon">{step.icon}</span>
                        <span className="super-step-dot-label">{step.label}</span>
                    </div>
                ))}
            </div>

            <div className="super-step-icon">{currentStep?.icon}</div>
            <h3>{currentStep?.label}</h3>
            <p className="agent-status">{agentStatus}</p>
            <div className="super-progress-dots">
                <span /><span /><span />
            </div>

            {superStep === 'selecting' && (
                <div className="idea-selection-grid">
                    {trends.map((idea, idx) => (
                        <div key={idx} className="idea-card" onClick={() => onSelectIdea(idea)}>
                            <div className="idea-card-number">#{idx + 1}</div>
                            <h4 className="idea-title">{idea.title}</h4>
                            <span className="idea-desc">{idea.desc}</span>
                            <div className="idea-tone-badge">{idea.tone}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
