import { ScriptJsonOutput, SceneData, TrendIdea, ArtStyle } from '../../types'
import { SceneEditor } from './SceneEditor'
import { ScriptOutput } from './ScriptOutput'
import { SuperCreateFlow } from './SuperCreateFlow'

// ==================== Timeline Component ====================

interface TimelineProps {
    scenes: SceneData[]
    activeScene: number
    onSceneSelect: (idx: number) => void
    onAddScene: () => void
    onExport: () => void
}

function Timeline({ scenes, activeScene, onSceneSelect, onAddScene, onExport }: TimelineProps) {
    return (
        <div className="scene-timeline-container">
            <div className="timeline-header">
                <span>ลำดับฉาก (Timeline)</span>
                <button className="btn btn-secondary btn-sm" onClick={onExport}>📦 ส่งออกโปรเจค</button>
            </div>
            <div className="scene-timeline">
                {scenes.map((_, idx) => (
                    <div
                        key={idx}
                        className={`timeline-scene ${activeScene === idx ? 'active' : ''}`}
                        onClick={() => onSceneSelect(idx)}
                    >
                        {idx + 1}s
                    </div>
                ))}
                <div className="timeline-scene add-scene" onClick={onAddScene}>+ ต่อฉาก</div>
            </div>
        </div>
    )
}

// ==================== Video Preview Component ====================

interface VideoPreviewProps {
    isGenerating: boolean
    progress: number
    scriptData: ScriptJsonOutput | null
    creationMode: 'simple' | 'super'
    superStep: string
    trends: TrendIdea[]
    agentStatus: string
    activeScene: number
    artStyle: ArtStyle

    // Handlers
    onUpdateScene: (idx: number, field: string, value: string) => void
    onGenerateVisualRef: (idx: number) => void
    onAddScene: () => void
    onSelectIdea: (idea: TrendIdea) => void
    onSceneSelect: (idx: number) => void
}

export function VideoPreview({
    isGenerating,
    progress,
    scriptData,
    creationMode,
    superStep,
    trends,
    agentStatus,
    activeScene,
    artStyle,
    onUpdateScene,
    onGenerateVisualRef,
    onAddScene,
    onSelectIdea,
    onSceneSelect
}: VideoPreviewProps) {

    // Handle export
    const handleExport = () => {
        if (!scriptData) return
        const blob = new Blob([JSON.stringify(scriptData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `project-${scriptData.project.title.replace(/\s+/g, '-')}.json`
        a.click()
    }

    return (
        <div className="video-preview-panel">
            <div className="preview-container">
                {isGenerating ? (
                    <div className="preview-placeholder">
                        {creationMode === 'super' && superStep !== 'input' ? (
                            <SuperCreateFlow
                                superStep={superStep}
                                agentStatus={agentStatus}
                                trends={trends}
                                onSelectIdea={onSelectIdea}
                            />
                        ) : (
                            <>
                                <div className="loading-spinner" />
                                <p>AI กำลังวางโครงสร้างภาพ... ({progress}%)</p>
                            </>
                        )}
                    </div>
                ) : scriptData ? (
                    <SceneEditor
                        scene={scriptData.scenes[activeScene]}
                        sceneIndex={activeScene}
                        artStyleIcon={artStyle.icon}
                        onUpdateScene={onUpdateScene}
                        onGenerateVisualRef={onGenerateVisualRef}
                    />
                ) : (
                    <div className="preview-placeholder">
                        <span className="preview-icon">🎬</span>
                        <p>รอการสร้างวิดีโอ...</p>
                    </div>
                )}
            </div>

            {scriptData && (
                <Timeline
                    scenes={scriptData.scenes}
                    activeScene={activeScene}
                    onSceneSelect={onSceneSelect}
                    onAddScene={onAddScene}
                    onExport={handleExport}
                />
            )}

            <ScriptOutput scriptData={scriptData} />
        </div>
    )
}
