import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientsAPI } from '../api';

function PatientDashboard() {
  const { user, logout } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      // First get the patient record for this user
      const patientsResponse = await patientsAPI.getAll();
      const patientRecord = patientsResponse.data.patients.find(p => p.user_id === user.id);
      
      if (patientRecord) {
        setPatient(patientRecord);
        
        // Load appointments and AI summary
        const [appointmentsRes, summaryRes] = await Promise.all([
          patientsAPI.getAppointments(patientRecord.id),
          patientsAPI.getAISummary(patientRecord.id)
        ]);
        
        setAppointments(appointmentsRes.data.appointments);
        setAiSummary(summaryRes.data.summary);
      }
    } catch (error) {
      console.error('Failed to load patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">DoctorAI Connect</h1>
              <p className="text-gray-600">Welcome, {user?.name}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {patient ? (
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">My Information</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{patient.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{patient.email}</p>
                  </div>
                  {patient.dob && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-gray-900">{patient.dob}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">My Medical Summary</h3>
                <p className="text-sm text-gray-500 mt-1">
                  AI-generated summary of your medical history
                </p>
              </div>
              <div className="px-6 py-4">
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{aiSummary}</p>
                </div>
              </div>
            </div>

            {/* Appointments */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">My Appointment History</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your past and upcoming appointments (read-only)
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {appointments.length > 0 ? (
                  appointments.map((appointment) => (
                    <div key={appointment.id} className="px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(appointment.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Dr. {appointment.doctor_name} - {appointment.specialization}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {appointment.notes && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Notes:</span>
                            <p className="text-sm text-gray-700">{appointment.notes}</p>
                          </div>
                        )}
                        {appointment.medications && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Medications:</span>
                            <p className="text-sm text-gray-700">{appointment.medications}</p>
                          </div>
                        )}
                        {appointment.allergies && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Allergies:</span>
                            <p className="text-sm text-gray-700">{appointment.allergies}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="text-gray-500">No appointments found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Patient record not found
              </h3>
              <p className="text-gray-500">
                Please contact your healthcare provider to set up your patient record.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientDashboard;
