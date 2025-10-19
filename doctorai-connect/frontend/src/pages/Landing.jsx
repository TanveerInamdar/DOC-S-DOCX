// src/pages/Landing.jsx
import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing({ user }) {
    return (
        <div className="relative">
            {/* subtle gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent -z-10" />

            <section className="text-center py-10 md:py-14">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    DoctorAI Connect
                </h1>
                <p className="mt-3 text-gray-600 max-w-xl mx-auto">
                    A simple doctor and patient portal with AI summaries of medical history.
                    Doctors can add and edit appointments. Patients can view their records.
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                    {!user && (
                        <Link
                            to="/login"
                            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:opacity-90 shadow"
                        >
                            Sign in to continue
                        </Link>
                    )}

                    {user?.role === 'doctor' && (
                        <Link
                            to="/doctor"
                            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:opacity-90 shadow"
                        >
                            Go to Doctor Dashboard
                        </Link>
                    )}
                    {user?.role === 'patient' && (
                        <Link
                            to="/patient"
                            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:opacity-90 shadow"
                        >
                            Go to Patient Dashboard
                        </Link>
                    )}
                </div>

                {/* Demo logins card */}
                {!user && (
                    <div className="mt-6 inline-block text-left bg-white shadow rounded-2xl p-4 border">
                        <h3 className="font-semibold mb-2">Demo accounts</h3>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li><span className="font-medium">Doctor:</span> dr@demo.com / demo123</li>
                            <li><span className="font-medium">Patient:</span> pat@demo.com / demo123</li>
                        </ul>
                    </div>
                )}
            </section>

            {/* Feature grid */}
            <section className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-2xl p-5 shadow border">
                    <h4 className="font-semibold">Unified Records</h4>
                    <p className="text-sm text-gray-600 mt-1">
                        View a patient’s appointments, notes, medications, and allergies in one place.
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow border">
                    <h4 className="font-semibold">Doctor Tools</h4>
                    <p className="text-sm text-gray-600 mt-1">
                        Add new appointments and update notes quickly during visits.
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow border">
                    <h4 className="font-semibold">AI Summary</h4>
                    <p className="text-sm text-gray-600 mt-1">
                        Generate a concise, non-diagnostic summary powered by Cloudflare Workers AI.
                    </p>
                </div>
            </section>

            <footer className="mt-10 text-center text-xs text-gray-500">
                Built for a hackathon demo with Cloudflare Workers, D1, and Workers AI.
            </footer>
        </div>
    )
}
