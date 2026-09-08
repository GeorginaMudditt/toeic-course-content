import { supabaseServer } from '@/lib/supabase'
import { FRENCH_XAVIER_RESOURCES } from '@/lib/french-content'

export const XAVIER_STORAGE_BUCKET = 'resources'
export const XAVIER_MANIFEST_PATH = 'french/xavier/manifest.json'

export type XavierResource = {
  id: string
  title: string
  description: string
  file_url: string
  file_path: string
  created_at: string
}

function seedResources(): XavierResource[] {
  return FRENCH_XAVIER_RESOURCES.map((resource, index) => ({
    id: `seed-${index + 1}`,
    title: resource.title,
    description: resource.description,
    file_url: resource.href,
    file_path: '',
    created_at: `2026-09-0${index + 1}T12:00:00.000Z`,
  }))
}

export async function loadXavierResources(): Promise<XavierResource[]> {
  const { data, error } = await supabaseServer.storage
    .from(XAVIER_STORAGE_BUCKET)
    .download(XAVIER_MANIFEST_PATH)

  if (error || !data) {
    return seedResources()
  }

  try {
    const parsed = JSON.parse(await data.text()) as { resources?: XavierResource[] }
    if (!Array.isArray(parsed.resources)) return seedResources()
    return parsed.resources.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.file_url === 'string'
    )
  } catch {
    return seedResources()
  }
}

export async function saveXavierResources(resources: XavierResource[]): Promise<void> {
  const body = JSON.stringify({ resources }, null, 2)
  const { error } = await supabaseServer.storage
    .from(XAVIER_STORAGE_BUCKET)
    .upload(XAVIER_MANIFEST_PATH, body, {
      contentType: 'application/json',
      upsert: true,
    })

  if (error) {
    throw error
  }
}
