import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function AddAppointment() {
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({ 
    patient_id: '', 
    date: '', 
    notes: '', 
    medications: '', 
    allergies: '' 
  })
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/patients').then(r => setPatients(r.data.patients || [])).catch(()=>{})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.patient_id || !form.date) return
    
    setLoading(true)
    try {
      await api.post('/api/appointments', form)
      setSuccess(true)
      setForm({ patient_id: '', date: '', notes: '', medications: '', allergies: '' })
    } catch (error) {
      console.error('Failed to add appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[90vw] mx-auto">
      <div className="bg-white rounded-xl p-6 shadow">
        <h1 className="text-2xl font-semibold mb-6">Add New Appointment</h1>
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-green-800">
                <strong>Success!</strong> Appointment added successfully.
              </div>
              <Link 
                to="/doctor/patients" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Open Patient Manager
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient *
            </label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.patient_id}
              onChange={e => setForm({...form, patient_id: e.target.value})}
              required
            >
              <option value="">Select a patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name} (DOB: {patient.dob})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input 
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Visit notes, observations, etc."
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medications
            </label>
            <input 
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Prescribed medications"
              value={form.medications}
              onChange={e => setForm({...form, medications: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allergies
            </label>
            <input 
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Known allergies"
              value={form.allergies}
              onChange={e => setForm({...form, allergies: e.target.value})}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="submit"
              disabled={loading || !form.patient_id || !form.date}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Appointment'}
            </button>
            <Link 
              to="/doctor/patients"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
