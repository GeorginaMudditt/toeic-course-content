import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FrenchVerbConjugationView from '@/components/FrenchVerbConjugationView'
import { ETRE_VERB } from '@/lib/french-verbs/etre'

export default async function FrenchEtrePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return <FrenchVerbConjugationView verb={ETRE_VERB} />
}
