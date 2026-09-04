import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FrenchVerbConjugationView from '@/components/FrenchVerbConjugationView'
import { ALLER_VERB } from '@/lib/french-verbs/aller'

export default async function FrenchAllerPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return <FrenchVerbConjugationView verb={ALLER_VERB} />
}
