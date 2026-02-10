// ==================== Pipeline Orchestrator ====================
// Manages the full automation flow: Research → Plan → Script → Media → Video
// Uses SSE for real-time updates to frontend

import { randomUUID } from 'crypto'
import { runResearchAgent, runPlannerAgent, runScriptwriterAgent } from './agents'
import * as leonardo from './providers/leonardo'
import * as elevenlabs from './providers/elevenlabs'
import * as kling from './providers/kling'
import type {
    PipelineJob,
    PipelineConfig,
    PipelineStep,
    PipelineEvent,
    ProviderConfig,
    AllProviderConfigs,
    MediaOutput,
} from './providers/types'

// ==================== In-Memory Job Store ====================
const jobs = new Map<string, PipelineJob>()
const sseListeners = new Map<string, Set<(event: PipelineEvent) => void>>()

// ==================== Job Helpers ====================
function createStep(id: string, name: string, agent: string, icon: string): PipelineStep {
    return { id, name, agent, icon, status: 'pending', retryCount: 0 }
}

function updateStep(job: PipelineJob, stepId: string, updates: Partial<PipelineStep>) {
    const step = job.steps.find(s => s.id === stepId)
    if (step) Object.assign(step, updates)
    job.updatedAt = new Date().toISOString()
    jobs.set(job.id, job)
}

function emit(jobId: string, event: PipelineEvent) {
    const listeners = sseListeners.get(jobId)
    if (listeners) {
        for (const listener of listeners) {
            try { listener(event) } catch { /* ignore */ }
        }
    }
}

// ==================== Public API ====================

export function getJob(jobId: string): PipelineJob | undefined {
    return jobs.get(jobId)
}

export function subscribeToJob(jobId: string, listener: (event: PipelineEvent) => void): () => void {
    if (!sseListeners.has(jobId)) {
        sseListeners.set(jobId, new Set())
    }
    sseListeners.get(jobId)!.add(listener)

    // Return unsubscribe function
    return () => {
        sseListeners.get(jobId)?.delete(listener)
        if (sseListeners.get(jobId)?.size === 0) {
            sseListeners.delete(jobId)
        }
    }
}

export function approveStep(jobId: string, stepId: string): boolean {
    const job = jobs.get(jobId)
    if (!job) return false
    const step = job.steps.find(s => s.id === stepId)
    if (!step || step.status !== 'awaiting_approval') return false
    step.status = 'completed'
    job.updatedAt = new Date().toISOString()
    jobs.set(jobId, job)
    return true
}

// ==================== Start Pipeline ====================
export async function startPipeline(
    config: PipelineConfig,
    geminiApiKey: string,
    providerConfigs: Partial<AllProviderConfigs>
): Promise<PipelineJob> {
    const jobId = randomUUID()

    // Build steps based on enabled providers
    const steps: PipelineStep[] = [
        createStep('research', '🔍 วิจัยเทรนด์', 'ResearchAgent', '🔍'),
        createStep('planning', '📋 วางโครงสร้าง', 'PlannerAgent', '📋'),
        createStep('scripting', '✍️ เขียนสคริปต์', 'ScriptwriterAgent', '✍️'),
    ]

    if (config.providers.image !== 'none') {
        steps.push(createStep('image_gen', '🖼️ สร้างภาพ', 'LeonardoProvider', '🖼️'))
    }
    if (config.providers.voice !== 'none') {
        steps.push(createStep('voice_gen', '🗣️ สร้างเสียง', 'ElevenLabsProvider', '🗣️'))
    }
    if (config.providers.video !== 'none') {
        steps.push(createStep('video_gen', '📹 สร้างวิดีโอ', 'KlingProvider', '📹'))
    }

    const job: PipelineJob = {
        id: jobId,
        status: 'researching',
        config,
        steps,
        mediaOutputs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }

    jobs.set(jobId, job)
    emit(jobId, { type: 'job_created', jobId })

    // Run pipeline async
    runPipeline(job, geminiApiKey, providerConfigs).catch(err => {
        job.status = 'error'
        job.error = err.message
        job.updatedAt = new Date().toISOString()
        jobs.set(jobId, job)
        emit(jobId, { type: 'pipeline_error', jobId, error: err.message })
    })

    return job
}

// ==================== Pipeline Runner ====================
async function runPipeline(
    job: PipelineJob,
    geminiApiKey: string,
    providerConfigs: Partial<AllProviderConfigs>
) {
    const { config } = job
    const emitStatus = (agent: string, message: string) => {
        emit(job.id, { type: 'agent_status', agent, message })
    }

    try {
        // ────────── Step 1: Research ──────────
        updateStep(job, 'research', { status: 'running', startedAt: new Date().toISOString() })
        emit(job.id, { type: 'step_started', stepId: 'research', stepName: '🔍 วิจัยเทรนด์', agent: 'ResearchAgent' })

        const researchResult = await runResearchAgent(geminiApiKey, config, (msg) => emitStatus('ResearchAgent', msg))
        job.researchResult = researchResult

        // Auto-select best trend
        if (researchResult.trends.length > 0) {
            researchResult.selectedTrend = researchResult.trends.reduce(
                (best, t) => t.viralScore > best.viralScore ? t : best,
                researchResult.trends[0]
            )
        }

        updateStep(job, 'research', { status: 'completed', output: researchResult, completedAt: new Date().toISOString() })
        emit(job.id, { type: 'step_completed', stepId: 'research', output: researchResult })

        // Semi-auto pause after research
        if (config.mode === 'semi_auto') {
            updateStep(job, 'research', { status: 'awaiting_approval' })
            emit(job.id, { type: 'step_awaiting_approval', stepId: 'research' })
            job.status = 'paused'
            jobs.set(job.id, job)

            // Wait for approval (poll-based, checked by frontend calling approve)
            await waitForApproval(job, 'research')
            job.status = 'planning'
        }

        // ────────── Step 2: Planning ──────────
        job.status = 'planning'
        updateStep(job, 'planning', { status: 'running', startedAt: new Date().toISOString() })
        emit(job.id, { type: 'step_started', stepId: 'planning', stepName: '📋 วางโครงสร้าง', agent: 'PlannerAgent' })

        const planResult = await runPlannerAgent(geminiApiKey, config, researchResult, (msg) => emitStatus('PlannerAgent', msg))
        job.planResult = planResult

        updateStep(job, 'planning', { status: 'completed', output: planResult, completedAt: new Date().toISOString() })
        emit(job.id, { type: 'step_completed', stepId: 'planning', output: planResult })

        // ────────── Step 3: Scripting ──────────
        job.status = 'scripting'
        updateStep(job, 'scripting', { status: 'running', startedAt: new Date().toISOString() })
        emit(job.id, { type: 'step_started', stepId: 'scripting', stepName: '✍️ เขียนสคริปต์', agent: 'ScriptwriterAgent' })

        const scriptResult = await runScriptwriterAgent(geminiApiKey, config, researchResult, planResult, (msg) => emitStatus('ScriptwriterAgent', msg))
        job.scriptResult = scriptResult

        updateStep(job, 'scripting', { status: 'completed', output: scriptResult, completedAt: new Date().toISOString() })
        emit(job.id, { type: 'step_completed', stepId: 'scripting', output: scriptResult })

        // Semi-auto pause after scripting
        if (config.mode === 'semi_auto') {
            updateStep(job, 'scripting', { status: 'awaiting_approval' })
            emit(job.id, { type: 'step_awaiting_approval', stepId: 'scripting' })
            job.status = 'paused'
            jobs.set(job.id, job)
            await waitForApproval(job, 'scripting')
        }

        // ────────── Step 4: Image Generation (parallel-ready) ──────────
        if (config.providers.image !== 'none' && providerConfigs.leonardo?.enabled) {
            job.status = 'generating_images'
            updateStep(job, 'image_gen', { status: 'running', startedAt: new Date().toISOString() })
            emit(job.id, { type: 'step_started', stepId: 'image_gen', stepName: '🖼️ สร้างภาพ', agent: 'LeonardoProvider' })
            emitStatus('LeonardoProvider', '🖼️ กำลังสร้างภาพจาก AI...')

            const imagePromises = scriptResult.scenes.map(async (scene) => {
                try {
                    const result = await leonardo.generateImageAndWait(
                        providerConfigs.leonardo!,
                        {
                            prompt: scene.imagePrompt,
                            negativePrompt: scene.negativePrompt,
                            width: config.formData.orientation === 'vertical' ? 768 : 1360,
                            height: config.formData.orientation === 'vertical' ? 1360 : 768,
                        },
                        scene.sceneNumber
                    )
                    emit(job.id, { type: 'media_generated', media: result })
                    return result
                } catch (err: any) {
                    const errorResult: MediaOutput = {
                        id: `err-img-${scene.sceneNumber}`,
                        provider: 'leonardo',
                        status: 'error',
                        prompt: scene.imagePrompt,
                        sceneNumber: scene.sceneNumber,
                        error: err.message,
                    }
                    return errorResult
                }
            })

            const imageResults = await Promise.all(imagePromises)
            job.mediaOutputs.push(...imageResults)

            updateStep(job, 'image_gen', { status: 'completed', completedAt: new Date().toISOString() })
            emit(job.id, { type: 'step_completed', stepId: 'image_gen', output: { count: imageResults.length } })
        } else if (config.providers.image !== 'none') {
            // Skip — no API key configured
            updateStep(job, 'image_gen', { status: 'skipped' })
            emitStatus('LeonardoProvider', '⏭️ ข้ามขั้นตอน (ไม่มี API Key)')
        }

        // ────────── Step 5: Voice Generation (parallel-ready) ──────────
        if (config.providers.voice !== 'none' && providerConfigs.elevenlabs?.enabled) {
            job.status = 'generating_voice'
            updateStep(job, 'voice_gen', { status: 'running', startedAt: new Date().toISOString() })
            emit(job.id, { type: 'step_started', stepId: 'voice_gen', stepName: '🗣️ สร้างเสียง', agent: 'ElevenLabsProvider' })
            emitStatus('ElevenLabsProvider', '🗣️ กำลังสร้างเสียงพากย์...')

            const voicePromises = scriptResult.scenes.map(async (scene) => {
                try {
                    const result = await elevenlabs.generateSpeech(providerConfigs.elevenlabs!, {
                        text: scene.narration,
                        voiceId: elevenlabs.DEFAULT_VOICES['thai-female'].id,
                    })
                    result.sceneNumber = scene.sceneNumber
                    emit(job.id, { type: 'media_generated', media: result })
                    return result
                } catch (err: any) {
                    const errorResult: MediaOutput = {
                        id: `err-voice-${scene.sceneNumber}`,
                        provider: 'elevenlabs',
                        status: 'error',
                        text: scene.narration,
                        voiceId: '',
                        sceneNumber: scene.sceneNumber,
                        error: err.message,
                    }
                    return errorResult
                }
            })

            const voiceResults = await Promise.all(voicePromises)
            job.mediaOutputs.push(...voiceResults)

            updateStep(job, 'voice_gen', { status: 'completed', completedAt: new Date().toISOString() })
            emit(job.id, { type: 'step_completed', stepId: 'voice_gen', output: { count: voiceResults.length } })
        } else if (config.providers.voice !== 'none') {
            updateStep(job, 'voice_gen', { status: 'skipped' })
            emitStatus('ElevenLabsProvider', '⏭️ ข้ามขั้นตอน (ไม่มี API Key)')
        }

        // ────────── Step 6: Video Generation ──────────
        if (config.providers.video !== 'none' && providerConfigs.kling?.enabled) {
            job.status = 'generating_video'
            updateStep(job, 'video_gen', { status: 'running', startedAt: new Date().toISOString() })
            emit(job.id, { type: 'step_started', stepId: 'video_gen', stepName: '📹 สร้างวิดีโอ', agent: 'KlingProvider' })
            emitStatus('KlingProvider', '📹 กำลังสร้างวิดีโอจากภาพ...')

            // Get image URLs for video generation
            const imageOutputs = job.mediaOutputs.filter(
                (m): m is Extract<MediaOutput, { provider: 'leonardo' }> =>
                    m.provider === 'leonardo' && m.status === 'completed'
            )

            const videoPromises = scriptResult.scenes.map(async (scene) => {
                const imageForScene = imageOutputs.find(img => img.sceneNumber === scene.sceneNumber)

                try {
                    if (imageForScene?.imageUrl) {
                        const result = await kling.generateVideoAndWait(
                            providerConfigs.kling!,
                            {
                                imageUrl: imageForScene.imageUrl,
                                prompt: scene.imagePrompt,
                                duration: Math.min(scene.timeRange.duration, 10) as 5 | 10,
                                aspectRatio: config.formData.orientation === 'vertical' ? '9:16' : '16:9',
                            },
                            scene.sceneNumber
                        )
                        emit(job.id, { type: 'media_generated', media: result })
                        return result
                    } else {
                        // Fallback to text-to-video
                        const result = await kling.generateVideoAndWait(
                            providerConfigs.kling!,
                            {
                                prompt: scene.imagePrompt,
                                duration: 5,
                                aspectRatio: config.formData.orientation === 'vertical' ? '9:16' : '16:9',
                            },
                            scene.sceneNumber
                        )
                        emit(job.id, { type: 'media_generated', media: result })
                        return result
                    }
                } catch (err: any) {
                    const errorResult: MediaOutput = {
                        id: `err-video-${scene.sceneNumber}`,
                        provider: 'kling',
                        status: 'error',
                        sceneNumber: scene.sceneNumber,
                        error: err.message,
                    }
                    return errorResult
                }
            })

            const videoResults = await Promise.all(videoPromises)
            job.mediaOutputs.push(...videoResults)

            updateStep(job, 'video_gen', { status: 'completed', completedAt: new Date().toISOString() })
            emit(job.id, { type: 'step_completed', stepId: 'video_gen', output: { count: videoResults.length } })
        } else if (config.providers.video !== 'none') {
            updateStep(job, 'video_gen', { status: 'skipped' })
            emitStatus('KlingProvider', '⏭️ ข้ามขั้นตอน (ไม่มี API Key)')
        }

        // ────────── Done ──────────
        job.status = 'completed'
        job.updatedAt = new Date().toISOString()
        jobs.set(job.id, job)
        emit(job.id, { type: 'pipeline_completed', jobId: job.id })

    } catch (err: any) {
        job.status = 'error'
        job.error = err.message
        job.updatedAt = new Date().toISOString()
        jobs.set(job.id, job)
        emit(job.id, { type: 'pipeline_error', jobId: job.id, error: err.message })
    }
}

// ==================== Semi-Auto Approval Wait ====================
async function waitForApproval(job: PipelineJob, stepId: string, timeoutMs: number = 300_000): Promise<void> {
    const start = Date.now()

    while (Date.now() - start < timeoutMs) {
        const currentJob = jobs.get(job.id)
        if (!currentJob) throw new Error('Job not found')

        const step = currentJob.steps.find(s => s.id === stepId)
        if (!step) throw new Error(`Step ${stepId} not found`)

        if (step.status === 'completed') {
            return // Approved!
        }

        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    throw new Error(`Approval timeout for step: ${stepId}`)
}

// ==================== Retry Step ====================
export async function retryStep(
    jobId: string,
    stepId: string,
    geminiApiKey: string,
    providerConfigs: Partial<AllProviderConfigs>
): Promise<boolean> {
    const job = jobs.get(jobId)
    if (!job) return false

    const step = job.steps.find(s => s.id === stepId)
    if (!step || step.status !== 'error') return false

    step.retryCount++
    step.status = 'pending'
    step.error = undefined
    job.updatedAt = new Date().toISOString()
    jobs.set(jobId, job)

    // Re-run the pipeline from this step
    // (Simplified: full re-run for now, could be optimized)
    // For now, mark as not implemented
    return true
}
