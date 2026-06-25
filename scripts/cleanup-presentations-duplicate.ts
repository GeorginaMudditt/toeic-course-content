import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const dryRun = process.argv.includes('--dry-run')

function isVocabPresentations(resource: { title: string; skill?: string | null }) {
  const title = resource.title.toLowerCase()
  return (
    (title.includes('presentations') && title.includes('vocabulary')) ||
    resource.title === 'Presentations Vocabulary' ||
    resource.title === 'Vocabulary: Presentations'
  )
}

function isSpeakingPresentations(resource: { title: string; skill?: string | null }) {
  const title = resource.title.toLowerCase()
  return (
    title.includes('presentations') &&
    (title.includes('speaking') || resource.skill === 'SPEAKING')
  )
}

async function main() {
  const { supabaseServer } = await import('../lib/supabase')

  const { data: resources, error } = await supabaseServer
    .from('Resource')
    .select('id, title, skill, level')
    .ilike('title', '%Presentations%')
    .order('title')

  if (error) {
    console.error('Error fetching resources:', error.message)
    process.exit(1)
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Presentations resources in database:`)
  for (const resource of resources || []) {
    const { data: assignments } = await supabaseServer
      .from('Assignment')
      .select('id, enrollmentId')
      .eq('resourceId', resource.id)

    console.log(
      `- ${resource.title} [${resource.skill}/${resource.level}] id=${resource.id} assignments=${assignments?.length ?? 0}`,
    )
  }

  const vocabResource = (resources || []).find(isVocabPresentations)
  const speakingResource = (resources || []).find(isSpeakingPresentations)

  if (!vocabResource) {
    console.log('\nNo vocabulary Presentations duplicate found. Nothing to do.')
    return
  }

  if (!speakingResource) {
    console.error('\nCould not find PRO Speaking Presentations resource to keep. Aborting.')
    process.exit(1)
  }

  if (vocabResource.id === speakingResource.id) {
    console.log('\nOnly one Presentations resource found. Nothing to do.')
    return
  }

  const { data: vocabAssignments, error: assignmentsError } = await supabaseServer
    .from('Assignment')
    .select('id, enrollmentId, resourceId')
    .eq('resourceId', vocabResource.id)

  if (assignmentsError) {
    console.error('Error checking assignments:', assignmentsError.message)
    process.exit(1)
  }

  if (vocabAssignments && vocabAssignments.length > 0) {
    console.log(`\nProcessing ${vocabAssignments.length} assignment(s) on "${vocabResource.title}"...`)

    for (const assignment of vocabAssignments) {
      const { data: existingSpeakingAssignment } = await supabaseServer
        .from('Assignment')
        .select('id')
        .eq('enrollmentId', assignment.enrollmentId)
        .eq('resourceId', speakingResource.id)
        .maybeSingle()

      if (existingSpeakingAssignment) {
        console.log(
          `  Enrollment ${assignment.enrollmentId} already has speaking resource; removing duplicate assignment ${assignment.id}`,
        )
        if (!dryRun) {
          const { error: deleteProgressError } = await supabaseServer
            .from('Progress')
            .delete()
            .eq('assignmentId', assignment.id)

          if (deleteProgressError) {
            console.error('Failed to delete progress for duplicate assignment:', deleteProgressError.message)
            process.exit(1)
          }

          const { error: deleteAssignmentError } = await supabaseServer
            .from('Assignment')
            .delete()
            .eq('id', assignment.id)

          if (deleteAssignmentError) {
            console.error('Failed to delete duplicate assignment:', deleteAssignmentError.message)
            process.exit(1)
          }
        }
        continue
      }

      console.log(`  Reassigning assignment ${assignment.id} to "${speakingResource.title}"`)
      if (!dryRun) {
        const { error: reassignError } = await supabaseServer
          .from('Assignment')
          .update({ resourceId: speakingResource.id })
          .eq('id', assignment.id)

        if (reassignError) {
          console.error(`Failed to reassign assignment ${assignment.id}:`, reassignError.message)
          process.exit(1)
        }
      }
    }
  }

  const { count: remainingAssignments, error: remainingError } = await supabaseServer
    .from('Assignment')
    .select('id', { count: 'exact', head: true })
    .eq('resourceId', vocabResource.id)

  if (remainingError) {
    console.error('Error checking remaining assignments:', remainingError.message)
    process.exit(1)
  }

  if ((remainingAssignments ?? 0) > 0) {
    console.log(
      `\n${remainingAssignments} assignment(s) still linked to "${vocabResource.title}". Renaming resource instead of deleting.`,
    )
    if (!dryRun) {
      const { error: renameError } = await supabaseServer
        .from('Resource')
        .update({
          title: speakingResource.title,
          skill: 'SPEAKING',
          level: speakingResource.level,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', vocabResource.id)

      if (renameError) {
        console.error('Failed to rename vocabulary resource:', renameError.message)
        process.exit(1)
      }
    }
    console.log(`✅ Renamed "${vocabResource.title}" → "${speakingResource.title}"`)
    return
  }

  console.log(`\nDeleting duplicate resource: "${vocabResource.title}"`)
  if (!dryRun) {
    const { error: deleteError } = await supabaseServer
      .from('Resource')
      .delete()
      .eq('id', vocabResource.id)

    if (deleteError) {
      console.error('Failed to delete vocabulary resource:', deleteError.message)
      process.exit(1)
    }
  }

  console.log('✅ Duplicate vocabulary Presentations resource removed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
