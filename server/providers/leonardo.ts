// ==================== Leonardo AI Provider ====================
// Handles: Image Generation, Blueprint Execution, Webhook
// Docs: https://docs.leonardo.ai

import type {
    ProviderConfig,
    ImageGenerationResult,
    LeonardoGenerationRequest,
    LeonardoBlueprintInput
} from './types'

const DEFAULT_BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1'
const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 60 // ~3 minutes

// ==================== Client ====================
function makeHeaders(apiKey: string) {
    return {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
    }
}

// ==================== Image Generation ====================
export async function generateImage(
    config: ProviderConfig,
    request: LeonardoGenerationRequest
): Promise<ImageGenerationResult> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    // Step 1: Create generation
    const response = await fetch(`${baseUrl}/generations`, {
        method: 'POST',
        headers: makeHeaders(config.apiKey),
        body: JSON.stringify({
            prompt: request.prompt,
            negative_prompt: request.negativePrompt || 'blurry, low quality, text, watermark, nsfw',
            modelId: request.modelId || null, // null = use platform default
            width: request.width || 1024,
            height: request.height || 1024,
            num_images: request.numImages || 1,
            alchemy: request.alchemy ?? true,
            photoReal: request.photoReal ?? false,
            presetStyle: request.presetStyle || 'DYNAMIC',
        }),
    })

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(`Leonardo generation failed: ${(err as any)?.error || response.status}`)
    }

    const data = await response.json()
    const generationId = data.sdGenerationJob?.generationId

    if (!generationId) {
        throw new Error('Leonardo: No generation ID returned')
    }

    return {
        id: generationId,
        provider: 'leonardo',
        status: 'processing',
        prompt: request.prompt,
        sceneNumber: 0, // Caller sets this
    }
}

// ==================== Poll Generation Status ====================
export async function pollGenerationStatus(
    config: ProviderConfig,
    generationId: string
): Promise<ImageGenerationResult> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const response = await fetch(`${baseUrl}/generations/${generationId}`, {
            method: 'GET',
            headers: makeHeaders(config.apiKey),
        })

        if (!response.ok) {
            throw new Error(`Leonardo poll failed: ${response.status}`)
        }

        const data = await response.json()
        const generation = data.generations_by_pk

        if (generation?.status === 'COMPLETE') {
            const images = generation.generated_images || []
            return {
                id: generationId,
                provider: 'leonardo',
                status: 'completed',
                imageUrl: images[0]?.url || '',
                thumbnailUrl: images[0]?.url || '',
                prompt: generation.prompt || '',
                sceneNumber: 0,
                metadata: {
                    allImages: images.map((img: any) => img.url),
                    model: generation.modelId,
                    seed: generation.seed,
                },
            }
        }

        if (generation?.status === 'FAILED') {
            return {
                id: generationId,
                provider: 'leonardo',
                status: 'error',
                prompt: generation.prompt || '',
                sceneNumber: 0,
                error: 'Generation failed on Leonardo side',
            }
        }

        // Still processing, wait and retry
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    return {
        id: generationId,
        provider: 'leonardo',
        status: 'error',
        prompt: '',
        sceneNumber: 0,
        error: `Timeout: generation did not complete within ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s`,
    }
}

// ==================== Generate & Wait ====================
export async function generateImageAndWait(
    config: ProviderConfig,
    request: LeonardoGenerationRequest,
    sceneNumber: number
): Promise<ImageGenerationResult> {
    const initial = await generateImage(config, request)
    initial.sceneNumber = sceneNumber

    const result = await pollGenerationStatus(config, initial.id)
    result.sceneNumber = sceneNumber
    return result
}

// ==================== Blueprint Execution ====================
export async function listBlueprints(
    config: ProviderConfig,
    limit: number = 10
): Promise<any[]> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    const response = await fetch(`${baseUrl}/blueprints`, {
        method: 'GET',
        headers: makeHeaders(config.apiKey),
    })

    if (!response.ok) {
        throw new Error(`Leonardo blueprints list failed: ${response.status}`)
    }

    const data = await response.json()
    return data.blueprints?.edges?.map((e: any) => e.node) || []
}

export async function getBlueprintVersions(
    config: ProviderConfig,
    blueprintId: string
): Promise<any> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    const response = await fetch(`${baseUrl}/blueprints/${blueprintId}/versions`, {
        method: 'GET',
        headers: makeHeaders(config.apiKey),
    })

    if (!response.ok) {
        throw new Error(`Leonardo blueprint versions failed: ${response.status}`)
    }

    const data = await response.json()
    const versions = data.blueprintVersions?.edges || []
    return versions.length > 0 ? versions[0].node : null
}

export async function executeBlueprint(
    config: ProviderConfig,
    input: LeonardoBlueprintInput
): Promise<string> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    const response = await fetch(`${baseUrl}/blueprint-executions`, {
        method: 'POST',
        headers: makeHeaders(config.apiKey),
        body: JSON.stringify({
            blueprintVersionId: input.blueprintVersionId,
            input: {
                nodeInputs: input.nodeInputs,
                public: false,
                collectionIds: [],
            },
        }),
    })

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(`Leonardo blueprint execution failed: ${(err as any)?.error || response.status}`)
    }

    const data = await response.json()
    return data.executeBlueprint?.akUUID || ''
}

export async function getBlueprintExecutionGenerations(
    config: ProviderConfig,
    executionId: string
): Promise<string[]> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    // Poll until complete
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const statusRes = await fetch(`${baseUrl}/blueprint-executions/${executionId}`, {
            method: 'GET',
            headers: makeHeaders(config.apiKey),
        })

        if (statusRes.ok) {
            const statusData = await statusRes.json()
            if (statusData.blueprintExecution?.status === 'COMPLETED') {
                break
            }
            if (statusData.blueprintExecution?.status === 'FAILED') {
                throw new Error('Blueprint execution failed')
            }
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    // Now get generation IDs
    const response = await fetch(`${baseUrl}/blueprint-executions/${executionId}/generations`, {
        method: 'GET',
        headers: makeHeaders(config.apiKey),
    })

    if (!response.ok) {
        throw new Error(`Blueprint generations fetch failed: ${response.status}`)
    }

    const data = await response.json()
    const edges = data.blueprintExecutionGenerations?.edges || []

    return edges
        .filter((e: any) => e.node?.status === 'COMPLETED')
        .map((e: any) => e.node.generationId)
}

// ==================== Upload Init Image ====================
export async function uploadInitImage(
    config: ProviderConfig,
    imageBuffer: Buffer,
    fileName: string
): Promise<string> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL

    // Step 1: Get presigned URL
    const presignRes = await fetch(`${baseUrl}/init-image`, {
        method: 'POST',
        headers: makeHeaders(config.apiKey),
        body: JSON.stringify({ extension: 'jpg' }),
    })

    if (!presignRes.ok) {
        throw new Error(`Leonardo upload presign failed: ${presignRes.status}`)
    }

    const presignData = await presignRes.json()
    const { url: uploadUrl, fields, id: imageId } = presignData.uploadInitImage || {}

    if (!uploadUrl || !imageId) {
        throw new Error('Leonardo: Failed to get presigned URL')
    }

    // Step 2: Upload image
    const formData = new FormData()
    if (fields) {
        const parsedFields = typeof fields === 'string' ? JSON.parse(fields) : fields
        for (const [key, value] of Object.entries(parsedFields)) {
            formData.append(key, value as string)
        }
    }
    formData.append('file', new Blob([imageBuffer]), fileName)

    await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
    })

    return imageId
}

// ==================== Health Check ====================
export async function checkConnection(config: ProviderConfig): Promise<boolean> {
    try {
        const baseUrl = config.baseUrl || DEFAULT_BASE_URL
        const response = await fetch(`${baseUrl}/me`, {
            method: 'GET',
            headers: makeHeaders(config.apiKey),
        })
        return response.ok
    } catch {
        return false
    }
}
