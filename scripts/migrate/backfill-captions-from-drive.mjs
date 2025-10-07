// Backfill captions in public.videos from Google Drive file descriptions
// Usage: node scripts/migrate/backfill-captions-from-drive.mjs
// Requires env:
//   GOOGLE_APPLICATION_CREDENTIALS, DRIVE_FOLDER_ID
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OWNER_UID
// Notes:
//   - Matches videos by title === Drive file base name (without extension) and owner_id === OWNER_UID
//   - Only writes caption when Drive has description; existing non-null captions are left as-is

import 'dotenv/config'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const {
  GOOGLE_APPLICATION_CREDENTIALS,
  DRIVE_FOLDER_ID,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  OWNER_UID,
} = process.env

function ensure(name, val) {
  if (!val) throw new Error(`Missing env ${name}`)
}

ensure('GOOGLE_APPLICATION_CREDENTIALS', GOOGLE_APPLICATION_CREDENTIALS)
ensure('DRIVE_FOLDER_ID', DRIVE_FOLDER_ID)
ensure('SUPABASE_URL', SUPABASE_URL)
ensure('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY)
ensure('OWNER_UID', OWNER_UID)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function listAll(drive, folderId) {
  const out = []
  async function walk(id) {
    let pageToken
    do {
      const { data } = await drive.files.list({
        q: `'${id}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id,name,mimeType,description)',
        pageSize: 1000,
        pageToken,
      })
      for (const f of data.files ?? []) {
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

function baseName(name = '') {
  return name.replace(/\.[^.]+$/, '')
}

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  const drive = google.drive({ version: 'v3', auth })

  console.log('[captions] Listing Drive files...')
  const files = await listAll(drive, DRIVE_FOLDER_ID)
  const withDesc = files.filter((f) => (f.description || '').trim().length > 0)
  console.log(`[captions] Found ${files.length} videos, ${withDesc.length} with descriptions`)

  let updated = 0
  for (const f of withDesc) {
    const title = baseName(f.name)
    const caption = f.description.trim()
    try {
      const { data, error } = await supabase
        .from('videos')
        .update({ caption })
        .eq('owner_id', OWNER_UID)
        .eq('title', title)
        .is('caption', null)
        .select('id')
      if (error) throw error
      if ((data ?? []).length > 0) {
        updated += (data ?? []).length
        console.log(`[captions] Updated: ${title}`)
      }
    } catch (e) {
      console.warn(`[captions] Failed to update ${title}:`, e?.message || e)
    }
  }

  console.log(`[captions] Done. Updated ${updated} rows.`)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})

