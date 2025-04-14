import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'

export type UserContextType = {
  user: User | null
  loading: boolean
}

export const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
})

export const useAuth = () => {
    const context = useContext(UserContext);
    if (!context) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
  };