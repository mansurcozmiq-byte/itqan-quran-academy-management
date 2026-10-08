import { sb } from './supabase'

/** Upload file to Supabase Storage. Returns public URL or null. */
export async function uploadFile(bucket, path, file) {
  const { error } = await sb.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (error) {
    console.error('Upload error:', error.message)
    throw new Error(error.message)
  }
  const { data } = sb.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl || null
}

export async function uploadPhoto(studentId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${studentId}/photo.${ext}`
  return uploadFile('photos', path, file)
}

export async function uploadDocument(studentId, file, title) {
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase()
  const safe = (title || 'doc').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
  const path = `${studentId}/${Date.now()}_${safe}.${ext}`
  return uploadFile('documents', path, file)
}

/** Build WhatsApp fee reminder link */
export function whatsappReminder(s, dueMonthsList, amount) {
  const phone = (s.whatsapp || s.mobile || '').replace(/[^0-9]/g, '')
  if (!phone) return null
  // Bangladesh: ensure country code 880
  let num = phone
  if (num.startsWith('0')) num = '880' + num.slice(1)
  else if (!num.startsWith('880')) num = '880' + num
  const months = (dueMonthsList || []).slice(-3).join(', ')
  const msg = encodeURIComponent(
    `Assalamu Alaikum.\n\nItqan Quran Academy\n\nStudent: ${s.name} (${s.adm_no})\nDue months: ${months || '—'}${amount ? `\nAmount: ${amount} BDT` : ''}\n\nPlease pay the pending fee at your earliest convenience.\nJazakAllah Khair.`
  )
  return `https://wa.me/${num}?text=${msg}`
}
