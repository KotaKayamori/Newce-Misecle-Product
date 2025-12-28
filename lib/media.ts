export const FALLBACK_VIDEO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01128128b91e4216be8e0f1e2eb76d3a-83Mcy3H53RYQLcX9JxsyxoLI9VHH8M.mp4"

const VIDEO_EXT_REGEX = /\.(mp4|mov|m4v|webm|ogg)$/i

export function derivePosterUrl(playbackUrl?: string | null, storagePath?: string | null): string | null {
  if (storagePath) {
    const posterPath = storagePath.replace(/\.[^.]+$/, ".webp")
    if (posterPath && posterPath !== storagePath) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
      if (base) {
        const objectPath = posterPath.replace(/^\/+/, "")
        return `${base}/storage/v1/object/public/videos/${objectPath}`
      }
    }
  }

  if (!playbackUrl) return null
  try {
    const url = new URL(playbackUrl)
    if (!VIDEO_EXT_REGEX.test(url.pathname)) return null
    url.pathname = url.pathname.replace(VIDEO_EXT_REGEX, ".webp")
    url.search = ""
    url.hash = ""
    return url.toString()
  } catch {
    const base = playbackUrl?.split?.("?")[0]
    if (base && VIDEO_EXT_REGEX.test(base)) {
      return base.replace(VIDEO_EXT_REGEX, ".webp")
    }
    return null
  }
}

export function deriveAlbumCoverUrl(coverPath?: string | null): string | null {
  if (!coverPath) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  if (!base) return null
  const objectPath = coverPath.replace(/^\/+/, "")
  return `${base}/storage/v1/object/public/photos/${objectPath}`
}
