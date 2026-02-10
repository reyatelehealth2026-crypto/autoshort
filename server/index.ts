import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { z } from 'zod'

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

// ==================== Start Server ====================
console.log(`🚀 Shorts Factory API running on http://localhost:${PORT}`)
console.log(`📋 Endpoints:`)
console.log(`   POST /api/generate  - Generate script`)
console.log(`   POST /api/chat      - Chat with Director`)
console.log(`   POST /api/stream    - Stream generation`)
console.log(`   GET  /api/health    - Health check`)
console.log(`🔑 API Key: ${API_KEY ? 'configured' : 'not set (use x-api-key header)'}`)

serve({ fetch: app.fetch, port: PORT })
