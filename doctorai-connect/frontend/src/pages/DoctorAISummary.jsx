import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function DoctorAISummary() {
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch patients directly - the backend will handle authentication
    console.log('DoctorAISummary: Fetching patients...')
    api.get('/api/patients')
      .then(r => {
        console.log('DoctorAISummary: Patients loaded:', r.data.patients)
        setPatients(r.data.patients || [])
      })
      .catch(err => {
        console.error('DoctorAISummary: Failed to fetch patients:', err.response?.status, err.response?.data)
        setPatients([])
      })
  }, [])

  const generateSummary = async () => {
    if (!selectedPatient) return

    setLoading(true)
    setSummary('')
    try {
      const response = await api.post(`/api/patients/${selectedPatient}/ai-summary`)
      setSummary(response.data.summary)
    } catch (error) {
      console.error('Failed to generate summary:', error)
      setSummary('Error generating summary. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      // You could add a toast notification here if desired
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-[90vw] mx-auto">
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark-100 mb-2">AI Patient Summary</h1>
              <p className="text-dark-300">Generate comprehensive medical summaries powered by AI</p>
            </div>

            <div className="space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Select Patient {patients.length > 0 && `(${patients.length} available)`}
                </label>
                <select
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500"
                  value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Choose a patient</option>
                  {patients.length === 0 ? (
                    <option disabled style={{ backgroundColor: '#1e293b', color: '#64748b' }}>No patients available</option>
                  ) : (
                    patients.map(patient => (
                      <option key={patient.id} value={patient.id} style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>
                        {patient.full_name} (DOB: {patient.dob})
                      </option>
                    ))
                  )}
                </select>
                {patients.length === 0 && (
                  <p className="text-sm text-dark-400 mt-2">No patients found. Make sure you're logged in as a doctor.</p>
                )}
              </div>

              {/* Generate Button */}
              <div>
                <button
                  onClick={generateSummary}
                  disabled={loading || !selectedPatient}
                  className="btn-primary px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Summary...
                    </div>
                  ) : (
                    'Generate Summary'
                  )}
                </button>
              </div>

              {/* Summary Display */}
              {summary && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-dark-100">AI Summary</h3>
                    <button
                      onClick={copyToClipboard}
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                  <div className="bg-dark-800/30 border border-dark-700/50 rounded-xl p-6 min-h-[300px]">
                    <div className="text-sm text-dark-200 leading-relaxed" dangerouslySetInnerHTML={{__html: summary}} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 pb-6">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-dark-400">
            Built for a hackathon demo with Cloudflare Workers, D1, and Workers AI.
          </p>
        </div>
      </footer>
    </div>
  )
}
