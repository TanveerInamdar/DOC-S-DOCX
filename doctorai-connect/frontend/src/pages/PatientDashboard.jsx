import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function PatientDashboard() {
  const [me, setMe] = useState(null)
  const [detail, setDetail] = useState(null)
  const [ai, setAi] = useState('')

  useEffect(() => {
    api.get('/api/me').then(async r => {
      setMe(r.data.user)
      if (r.data.user?.patientId) {
        const p = await api.get(`/api/patients/${r.data.user.patientId}`)
        setDetail(p.data)
      }
    })
  }, [])

  const summarize = async () => {
    setAi('Loading summary...')
    const id = me?.patientId
    const r = await api.post(`/api/patients/${id}/ai-summary`)
    setAi(r.data.summary)
  }

  if (!me) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <h2 className="font-semibold mb-2">Welcome, {me.name}</h2>
      {!detail ? <p>No record.</p> : (
        <>
          <div className="mb-3">
            <h3 className="font-medium">Your appointments</h3>
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

          <div>
            <h3 className="font-medium mb-1">AI summary</h3>
            <button onClick={summarize} className="bg-blue-600 text-white px-3 py-1 rounded mb-2">Generate</button>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded border min-h-[120px]">{ai}</pre>
          </div>
        </>
      )}
    </div>
  )
}
