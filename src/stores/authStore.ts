import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Profile } from '@/types/database'

interface ProfileWithSlug extends Profile {
  tenant_slug?: string
}

interface AuthState {
  profile: ProfileWithSlug | null
  isLoading: boolean
  setProfile: (profile: ProfileWithSlug | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      isLoading: true,
      setProfile: (profile) => set({ profile, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ profile: null, isLoading: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
