import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FrenchVerbConjugationView from '@/components/FrenchVerbConjugationView'
import { PARLER_VERB } from '@/lib/french-verbs/parler'

export default async function FrenchParlerPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return <FrenchVerbConjugationView verb={PARLER_VERB} />
}
