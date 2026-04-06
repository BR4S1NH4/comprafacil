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
  canvas.getContext('2d').drawImage(image, 0, 0, w, h)
  return canvas.toDataURL(mimeType, quality)
}

/**
 * Gera data URL final do logo dentro do limite (base64 ~1.37× bytes).
 */
export async function finalizeLogoDataUrl(imageSrc, pixelCrop, maxBytes) {
  let dataUrl = await getCroppedImgDataUrl(imageSrc, pixelCrop, 'image/jpeg', 0.9)
  dataUrl = await downscaleDataUrl(dataUrl, 640, 'image/jpeg', 0.88)

  let quality = 0.85
  while (dataUrl.length > maxBytes * 1.37 && quality > 0.5) {
    const image = await createImage(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    canvas.getContext('2d').drawImage(image, 0, 0)
    dataUrl = canvas.toDataURL('image/jpeg', quality)
    quality -= 0.07
  }

  let maxSide = 560
  while (dataUrl.length > maxBytes * 1.37 && maxSide >= 240) {
    dataUrl = await downscaleDataUrl(dataUrl, maxSide, 'image/jpeg', 0.8)
    maxSide -= 80
  }

  if (dataUrl.length > maxBytes * 1.37) {
    throw new Error(
      'A imagem ainda ficou grande demais. Tente um recorte menor ou mais zoom na área desejada.'
    )
  }
  return dataUrl
}
