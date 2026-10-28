/**
 * יצירת קובץ PDF מהדוח בתוך הדפדפן — בלי חלון הדפסה (שלא עובד באפליקציה מותקנת באנדרואיד).
 * הדף מצולם כתמונה (html-to-image משתמש במנוע של הדפדפן, אז העברית מוצגת נכון),
 * ונחתך לעמודי A4 בנקודות בטוחות — בין שורות בטבלה ובין חלקים — כדי לא לחתוך באמצע שורה.
 */
const A4 = { w: 210, h: 297 }
const MARGIN = 10 // מ״מ

export async function reportToPdf(el, fileName) {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')])

  // רוחב קבוע בזמן הצילום → תוצאה זהה בטלפון ובמחשב
  el.classList.add('pdf-capture')
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  try {
    const top = el.getBoundingClientRect().top
    const cssHeight = el.scrollHeight
    // נקודות חיתוך מותרות: תחתית של כל שורה / בלוק, ותחילת כל כותרת חלק
    const cuts = new Set([cssHeight])
    el.querySelectorAll('tr, .pdf-block, header, footer').forEach((n) => cuts.add(Math.round(n.getBoundingClientRect().bottom - top)))
    el.querySelectorAll('.report-section').forEach((n) => cuts.add(Math.round(n.getBoundingClientRect().top - top)))
    const cutList = [...cuts].sort((a, b) => a - b)

    const canvas = await toCanvas(el, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true })
    const ratio = canvas.width / el.offsetWidth // פיקסלים בקנבס לכל פיקסל CSS
    const contentW = A4.w - MARGIN * 2
    const pageCss = (el.offsetWidth * (A4.h - MARGIN * 2)) / contentW // גובה עמוד ביחידות CSS

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
    let start = 0
    let page = 0
    while (start < cssHeight - 2) {
      const limit = start + pageCss
      let end = cssHeight
      if (limit < cssHeight) {
        const safe = cutList.filter((c) => c > start + pageCss * 0.3 && c <= limit)
        end = safe.length ? safe[safe.length - 1] : limit
      }
      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = Math.max(1, Math.round((end - start) * ratio))
      const ctx = slice.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, slice.width, slice.height)
      ctx.drawImage(canvas, 0, Math.round(start * ratio), canvas.width, slice.height, 0, 0, slice.width, slice.height)
      if (page > 0) pdf.addPage()
      const hMm = ((end - start) / el.offsetWidth) * contentW
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN, MARGIN, contentW, hMm, undefined, 'FAST')
      pdf.setFontSize(8)
      pdf.setTextColor(150)
      pdf.text(`${page + 1}`, A4.w / 2, A4.h - 5, { align: 'center' })
      start = end
      page++
    }
    const blob = pdf.output('blob')
    return new File([blob], fileName, { type: 'application/pdf' })
  } finally {
    el.classList.remove('pdf-capture')
  }
}

/** שיתוף (וואטסאפ, מייל, Drive...) אם הטלפון תומך, אחרת הורדה */
export async function shareOrDownload(file, preferShare) {
  if (preferShare && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
  return 'downloaded'
}

export const canShareFiles = () => {
  try {
    return !!navigator.canShare?.({ files: [new File(['x'], 'x.pdf', { type: 'application/pdf' })] })
  } catch {
    return false
  }
}
