import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

function Roster() {
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      const { data } = await supabase
        .from('roster')
        .select('*')
        .order('matric_no')

      setRoster(data || [])
      setLoading(false)
    }
    checkAuthAndLoad()
  }, [navigate])

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-navy">Loading...</div>
  }

  const filtered = roster.filter((r) => {
    if (filter === 'registered') return r.is_registered
    if (filter === 'unregistered') return !r.is_registered
    return true
  })

  const registeredCount = roster.filter((r) => r.is_registered).length

  return (
    <div className="min-h-screen bg-white px-6 py-10 max-w-2xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-accent text-sm mb-6">← Back to Dashboard</button>
      <h1 className="text-2xl font-bold text-navy mb-1">Student Roster</h1>
      <button onClick={() => navigate('/roster/upload')} className="text-accent text-sm mb-6 block">+ Bulk upload CSV →</button>
      <p className="text-gray-500 mb-6">{registeredCount} of {roster.length} registered</p>

      <div className="flex gap-2 mb-6">
        {['all', 'registered', 'unregistered'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              filter === f ? 'bg-accent text-white' : 'border border-gray-300 text-navy'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((r) => (
          <div key={r.matric_no} className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-navy font-medium">{r.full_name}</p>
              <p className="text-sm text-gray-500">{r.matric_no} · {r.level} Level</p>
            </div>
            {r.is_registered ? (
              <span className="text-accent text-sm font-semibold">Registered</span>
            ) : (
              <span className="text-gray-400 text-sm">Not registered</span>
            )}
          </div>
        ))}
        {!filtered.length && <p className="text-sm text-gray-400">No students match this filter.</p>}
      </div>
    </div>
  )
}

export default Roster