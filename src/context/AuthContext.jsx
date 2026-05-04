import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*, schools(name)').eq('id', userId).single()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email, password, fullName, schoolName, role = 'admin') => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }

    if (role === 'admin') {
      const { data: school } = await supabase.from('schools').insert({ name: schoolName }).select().single()
      await supabase.from('profiles').insert({
        id: data.user.id,
        school_id: school.id,
        full_name: fullName,
        role: 'admin'
      })
    } else {
      const { data: adminProfile } = await supabase.from('profiles').select('school_id').eq('role', 'admin').single()
      await supabase.from('profiles').insert({
        id: data.user.id,
        school_id: adminProfile.school_id,
        full_name: fullName,
        role: role
      })
    }
    return { error: null }
  }

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
