export function parseYouTube(url = '') {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/))([\w-]{11})/)
  return m?.[1] ?? null
}

export function detectMediaType(url = '') {
  if (!url) return ''
  if (parseYouTube(url)) return 'youtube'
  if (url.startsWith('data:video') || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)) return 'video'
  return 'image'
}

/** מקטין תמונה ל-JPEG קטן (לשמירה מקומית או העלאה מהירה) */
export function compressImage(file, maxSize = 720, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('compress failed'))), 'image/jpeg', quality)
    }
    img.onerror = reject
    img.src = objectUrl
  })
}

export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
