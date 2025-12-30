import { redirect } from 'next/navigation'

export default async function Home() {
  // Temporarily redirect to login without checking session to avoid auth initialization errors
  redirect('/login')
}


