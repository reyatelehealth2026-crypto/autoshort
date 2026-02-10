import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { startPipeline, getJob, subscribeToJob, approveStep, retryStep } from './pipeline'
import * as leonardoProvider from './providers/leonardo'
import * as elevenlabsProvider from './providers/elevenlabs'
import * as klingProvider from './providers/kling'
import type { PipelineConfig, PipelineEvent, AllProviderConfigs } from './providers/types'

// ==================== Config ====================
const PORT = 3001
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-2.0-flash'

// In production, load from env vars
const API_KEY = process.env.GEMINI_API_KEY || ''

// ==================== Rate Limiting ====================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 30 // 30 requests per minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(ip)

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
        return true
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return false
    }

    entry.count++
    return true
}

// ==================== Zod Schemas ====================
const GenerateSchema = z.object({
    prompt: z.string().min(1).max(10000),
    model: z.string().default(DEFAULT_MODEL),
    temperature: z.number().min(0).max(2).default(0.85),
    maxOutputTokens: z.number().min(1).max(16384).default(8192),
    responseMimeType: z.string().optional(),
})

const ChatSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(z.object({
            text: z.string().optional(),
        }))
    })),
    systemInstruction: z.string().optional(),
    tools: z.any().optional(),
    model: z.string().default(DEFAULT_MODEL),
    temperature: z.number().min(0).max(2).default(0.8),
    maxOutputTokens: z.number().min(1).max(16384).default(1024),
})

const TrendsSchema = z.object({
    topic: z.string().min(1).max(500),
    model: z.string().default(DEFAULT_MODEL),
})

// ==================== Hono App ====================
const app = new Hono()

// CORS
app.use('*', cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
}))

// Rate limit middleware
app.use('/api/*', async (c, next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
        return c.json({ error: 'Rate limit exceeded. Try again in 1 minute.' }, 429)
    }
    await next()
})

// Health check
app.get('/api/health', (c) => {
    return c.json({ status: 'ok', model: DEFAULT_MODEL, hasKey: !!API_KEY })
})

// ==================== Generate Script ====================
app.post('/api/generate', async (c) => {
    const body = await c.req.json()
    const parsed = GenerateSchema.safeParse(body)

    if (!parsed.success) {
        return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
    }

    const { prompt, model, temperature, maxOutputTokens, responseMimeType } = parsed.data
    const key = API_KEY || c.req.header('x-api-key') || ''

    if (!key) {
        return c.json({ error: 'API key required. Set GEMINI_API_KEY env var or pass x-api-key header.' }, 401)
    }

    try {
        const response = await fetch(
            `${GEMINI_API_BASE}/${model}:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature,
                        maxOutputTokens,
                        ...(responseMimeType ? { responseMimeType } : {}),
                    }
                })
            }
        )

        const data = await response.json()
        if (!response.ok) {
            return c.json({ error: data?.error?.message || `Gemini API error: ${response.status}` }, response.status as any)
        }

        return c.json(data)
    } catch (err: any) {
        return c.json({ error: err.message || 'Internal server error' }, 500)
    }
})

// ==================== Chat with Director ====================
app.post('/api/chat', async (c) => {
    const body = await c.req.json()
    const parsed = ChatSchema.safeParse(body)

    if (!parsed.success) {
        return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
    }

    const { messages, systemInstruction, tools, model, temperature, maxOutputTokens } = parsed.data
    const key = API_KEY || c.req.header('x-api-key') || ''

    if (!key) {
        return c.json({ error: 'API key required' }, 401)
    }

    try {
        const requestBody: any = {
            contents: messages,
            generationConfig: { temperature, maxOutputTokens },
        }

        if (systemInstruction) {
            requestBody.system_instruction = { parts: [{ text: systemInstruction }] }
        }

        if (tools) {
            requestBody.tools = tools
        }

        const response = await fetch(
            `${GEMINI_API_BASE}/${model}:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        )

        const data = await response.json()
        if (!response.ok) {
            return c.json({ error: data?.error?.message || `Gemini API error: ${response.status}` }, response.status as any)
        }

        return c.json(data)
    } catch (err: any) {
        return c.json({ error: err.message || 'Internal server error' }, 500)
    }
})

// ==================== Stream Generate ====================
app.post('/api/stream', async (c) => {
    const body = await c.req.json()
    const parsed = GenerateSchema.safeParse(body)

    if (!parsed.success) {
        return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
    }

    const { prompt, model, temperature, maxOutputTokens } = parsed.data
    const key = API_KEY || c.req.header('x-api-key') || ''

    if (!key) {
        return c.json({ error: 'API key required' }, 401)
    }

    try {
        const response = await fetch(
            `${GEMINI_API_BASE}/${model}:streamGenerateContent?key=${key}&alt=sse`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature, maxOutputTokens }
                })
            }
        )

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            return c.json({ error: (err as any)?.error?.message || `HTTP ${response.status}` }, response.status)
        }

        // Stream through to client
        c.header('Content-Type', 'text/event-stream')
        c.header('Cache-Control', 'no-cache')
        c.header('Connection', 'keep-alive')

        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
            }
        })
    } catch (err: any) {
        return c.json({ error: err.message || 'Internal server error' }, 500)
    }
})

// ==================== Pipeline Schemas ====================
const PipelineStartSchema = z.object({
    topic: z.string().min(1),
    mode: z.enum(['full_auto', 'semi_auto']).default('semi_auto'),
    providers: z.object({
        image: z.enum(['leonardo', 'none']).default('leonardo'),
        voice: z.enum(['elevenlabs', 'none']).default('elevenlabs'),
        video: z.enum(['kling', 'leonardo_motion', 'none']).default('kling'),
    }),
    formData: z.object({
        genre: z.string().default('comedy'),
        orientation: z.string().default('vertical'),
        targetAudience: z.string().default('general'),
        duration: z.string().default('8sec'),
        tone: z.string().default('funny'),
        voice: z.string().default('thai-female'),
        music: z.string().default('upbeat'),
        artStyleName: z.string().default('Cinematic'),
        additionalInfo: z.string().optional(),
        negativePrompt: z.string().optional(),
    }),
    apiKeys: z.object({
        gemini: z.string().min(1),
        leonardo: z.string().optional(),
        elevenlabs: z.string().optional(),
        kling: z.string().optional(),
    }),
})

// ==================== Automation Pipeline ====================

// Start Pipeline
app.post('/api/pipeline/start', async (c) => {
    const body = await c.req.json()
    const parsed = PipelineStartSchema.safeParse(body)

    if (!parsed.success) {
        return c.json({ error: 'Validation error', details: parsed.error.issues }, 400)
    }

    const { topic, mode, providers, formData, apiKeys } = parsed.data

    const pipelineConfig: PipelineConfig = {
        topic,
        mode,
        providers,
        formData,
    }

    const providerConfigs: Partial<AllProviderConfigs> = {
        gemini: {
            apiKey: apiKeys.gemini,
            baseUrl: GEMINI_API_BASE,
            enabled: true,
        },
    }

    if (apiKeys.leonardo) {
        providerConfigs.leonardo = {
            apiKey: apiKeys.leonardo,
            baseUrl: 'https://cloud.leonardo.ai/api/rest/v1',
            enabled: true,
        }
    }

    if (apiKeys.elevenlabs) {
        providerConfigs.elevenlabs = {
            apiKey: apiKeys.elevenlabs,
            baseUrl: 'https://api.elevenlabs.io',
            enabled: true,
        }
    }

    if (apiKeys.kling) {
        providerConfigs.kling = {
            apiKey: apiKeys.kling,
            baseUrl: 'https://api.klingai.com',
            enabled: true,
        }
    }

    try {
        const job = await startPipeline(pipelineConfig, apiKeys.gemini, providerConfigs)
        return c.json({ success: true, jobId: job.id, status: job.status })
    } catch (err: any) {
        return c.json({ error: err.message || 'Failed to start pipeline' }, 500)
    }
})

// Get Pipeline Status
app.get('/api/pipeline/:id/status', (c) => {
    const jobId = c.req.param('id')
    const job = getJob(jobId)

    if (!job) {
        return c.json({ error: 'Job not found' }, 404)
    }

    return c.json({
        id: job.id,
        status: job.status,
        steps: job.steps,
        mediaOutputs: job.mediaOutputs,
        researchResult: job.researchResult,
        planResult: job.planResult,
        scriptResult: job.scriptResult,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
    })
})

// SSE Stream for real-time updates
app.get('/api/pipeline/:id/stream', (c) => {
    const jobId = c.req.param('id')
    const job = getJob(jobId)

    if (!job) {
        return c.json({ error: 'Job not found' }, 404)
    }

    return streamSSE(c, async (stream) => {
        // Send current state first
        await stream.writeSSE({
            data: JSON.stringify({
                type: 'initial_state',
                job: {
                    id: job.id,
                    status: job.status,
                    steps: job.steps,
                    mediaOutputs: job.mediaOutputs,
                    researchResult: job.researchResult,
                    planResult: job.planResult,
                    scriptResult: job.scriptResult,
                },
            }),
            event: 'message',
        })

        // Subscribe to future events
        const unsubscribe = subscribeToJob(jobId, async (event: PipelineEvent) => {
            try {
                await stream.writeSSE({
                    data: JSON.stringify(event),
                    event: 'message',
                })
            } catch {
                unsubscribe()
            }
        })

        // Keep connection alive
        const keepAlive = setInterval(async () => {
            try {
                await stream.writeSSE({ data: '', event: 'ping' })
            } catch {
                clearInterval(keepAlive)
                unsubscribe()
            }
        }, 15_000)

        // Wait for stream to close
        stream.onAbort(() => {
            clearInterval(keepAlive)
            unsubscribe()
        })

        // Keep stream open
        while (true) {
            const currentJob = getJob(jobId)
            if (!currentJob || currentJob.status === 'completed' || currentJob.status === 'error') {
                // Give a little time for final events to flush
                await new Promise(r => setTimeout(r, 2000))
                break
            }
            await new Promise(r => setTimeout(r, 1000))
        }

        clearInterval(keepAlive)
        unsubscribe()
    })
})

// Approve Step (for semi-auto mode)
app.post('/api/pipeline/:id/approve', async (c) => {
    const jobId = c.req.param('id')
    const body = await c.req.json()
    const { stepId } = body

    if (!stepId) {
        return c.json({ error: 'stepId is required' }, 400)
    }

    const success = approveStep(jobId, stepId)
    if (!success) {
        return c.json({ error: 'Step not found or not awaiting approval' }, 400)
    }

    return c.json({ success: true })
})

// Retry Step
app.post('/api/pipeline/:id/retry', async (c) => {
    const jobId = c.req.param('id')
    const body = await c.req.json()
    const { stepId, apiKeys } = body

    if (!stepId) {
        return c.json({ error: 'stepId is required' }, 400)
    }

    const geminiKey = apiKeys?.gemini || API_KEY
    const success = await retryStep(jobId, stepId, geminiKey, {})
    return c.json({ success })
})

// ==================== Provider Direct APIs ====================

// Leonardo: Generate Image
app.post('/api/providers/leonardo/generate', async (c) => {
    const body = await c.req.json()
    const { apiKey: providedKey, prompt, negativePrompt, width, height } = body
    const apiKey = providedKey || ''

    if (!apiKey) return c.json({ error: 'Leonardo API key required' }, 401)

    try {
        const result = await leonardoProvider.generateImageAndWait(
            { apiKey, baseUrl: 'https://cloud.leonardo.ai/api/rest/v1', enabled: true },
            { prompt, negativePrompt, width, height },
            1
        )
        return c.json(result)
    } catch (err: any) {
        return c.json({ error: err.message }, 500)
    }
})

// ElevenLabs: TTS
app.post('/api/providers/elevenlabs/tts', async (c) => {
    const body = await c.req.json()
    const { apiKey: providedKey, text, voiceId } = body
    const apiKey = providedKey || ''

    if (!apiKey) return c.json({ error: 'ElevenLabs API key required' }, 401)

    try {
        const result = await elevenlabsProvider.generateSpeech(
            { apiKey, baseUrl: 'https://api.elevenlabs.io', enabled: true },
            { text, voiceId }
        )
        return c.json(result)
    } catch (err: any) {
        return c.json({ error: err.message }, 500)
    }
})

// Kling: Video
app.post('/api/providers/kling/video', async (c) => {
    const body = await c.req.json()
    const { apiKey: providedKey, prompt, imageUrl, duration, aspectRatio } = body
    const apiKey = providedKey || ''

    if (!apiKey) return c.json({ error: 'Kling API key required' }, 401)

    try {
        const result = await klingProvider.generateVideoAndWait(
            { apiKey, baseUrl: 'https://api.klingai.com', enabled: true },
            { prompt, imageUrl, duration, aspectRatio },
            1
        )
        return c.json(result)
    } catch (err: any) {
        return c.json({ error: err.message }, 500)
    }
})

// Provider Health Check
app.post('/api/providers/status', async (c) => {
    const body = await c.req.json()
    const { apiKeys } = body
    const results: Record<string, boolean> = {}

    if (apiKeys?.leonardo) {
        results.leonardo = await leonardoProvider.checkConnection({
            apiKey: apiKeys.leonardo, baseUrl: 'https://cloud.leonardo.ai/api/rest/v1', enabled: true
        })
    }
    if (apiKeys?.elevenlabs) {
        results.elevenlabs = await elevenlabsProvider.checkConnection({
            apiKey: apiKeys.elevenlabs, baseUrl: 'https://api.elevenlabs.io', enabled: true
        })
    }
    if (apiKeys?.kling) {
        results.kling = await klingProvider.checkConnection({
            apiKey: apiKeys.kling, baseUrl: 'https://api.klingai.com', enabled: true
        })
    }

    return c.json({ providers: results })
})

// ==================== Webhook Callback ====================
app.post('/api/webhooks/leonardo', async (c) => {
    const body = await c.req.json()
    console.log('📩 Leonardo Webhook received:', JSON.stringify(body, null, 2))
    // Could be used to update job status in real-time without polling
    return c.json({ received: true })
})

// ==================== Start Server ====================
console.log(`🚀 Shorts Factory API running on http://localhost:${PORT}`)
console.log(`📋 Endpoints:`)
console.log(`   POST /api/generate        - Generate script`)
console.log(`   POST /api/chat            - Chat with Director`)
console.log(`   POST /api/stream          - Stream generation`)
console.log(`   GET  /api/health          - Health check`)
console.log(`   POST /api/pipeline/start  - Start automation pipeline`)
console.log(`   GET  /api/pipeline/:id/*  - Pipeline status/stream`)
console.log(`   POST /api/providers/*     - Direct provider APIs`)
console.log(`🔑 API Key: ${API_KEY ? 'configured' : 'not set (use x-api-key header)'}`)

serve({ fetch: app.fetch, port: PORT })
