// list-drive.mjs — List Google Drive videos under a folder (recursive)
// Usage: node list-drive.mjs
// Requires env: DRIVE_FOLDER_ID, GOOGLE_APPLICATION_CREDENTIALS

import 'dotenv/config'
import { google } from 'googleapis'

const FOLDER_ID = process.env.DRIVE_FOLDER_ID
const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS

if (!FOLDER_ID) {
  console.error('Missing env DRIVE_FOLDER_ID')
  process.exit(1)
}
if (!KEY_FILE) {
  console.error('Missing env GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)')
  process.exit(1)
}

async function listAll(drive, folderId) {
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

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  const drive = google.drive({ version: 'v3', auth })

  console.log('Listing videos under folder:', FOLDER_ID)
  const files = await listAll(drive, FOLDER_ID)
  console.log('Found files:', files.length)
  for (const f of files.slice(0, 50)) {
    console.log('-', f.name, '|', f.mimeType, '|', f.size || 'size?')
  }
}

main().catch((e) => {
  console.error('Error:', e?.message || e)
  process.exit(1)
})

