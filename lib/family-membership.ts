import { supabaseServer } from '@/lib/supabase'

export type FamilyChild = {
  id: string
  name: string
  avatar: string | null
  displayOrder: number
}

export async function loadFamilyChildren(guardianId: string): Promise<FamilyChild[]> {
  const { data: memberships, error: membershipError } = await supabaseServer
    .from('FamilyMembership')
    .select('childStudentId, displayOrder')
    .eq('guardianId', guardianId)
    .order('displayOrder', { ascending: true })

  if (membershipError) {
    console.error('Error loading family memberships:', membershipError)
    return []
  }

  if (!memberships?.length) return []

  const childIds = memberships.map((row) => row.childStudentId)
  const { data: users, error: usersError } = await supabaseServer
    .from('User')
    .select('id, name, avatar')
    .in('id', childIds)

  if (usersError) {
    console.error('Error loading family children:', usersError)
    return []
  }

  const userById = new Map((users || []).map((user) => [user.id, user]))

  return memberships
    .map((membership) => {
      const user = userById.get(membership.childStudentId)
      if (!user) return null
      return {
        id: String(user.id),
        name: String(user.name),
        avatar: user.avatar ?? null,
        displayOrder: membership.displayOrder ?? 0,
      }
    })
    .filter((child): child is FamilyChild => child !== null)
}

export async function isGuardianChildLinked(
  guardianId: string,
  childStudentId: string
): Promise<boolean> {
  const { data, error } = await supabaseServer
    .from('FamilyMembership')
    .select('id')
    .eq('guardianId', guardianId)
    .eq('childStudentId', childStudentId)
    .limit(1)

  if (error) {
    console.error('Error verifying family link:', error)
    return false
  }

  return Boolean(data?.length)
}
