import { redirect } from 'next/navigation'

export default async function Home() {
  // Redirect to login - session check happens client-side after login
  redirect('/login')
}


