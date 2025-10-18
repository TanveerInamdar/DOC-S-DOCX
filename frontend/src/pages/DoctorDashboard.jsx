import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientsAPI, appointmentsAPI } from '../api';

function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patient_id: '',
    doctor_id: 1,
    date: '',
    notes: '',
    medications: '',
    allergies: ''
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await patientsAPI.getAll();
      setPatients(response.data.patients);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  const loadPatientData = async (patientId) => {
    setLoading(true);
    try {
      const [appointmentsRes, summaryRes] = await Promise.all([
        patientsAPI.getAppointments(patientId),
        patientsAPI.getAISummary(patientId)
      ]);
      
      setAppointments(appointmentsRes.data.appointments);
      setAiSummary(summaryRes.data.summary);
    } catch (error) {
      console.error('Failed to load patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    loadPatientData(patient.id);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      await appointmentsAPI.create(newAppointment);
      setShowNewAppointment(false);
      setNewAppointment({
        patient_id: selectedPatient?.id || '',
        doctor_id: 1,
        date: '',
        notes: '',
        medications: '',
        allergies: ''
      });
      if (selectedPatient) {
        loadPatientData(selectedPatient.id);
      }
    } catch (error) {
      console.error('Failed to create appointment:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">DoctorAI Connect</h1>
              <p className="text-gray-600">Welcome, Dr. {user?.name}</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patients List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Patients</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                      selectedPatient?.id === patient.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{patient.full_name}</div>
                    <div className="text-sm text-gray-500">{patient.email}</div>
                    {patient.dob && (
                      <div className="text-sm text-gray-500">DOB: {patient.dob}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="space-y-6">
                {/* Patient Info */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-medium text-gray-900">
                        {selectedPatient.full_name}
                      </h2>
                      <button
                        onClick={() => setShowNewAppointment(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        New Appointment
                      </button>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{selectedPatient.email}</p>
                      </div>
                      {selectedPatient.dob && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                          <p className="text-gray-900">{selectedPatient.dob}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">AI Medical Summary</h3>
                  </div>
                  <div className="px-6 py-4">
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ) : (
                      <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{aiSummary}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointments */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Appointment History</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {appointments.map((appointment) => (
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
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-12 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a patient to view details
                  </h3>
                  <p className="text-gray-500">
                    Choose a patient from the list to see their medical history and AI summary.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">New Appointment</h3>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    required
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medications</label>
                  <input
                    type="text"
                    value={newAppointment.medications}
                    onChange={(e) => setNewAppointment({...newAppointment, medications: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Allergies</label>
                  <input
                    type="text"
                    value={newAppointment.allergies}
                    onChange={(e) => setNewAppointment({...newAppointment, allergies: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewAppointment(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
