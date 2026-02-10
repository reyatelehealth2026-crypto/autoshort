import { useState } from 'react'
import { SceneData } from '../../types'

interface SceneEditorProps {
    scene: SceneData
    sceneIndex: number
    artStyleIcon: string
    onUpdateScene: (idx: number, field: string, value: string) => void
    onGenerateVisualRef: (idx: number) => void
}

export function SceneEditor({
    scene,
    sceneIndex,
    artStyleIcon,
    onUpdateScene,
    onGenerateVisualRef
}: SceneEditorProps) {
    const [editMode, setEditMode] = useState<boolean>(false)

    if (editMode) {
        return (
            <div className="preview-placeholder">
                <span className="preview-icon">{artStyleIcon}</span>
                <div className="preview-status">🛠️ Manual Edit Mode</div>
                <div className="scene-manual-editor">
                    <div className="editor-visual-ref">
                        <div className="visual-ref-placeholder">
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => onGenerateVisualRef(sceneIndex)}
                            >
                                🎨 เจนภาพ Ref
                            </button>
                        </div>
                    </div>
                    <label>Prompt ภาพ:</label>
                    <textarea
                        value={scene.imagePrompt}
                        onChange={(e) => onUpdateScene(sceneIndex, 'imagePrompt', e.target.value)}
                    />
                    <label>บทพูด:</label>
                    <input
                        type="text"
                        value={scene.audio.dialogue}
                        onChange={(e) => onUpdateScene(sceneIndex, 'audio.dialogue', e.target.value)}
                    />
                    <label>มุมกล้อง:</label>
                    <input
                        type="text"
                        value={scene.camera.angle}
                        onChange={(e) => onUpdateScene(sceneIndex, 'camera.angle', e.target.value)}
                    />
                    <label>การเคลื่อนไหว:</label>
                    <input
                        type="text"
                        value={scene.camera.movement}
                        onChange={(e) => onUpdateScene(sceneIndex, 'camera.movement', e.target.value)}
                    />
                    <label>โทนสี:</label>
                    <input
                        type="text"
                        value={scene.visuals.colorTone}
                        onChange={(e) => onUpdateScene(sceneIndex, 'visuals.colorTone', e.target.value)}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => setEditMode(false)}>
                        ✅ บันทึก
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="preview-placeholder">
            <span className="preview-icon">{artStyleIcon}</span>
            <div className="preview-status">Preview: Scene {sceneIndex + 1}</div>
            <div className="scene-info-overlay">
                <p className="scene-mood">{scene.visuals?.mood}</p>
                <div className="scene-script-preview">
                    <p><strong>Camera:</strong> {scene.camera?.angle} / {scene.camera?.movement}</p>
                    <p><strong>Color:</strong> {scene.visuals?.colorTone}</p>
                    <p><strong>Voice:</strong> {scene.audio?.dialogue}</p>
                </div>
                <button className="btn-edit-icon" onClick={() => setEditMode(true)}>
                    ✏️ แก้ไขฉากนี้
                </button>
            </div>
        </div>
    )
}
