'use client'

import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import FamilyVocabularyNavbar from '@/components/FamilyVocabularyNavbar'

export default function VocabularyNav() {
  const { data: session } = useSession()
  if (session?.user?.role === 'GUARDIAN') {
    return <FamilyVocabularyNavbar />
  }
  return <Navbar />
}
