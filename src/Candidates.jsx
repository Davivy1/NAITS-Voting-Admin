import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

function Candidates() {
  const [positions, setPositions] = useState([])
  const [candidatesByPosition, setCandidatesByPosition] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ position_id: '', full_name: '', level: '', manifesto: '' })
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    const { data: posData } = await supabase.from('positions').select('*').order('id')
    const { data: candData } = await supabase.from('candidates').select('*')

    const grouped = {}
    ;(candData || []).forEach((c) => {
      if (!grouped[c.position_id]) grouped[c.position_id] = []
      grouped[c.position_id].push(c)
    })

    setPositions(posData || [])
    setCandidatesByPosition(grouped)
    setLoading(false)
  }

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }
      await loadData()
    }
    checkAuthAndLoad()
  }, [navigate])

  async function handleAddCandidate(e) {
    e.preventDefault()
    setSaving(true)

    let photoUrl = ''

    // Upload photo to Supabase Storage if selected
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `candidates/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('candidate-photos')
        .upload(filePath, imageFile)

      if (uploadError) {
        alert('Error uploading image: ' + uploadError.message)
        setSaving(false)
        return
      }

      // Get public URL of uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('candidate-photos')
        .getPublicUrl(filePath)

      photoUrl = publicUrlData.publicUrl
    }

    const { error } = await supabase.from('candidates').insert({
      position_id: form.position_id,
      full_name: form.full_name,
      level: form.level,
      photo_url: photoUrl,
      manifesto: form.manifesto,
    })

    if (!error) {
      setForm({ position_id: '', full_name: '', level: '', manifesto: '' })
      setImageFile(null)
      setShowForm(false)
      await loadData()
    } else {
      alert('Error saving candidate: ' + error.message)
    }
    setSaving(false)
  }

  async function handleDelete(candidateId) {
    await supabase.from('candidates').delete().eq('id', candidateId)
    await loadData()
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-navy">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white px-6 py-10 max-w-2xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-accent text-sm mb-6">← Back to Dashboard</button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy">Manage Candidates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          {showForm ? 'Cancel' : '+ Add Candidate'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddCandidate} className="border border-gray-200 rounded-lg p-5 mb-8 space-y-3">
          <select
            required
            value={form.position_id}
            onChange={(e) => setForm({ ...form, position_id: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Select position</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <input
            required
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            required
            placeholder="Level (e.g. 300)"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />

          {/* Photo File Input */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Candidate Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 hover:file:bg-gray-200"
            />
          </div>

          <textarea
            placeholder="Manifesto"
            value={form.manifesto}
            onChange={(e) => setForm({ ...form, manifesto: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
          <button type="submit" disabled={saving} className="bg-accent text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50">
            {saving ? 'Uploading & Saving...' : 'Save Candidate'}
          </button>
        </form>
      )}

      <div className="space-y-6">
        {positions.map((pos) => (
          <div key={pos.id}>
            <h2 className="text-navy font-semibold mb-2">{pos.title}</h2>
            <div className="space-y-2">
              {(candidatesByPosition[pos.id] || []).map((c) => (
                <div key={c.id} className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-3">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.full_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                        No photo
                      </div>
                    )}
                    <div>
                      <p className="text-navy font-medium">{c.full_name}</p>
                      <p className="text-sm text-gray-500">{c.level} Level</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 text-sm">Delete</button>
                </div>
              ))}
              {!(candidatesByPosition[pos.id] || []).length && (
                <p className="text-sm text-gray-400">No candidates yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Candidates