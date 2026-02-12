import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { generateNextScene } from '../services/gemini'
import { generateImageWithNanoBanana } from '../services/nanoBanana'
import toast from 'react-hot-toast'
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
  const location = useLocation()

  // Auto-switch to Simple Mode if entering via /studio (Manual Studio)
  useEffect(() => {
    if (location.pathname === '/studio') {
      useProjectStore.getState().setCreationMode('simple')
    } else {
      useProjectStore.getState().setCreationMode('super')
    }
  }, [location.pathname])

  // Updated generation function with API call
  const generateVisualRef = async (idx: number) => {
    const currentScript = useProjectStore.getState().scriptData
    if (!currentScript) return

    const settings = useSettingsStore.getState()

    const references = [formData.productRefImage, formData.characterRefImage].filter(Boolean)
    if (references.length > 0) {
      useProjectStore.getState().setScriptData({
        ...currentScript,
        scenes: currentScript.scenes.map((s, i) =>
          i === idx ? { ...s, visualRefStatus: 'generating' as const } : s
        )
      })

      try {
        const scene = currentScript.scenes[idx]
        const orientation = formData.orientation === 'vertical' ? 'vertical' : formData.orientation === 'horizontal' ? 'horizontal' : 'square'
        const data = await generateImageWithNanoBanana({
          prompt: scene.imagePrompt,
          orientation,
          references: references as any,
        })

        const updatedScript = useProjectStore.getState().scriptData
        if (!updatedScript) return

        useProjectStore.getState().setScriptData({
          ...updatedScript,
          scenes: updatedScript.scenes.map((s, i) =>
            i === idx ? {
              ...s,
              visualRefStatus: 'ready' as const,
              visualRefUrl: data.imageDataUrl
            } : s
          )
        })

        toast.success('Generated with Nano Banana + references')
        return
      } catch (err: any) {
        console.error(err)
        toast.error(`Nano Banana failed: ${err.message}`)
        useProjectStore.getState().setScriptData({
          ...currentScript,
          scenes: currentScript.scenes.map((s, i) =>
            i === idx ? { ...s, visualRefStatus: 'error' as const } : s
          )
        })
        return
      }
    }

    if (!settings.leonardoKey) {
      // Use Pollinations AI for free image generation
      useProjectStore.getState().setScriptData({
        ...currentScript,
        scenes: currentScript.scenes.map((s, i) =>
          i === idx ? { ...s, visualRefStatus: 'generating' as const } : s
        )
      })

      try {
        const scene = currentScript.scenes[idx]
        const encodedPrompt = encodeURIComponent(scene.imagePrompt)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${formData.orientation === 'vertical' ? 768 : 1024}&height=${formData.orientation === 'vertical' ? 1024 : 768}&nologo=true`

        // Simple image validation
        const img = new Image()
        img.src = imageUrl
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const updated = useProjectStore.getState().scriptData
        if (!updated) return

        useProjectStore.getState().setScriptData({
          ...updated,
          scenes: updated.scenes.map((s, i) =>
            i === idx ? {
              ...s,
              visualRefStatus: 'ready' as const,
              visualRefUrl: imageUrl
            } : s
          )
        })
        toast.success('Generated with Pollinations AI (Free Mode)')
        return
      } catch (e) {
        toast.error('Failed to generate image')
        useProjectStore.getState().setScriptData({
          ...currentScript,
          scenes: currentScript.scenes.map((s, i) =>
            i === idx ? { ...s, visualRefStatus: 'error' as const } : s
          )
        })
        return
      }
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


  // Smart Add Scene using AI
  const handleSmartAddScene = async () => {
    const currentScript = useProjectStore.getState().scriptData
    const currentFormData = useProjectStore.getState().formData
    const apiKey = useSettingsStore.getState().apiKey

    if (!apiKey) {
      toast.error('Please set Gemini API Key first')
      useUIStore.getState().setShowApiKeyModal(true)
      return
    }

    if (!currentScript) {
      // Fallback if no script starts
      addScene()
      return
    }

    const toastId = toast.loading('Creativity flowing... generating next scene 🎬')

    try {
      const nextSceneData = await generateNextScene(apiKey, currentScript.scenes, currentFormData)
      useProjectStore.getState().addSceneWithData(nextSceneData)
      toast.success('New scene added!', { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error('AI Brain freeze! Adding blank scene instead.', { id: toastId })
      addScene()
    }
  }

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
          onAddScene={handleSmartAddScene}
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
