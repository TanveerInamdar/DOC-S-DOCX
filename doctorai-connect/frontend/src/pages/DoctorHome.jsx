// src/pages/DoctorHome.jsx
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function DoctorHome({ user }) {
    const [patients, setPatients] = useState([])
    const [resume, setResume] = useState(null)   // last selected patient (optional)
    const nav = useNavigate()

    useEffect(() => {
        // Load patient list for quick actions
        console.log('DoctorHome: Fetching patients...')
        api.get('/api/patients')
            .then(r => {
                console.log('DoctorHome: Patients loaded:', r.data.patients)
                setPatients(r.data.patients || [])
            })
            .catch(err => {
                console.error('DoctorHome: Failed to fetch patients:', err.response?.status, err.response?.data)
            })

        // Try to restore last viewed patient from localStorage (set by dashboard)
        const pid = localStorage.getItem('last_patient_id')
        if (pid) {
            api.get(`/api/patients/${pid}`).then(r => {
                setResume(r.data?.patient || null)
            }).catch(()=>{})
        }
    }, [])

    const quickOpenFirst = async () => {
        if (!patients?.length) return
        // Go straight to the Manage view filtered to the first patient
        nav('/doctor/patients', { state: { focusId: patients[0].id } })
    }

    return (
        <div className="space-y-6">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow">
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-semibold">
                        Welcome{user?.name ? `, ${user.name}` : ''} 👋
                    </h1>
                    <p className="mt-2 text-blue-100">
                        Manage patients, add appointments, and generate AI visit summaries in seconds.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link to="/doctor/patients" className="bg-white text-blue-700 px-4 py-2 rounded-xl font-medium shadow hover:opacity-90">
                            Open Patient Manager
                        </Link>
                        <button
                            onClick={quickOpenFirst}
                            className="bg-white/10 hover:bg-white/20 border border-white/30 px-4 py-2 rounded-xl font-medium"
                        >
                            Quick open first patient
                        </button>
                    </div>
                </div>
                <div className="absolute -right-10 -top-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            </section>

            {/* KPI / Shortcuts */}
            <section className="grid md:grid-cols-3 gap-4">
                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <div className="text-sm text-gray-500">Patients</div>
                    <div className="text-2xl font-semibold mt-1">{patients.length}</div>
                    <p className="text-sm text-gray-500 mt-2">Total patients in your panel</p>
                </div>

                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <div className="text-sm text-gray-500">Common action</div>
                    <div className="mt-2 flex gap-2">
                        <Link
                            to="/doctor/add"
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
                        >
                            Add appointment
                        </Link>
                        <Link
                            to="/doctor/records"
                            className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm"
                        >
                            View records
                        </Link>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Actions live in Patient Manager</p>
                </div>

                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <div className="text-sm text-gray-500">AI Summary</div>
                    <p className="text-sm text-gray-600 mt-2">
                        Generate a concise, non diagnostic summary of a patient's history.
                    </p>
                    <Link
                        to="/doctor/ai"
                        className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm"
                    >
                        Open AI Summary
                    </Link>
                </div>
            </section>

            {/* Continue where you left off */}
            {resume && (
                <section className="bg-white border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500">Continue where you left off</div>
                            <div className="text-lg font-semibold">{resume.full_name}</div>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                to="/doctor/patients"
                                state={{ focusId: resume.id }}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
                            >
                                Open in Patient Manager
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}