import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function DoctorAISummary() {
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/patients').then(r => setPatients(r.data.patients || [])).catch(()=>{})
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl p-6 shadow">
        <h1 className="text-2xl font-semibold mb-6">AI Patient Summary</h1>

        <div className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedPatient}
              onChange={e => setSelectedPatient(e.target.value)}
            >
              <option value="">Choose a patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name} (DOB: {patient.dob})
                </option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <div>
            <button
              onClick={generateSummary}
              disabled={loading || !selectedPatient}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating Summary...' : 'Generate Summary'}
            </button>
          </div>

          {/* Summary Display */}
          {summary && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">AI Summary</h3>
                <button
                  onClick={copyToClipboard}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded border"
                >
                  Copy
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border border-gray-200 min-h-[200px]">
                {summary}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
