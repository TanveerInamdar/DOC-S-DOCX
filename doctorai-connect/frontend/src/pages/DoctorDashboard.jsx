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
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

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

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return
    
    const userMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsTyping(true)

    try {
      const context = detail ? `Current patient: ${detail.patient.full_name}, DOB: ${detail.patient.dob}` : ''
      const r = await api.post('/api/chat', { 
        message: chatInput,
        context,
        history: chatMessages
      })
      const aiMessage = { role: 'assistant', content: r.data.response }
      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      console.error('Error response:', error.response?.data)
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error'
      const errorMessage = { role: 'assistant', content: `Error: ${errorMsg}. Please make sure you're logged in.` }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }

  // Filter patients based on search term
  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dob.includes(searchTerm)
  )

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] w-full">
      {/* Main Content Area */}
      <div className="flex-1 grid md:grid-cols-3 gap-6 overflow-y-auto">
        <div className="bg-slate-100/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/20 h-fit hover:shadow-xl transition-all duration-300 hover:bg-slate-100/95">
        <h2 className="font-semibold text-lg mb-4 text-gray-800">
          Patients
        </h2>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/80 backdrop-blur-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md"
            />
            <svg 
              className="absolute left-3 top-3 h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-xs text-gray-500 mt-2">
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
                  className="text-emerald-500 hover:text-emerald-600 text-xs mt-2 font-medium"
                >
                  Clear search
                </button>
              )}
            </li>
          ) : (
            filteredPatients.map(p => (
            <li key={p.id}>
              <button onClick={()=>load(p.id)} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] ${selected===p.id?'bg-emerald-600 text-white shadow-lg scale-[1.02]':'bg-slate-50/80 text-gray-900 hover:bg-slate-100 hover:shadow-md border border-slate-200 hover:border-emerald-300'}`}>
                <div className="flex flex-col">
                  <span className="text-base font-semibold">{p.full_name}</span>
                  <span className={`text-xs mt-1 ${selected===p.id?'text-emerald-100':'text-gray-500'}`}>DOB: {p.dob}</span>
                </div>
              </button>
            </li>
            ))
          )}
        </ul>
      </div>

      <div className="bg-slate-100/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/20 md:col-span-2 hover:shadow-xl transition-all duration-300 hover:bg-slate-100/95">
        {!detail ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-gray-400 text-lg">Select a patient to view their medical profile</p>
          </div>
        ) : (
          <>
            {/* Patient Header */}
            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">{detail.patient.full_name}</h2>
                  <p className="text-sm text-gray-600">Date of Birth: <span className="font-medium">{detail.patient.dob}</span></p>
                </div>
                <div className="bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full p-4 shadow-md hover:shadow-lg transition-all duration-300">
                  <span className="text-4xl">👤</span>
                </div>
              </div>
            </div>

            {/* Medical Profile Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Allergies Card */}
              <div className="bg-gradient-to-br from-red-100 to-pink-100 border border-red-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <h3 className="font-bold text-red-800 flex items-center mb-3 text-lg">
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
                      <p className="text-sm text-red-700 italic">No known allergies</p>
                    );
                  })()}
                </div>
              </div>

              {/* Current Medications Card */}
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <h3 className="font-bold text-emerald-800 flex items-center mb-3 text-lg">
                  <span className="mr-2 text-2xl">💊</span> Current Medications
                </h3>
                <div className="space-y-2">
                  {(() => {
                    // Get the most recent appointment's medications
                    const latestMeds = (detail.appointments||[]).length > 0 ? detail.appointments[0].medications : null;
                    return latestMeds ? (
                      latestMeds.split(',').map((med, idx) => (
                        <div key={idx} className="flex items-center">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                          <span className="text-sm font-medium text-emerald-900">{med.trim()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-emerald-700 italic">No current medications</p>
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

      {/* AI Chat Copilot Sidebar */}
      <div className="w-96 min-w-96 bg-slate-100/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/20 flex flex-col hover:shadow-xl transition-all duration-300 hover:bg-slate-100/95">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-t-xl shadow-lg">
          <h2 className="text-lg font-semibold flex items-center">
            <svg className="w-6 h-6 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Medical Copilot
          </h2>
          <p className="text-xs text-emerald-100 mt-1">Ask me anything about diagnosis, treatment, or patient care</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50 to-slate-100">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <div className="w-16 h-16 mx-auto mb-3 text-gray-300 animate-bounce">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-sm">Start a conversation</p>
              <p className="text-xs mt-2 px-4">Ask me to help with diagnoses, suggest treatments, or provide medical insights.</p>
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 transition-all duration-200 hover:scale-[1.02] ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white shadow-md hover:shadow-lg' 
                    : 'bg-slate-50 border border-slate-200 text-gray-800 shadow-sm hover:shadow-md'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center mb-1">
                      <svg className="w-4 h-4 mr-1 text-emerald-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-xs font-semibold text-emerald-600">AI Copilot</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-slate-200 bg-slate-100/80 backdrop-blur-sm rounded-b-xl">
          <div className="flex gap-2">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask AI for medical guidance..."
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all duration-200 hover:border-emerald-400 focus:border-emerald-500 bg-slate-50"
              rows="2"
              disabled={isTyping}
            />
            <button
              onClick={sendChatMessage}
              disabled={isTyping || !chatInput.trim()}
              className="bg-emerald-600 text-white px-4 rounded-lg hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
