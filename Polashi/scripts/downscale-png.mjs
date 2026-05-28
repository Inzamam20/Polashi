// Simple box-filter downscale for PNG.
// Usage: node downscale-png.mjs <in> <out> <newSize>

import { PNG } from 'pngjs'
import fs from 'node:fs'

const [, , inPath, outPath, sizeArg] = process.argv
const newSize = parseInt(sizeArg, 10) || 128

const src = PNG.sync.read(fs.readFileSync(inPath))
const sw = src.width, sh = src.height
const dst = new PNG({ width: newSize, height: newSize })
const dw = dst.width, dh = dst.height

const xRatio = sw / dw, yRatio = sh / dh
for (let dy = 0; dy < dh; dy++) {
  for (let dx = 0; dx < dw; dx++) {
    const sx0 = Math.floor(dx * xRatio)
    const sy0 = Math.floor(dy * yRatio)
    const sx1 = Math.min(sw, Math.floor((dx + 1) * xRatio))
    const sy1 = Math.min(sh, Math.floor((dy + 1) * yRatio))
    let r = 0, g = 0, b = 0, a = 0, n = 0
    for (let sy = sy0; sy < sy1; sy++) {
      for (let sx = sx0; sx < sx1; sx++) {
        const si = (sw * sy + sx) << 2
        const sa = src.data[si + 3]
        // Weight RGB by alpha so transparent pixels don't smudge edges
        const w = sa / 255
        r += src.data[si]     * w
        g += src.data[si + 1] * w
        b += src.data[si + 2] * w
        a += sa
        n++
      }
    }
    const di = (dw * dy + dx) << 2
    const totalA = a / 255  // total alpha weight
    if (totalA > 0) {
      dst.data[di]     = Math.round(r / totalA)
      dst.data[di + 1] = Math.round(g / totalA)
      dst.data[di + 2] = Math.round(b / totalA)
    }
    dst.data[di + 3] = Math.round(a / n)
  }
}
fs.writeFileSync(outPath, PNG.sync.write(dst))
console.log(`Downscaled to ${newSize}x${newSize}: ${outPath}`)
