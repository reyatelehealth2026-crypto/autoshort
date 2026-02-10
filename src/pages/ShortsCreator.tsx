import ArtStyleModal from '../components/ArtStyleModal'
import { SetupForm } from '../components/shorts-creator/SetupForm'
import { VideoPreview } from '../components/shorts-creator/VideoPreview'
import { DirectorChat } from '../components/shorts-creator/DirectorChat'
import { useProjectStore } from '../stores/useProjectStore'
import { useUIStore } from '../stores/useUIStore'
import { useScriptGenerator } from '../hooks/useScriptGenerator'
import './ShortsCreator.css'

export default function ShortsCreator() {
  const {
    formData, setFormData, scriptData, isGenerating, progress, error,
    creationMode, setCreationMode, superStep, trends, agentStatus,
    activeScene, setActiveScene, updateScene, addScene
  } = useProjectStore()
  const { showArtModal, setShowArtModal } = useUIStore()
  const { handleMainAction, handleSelectIdea, handleAssistantSend } = useScriptGenerator()

  const generateVisualRef = async (idx: number) => {
    if (!scriptData) return
    useProjectStore.getState().setScriptData({
      ...scriptData,
      scenes: scriptData.scenes.map((s, i) =>
        i === idx ? { ...s, visualRefStatus: 'generating' as const } : s
      )
    })
    setTimeout(() => {
      const current = useProjectStore.getState().scriptData
      if (!current) return
      useProjectStore.getState().setScriptData({
        ...current,
        scenes: current.scenes.map((s, i) =>
          i === idx ? { ...s, visualRefStatus: 'ready' as const, visualRefUrl: 'https://via.placeholder.com/1024x1792/1a1a2e/FFFFFF?text=AI+Visual' } : s
        )
      })
    }, 2000)
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
