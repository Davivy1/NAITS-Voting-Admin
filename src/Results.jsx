import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

function Results() {
  const [electionStatus, setElectionStatus] = useState(null)
  const [positions, setPositions] = useState([])
  const [resultsByPosition, setResultsByPosition] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      const { data: election } = await supabase
        .from('elections')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(1)
        .single()

      setElectionStatus(election?.status)

      const { data: posData } = await supabase.from('positions').select('*').order('id')
      const { data: resultsData } = await supabase.from('results').select('*')

      const grouped = {}
      ;(resultsData || []).forEach((r) => {
        if (!grouped[r.position_id]) grouped[r.position_id] = []
        grouped[r.position_id].push(r)
      })
      Object.keys(grouped).forEach((posId) => {
        grouped[posId].sort((a, b) => b.vote_count - a.vote_count)
      })

      setPositions(posData || [])
      setResultsByPosition(grouped)
      setLoading(false)
    }
    loadData()
  }, [navigate])

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-navy">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white px-6 py-10 max-w-2xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-accent text-sm mb-6">← Back to Dashboard</button>
      <h1 className="text-2xl font-bold text-navy mb-1">Election Results</h1>
      <p className="text-gray-500 mb-8">Status: <span className="font-semibold capitalize">{electionStatus}</span></p>

      <div className="space-y-8">
        {positions.map((pos) => {
          const candidates = resultsByPosition[pos.id] || []
          const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0)
          return (
            <div key={pos.id}>
              <h2 className="text-navy font-semibold mb-3">{pos.title}</h2>
              <div className="space-y-2">
                {candidates.length === 0 && (
                  <p className="text-sm text-gray-400">No votes yet.</p>
                )}
                {candidates.map((c, i) => {
                  const pct = totalVotes ? Math.round((c.vote_count / totalVotes) * 100) : 0
                  return (
                    <div key={c.candidate_id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-medium ${i === 0 ? 'text-accent' : 'text-navy'}`}>
                          {c.candidate_name} {i === 0 && '🏆'}
                        </span>
                        <span className="text-sm text-gray-500">{c.vote_count} votes ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${i === 0 ? 'bg-accent' : 'bg-gray-300'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Results