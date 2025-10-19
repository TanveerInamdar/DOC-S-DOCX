import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
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
        // Try to restore user from localStorage first
        const savedUser = localStorage.getItem('currentUser')
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser))
            } catch (e) {
                console.error('Failed to restore user from localStorage')
            }
        }
        
        // Also check with API
        api.get('/api/me').then(r => {
            setUser(r.data.user)
            if (r.data.user) {
                localStorage.setItem('currentUser', JSON.stringify(r.data.user))
            }
        }).catch(() => {})
    }, [])

    const logout = async () => {
        await api.post('/api/logout')
        setUser(null)
        localStorage.removeItem('currentUser')
        nav('/')
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-[95vw] mx-auto px-6 py-8">
                <header className="glass-card mb-8 p-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="text-xl font-semibold text-dark-100 hover:text-brand-400 transition-colors">
                            DOC'S DOCX
                        </Link>
                        <nav className="flex gap-4">
                            {user?.role === 'doctor' && (
                                <>
                                    <Link to="/doctor" className="text-dark-300 hover:text-brand-400 transition-colors font-medium px-3 py-1 rounded-lg hover:bg-dark-700/50">Doctor</Link>
                                    <Link to="/doctor/patients" className="text-dark-300 hover:text-brand-400 transition-colors font-medium px-3 py-1 rounded-lg hover:bg-dark-700/50">Patients</Link>
                                </>
                            )}
                            {user?.role === 'patient' && <Link to="/patient" className="text-dark-300 hover:text-brand-400 transition-colors font-medium px-3 py-1 rounded-lg hover:bg-dark-700/50">Patient</Link>}
                            {user ? (
                                <button onClick={logout} className="btn-secondary">Logout</button>
                            ) : (
                                <>
                                    <Link to="/login" className="text-dark-300 hover:text-brand-400 transition-colors font-medium px-3 py-1 rounded-lg hover:bg-dark-700/50">Login</Link>
                                    <Link to="/signup" className="btn-primary">Sign Up</Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <Routes>
                    <Route path="/" element={<Landing user={user} />} />
                    <Route path="/login" element={<Login onLoggedIn={setUser} />} />
                    <Route path="/signup" element={<Signup onLoggedIn={setUser} />} />

                    {/* Doctor routes */}
                    <Route path="/doctor" element={<DoctorHome user={user} />} />
                    <Route path="/doctor/patients" element={<DoctorDashboard />} />
                    <Route path="/doctor/add" element={<AddAppointment />} />
                    <Route path="/doctor/ai" element={<DoctorAISummary />} />
                    <Route path="/doctor/records" element={<DoctorRecords />} />

                    {/* Patient route */}
                    <Route path="/patient" element={<PatientDashboard user={user} />} />
                </Routes>
            </div>
        </div>
    )
}