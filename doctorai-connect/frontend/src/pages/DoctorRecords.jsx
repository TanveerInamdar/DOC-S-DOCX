import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function DoctorRecords() {
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [patientData, setPatientData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/patients').then(r => setPatients(r.data.patients || [])).catch(()=>{})
  }, [])

  const loadPatientData = async (patientId) => {
    if (!patientId) return
    
    setLoading(true)
    try {
      const response = await api.get(`/api/patients/${patientId}`)
      setPatientData(response.data)
    } catch (error) {
      console.error('Failed to load patient data:', error)
      setPatientData(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePatientChange = (e) => {
    const patientId = e.target.value
    setSelectedPatient(patientId)
    if (patientId) {
      loadPatientData(patientId)
    } else {
      setPatientData(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl p-6 shadow">
        <h1 className="text-2xl font-semibold mb-6">Patient Records</h1>
        
        <div className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient
            </label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedPatient}
              onChange={handlePatientChange}
            >
              <option value="">Choose a patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name} (DOB: {patient.dob})
                </option>
              ))}
            </select>
          </div>

          {/* Patient Information */}
          {patientData && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {patientData.patient.full_name}
              </h2>
              <p className="text-gray-600">
                Date of Birth: {patientData.patient.dob}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading patient records...</div>
            </div>
          )}

          {/* Appointments List */}
          {patientData && !loading && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Appointment History ({patientData.appointments?.length || 0} appointments)
              </h3>
              
              {patientData.appointments?.length > 0 ? (
                <div className="space-y-4">
                  {patientData.appointments.map(appointment => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {appointment.date}
                        </div>
                        <div className="text-sm text-gray-500">
                          Dr. {appointment.doctor_name}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {appointment.notes && (
                          <div>
                            <span className="font-medium text-gray-700">Notes:</span>
                            <span className="text-gray-600 ml-2">{appointment.notes}</span>
                          </div>
                        )}
                        
                        {appointment.medications && (
                          <div>
                            <span className="font-medium text-gray-700">Medications:</span>
                            <span className="text-gray-600 ml-2">{appointment.medications}</span>
                          </div>
                        )}
                        
                        {appointment.allergies && (
                          <div>
                            <span className="font-medium text-gray-700">Allergies:</span>
                            <span className="text-gray-600 ml-2">{appointment.allergies}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No appointments found for this patient.
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!selectedPatient && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">Select a patient to view their records</div>
              <div className="text-sm">Choose from the dropdown above to get started</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
