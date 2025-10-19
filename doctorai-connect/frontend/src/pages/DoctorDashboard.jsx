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
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      {/* Patient Sidebar - Compact Dense Style */}
      <div className="w-full lg:w-96 glass-card p-4 h-fit lg:h-auto lg:order-1">
        <h2 className="font-semibold text-lg mb-4 text-dark-100">
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-600 rounded-xl text-dark-100 placeholder-dark-400 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500"
            />
            <svg 
              className="absolute left-3 top-3 h-4 w-4 text-dark-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-dark-400 hover:text-dark-300 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-xs text-dark-400 mt-2">
              Found {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ul className="space-y-1">
          {filteredPatients.length === 0 ? (
            <li className="text-center py-6">
              <p className="text-dark-400 text-sm">No patients found</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-brand-400 hover:text-brand-300 text-xs mt-2 font-medium"
                >
                  Clear search
                </button>
              )}
            </li>
          ) : (
            filteredPatients.map(p => (
            <li key={p.id}>
              <button 
                onClick={()=>load(p.id)} 
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  selected===p.id
                    ? 'bg-brand-600 text-white shadow-glow' 
                    : 'bg-slate-700/50 text-dark-200 hover:bg-slate-700 hover:shadow-soft border border-transparent hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{p.full_name}</span>
                  <span className={`text-xs mt-0.5 ${selected===p.id?'text-brand-100':'text-dark-400'}`}>DOB: {p.dob}</span>
                </div>
              </button>
            </li>
            ))
          )}
        </ul>
      </div>

      {/* Main Content - Card Stack */}
      <div className="flex-1 space-y-6 overflow-y-auto lg:order-2">
        {!detail ? (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4 opacity-50">👤</div>
            <p className="text-dark-400 text-lg">Select a patient to view their medical profile</p>
          </div>
        ) : (
          <>
            {/* Patient Header Card */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-dark-100 mb-1">{detail.patient.full_name}</h2>
                  <p className="text-sm text-dark-400">Date of Birth: <span className="font-medium text-dark-300">{detail.patient.dob}</span></p>
                </div>
                <div className="bg-gradient-to-br from-brand-500/20 to-brand-600/20 rounded-full p-4 border border-brand-500/30">
                  <span className="text-4xl">👤</span>
                </div>
              </div>
            </div>

            {/* Summary Tiles */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Allergies Card */}
              <div className="glass-card p-5 hover:shadow-soft transition-all duration-200">
                <h3 className="font-semibold text-orange-300 flex items-center mb-3 text-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Known Allergies
                </h3>
                <div className="space-y-2">
                  {(() => {
                    const allergies = [...new Set((detail.appointments||[]).map(a => a.allergies).filter(Boolean))];
                    return allergies.length > 0 ? (
                      allergies.map((allergy, idx) => (
                        <div key={idx} className="flex items-center">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-dark-200">{allergy}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-dark-400 italic">No known allergies</p>
                    );
                  })()}
                </div>
              </div>

              {/* Current Medications Card */}
              <div className="glass-card p-5 hover:shadow-soft transition-all duration-200">
                <h3 className="font-semibold text-brand-300 flex items-center mb-3 text-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Current Medications
                </h3>
                <div className="space-y-2">
                  {(() => {
                    const latestMeds = (detail.appointments||[]).length > 0 ? detail.appointments[0].medications : null;
                    return latestMeds ? (
                      latestMeds.split(',').map((med, idx) => (
                        <div key={idx} className="flex items-center">
                          <div className="w-2 h-2 bg-brand-400 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-dark-200">{med.trim()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-dark-400 italic">No current medications</p>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Medical History List */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-dark-100 mb-4 flex items-center">
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
                    <div key={a.id} className="bg-dark-800/30 border border-dark-700/50 rounded-lg p-4 hover:shadow-soft transition-all duration-200 hover:border-dark-600">
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

            {/* Add Appointment Form */}
            <div className="glass-card p-6">
              <h3 className="font-medium text-dark-100 mb-4">Add Appointment</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Date</label>
                    <input 
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-400 brand-ring" 
                      placeholder="YYYY-MM-DD" 
                      value={form.date} 
                      onChange={e=>setForm({...form, date:e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Notes</label>
                    <input 
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-400 brand-ring" 
                      placeholder="Notes" 
                      value={form.notes} 
                      onChange={e=>setForm({...form, notes:e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Medications</label>
                    <input 
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-400 brand-ring" 
                      placeholder="Medications" 
                      value={form.medications} 
                      onChange={e=>setForm({...form, medications:e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Allergies</label>
                    <input 
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-400 brand-ring" 
                      placeholder="Allergies" 
                      value={form.allergies} 
                      onChange={e=>setForm({...form, allergies:e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={addAppt} className="btn-primary">Save</button>
                {msg && <span className="text-sm text-brand-400">{msg}</span>}
              </div>
            </div>

            {/* AI Summary Section */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-dark-100 mb-4">AI Summary</h3>
              <button 
                onClick={summarize} 
                disabled={ai === 'Loading summary...'}
                className="w-full btn-primary mb-4"
              >
                {ai === 'Loading summary...' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  'Generate AI Summary'
                )}
              </button>
              <div className="bg-dark-800/30 border border-dark-700/50 rounded-lg p-4 min-h-[150px]">
                {ai ? (
                  <div className="text-sm text-dark-200 leading-relaxed" dangerouslySetInnerHTML={{__html: ai}} />
                ) : (
                  <p className="text-sm text-dark-400 italic">Click "Generate AI Summary" to create a comprehensive medical summary for this patient.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* AI Copilot Panel - Floating Style */}
      <div className="w-full lg:w-96 glass-card flex flex-col lg:sticky lg:top-6 lg:order-3">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-4 rounded-t-2xl">
          <h2 className="text-lg font-semibold flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Medical Copilot
          </h2>
          <p className="text-xs text-brand-100 mt-1">Ask me anything about diagnosis, treatment, or patient care</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-800/20">
          {chatMessages.length === 0 ? (
            <div className="text-center text-dark-400 mt-8">
              <div className="w-12 h-12 mx-auto mb-3 text-dark-500">
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
                <div className={`max-w-[85%] rounded-lg p-3 transition-all duration-200 ${
                  msg.role === 'user' 
                    ? 'bg-brand-600 text-white shadow-md' 
                    : 'bg-slate-700/50 border border-slate-600/50 text-dark-200 shadow-sm'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center mb-1">
                      <svg className="w-3 h-3 mr-1 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-xs font-semibold text-brand-400">AI Copilot</span>
                    </div>
                  )}
                  <div className="text-sm" dangerouslySetInnerHTML={{__html: msg.content}} />
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 rounded-b-2xl">
          <div className="flex gap-2">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask AI for medical guidance..."
              className="flex-1 bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 brand-ring resize-none"
              rows="2"
              disabled={isTyping}
            />
            <button
              onClick={sendChatMessage}
              disabled={isTyping || !chatInput.trim()}
              className="bg-brand-600 text-white px-3 rounded-lg hover:bg-brand-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-dark-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
