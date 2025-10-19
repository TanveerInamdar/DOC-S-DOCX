import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import Landing from './pages/Landing'
import DoctorHome from './pages/DoctorHome'
import AddAppointment from './pages/AddAppointment'
import DoctorAISummary from './pages/DoctorAISummary'
import DoctorRecords from './pages/DoctorRecords'
import { api } from './api'

export default function App() {
    const [user, setUser] = useState(null)
    const nav = useNavigate()

    useEffect(() => {
        api.get('/api/me').then(r => setUser(r.data.user)).catch(() => {})
    }, [])

    const logout = async () => {
        await api.post('/api/logout')
        setUser(null)
        nav('/')
    }

    return (
        <div className="max-w-5xl mx-auto p-4">
            <header className="flex items-center justify-between mb-6">
                <Link to="/" className="text-xl font-semibold">DoctorAI Connect</Link>
                <nav className="flex gap-4">
                    {user?.role === 'doctor' && (
                        <>
                            <Link to="/doctor" className="text-blue-600">Doctor</Link>
                            <Link to="/doctor/patients" className="text-blue-600">Patients</Link>
                        </>
                    )}
                    {user?.role === 'patient' && <Link to="/patient" className="text-blue-600">Patient</Link>}
                    {user ? (
                        <button onClick={logout} className="px-3 py-1 rounded bg-gray-200">Logout</button>
                    ) : (
                        <Link to="/login" className="px-3 py-1 rounded bg-blue-600 text-white">Login</Link>
                    )}
                </nav>
            </header>

            <Routes>
                <Route path="/" element={<Landing user={user} />} />
                <Route path="/login" element={<Login onLoggedIn={setUser} />} />

                {/* Doctor routes */}
                <Route path="/doctor" element={<DoctorHome user={user} />} />
                <Route path="/doctor/patients" element={<DoctorDashboard />} />
                <Route path="/doctor/add" element={<AddAppointment />} />
                <Route path="/doctor/ai" element={<DoctorAISummary />} />
                <Route path="/doctor/records" element={<DoctorRecords />} />

                {/* Patient route */}
                <Route path="/patient" element={<PatientDashboard />} />
            </Routes>
        </div>
    )
}