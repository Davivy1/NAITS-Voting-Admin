import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const [election, setElection] = useState(null)
  const [totalStudents, setTotalStudents] = useState(0)
  const [votedStudents, setVotedStudents] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/')
        return
      }

      const { data: electionData } = await supabase
        .from('elections')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(1)
        .single()

      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      const { data: votes } = await supabase
        .from('votes')
        .select('student_id')

      const uniqueVoters = new Set((votes || []).map(v => v.student_id)).size

      setElection(electionData)
      setTotalStudents(studentCount || 0)
      setVotedStudents(uniqueVoters)
      setLoading(false)
    }
    loadData()
  }, [navigate])

  async function toggleElectionStatus(newStatus) {
    setUpdating(true)
    const { error } = await supabase
      .from('elections')
      .update({ status: newStatus })
      .eq('id', election.id)

    if (!error) {
      setElection({ ...election, status: newStatus })
    }
    setUpdating(false)
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-navy">Loading...</div>
  }

  const turnoutPct = totalStudents ? Math.round((votedStudents / totalStudents) * 100) : 0

  return (
    <div className="min-h-screen bg-white px-6 py-10 max-w-2xl mx-auto">
      <img src="/logo.png" alt="FUTO NAITS" className="h-14 mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-navy mb-1">{election?.title}</h1>
      <button onClick={async () => { await supabase.auth.signOut(); navigate('/') }} className="text-sm text-gray-500 mb-6 block">
        Log out
      </button>
      <p className="text-gray-500 mb-8">Status: <span className="font-semibold capitalize">{election?.status}</span></p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-navy">{totalStudents}</p>
          <p className="text-sm text-gray-500">Registered</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-navy">{votedStudents}</p>
          <p className="text-sm text-gray-500">Voted</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-accent">{turnoutPct}%</p>
          <p className="text-sm text-gray-500">Turnout</p>
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        {election?.status !== 'active' && (
          <button
            onClick={() => toggleElectionStatus('active')}
            disabled={updating}
            className="bg-accent text-white px-5 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            Open Voting
          </button>
        )}
        {election?.status === 'active' && (
          <button
            onClick={() => toggleElectionStatus('closed')}
            disabled={updating}
            className="bg-red-600 text-white px-5 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            Close Voting
          </button>
        )}
      </div>

      <div className="space-y-2">
        <button onClick={() => navigate('/candidates')} className="w-full text-left border border-gray-200 rounded-lg px-5 py-4 text-navy font-medium">
          Manage Candidates →
        </button>
        <button onClick={() => navigate('/roster')} className="w-full text-left border border-gray-200 rounded-lg px-5 py-4 text-navy font-medium">
          View Roster →
        </button>
      </div>
    </div>
  )
}

export default Dashboard