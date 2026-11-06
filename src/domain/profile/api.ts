import { http } from '@/lib/http'
import {
  profile,
  type ChangePasswordRequest,
  type Profile,
  type UpdateProfileRequest,
} from './schema'

export async function getProfile(signal?: AbortSignal): Promise<Profile> {
  const { data } = await http.get('/profile', { signal })
  return profile.parse(data)
}

export async function updateProfile(body: UpdateProfileRequest): Promise<Profile> {
  const { data } = await http.patch('/profile', body)
  return profile.parse(data)
}

export async function uploadAvatar(file: File): Promise<Profile> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await http.put('/profile/avatar', form)
  return profile.parse(data)
}

export async function removeAvatar(): Promise<void> {
  await http.delete('/profile/avatar')
}

export async function changePassword(body: ChangePasswordRequest): Promise<void> {
  await http.put('/profile/password', body)
}
