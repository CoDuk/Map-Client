import { api } from '@/apis/client'

export async function withdrawMe() {
  const res = await api.delete('/api/users/me', {
    headers: { Accept: 'application/json' },
  })

  return res.data
}