import ArtStyleModal from '../components/ArtStyleModal'
import { SetupForm } from '../components/shorts-creator/SetupForm'
import { VideoPreview } from '../components/shorts-creator/VideoPreview'
import { DirectorChat } from '../components/shorts-creator/DirectorChat'
import { useProjectStore } from '../stores/useProjectStore'
import { useUIStore } from '../stores/useUIStore'
import { useScriptGenerator } from '../hooks/useScriptGenerator'
import { useSettingsStore } from '../stores/useSettingsStore'
import './ShortsCreator.css'

export default function ShortsCreator() {
  const {
    formData, setFormData, scriptData, isGenerating, progress, error,
    creationMode, setCreationMode, superStep, trends, agentStatus,
    activeScene, setActiveScene, updateScene, addScene
  } = useProjectStore()
  const { showArtModal, setShowArtModal } = useUIStore()
  const { handleMainAction, handleSelectIdea, handleAssistantSend } = useScriptGenerator()

  // Updated generation function with API call
  const generateVisualRef = async (idx: number) => {
    const currentScript = useProjectStore.getState().scriptData
    if (!currentScript) return

    const settings = useSettingsStore.getState()
    if (!settings.leonardoKey) {
      alert('กรุณาใส่ Leonardo API Key ใน Settings ก่อน (คลิกที่รูปกุญแจ)')
      return
    }

    // Set generating status
    useProjectStore.getState().setScriptData({
      ...currentScript,
      scenes: currentScript.scenes.map((s, i) =>
        i === idx ? { ...s, visualRefStatus: 'generating' as const } : s
      )
    })

    try {
      const scene = currentScript.scenes[idx]
      const response = await fetch('http://localhost:3001/api/providers/leonardo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.leonardoKey,
          prompt: scene.imagePrompt,
          width: formData.orientation === 'vertical' ? 768 : 1360,
          height: formData.orientation === 'vertical' ? 1360 : 768,
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Generaton failed')

      // Update with result
      const updatedScript = useProjectStore.getState().scriptData
      if (!updatedScript) return

      useProjectStore.getState().setScriptData({
        ...updatedScript,
        scenes: updatedScript.scenes.map((s, i) =>
          i === idx ? {
            ...s,
            visualRefStatus: 'ready' as const,
            visualRefUrl: data.imageUrl || data.url
          } : s
        )
      })

    } catch (err: any) {
      console.error(err)
      alert(`Failed to generate image: ${err.message}`)

      // Reset status to allow retry
      const failedScript = useProjectStore.getState().scriptData
      if (!failedScript) return
      useProjectStore.getState().setScriptData({
        ...failedScript,
        scenes: failedScript.scenes.map((s, i) =>
          i === idx ? { ...s, visualRefStatus: 'error' as const } : s
        )
      })
    }
  }

  const isFormValid = formData.topic.trim() !== ''
  const filledFields = [formData.topic, formData.genre, formData.orientation, formData.tone, formData.duration].filter(Boolean).length
  const totalRequired = 5
  const progressPercent = (filledFields / totalRequired) * 100

  return (
    <div className="shorts-creator">
      <div className="page-header">
        <div className="page-label">🚀 SuperCreate Mode</div>
        <h1 className="page-title">Shorts Factory</h1>
      </div>

      <div className="creator-layout">
        <SetupForm
          formData={formData}
          setFormData={setFormData}
          isGenerating={isGenerating}
          creationMode={creationMode}
          filledFields={filledFields}
          totalRequired={totalRequired}
          progressPercent={progressPercent}
          isFormValid={isFormValid}
          onGenerate={handleMainAction}
          onOpenArtModal={() => setShowArtModal(true)}
          error={error}
        />

        <VideoPreview
          isGenerating={isGenerating}
          progress={progress}
          scriptData={scriptData}
          creationMode={creationMode}
          superStep={superStep}
          trends={trends}
          agentStatus={agentStatus}
          activeScene={activeScene}
          artStyle={formData.artStyle}
          onUpdateScene={updateScene}
          onGenerateVisualRef={generateVisualRef}
          onAddScene={addScene}
          onSelectIdea={handleSelectIdea}
          onSceneSelect={setActiveScene}
        />

        <DirectorChat onSend={handleAssistantSend} />
      </div>

      {showArtModal && (
        <ArtStyleModal
          selectedStyle={formData.artStyle}
          onSelect={(s) => { setFormData({ ...formData, artStyle: s }); setShowArtModal(false) }}
          onClose={() => setShowArtModal(false)}
        />
      )}
    </div>
  )
}
