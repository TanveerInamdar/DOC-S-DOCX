// src/pages/DoctorHome.jsx
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function DoctorHome({ user }) {
    const [patients, setPatients] = useState([])
    const [resume, setResume] = useState(null)   // last selected patient (optional)
    const [recentActivity, setRecentActivity] = useState([])
    const [loading, setLoading] = useState(true)
    const nav = useNavigate()

    useEffect(() => {
        // Load patient list for quick actions
        console.log('DoctorHome: Fetching patients...')
        api.get('/api/patients')
            .then(r => {
                console.log('DoctorHome: Patients loaded:', r.data.patients)
                setPatients(r.data.patients || [])
                setLoading(false)
            })
            .catch(err => {
                console.error('DoctorHome: Failed to fetch patients:', err.response?.status, err.response?.data)
                setLoading(false)
            })

        // Try to restore last viewed patient from localStorage (set by dashboard)
        const pid = localStorage.getItem('last_patient_id')
        if (pid) {
            api.get(`/api/patients/${pid}`).then(r => {
                setResume(r.data?.patient || null)
            }).catch(()=>{})
        }

        // Mock recent activity data
        setRecentActivity([
            { id: 1, text: "Appointment added for Alex Patient", time: "10:30 AM", type: "appointment" },
            { id: 2, text: "Summary generated for Sarah Johnson", time: "9:15 AM", type: "ai" },
            { id: 3, text: "Note updated for Michael Chen", time: "8:45 AM", type: "note" }
        ])
    }, [])

    const quickOpenFirst = async () => {
        if (!patients?.length) return
        // Go straight to the Manage view filtered to the first patient
        nav('/doctor/patients', { state: { focusId: patients[0].id } })
    }

    return (
        <div className="space-y-8 lg:space-y-8">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl p-8 md:p-12">
                {/* Background gradient with inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-brand-500/10 to-purple-600/20 rounded-3xl"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-purple-500/5 rounded-3xl"></div>
                
                {/* Subtle starfield */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-10 left-20 w-1 h-1 bg-white rounded-full"></div>
                    <div className="absolute top-32 right-32 w-0.5 h-0.5 bg-white rounded-full"></div>
                    <div className="absolute bottom-20 left-40 w-1 h-1 bg-white rounded-full"></div>
                    <div className="absolute top-20 right-20 w-0.5 h-0.5 bg-white rounded-full"></div>
                    <div className="absolute bottom-32 right-40 w-1 h-1 bg-white rounded-full"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-dark-100">
                            Welcome, {user?.name || 'Dr. Rivera'}
                        </h1>
                        <div className="bg-brand-500/20 border border-brand-500/30 rounded-full px-3 py-1">
                            <span className="text-lg">👋</span>
                        </div>
                    </div>
                    <p className="text-lg text-dark-300 mb-8 max-w-2xl">
                        Manage patients, add appointments, and generate AI visit summaries in seconds.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link 
                            to="/doctor/patients" 
                            className="btn-primary text-lg px-6 py-3 rounded-2xl font-semibold"
                        >
                            Open Patient Manager
                        </Link>
                        <button
                            onClick={quickOpenFirst}
                            className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-dark-200 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:border-slate-500"
                        >
                            Quick open first patient
                        </button>
                    </div>
                </div>
            </section>

            {/* Quick Overview Grid */}
            <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Patients Metric Card */}
                <div className="glass-card p-6 hover:shadow-soft transition-all duration-200 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            {loading ? (
                                <div className="h-8 w-16 bg-slate-700/50 rounded animate-pulse"></div>
                            ) : (
                                <div className="text-4xl font-bold text-dark-100">{patients.length}</div>
                            )}
                            <p className="text-sm text-dark-400 mt-1">Total patients in your panel</p>
                        </div>
                        <Link 
                            to="/doctor/patients" 
                            className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
                        >
                            View all →
                        </Link>
                    </div>
                    {patients.length === 0 && (
                        <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                            <p className="text-sm text-dark-400">Get started by adding your first patient</p>
                            <Link to="/doctor/add" className="text-brand-400 hover:text-brand-300 text-xs mt-1 inline-block">
                                Add patient →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Common Actions Card */}
                <div className="glass-card p-6 hover:shadow-soft transition-all duration-200 hover:-translate-y-1">
                    <h3 className="text-lg font-semibold text-dark-100 mb-4">Common Actions</h3>
                    <div className="space-y-3">
                        <Link
                            to="/doctor/add"
                            className="block w-full bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-center"
                        >
                            Add appointment
                        </Link>
                        <Link
                            to="/doctor/records"
                            className="block w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-dark-200 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-center hover:border-slate-500"
                        >
                            Create note
                        </Link>
                    </div>
                    <p className="text-sm text-dark-400 mt-4">Actions live in Patient Manager</p>
                </div>

                {/* AI Summary Card */}
                <div className="glass-card p-6 hover:shadow-soft transition-all duration-200 hover:-translate-y-1">
                    <h3 className="text-lg font-semibold text-dark-100 mb-4">AI Summary</h3>
                    <p className="text-sm text-dark-300 mb-4">
                        Generate a concise, non diagnostic summary of a patient's history.
                    </p>
                    <Link
                        to="/doctor/ai"
                        className="block w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-center mb-3"
                    >
                        Open AI Summary
                    </Link>
                    <p className="text-xs text-dark-500">Responsible AI use guidelines apply</p>
                </div>
            </section>

            {/* Recent Activity */}
            <section className="glass-card p-6 lg:order-3">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-dark-100">Recent Activity</h3>
                    <Link 
                        to="/doctor/patients" 
                        className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
                    >
                        View all →
                    </Link>
                </div>
                <div className="space-y-3">
                    {recentActivity.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-sm text-dark-400">No recent activity</p>
                            <p className="text-xs text-dark-500 mt-1">Activity will appear here as you work</p>
                        </div>
                    ) : (
                        recentActivity.map(activity => (
                            <div key={activity.id} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                        activity.type === 'appointment' ? 'bg-brand-400' :
                                        activity.type === 'ai' ? 'bg-purple-400' : 'bg-slate-400'
                                    }`}></div>
                                    <span className="text-sm text-dark-200">{activity.text}</span>
                                </div>
                                <span className="text-xs text-dark-500">{activity.time}</span>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Copilot Teaser */}
            <section className="glass-card p-6 lg:order-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="bg-brand-500/20 border border-brand-500/30 rounded-full p-3 flex-shrink-0">
                        <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <div className="flex-1 w-full">
                        <p className="text-dark-200 font-medium mb-3">Ask the medical copilot for routing, follow-up, or note templates</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text" 
                                placeholder="Ask about treatment protocols..." 
                                className="flex-1 bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-dark-100 placeholder-dark-400 brand-ring"
                            />
                            <Link 
                                to="/doctor/patients" 
                                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 text-center sm:text-left"
                            >
                                Open Copilot
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Continue where you left off */}
            {resume && (
                <section className="glass-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-dark-400 mb-1">Continue where you left off</div>
                            <div className="text-xl font-semibold text-dark-100">{resume.full_name}</div>
                        </div>
                        <Link
                            to="/doctor/patients"
                            state={{ focusId: resume.id }}
                            className="btn-primary"
                        >
                            Open in Patient Manager
                        </Link>
                    </div>
                </section>
            )}
        </div>
    )
}