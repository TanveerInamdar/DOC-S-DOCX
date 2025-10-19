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
        <div className="w-full min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" style={{animationDelay: '4s'}}></div>
            </div>
            
            <div className="relative z-10 p-4">
                <header className="flex items-center justify-between mb-6 bg-slate-100/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-slate-200/20 hover:shadow-xl transition-all duration-300">
                    <Link to="/" className="text-2xl font-bold text-gray-800 hover:text-emerald-600 transition-colors">
                        DoctorAI Connect
                    </Link>
                    <nav className="flex gap-4">
                        {user?.role === 'doctor' && (
                            <>
                                <Link to="/doctor" className="text-gray-600 hover:text-emerald-600 transition-all duration-200 font-medium px-3 py-1 rounded-lg hover:bg-emerald-50">Doctor</Link>
                                <Link to="/doctor/patients" className="text-gray-600 hover:text-emerald-600 transition-all duration-200 font-medium px-3 py-1 rounded-lg hover:bg-emerald-50">Patients</Link>
                            </>
                        )}
                        {user?.role === 'patient' && <Link to="/patient" className="text-gray-600 hover:text-emerald-600 transition-all duration-200 font-medium px-3 py-1 rounded-lg hover:bg-emerald-50">Patient</Link>}
                        {user ? (
                            <button onClick={logout} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 hover:shadow-md">Logout</button>
                        ) : (
                            <Link to="/login" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Login</Link>
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
        </div>
    )
}