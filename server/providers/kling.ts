// ==================== Kling AI Video Provider ====================
// Handles: Image-to-Video, Text-to-Video generation
// Docs: https://docs.klingai.com

import type { ProviderConfig, VideoGenerationResult, KlingVideoRequest } from './types'

const DEFAULT_BASE_URL = 'https://api.klingai.com'
const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 120 // ~10 minutes (video gen takes longer)

// ==================== Helpers ====================
function makeHeaders(apiKey: string) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
    }
}

// ==================== Image to Video ====================
export async function imageToVideo(
    config: ProviderConfig,
    request: KlingVideoRequest & { imageUrl: string }
): Promise<VideoGenerationResult> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    const response = await fetch(`${baseUrl}/v1/videos/image2video`, {
        method: 'POST',
        headers: makeHeaders(config.apiKey),
        body: JSON.stringify({
            image_url: request.imageUrl,
            prompt: request.prompt || '',
            duration: request.duration || 5,
            mode: request.mode || 'standard',
            aspect_ratio: request.aspectRatio || '9:16',
        }),
    })

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(`Kling image2video failed: ${(err as any)?.message || response.status}`)
    }

    const data = await response.json()
    const taskId = data.data?.task_id || data.task_id

    if (!taskId) {
        throw new Error('Kling: No task ID returned')
    }

    return {
        id: taskId,
        provider: 'kling',
        status: 'processing',
        sourceImageUrl: request.imageUrl,
        sceneNumber: 0,
    }
}

// ==================== Text to Video ====================
export async function textToVideo(
    config: ProviderConfig,
    request: KlingVideoRequest & { prompt: string }
): Promise<VideoGenerationResult> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    const response = await fetch(`${baseUrl}/v1/videos/text2video`, {
        method: 'POST',
        headers: makeHeaders(config.apiKey),
        body: JSON.stringify({
            prompt: request.prompt,
            duration: request.duration || 5,
            mode: request.mode || 'standard',
            aspect_ratio: request.aspectRatio || '9:16',
        }),
    })

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(`Kling text2video failed: ${(err as any)?.message || response.status}`)
    }

    const data = await response.json()
    const taskId = data.data?.task_id || data.task_id

    if (!taskId) {
        throw new Error('Kling: No task ID returned')
    }

    return {
        id: taskId,
        provider: 'kling',
        status: 'processing',
        sceneNumber: 0,
    }
}

// ==================== Poll Video Status ====================
export async function pollVideoStatus(
    config: ProviderConfig,
    taskId: string
): Promise<VideoGenerationResult> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const response = await fetch(`${baseUrl}/v1/videos/${taskId}`, {
            method: 'GET',
            headers: makeHeaders(config.apiKey),
        })

        if (!response.ok) {
            // Some 404s happen early, keep polling
            if (response.status !== 404) {
                throw new Error(`Kling poll failed: ${response.status}`)
            }
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
            continue
        }

        const data = await response.json()
        const task = data.data || data

        if (task.status === 'completed' || task.status === 'succeed') {
            const videoUrl = task.works?.[0]?.resource?.resource ||
                task.video_url ||
                task.output?.video_url ||
                ''

            return {
                id: taskId,
                provider: 'kling',
                status: 'completed',
                videoUrl,
                sceneNumber: 0,
                durationSec: task.duration || 5,
                metadata: {
                    resolution: task.resolution,
                    mode: task.mode,
                },
            }
        }

        if (task.status === 'failed' || task.status === 'error') {
            return {
                id: taskId,
                provider: 'kling',
                status: 'error',
                sceneNumber: 0,
                error: task.fail_reason || task.error_message || 'Video generation failed',
            }
        }

        // Still processing
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    return {
        id: taskId,
        provider: 'kling',
        status: 'error',
        sceneNumber: 0,
        error: `Timeout: video did not complete within ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s`,
    }
}

// ==================== Generate & Wait ====================
export async function generateVideoAndWait(
    config: ProviderConfig,
    request: KlingVideoRequest,
    sceneNumber: number
): Promise<VideoGenerationResult> {
    let initial: VideoGenerationResult

    if (request.imageUrl) {
        initial = await imageToVideo(config, {
            ...request,
            imageUrl: request.imageUrl,
        })
    } else if (request.prompt) {
        initial = await textToVideo(config, {
            ...request,
            prompt: request.prompt,
        })
    } else {
        throw new Error('Kling: Either imageUrl or prompt is required')
    }

    initial.sceneNumber = sceneNumber

    const result = await pollVideoStatus(config, initial.id)
    result.sceneNumber = sceneNumber
    return result
}

// ==================== Health Check ====================
export async function checkConnection(config: ProviderConfig): Promise<boolean> {
    try {
        const baseUrl = config.baseUrl || DEFAULT_BASE_URL
        const response = await fetch(`${baseUrl}/v1/user/info`, {
            method: 'GET',
            headers: makeHeaders(config.apiKey),
        })
        return response.ok
    } catch {
        return false
    }
}
