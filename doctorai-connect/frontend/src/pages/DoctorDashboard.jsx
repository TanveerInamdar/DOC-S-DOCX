import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [ai, setAi] = useState('')
  const [form, setForm] = useState({ date: '', notes: '', medications: '', allergies: '' })
  const [msg, setMsg] = useState('')

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
    const r = await api.post(`/api/patients/${selected}/ai-summary`)
    setAi(r.data.summary)
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="font-semibold mb-2">Patients</h2>
        <ul className="space-y-2">
          {patients.map(p => (
            <li key={p.id}>
              <button onClick={()=>load(p.id)} className={`w-full text-left px-3 py-2 rounded ${selected===p.id?'bg-blue-50':'bg-gray-100'}`}>
                {p.full_name} <span className="text-xs text-gray-500">DOB {p.dob}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl p-4 shadow md:col-span-2">
        {!detail ? <p>Select a patient.</p> : (
          <>
            <h2 className="font-semibold mb-2">{detail.patient.full_name}</h2>
            <div className="mb-3">
              <h3 className="font-medium">Appointments</h3>
              <div className="divide-y border rounded">
                {(detail.appointments||[]).map(a=>(
                  <div key={a.id} className="p-2">
                    <div className="text-sm font-medium">{a.date} • {a.doctor_name}</div>
                    <div className="text-sm">Notes: {a.notes}</div>
                    <div className="text-sm">Meds: {a.medications}</div>
                    <div className="text-sm">Allergies: {a.allergies}</div>
                  </div>
                ))}
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
                <h3 className="font-medium mb-1">AI summary</h3>
                <button onClick={summarize} className="bg-blue-600 text-white px-3 py-1 rounded mb-2">Generate</button>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded border min-h-[120px]">{ai}</pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
