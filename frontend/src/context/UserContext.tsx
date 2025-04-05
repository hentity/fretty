import { createContext } from 'react'
import type { User } from 'firebase/auth'

export type UserContextType = {
  user: User | null
  loading: boolean
}

export const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
})
