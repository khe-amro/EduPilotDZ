const https = require('https')
const fs = require('fs')
const path = require('path')

const FONTS_DIR = path.join(__dirname, '..', 'src', 'renderer', 'assets', 'fonts')
if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true })

// Stable woff2 Google Fonts URLs for Playfair Display
const PLAYFAIR_FONTS = [
  {
    url: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2',
    filename: 'PlayfairDisplay-Regular.woff2',
  },
  {
    url: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiunDXbtM.woff2',
    filename: 'PlayfairDisplay-SemiBold.woff2',
  },
  {
    url: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeFvnDXbtM.woff2',
    filename: 'PlayfairDisplay-Bold.woff2',
  },
]

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`  ✓ Already exists: ${path.basename(dest)}`)
      return resolve()
    }
    const file = fs.createWriteStream(dest)
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close()
          fs.unlinkSync(dest)
          return downloadFile(res.headers.location, dest).then(resolve).catch(reject)
        }
        if (res.statusCode !== 200) {
          file.close()
          fs.unlinkSync(dest)
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        }
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          console.log(`  ✓ Downloaded: ${path.basename(dest)}`)
          resolve()
        })
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {})
        reject(err)
      })
  })
}

async function main() {
  console.log('Fetching Playfair Display offline woff2 fonts...')
  for (const font of PLAYFAIR_FONTS) {
    const dest = path.join(FONTS_DIR, font.filename)
    try {
      await downloadFile(font.url, dest)
    } catch (err) {
      console.warn(`  ! Could not download ${font.filename} via primary URL: ${err.message}`)
      // Try fallback URL from jsdelivr/fontsource
      const fallbackUrl = `https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-${font.filename.includes('Bold') ? '700' : font.filename.includes('SemiBold') ? '600' : '400'}-normal.woff2`
      try {
        console.log(`  -> Trying fallback URL: ${fallbackUrl}`)
        await downloadFile(fallbackUrl, dest)
      } catch (err2) {
        console.error(`  ✗ Fallback failed: ${err2.message}`)
      }
    }
  }
  console.log('Playfair fonts check complete.')
}

main()
