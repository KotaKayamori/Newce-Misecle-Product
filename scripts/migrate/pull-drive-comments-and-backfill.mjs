// pull-drive-comments-and-backfill.mjs
// 目的: Google Drive のコメント本文を Supabase public.videos.caption に一括反映
// 実行例:
//   node scripts/migrate/pull-drive-comments-and-backfill.mjs
// 必要な環境変数:
//   GOOGLE_APPLICATION_CREDENTIALS=./keys/service-account.json
//   DRIVE_FOLDER_ID=... (対象フォルダID)
//   SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...
//   OWNER_UID=... (videos.owner_id に一致)
// 任意:
//   DRY_RUN=1  → 更新せずログのみ
//   LIMIT=100  → 先頭から N 件だけ処理

import 'dotenv/config'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const {
  DRIVE_FOLDER_ID,
  OWNER_UID,
  GOOGLE_APPLICATION_CREDENTIALS,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  DRY_RUN,
} = process.env

function ensure(name, val) {
  if (!val) throw new Error(`Missing env ${name}`)
}

ensure('DRIVE_FOLDER_ID', DRIVE_FOLDER_ID)
ensure('OWNER_UID', OWNER_UID)
ensure('GOOGLE_APPLICATION_CREDENTIALS', GOOGLE_APPLICATION_CREDENTIALS)
ensure('SUPABASE_URL', SUPABASE_URL)
ensure('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const auth = new google.auth.GoogleAuth({
  keyFile: GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})
const drive = google.drive({ version: 'v3', auth })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function listAllVideosRecursive(folderId) {
  const out = []
  async function walk(id) {
    let pageToken
    do {
      const { data } = await drive.files.list({
        q: `'${id}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id,name,mimeType,size,modifiedTime)',
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

async function getCaptionFromComments(fileId) {
  try {
    const res = await drive.comments.list({
      fileId,
      fields: 'comments(content,deleted,createdTime)',
      pageSize: 100,
    })
    const comments = res.data.comments ?? []
    for (const c of comments) {
      if (!c.deleted && c.content && c.content.trim()) {
        return c.content.replace(/\r?\n/g, '\n').trim()
      }
    }
    return null
  } catch (e) {
    // 権限やコメント無効などで 403/404 になり得る
    return null
  }
}

async function main() {
  console.log('[comments->captions] listing videos under folder:', DRIVE_FOLDER_ID)
  const files = await listAllVideosRecursive(DRIVE_FOLDER_ID)
  const LIMIT = Number(process.env.LIMIT || '0')
  const target = LIMIT > 0 ? files.slice(0, LIMIT) : files
  console.log(`[comments->captions] total videos: ${files.length}, processing: ${target.length}`)

  let updated = 0,
    skipped = 0,
    empty = 0

  for (let i = 0; i < target.length; i++) {
    const f = target[i]
    if (i && i % 10 === 0) await sleep(400) // 軽いレート制御

    const caption = await getCaptionFromComments(f.id)
    if (!caption) {
      empty++
      continue
    }

    const title = baseName(f.name)
    if (DRY_RUN) {
      console.log(`[dry-run] would update: title="${title}"`)
      updated++
      continue
    }

    try {
      const { data, error } = await supabase
        .from('videos')
        .update({ caption })
        .eq('owner_id', OWNER_UID)
        .eq('title', title)
        .is('caption', null)
        .select('id')

      if (error) {
        console.warn('[skip db error]:', f.name, error.message)
        skipped++
        continue
      }
      const cnt = (data ?? []).length
      if (cnt > 0) {
        updated += cnt
        console.log(`✓ updated: ${title} (${cnt})`)
      } else {
        skipped++ // マッチなし or 既にcaptionあり
      }
    } catch (e) {
      console.warn('[skip exception]:', f.name, e?.message || e)
      skipped++
    }
  }

  console.log('--- summary ---')
  console.log('updated:', updated)
  console.log('skipped (no match / has caption / db err):', skipped)
  console.log('no comments:', empty)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})

