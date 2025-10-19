import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [ai, setAi] = useState('')
  const [form, setForm] = useState({ date: '', notes: '', medications: '', allergies: '' })
  const [msg, setMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    api.get('/api/patients').then(r => setPatients(r.data.patients || [])).catch(()=>{})
  }, [])

  const load = async (id) => {
    setSelected(id)
    const r = await api.get(`/api/patients/${id}`)
    setDetail(r.data)
    setAi('')
  }

  const addAppt = async () => {
    if (!selected || !form.date) return
    await api.post('/api/appointments', { patient_id: selected, ...form })
    setMsg('Appointment added')
    await load(selected)
    setForm({ date: '', notes: '', medications: '', allergies: '' })
    setTimeout(()=>setMsg(''), 1500)
  }

  const summarize = async () => {
    setAi('Loading summary...')
    try {
      console.log('Requesting AI summary for patient:', selected)
      const r = await api.post(`/api/patients/${selected}/ai-summary`)
      console.log('AI response:', r.data)
      setAi(r.data.summary || 'No summary generated.')
    } catch (error) {
      console.error('AI summary error:', error)
      setAi(`Error: ${error.response?.data?.error || error.message || 'Failed to generate summary'}`)
    }
  }

  // Filter patients based on search term
  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dob.includes(searchTerm)
  )

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="font-semibold mb-3">Patients</h2>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg 
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-xs text-gray-500 mt-1">
              Found {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ul className="space-y-2">
          {filteredPatients.length === 0 ? (
            <li className="text-center py-8">
              <p className="text-gray-400 text-sm">No patients found</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:text-blue-700 text-xs mt-2"
                >
                  Clear search
                </button>
              )}
            </li>
          ) : (
            filteredPatients.map(p => (
            <li key={p.id}>
              <button onClick={()=>load(p.id)} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${selected===p.id?'bg-blue-600 text-white':'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}>
                <div className="flex flex-col">
                  <span className="text-base">{p.full_name}</span>
                  <span className={`text-xs mt-1 ${selected===p.id?'text-blue-100':'text-gray-500'}`}>DOB: {p.dob}</span>
                </div>
              </button>
            </li>
            ))
          )}
        </ul>
      </div>

      <div className="bg-white rounded-xl p-4 shadow md:col-span-2">
        {!detail ? <p className="text-gray-500">Select a patient to view their profile.</p> : (
          <>
            {/* Patient Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">{detail.patient.full_name}</h2>
                  <p className="text-sm text-gray-600">Date of Birth: <span className="font-medium">{detail.patient.dob}</span></p>
                </div>
                <div className="bg-white rounded-full p-4 shadow-md">
                  <span className="text-4xl">👤</span>
                </div>
              </div>
            </div>

            {/* Medical Profile Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Allergies Card */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-red-900 flex items-center mb-3 text-lg">
                  <span className="mr-2 text-2xl">⚠️</span> Known Allergies
                </h3>
                <div className="space-y-2">
                  {(() => {
                    const allergies = [...new Set((detail.appointments||[]).map(a => a.allergies).filter(Boolean))];
                    return allergies.length > 0 ? (
                      allergies.map((allergy, idx) => (
                        <div key={idx} className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          <span className="text-sm font-medium text-red-900">{allergy}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-red-700 italic">✓ No known allergies</p>
                    );
                  })()}
                </div>
              </div>

              {/* Current Medications Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-blue-900 flex items-center mb-3 text-lg">
                  <span className="mr-2 text-2xl">💊</span> Current Medications
                </h3>
                <div className="space-y-2">
                  {(() => {
                    // Get the most recent appointment's medications
                    const latestMeds = (detail.appointments||[]).length > 0 ? detail.appointments[0].medications : null;
                    return latestMeds ? (
                      latestMeds.split(',').map((med, idx) => (
                        <div key={idx} className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          <span className="text-sm font-medium text-blue-900">{med.trim()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-blue-700 italic">No current medications</p>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Medical History / Appointments */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📋</span> Medical History & Appointments
              </h3>
              <div className="space-y-3">
                {(detail.appointments||[]).length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded">No appointments on record</p>
                ) : (
                  (detail.appointments||[]).map(a=>(
                    <div key={a.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-semibold text-gray-900">{a.date}</div>
                        <div className="text-xs text-gray-500">Dr. {a.doctor_name}</div>
                      </div>
                      {a.notes && (
                        <div className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Notes:</span> {a.notes}
                        </div>
                      )}
                      <div className="flex gap-3 text-xs">
                        {a.medications && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            💊 {a.medications}
                          </span>
                        )}
                        {a.allergies && (
                          <span className="bg-red-50 text-red-700 px-2 py-1 rounded">
                            ⚠️ {a.allergies}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-1">Add appointment</h3>
                <div className="space-y-2">
                  <input className="w-full border rounded px-2 py-1" placeholder="YYYY-MM-DD" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
                  <input className="w-full border rounded px-2 py-1" placeholder="Notes" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})}/>
                  <input className="w-full border rounded px-2 py-1" placeholder="Medications" value={form.medications} onChange={e=>setForm({...form, medications:e.target.value})}/>
                  <input className="w-full border rounded px-2 py-1" placeholder="Allergies" value={form.allergies} onChange={e=>setForm({...form, allergies:e.target.value})}/>
                  <button onClick={addAppt} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                  {msg && <span className="text-sm text-green-600">{msg}</span>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-gray-900">🤖 AI Summary</h3>
                <button 
                  onClick={summarize} 
                  disabled={ai === 'Loading summary...'}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50 mb-3"
                >
                  {ai === 'Loading summary...' ? '⏳ Generating...' : '✨ Generate AI Summary'}
                </button>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 min-h-[150px]">
                  {ai ? (
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{ai}</pre>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Click "Generate AI Summary" to create a comprehensive medical summary for this patient.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
