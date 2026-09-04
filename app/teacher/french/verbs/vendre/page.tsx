import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FrenchVerbConjugationView from '@/components/FrenchVerbConjugationView'
import { VENDRE_VERB } from '@/lib/french-verbs/vendre'

export default async function FrenchVendrePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return <FrenchVerbConjugationView verb={VENDRE_VERB} />
}
