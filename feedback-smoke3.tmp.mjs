import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const outDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const pngBuf = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000a49444154789c6360000002000155a4b3c00000000049454e44ae426082', 'hex')
const tinyPngPath = path.join(outDir, 'tiny.png')
fs.writeFileSync(tinyPngPath, pngBuf)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })

const presignCalls = []
const s3PutCalls = []
page.on('request', (req) => {
  if (req.url().includes('/api/uploads/presigned-url')) presignCalls.push(Date.now())
  if (req.url().includes('amazonaws.com') && req.method() === 'PUT') s3PutCalls.push(Date.now())
})
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
await page.locator('button:has-text("Feedback")').first().click()
await page.locator('text=Share Your Feedback').waitFor({ state: 'visible' })

// ── Step A: select a file. Must NOT trigger any network call. ──
await page.locator('input[type="file"]').setInputFiles(tinyPngPath)
await page.waitForTimeout(1500)
console.log('presign calls after selecting (expect 0):', presignCalls.length)
console.log('s3 PUT calls after selecting (expect 0):', s3PutCalls.length)
const cardStatus = await page.locator('li:has-text("tiny.png")').innerText()
console.log('card status right after selection:', JSON.stringify(cardStatus))

// ── Step B: remove it. Still must never have uploaded anything. ──
await page.locator('button[aria-label^="Remove"]').click()
await page.waitForTimeout(300)
console.log('presign calls after remove (expect 0):', presignCalls.length)

// ── Step C: re-select, then fill form and submit — NOW it should upload. ──
await page.locator('input[type="file"]').setInputFiles(tinyPngPath)
await page.waitForTimeout(200)
await page.locator('text=Bug Report').first().click()
await page.locator('#fn-feedback-message').fill('Transactional upload flow smoke test.')

console.log('presign calls before Send Feedback click (expect 0):', presignCalls.length)
await page.locator('button:has-text("Send Feedback")').click()
await page.waitForTimeout(4000)
console.log('presign calls after clicking Send Feedback (expect 1):', presignCalls.length)
console.log('s3 PUT calls after clicking Send Feedback (expect 1):', s3PutCalls.length)

await page.screenshot({ path: path.join(outDir, 'after-submit.png') })
console.log('page errors:', JSON.stringify(errors))

await browser.close()
