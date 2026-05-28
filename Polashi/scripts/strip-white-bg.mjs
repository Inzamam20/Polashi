// One-off utility: read a PNG and write a new copy where near-white pixels
// become fully transparent. Used to clean up the team marker PNG that came
// with a white background.

import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'

const [, , inputPath, outputPath, thresholdArg] = process.argv
if (!inputPath || !outputPath) {
  console.error('Usage: node strip-white-bg.mjs <input.png> <output.png> [threshold=240]')
  process.exit(1)
}
const threshold = parseInt(thresholdArg, 10) || 240

const buf = fs.readFileSync(inputPath)
const png = PNG.sync.read(buf)

let stripped = 0
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2
    const r = png.data[idx]
    const g = png.data[idx + 1]
    const b = png.data[idx + 2]
    if (r >= threshold && g >= threshold && b >= threshold) {
      png.data[idx + 3] = 0
      stripped++
    }
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, PNG.sync.write(png))
console.log(`Stripped ${stripped} near-white pixels (threshold=${threshold})`)
console.log(`Wrote: ${outputPath}`)
