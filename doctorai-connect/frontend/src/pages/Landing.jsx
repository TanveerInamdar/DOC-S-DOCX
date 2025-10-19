// src/pages/Landing.jsx
import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing({ user }) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Main Content */}
            <main className="flex-1 px-6 py-8">
                {/* Hero Section */}
                <div className="glass-card p-8 md:p-12 text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-dark-100 mb-4">
                        DoctorAI Connect
                    </h1>
                    <p className="text-lg text-dark-300 max-w-2xl mx-auto mb-8">
                        A simple doctor and patient portal with AI summaries of medical history.
                        Doctors can add and edit appointments. Patients can view their records.
                    </p>

                           <div className="flex items-center justify-center gap-4 mb-8">
                               {!user && (
                                   <>
                                       <Link
                                           to="/login"
                                           className="btn-secondary px-8 py-3 text-lg"
                                       >
                                           Sign In
                                       </Link>
                                       <Link
                                           to="/signup"
                                           className="btn-primary px-8 py-3 text-lg"
                                       >
                                           Sign Up
                                       </Link>
                                   </>
                               )}

                        {user?.role === 'doctor' && (
                            <Link
                                to="/doctor"
                                className="btn-primary px-8 py-3 text-lg"
                            >
                                Go to Doctor Dashboard
                            </Link>
                        )}
                        {user?.role === 'patient' && (
                            <Link
                                to="/patient"
                                className="btn-primary px-8 py-3 text-lg"
                            >
                                Go to Patient Dashboard
                            </Link>
                        )}
                    </div>

                           {/* Demo logins card */}
                           {!user && (
                               <div className="glass-card p-6 max-w-2xl mx-auto">
                                   <h3 className="font-semibold text-dark-200 mb-4 text-lg text-center">Demo Accounts</h3>
                                   <div className="space-y-4">
                                       {/* Doctor Account */}
                                       <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                           <div>
                                               <span className="font-medium text-brand-300">Doctor:</span>
                                               <div className="text-sm text-dark-300">dr@demo.com / demo123</div>
                                           </div>
                                           <div className="w-2 h-2 bg-brand-400 rounded-full"></div>
                                       </div>
                                       
                                       {/* Patient Accounts */}
                                       <div>
                                           <div className="text-sm text-dark-400 font-medium mb-3">Patient Accounts:</div>
                                           <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                               <div className="p-2 bg-slate-800/30 rounded border border-slate-700/50">
                                                   <div className="text-purple-300 font-medium">pat@demo.com</div>
                                                   <div className="text-dark-400">Alex Patient</div>
                                               </div>
                                               <div className="p-2 bg-slate-800/30 rounded border border-slate-700/50">
                                                   <div className="text-purple-300 font-medium">pat2@demo.com</div>
                                                   <div className="text-dark-400">Sarah Johnson</div>
                                               </div>
                                               <div className="p-2 bg-slate-800/30 rounded border border-slate-700/50">
                                                   <div className="text-purple-300 font-medium">pat3@demo.com</div>
                                                   <div className="text-dark-400">Michael Chen</div>
                                               </div>
                                               <div className="p-2 bg-slate-800/30 rounded border border-slate-700/50">
                                                   <div className="text-purple-300 font-medium">pat4@demo.com</div>
                                                   <div className="text-dark-400">Emily Rodriguez</div>
                                               </div>
                                               <div className="p-2 bg-slate-800/30 rounded border border-slate-700/50">
                                                   <div className="text-purple-300 font-medium">pat5@demo.com</div>
                                                   <div className="text-dark-400">James Wilson</div>
                                               </div>
                                               <div className="p-2 bg-slate-800/30 rounded border border-slate-700/50">
                                                   <div className="text-purple-300 font-medium">pat6@demo.com</div>
                                                   <div className="text-dark-400">Maria Garcia</div>
                                               </div>
                                           </div>
                                           <div className="text-xs text-dark-500 text-center mt-2">All patients use password: demo123</div>
                                       </div>
                                   </div>
                               </div>
                           )}
                </div>

                {/* Feature grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 hover:shadow-soft transition-all duration-200">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-dark-100 text-lg">Unified Records</h4>
                        </div>
                        <p className="text-sm text-dark-300">
                            View a patient's appointments, notes, medications, and allergies in one place.
                        </p>
                    </div>
                    
                    <div className="glass-card p-6 hover:shadow-soft transition-all duration-200">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-dark-100 text-lg">Doctor Tools</h4>
                        </div>
                        <p className="text-sm text-dark-300">
                            Add new appointments and update notes quickly during visits.
                        </p>
                    </div>
                    
                    <div className="glass-card p-6 hover:shadow-soft transition-all duration-200">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-brand-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-dark-100 text-lg">AI Summary</h4>
                        </div>
                        <p className="text-sm text-dark-300">
                            Generate a concise, non-diagnostic summary powered by Cloudflare Workers AI.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="px-6 pb-6">
                <div className="glass-card p-4 text-center">
                    <p className="text-xs text-dark-400">
                        Built for a hackathon demo with Cloudflare Workers, D1, and Workers AI.
                    </p>
                </div>
            </footer>
        </div>
    )
}
