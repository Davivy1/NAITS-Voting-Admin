import { useState } from 'react'
import Papa from 'papaparse'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

function RosterUpload() {
  const [preview, setPreview] = useState([])
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // expects columns: matric_no, full_name, level
        const cleaned = results.data
          .map((row) => ({
            matric_no: (row.matric_no || '').trim(),
            full_name: (row.full_name || '').trim(),
            level: (row.level || '').trim(),
            department: (row.department || 'Information Technology').trim(),
            is_registered: false,
          }))
          .filter((row) => row.matric_no && row.full_name)

        setPreview(cleaned)
      },
    })
  }

  async function handleUpload() {
    setUploading(true)
    setProgress(`Uploading 0 of ${preview.length}...`)

    const BATCH_SIZE = 500
    let successCount = 0
    let errorRows = []

    for (let i = 0; i < preview.length; i += BATCH_SIZE) {
      const batch = preview.slice(i, i + BATCH_SIZE)

      const { error } = await supabase
        .from('roster')
        .upsert(batch, { onConflict: 'matric_no', ignoreDuplicates: true })

      if (error) {
        errorRows.push({ batchStart: i, message: error.message })
      } else {
        successCount += batch.length
      }

      setProgress(`Uploading ${Math.min(i + BATCH_SIZE, preview.length)} of ${preview.length}...`)
    }

    setResult({ successCount, errorRows })
    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-white px-6 py-10 max-w-2xl mx-auto">
      <button onClick={() => navigate('/roster')} className="text-accent text-sm mb-6">← Back to Roster</button>
      <h1 className="text-2xl font-bold text-navy mb-2">Bulk Upload Roster</h1>
      <p className="text-gray-500 mb-6">
        CSV must have columns: <span className="font-mono text-sm">matric_no, full_name, level</span> (optional: <span className="font-mono text-sm">department</span>)
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="mb-6 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-gray-100 hover:file:bg-gray-200"
      />

      {preview.length > 0 && (
        <>
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-navy font-semibold mb-2">{fileName}</p>
            <p className="text-sm text-gray-600 mb-3">{preview.length} valid rows found. Preview of first 5:</p>
            <div className="space-y-1">
              {preview.slice(0, 5).map((r, i) => (
                <p key={i} className="text-sm text-gray-500 font-mono">
                  {r.matric_no} — {r.full_name} — {r.level}L
                </p>
              ))}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-accent text-white px-5 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {uploading ? progress : `Upload ${preview.length} Students`}
          </button>
        </>
      )}

      {result && (
        <div className="mt-6 border border-gray-200 rounded-lg p-4">
          <p className="text-accent font-semibold">✅ {result.successCount} students uploaded successfully.</p>
          {result.errorRows.length > 0 && (
            <div className="mt-2">
              <p className="text-red-600 text-sm font-semibold">{result.errorRows.length} batch(es) failed:</p>
              {result.errorRows.map((e, i) => (
                <p key={i} className="text-sm text-red-500">Batch at row {e.batchStart}: {e.message}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RosterUpload