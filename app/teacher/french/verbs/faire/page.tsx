import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FrenchVerbConjugationView from '@/components/FrenchVerbConjugationView'
import { FAIRE_VERB } from '@/lib/french-verbs/faire'

export default async function FrenchFairePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return <FrenchVerbConjugationView verb={FAIRE_VERB} />
}
