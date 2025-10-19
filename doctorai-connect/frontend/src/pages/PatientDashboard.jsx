import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function PatientDashboard({ user }) {
  const [me, setMe] = useState(user)
  const [detail, setDetail] = useState(null)
  const [ai, setAi] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        // If user prop is provided, use it; otherwise fetch from API
        if (user) {
          setMe(user)
        } else {
          const userResponse = await api.get('/api/me')
          setMe(userResponse.data.user)
        }
        
        // Get the current user (either from prop or API)
        const currentUser = user || (await api.get('/api/me')).data.user
        
        if (currentUser?.patientId) {
          const patientResponse = await api.get(`/api/patients/${currentUser.patientId}`)
          setDetail(patientResponse.data)
        }
      } catch (error) {
        console.error('Failed to load patient data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadPatientData()
  }, [user])

  const summarize = async () => {
    if (!me?.patientId) return
    
    setAi('Loading summary...')
    try {
      const r = await api.post(`/api/patients/${me.patientId}/ai-summary`)
      setAi(r.data.summary)
    } catch (error) {
      console.error('Failed to generate summary:', error)
      setAi('Error generating summary. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading your medical records...</p>
        </div>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <p className="text-red-400">Please log in to view your medical records.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="glass-card mx-6 mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Welcome, {me.name}</h1>
            <p className="text-dark-300">View your medical records and appointment history</p>
          </div>
          <div className="bg-gradient-to-br from-brand-500/20 to-brand-600/20 rounded-full p-4 border border-brand-500/30">
            <span className="text-2xl">👤</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        {!detail ? (
          <div className="glass-card p-8 text-center">
            <div className="text-6xl mb-4 opacity-50">📋</div>
            <p className="text-dark-400 text-lg">No medical records found</p>
            <p className="text-dark-500 text-sm mt-2">Contact your healthcare provider to add your records</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Patient Info Card */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-dark-100">Patient Information</h2>
                <div className="text-sm text-dark-400">Patient ID: {detail.patient.id}</div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-dark-400">Full Name:</span>
                  <p className="text-dark-100 font-medium">{detail.patient.full_name}</p>
                </div>
                <div>
                  <span className="text-sm text-dark-400">Date of Birth:</span>
                  <p className="text-dark-100 font-medium">{detail.patient.dob}</p>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Medical History & Appointments
              </h3>
              <div className="space-y-3">
                {(detail.appointments||[]).length === 0 ? (
                  <p className="text-sm text-dark-400 p-4 bg-dark-800/30 rounded-lg">No appointments on record</p>
                ) : (
                  (detail.appointments||[]).map(a=>(
                    <div key={a.id} className="bg-dark-800/30 border border-dark-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-semibold text-dark-100">{a.date}</div>
                        <div className="text-xs text-dark-400">Dr. {a.doctor_name}</div>
                      </div>
                      {a.notes && (
                        <div className="text-sm text-dark-300 mb-2">
                          <span className="font-medium">Notes:</span> {a.notes}
                        </div>
                      )}
                      <div className="flex gap-2 text-xs">
                        {a.medications && (
                          <span className="bg-brand-500/20 text-brand-300 px-2 py-1 rounded-md border border-brand-500/30">
                            💊 {a.medications}
                          </span>
                        )}
                        {a.allergies && (
                          <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded-md border border-orange-500/30">
                            ⚠️ {a.allergies}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Summary Section */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Medical Summary
              </h3>
              <button 
                onClick={summarize} 
                disabled={ai === 'Loading summary...'}
                className="btn-primary mb-4"
              >
                {ai === 'Loading summary...' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Summary...
                  </div>
                ) : (
                  'Generate AI Summary'
                )}
              </button>
              <div className="bg-dark-800/30 border border-dark-700/50 rounded-lg p-4 min-h-[150px]">
                {ai ? (
                  <div className="text-sm text-dark-200 leading-relaxed" dangerouslySetInnerHTML={{__html: ai}} />
                ) : (
                  <p className="text-sm text-dark-400 italic">Click "Generate AI Summary" to create a comprehensive medical summary of your records.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 pb-6">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-dark-400">
            Your medical records are secure and private. Contact your healthcare provider for any questions.
          </p>
        </div>
      </footer>
    </div>
  )
}
