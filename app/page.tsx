import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: users, error } = await supabase.from('User').select()

  if (error) {
    return <p>Error loading users: {error.message}</p>
  }

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.username ?? `${user.firstname} ${user.lastname}`}</li>
      ))}
    </ul>
  )
}
