/**
 * Recorte para canvas (react-easy-crop) e compressão para data URL do logo.
 */

export function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

export async function getCroppedImgDataUrl(imageSrc, pixelCrop, mimeType = 'image/jpeg', quality = 0.92) {
  const image = await createImage(imageSrc)
  const sx = Math.round(pixelCrop.x)
  const sy = Math.round(pixelCrop.y)
  const sw = Math.max(1, Math.round(pixelCrop.width))
  const sh = Math.max(1, Math.round(pixelCrop.height))
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = sw
  canvas.height = sh
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvas.toDataURL(mimeType, quality)
}

/** Recorte quadrado com máscara circular (PNG com fundo transparente). */
export async function getCroppedImgCircularDataUrl(imageSrc, pixelCrop, mimeType = 'image/png', quality = 0.92) {
  const image = await createImage(imageSrc)
  const sw = Math.max(1, Math.round(pixelCrop.width))
  const sh = Math.max(1, Math.round(pixelCrop.height))
  const size = Math.min(sw, sh)
  const sx = Math.round(pixelCrop.x + (sw - size) / 2)
  const sy = Math.round(pixelCrop.y + (sh - size) / 2)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(image, sx, sy, size, size, 0, 0, size, size)
  ctx.restore()
  return canvas.toDataURL(mimeType, quality)
}

export async function downscaleDataUrl(dataUrl, maxSide, mimeType = 'image/jpeg', quality = 0.88) {
  const image = await createImage(dataUrl)
  const { width, height } = image
  const maxDim = Math.max(width, height)
  if (maxDim <= maxSide) return dataUrl
  const scale = maxSide / maxDim
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (mimeType === 'image/png') {
    ctx.clearRect(0, 0, w, h)
  }
  ctx.drawImage(image, 0, 0, w, h)
  return canvas.toDataURL(mimeType, quality)
}

function estimateDataUrlBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1] || ''
  return Math.ceil((base64.length * 3) / 4)
}

async function compressToMaxBytes(dataUrl, maxBytes, mimeType) {
  const isPng = mimeType === 'image/png'
  let quality = isPng ? 0.92 : 0.85

  while (estimateDataUrlBytes(dataUrl) > maxBytes && quality > (isPng ? 0.5 : 0.5)) {
    const image = await createImage(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    if (isPng) ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0)
    dataUrl = canvas.toDataURL(mimeType, quality)
    quality -= isPng ? 0.08 : 0.07
  }

  let maxSide = isPng ? 512 : 560
  while (estimateDataUrlBytes(dataUrl) > maxBytes && maxSide >= 200) {
    dataUrl = await downscaleDataUrl(dataUrl, maxSide, mimeType, isPng ? 0.85 : 0.8)
    maxSide -= 80
  }

  if (estimateDataUrlBytes(dataUrl) > maxBytes) {
    throw new Error(
      'A imagem ainda ficou grande demais. Tente um recorte menor ou mais zoom na área desejada.'
    )
  }
  return dataUrl
}

/**
 * Gera data URL final do logo dentro do limite de bytes.
 * @param {{ circular?: boolean }} options — circular: PNG com máscara redonda (avatar/ícone).
 */
export async function finalizeLogoDataUrl(imageSrc, pixelCrop, maxBytes, options = {}) {
  const circular = Boolean(options.circular)
  const mimeType = circular ? 'image/png' : 'image/jpeg'
  const maxSide = circular ? 512 : 640

  let dataUrl = circular
    ? await getCroppedImgCircularDataUrl(imageSrc, pixelCrop, mimeType, 0.92)
    : await getCroppedImgDataUrl(imageSrc, pixelCrop, mimeType, 0.9)

  dataUrl = await downscaleDataUrl(dataUrl, maxSide, mimeType, circular ? 0.9 : 0.88)
  return compressToMaxBytes(dataUrl, maxBytes, mimeType)
}
