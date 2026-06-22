import fs from 'fs'
import path from 'path'

export function getFamilyPhotos(): string[] {
  const dir = path.join(process.cwd(), 'public', 'images', 'family')

  try {
    return fs
      .readdirSync(dir)
      .filter((file) => /\.(jpe?g|png|webp|gif)$/i.test(file))
      .sort()
      .map((file) => `/images/family/${encodeURIComponent(file)}`)
  } catch {
    return []
  }
}
