import type { FormData, ScriptJsonOutput } from '../types'

export type QASeverity = 'error' | 'warn'

export interface QAFlag {
  code: string
  severity: QASeverity
  message: string
  evidence?: string[]
  suggestion?: string
}

export interface QAResult {
  score: number
  flags: QAFlag[]
  passed: boolean
}

const HARD_BLOCK_PATTERNS: Array<{ code: string; regex: RegExp; message: string }> = [
  { code: 'CLAIM_ABSOLUTE_MEDICAL', regex: /(หายขาด|การันตีผล|รับรองผลชัวร์)/i, message: 'มีคำกล่าวอ้างเกินจริงเชิงการแพทย์/ผลลัพธ์แน่นอน' },
  { code: 'CLAIM_ABSOLUTE_FINANCE', regex: /(กำไรแน่นอน|รวยชัวร์|ไม่มีทางขาดทุน)/i, message: 'มีคำกล่าวอ้างการเงินแบบรับประกันผล' },
  { code: 'RISKY_PLATFORM_LANGUAGE', regex: /(ปั่นวิว|โกงระบบ|บอทปั๊ม|ปั๊มฟอล)/i, message: 'พบถ้อยคำเสี่ยงต่อ policy แพลตฟอร์ม' },
]

const WARN_PATTERNS: Array<{ code: string; regex: RegExp; message: string; penalty: number }> = [
  { code: 'SPAM_CTA_OVERUSE', regex: /(กดไลก์|แชร์|ติดตาม).*(กดไลก์|แชร์|ติดตาม).*(กดไลก์|แชร์|ติดตาม)/i, message: 'CTA ซ้ำ/ถี่เกินไป', penalty: 10 },
  { code: 'OVERHYPE_WORDING', regex: /(ด่วน!!|ช็อก|ห้ามพลาด|100%)/i, message: 'ภาษา hype เกินจำเป็น', penalty: 8 },
]

function collectText(output: ScriptJsonOutput): string {
  const sceneText = output.scenes.map((s) => `${s.audio.dialogue} ${s.imagePrompt}`).join(' ')
  const summary = `${output.summary.hook} ${output.summary.callToAction}`
  return `${output.rawScript} ${sceneText} ${summary}`
}

export function validateScriptOutput(formData: FormData, output: ScriptJsonOutput): QAResult {
  const flags: QAFlag[] = []
  const text = collectText(output)
  let score = 100

  for (const p of HARD_BLOCK_PATTERNS) {
    const match = text.match(p.regex)
    if (match) {
      flags.push({
        code: p.code,
        severity: 'error',
        message: p.message,
        evidence: [match[0]],
        suggestion: 'ปรับถ้อยคำเป็นเชิงให้ข้อมูล ไม่การันตีผลลัพธ์',
      })
    }
  }

  for (const p of WARN_PATTERNS) {
    const match = text.match(p.regex)
    if (match) {
      score -= p.penalty
      flags.push({
        code: p.code,
        severity: 'warn',
        message: p.message,
        evidence: [match[0]],
      })
    }
  }

  const hashtags = output.summary.suggestedHashtags || []
  if (hashtags.length > 6) {
    score -= 8
    flags.push({
      code: 'HASHTAG_SPAM',
      severity: 'warn',
      message: 'Hashtag เยอะเกินไป (แนะนำ 3-6)',
      suggestion: 'ลดให้เหลือไม่เกิน 6 และเกี่ยวข้องกับเนื้อหา',
    })
  }

  if (!formData.topic || !text.toLowerCase().includes(formData.topic.toLowerCase().slice(0, 4))) {
    score -= 12
    flags.push({
      code: 'CONSISTENCY_TOPIC_DRIFT',
      severity: 'warn',
      message: 'เนื้อหาอาจหลุดจาก topic หลัก',
    })
  }

  if (!output.scenes?.length || !output.scenes[0]?.audio?.dialogue) {
    score -= 30
    flags.push({ code: 'SCHEMA_MISSING_FIELDS', severity: 'error', message: 'ข้อมูลฉากไม่ครบ' })
  }

  if (flags.some((f) => f.severity === 'error')) {
    return { score: 0, flags, passed: false }
  }

  score = Math.max(0, Math.min(100, score))
  const passed = score >= 85
  return { score, flags, passed }
}
