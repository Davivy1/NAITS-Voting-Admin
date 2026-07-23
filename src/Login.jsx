import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setStatus('❌ Invalid email or password.')
      return
    }

    // Confirm this user is actually in the admins table
    const { data: adminRow } = await supabase
      .from('admins')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!adminRow) {
      setStatus('❌ This account is not authorized as an admin.')
      await supabase.auth.signOut()
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-sm p-8">
        <img src="/logo.png" alt="FUTO NAITS" className="h-35 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-navy mb-6">Admin Login</h2>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button type="submit" className="w-full bg-accent text-white rounded-lg py-3 font-semibold hover:opacity-90">
          Log In
        </button>
        <p className="mt-4 text-sm text-gray-600">{status}</p>
      </form>
    </div>
  )
}

export default Login