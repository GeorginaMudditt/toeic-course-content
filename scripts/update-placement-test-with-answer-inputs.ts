import { supabaseServer } from '../lib/supabase'
import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('Updating Placement Test resource with answer inputs while preserving URLs...')

  // Read the new HTML template with answer inputs
  const htmlPath = join(process.cwd(), 'resources', 'placement-test-html.html')
  let newHtml: string
  try {
    newHtml = readFileSync(htmlPath, 'utf-8')
  } catch (error) {
    console.log('❌ Could not read file: resources/placement-test-html.html')
    process.exit(1)
  }

  // Find the Placement Test resource
  const { data: resources, error: findError } = await supabaseServer
    .from('Resource')
    .select('id, title, content')
    .ilike('title', '%Placement Test%')

  if (findError) {
    console.error('❌ Error finding resource:', findError.message)
    process.exit(1)
  }

  if (!resources || resources.length === 0) {
    console.log('❌ Placement Test resource not found in database.')
    return
  }

  const resource = resources[0]
  const oldHtml = resource.content || ''

  console.log('Found resource:', resource.title)
  console.log('Old HTML length:', oldHtml.length)
  console.log('New HTML length:', newHtml.length)

  // Extract URLs from old HTML using regex patterns
  const urlPatterns = {
    image1: /src="([^"]*IMAGE_URL_1[^"]*|https?:\/\/[^"]*)"[^>]*alt="Photograph 1"/i,
    image2: /src="([^"]*IMAGE_URL_2[^"]*|https?:\/\/[^"]*)"[^>]*alt="Photograph 2"/i,
    audioPL11: /src="([^"]*AUDIO_URL_PL_1_1[^"]*|https?:\/\/[^"]*PL-1\.1[^"]*|https?:\/\/[^"]*PL_1_1[^"]*)"[^>]*/i,
    audioPL12: /src="([^"]*AUDIO_URL_PL_1_2[^"]*|https?:\/\/[^"]*PL-1\.2[^"]*|https?:\/\/[^"]*PL_1_2[^"]*)"[^>]*/i,
    audioPL21: /src="([^"]*AUDIO_URL_PL_2_1[^"]*|https?:\/\/[^"]*PL-2\.1[^"]*|https?:\/\/[^"]*PL_2_1[^"]*)"[^>]*/i,
    audioPL22: /src="([^"]*AUDIO_URL_PL_2_2[^"]*|https?:\/\/[^"]*PL-2\.2[^"]*|https?:\/\/[^"]*PL_2_2[^"]*)"[^>]*/i,
  }

  // Try to extract URLs from old HTML
  const extractUrl = (pattern: RegExp, oldHtml: string): string | null => {
    // First try to find actual URLs (not placeholders)
    const urlMatch = oldHtml.match(/https?:\/\/[^"'\s]+/g)
    if (urlMatch) {
      // Look for URLs that might match our pattern
      for (const url of urlMatch) {
        if (pattern.source.includes('IMAGE_URL_1') && url.includes('image') || url.includes('photo') || url.includes('photograph')) {
          // Check if it's for image 1 or 2 by context
          const context = oldHtml.substring(Math.max(0, oldHtml.indexOf(url) - 200), oldHtml.indexOf(url) + 200)
          if (pattern.source.includes('IMAGE_URL_1') && (context.includes('Photograph 1') || context.includes('1.'))) {
            return url
          }
          if (pattern.source.includes('IMAGE_URL_2') && (context.includes('Photograph 2') || context.includes('2.'))) {
            return url
          }
        }
        if (pattern.source.includes('AUDIO_URL') && url.includes('audio') || url.includes('PL-')) {
          if (pattern.source.includes('PL_1_1') && url.includes('PL-1.1') || url.includes('PL_1_1')) return url
          if (pattern.source.includes('PL_1_2') && url.includes('PL-1.2') || url.includes('PL_1_2')) return url
          if (pattern.source.includes('PL_2_1') && url.includes('PL-2.1') || url.includes('PL_2_1')) return url
          if (pattern.source.includes('PL_2_2') && url.includes('PL-2.2') || url.includes('PL_2_2')) return url
        }
      }
    }
    return null
  }

  // Better approach: search for actual URLs in the old HTML by looking for the audio/image tags
  const findImageUrl = (oldHtml: string, imageNumber: number): string | null => {
    const imageSection = oldHtml.match(new RegExp(`Photograph ${imageNumber}[\\s\\S]{0,500}?<img[^>]*src="([^"]+)"`, 'i'))
    if (imageSection && imageSection[1] && !imageSection[1].includes('IMAGE_URL')) {
      return imageSection[1]
    }
    return null
  }

  const findAudioUrl = (oldHtml: string, audioCode: string): string | null => {
    // Look for audio tag near the audio code text
    const audioSection = oldHtml.match(new RegExp(`${audioCode}[\\s\\S]{0,500}?<source[^>]*src="([^"]+)"`, 'i'))
    if (audioSection && audioSection[1] && !audioSection[1].includes('AUDIO_URL')) {
      return audioSection[1]
    }
    // Also try audio tag directly
    const audioTag = oldHtml.match(new RegExp(`<audio[^>]*>\\s*<source[^>]*src="([^"]*${audioCode.replace(/\./g, '[._]')}[^"]*)"`, 'i'))
    if (audioTag && audioTag[1] && !audioTag[1].includes('AUDIO_URL')) {
      return audioTag[1]
    }
    return null
  }

  // Extract URLs from old HTML
  const image1Url = findImageUrl(oldHtml, 1)
  const image2Url = findImageUrl(oldHtml, 2)
  const audioPL11Url = findAudioUrl(oldHtml, 'PL-1.1') || findAudioUrl(oldHtml, 'PL_1_1')
  const audioPL12Url = findAudioUrl(oldHtml, 'PL-1.2') || findAudioUrl(oldHtml, 'PL_1_2')
  const audioPL21Url = findAudioUrl(oldHtml, 'PL-2.1') || findAudioUrl(oldHtml, 'PL_2_1')
  const audioPL22Url = findAudioUrl(oldHtml, 'PL-2.2') || findAudioUrl(oldHtml, 'PL_2_2')

  console.log('\nExtracted URLs:')
  console.log('Image 1:', image1Url || 'NOT FOUND')
  console.log('Image 2:', image2Url || 'NOT FOUND')
  console.log('Audio PL-1.1:', audioPL11Url || 'NOT FOUND')
  console.log('Audio PL-1.2:', audioPL12Url || 'NOT FOUND')
  console.log('Audio PL-2.1:', audioPL21Url || 'NOT FOUND')
  console.log('Audio PL-2.2:', audioPL22Url || 'NOT FOUND')

  // Replace placeholders in new HTML with actual URLs
  let updatedHtml = newHtml
  if (image1Url) {
    updatedHtml = updatedHtml.replace(/src="IMAGE_URL_1"/g, `src="${image1Url}"`)
  }
  if (image2Url) {
    updatedHtml = updatedHtml.replace(/src="IMAGE_URL_2"/g, `src="${image2Url}"`)
  }
  if (audioPL11Url) {
    updatedHtml = updatedHtml.replace(/src="AUDIO_URL_PL_1_1"/g, `src="${audioPL11Url}"`)
  }
  if (audioPL12Url) {
    updatedHtml = updatedHtml.replace(/src="AUDIO_URL_PL_1_2"/g, `src="${audioPL12Url}"`)
  }
  if (audioPL21Url) {
    updatedHtml = updatedHtml.replace(/src="AUDIO_URL_PL_2_1"/g, `src="${audioPL21Url}"`)
  }
  if (audioPL22Url) {
    updatedHtml = updatedHtml.replace(/src="AUDIO_URL_PL_2_2"/g, `src="${audioPL22Url}"`)
  }

  // Update the resource
  const { data: updated, error: updateError } = await supabaseServer
    .from('Resource')
    .update({ content: updatedHtml })
    .eq('id', resource.id)
    .select()
    .single()

  if (updateError) {
    console.error('❌ Error updating resource:', updateError.message)
    process.exit(1)
  }

  console.log('\n✅ Successfully updated Placement Test resource!')
  console.log(`   Resource ID: ${updated.id}`)
  console.log(`   Title: ${updated.title}`)
  console.log(`   Content length: ${updatedHtml.length} characters`)
  console.log('\n⚠️  Please verify the images and audio files are working correctly.')
}

main()
  .catch((e) => {
    console.error('Error updating resource:', e)
    process.exit(1)
  })
