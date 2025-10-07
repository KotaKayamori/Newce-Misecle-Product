// One-off migrator: Google Drive folder -> Supabase Storage + public.videos
// Usage:
//   node scripts/migrate/drive-to-supabase.mjs \
//     --folder <DRIVE_FOLDER_ID> \
//     --owner <SUPABASE_USER_UUID> \
//     [--map ./metadata.json] \
//     [--concurrency 3]
//
// Env vars required:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
//
// Notes:
// - Share the Drive folder (viewer) with the service account email.
// - metadata.json (optional): [{ fileId?, name?, title?, caption?, owner_id? }, ...]
// - Path format: videos/<owner_id>/<yyyy>/<mm>/<uuid>.<ext>

import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

function getArg(flag, fallback = undefined) {
  const i = process.argv.indexOf(flag)
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1]
  return fallback
}

const FOLDER_ID = getArg('--folder') || process.env.DRIVE_FOLDER_ID
const DEFAULT_OWNER = getArg('--owner') || process.env.OWNER_UID
const MAP_PATH = getArg('--map')
const CONCURRENCY = Number(getArg('--concurrency', '2')) || 2

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS

if (!FOLDER_ID) throw new Error('Missing --folder <DRIVE_FOLDER_ID>')
if (!DEFAULT_OWNER) throw new Error('Missing --owner <SUPABASE_USER_UUID>')
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
}
if (!GOOGLE_APPLICATION_CREDENTIALS || !fs.existsSync(GOOGLE_APPLICATION_CREDENTIALS)) {
  throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS env var or file not found')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const auth = new google.auth.GoogleAuth({
  keyFile: GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})
const drive = google.drive({ version: 'v3', auth })

let metaIndex = []
if (MAP_PATH) {
  const raw = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8'))
  if (Array.isArray(raw)) metaIndex = raw
}

function lookupMeta(file) {
  const byId = metaIndex.find((m) => m.fileId === file.id)
  if (byId) return byId
  const byName = metaIndex.find((m) => m.name && file.name && m.name === file.name)
  return byName || {}
}

function extFromNameOrMime(name = '', mime = '') {
  const fromName = name.split('.').pop()?.toLowerCase()
  if (fromName && /^(mp4|mov|m4v|webm|ogg)$/.test(fromName)) return fromName
  const map = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-m4v': 'm4v',
    'video/webm': 'webm',
    'video/ogg': 'ogg',
  }
  return map[mime?.toLowerCase()] || 'mp4'
}

async function listAll(folderId) {
  const out = []
  async function walk(fid) {
    let pageToken = undefined
    do {
      const { data } = await drive.files.list({
        q: `'${fid}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime)',
        pageSize: 1000,
        pageToken,
      })
      for (const f of data.files || []) {
        if (f.mimeType === 'application/vnd.google-apps.folder') {
          await walk(f.id)
        } else if ((f.mimeType || '').startsWith('video/')) {
          out.push(f)
        }
      }
      pageToken = data.nextPageToken
    } while (pageToken)
  }
  await walk(folderId)
  return out
}

async function downloadBuffer(fileId) {
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })
  return Buffer.from(res.data)
}

function yyyymm(d = new Date()) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return { yyyy, mm }
}

async function processOne(file) {
  const meta = lookupMeta(file)
  const owner = meta.owner_id || DEFAULT_OWNER
  const title = meta.title || (file.name ? file.name.replace(/\.[^.]+$/, '') : null)
  const caption = meta.caption || null
  const ext = extFromNameOrMime(file.name, file.mimeType)
  const { yyyy, mm } = yyyymm(file.modifiedTime ? new Date(file.modifiedTime) : new Date())
  const key = `${owner}/${yyyy}/${mm}/${crypto.randomUUID()}.${ext}`

  console.log(`[drive->supabase] downloading ${file.name} (${file.id}) ...`)
  const buf = await downloadBuffer(file.id)

  console.log(`[drive->supabase] uploading ${key} (${buf.length} bytes) ...`)
  const { error: upErr } = await supabase.storage
    .from('videos')
    .upload(key, buf, { contentType: file.mimeType || 'video/mp4', cacheControl: '31536000', upsert: false })
  if (upErr) {
    if (String(upErr.message || '').toLowerCase().includes('duplicate')) {
      console.warn(`upload duplicate, continue: ${key}`)
    } else {
      throw upErr
    }
  }

  const { data: pub } = supabase.storage.from('videos').getPublicUrl(key)
  const playbackUrl = pub.publicUrl

  console.log(`[drive->supabase] insert videos row ...`)
  const { error: insErr } = await supabase.from('videos').insert({
    owner_id: owner,
    playback_url: playbackUrl,
    storage_path: key,
    title,
    caption,
  })
  if (insErr) {
    const msg = String(insErr.message || '')
    if (!msg.toLowerCase().includes('duplicate')) throw insErr
  }
}

async function main() {
  console.log(`[drive->supabase] listing files in folder ${FOLDER_ID} ...`)
  const files = await listAll(FOLDER_ID)
  if (!files.length) {
    console.log('No video files found. Exiting.')
    return
  }
  console.log(`Found ${files.length} video files.`)

  const batches = []
  for (let i = 0; i < files.length; i += CONCURRENCY) batches.push(files.slice(i, i + CONCURRENCY))

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi]
    console.log(`Processing batch ${bi + 1}/${batches.length} (${batch.length} files) ...`)
    await Promise.all(
      batch.map(async (f) => {
        try {
          await processOne(f)
        } catch (e) {
          console.warn(`Failed for ${f.name} (${f.id}):`, e?.message || e)
        }
      }),
    )
  }

  console.log('Done.')
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
