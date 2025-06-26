import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})
export function setAuth(token: string, groupId?: string) {
  api.defaults.headers.common.Authorization = `Bearer ${token}`
  if (groupId) api.defaults.headers.common['x-group-id'] = groupId
}
