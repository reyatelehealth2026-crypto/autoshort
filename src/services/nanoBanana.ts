import type { ReferenceImage } from '../types'

interface NanoBananaGenerateInput {
  prompt: string
  orientation: 'vertical' | 'horizontal' | 'square'
  references: ReferenceImage[]
}

interface NanoBananaGenerateResponse {
  imageDataUrl: string
  filePath?: string
  provider: 'nano-banana-pro'
}

export async function generateImageWithNanoBanana(input: NanoBananaGenerateInput): Promise<NanoBananaGenerateResponse> {
  const response = await fetch('http://localhost:3001/api/providers/nano-banana/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error || 'Nano Banana generation failed')
  }

  return data as NanoBananaGenerateResponse
}
