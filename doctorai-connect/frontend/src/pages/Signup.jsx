import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'

export default function Signup({ onLoggedIn }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'patient',
    fullName: '',
    dob: '',
    specialization: '',
    doctorId: ''
  })
  const [doctors, setDoctors] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    // Load available doctors for patient selection
    api.get('/api/doctors')
      .then(r => setDoctors(r.data.doctors || []))
      .catch(err => console.error('Failed to load doctors:', err))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setErr('Passwords do not match')
      return
    }
    
    if (formData.password.length < 6) {
      setErr('Password must be at least 6 characters')
      return
    }
    
    if (formData.role === 'patient' && !formData.doctorId) {
      setErr('Please select a doctor')
      return
    }
    
    setLoading(true)
    
    try {
      const signupData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        fullName: formData.fullName || formData.name,
        dob: formData.dob,
        specialization: formData.specialization,
        doctorId: formData.doctorId ? parseInt(formData.doctorId) : null
      }
      
      const r = await api.post('/api/signup', signupData)
      
      // Store user in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(r.data.user))
      onLoggedIn?.(r.data.user)
      
      if (r.data.user.role === 'doctor') nav('/doctor')
      else nav('/patient')
    } catch (e) {
      setErr(e?.response?.data?.error || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* Signup Card */}
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark-100 mb-2">Create Account</h1>
              <p className="text-dark-300">Join DoctorAI Connect as a doctor or patient</p>
            </div>
            
            <form onSubmit={submit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">I am a:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    formData.role === 'doctor' 
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300' 
                      : 'border-slate-600 bg-slate-800/50 text-dark-300 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="doctor"
                      checked={formData.role === 'doctor'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-1">👨‍⚕️</div>
                      <div className="font-medium">Doctor</div>
                    </div>
                  </label>
                  <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    formData.role === 'patient' 
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300' 
                      : 'border-slate-600 bg-slate-800/50 text-dark-300 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="patient"
                      checked={formData.role === 'patient'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-1">👤</div>
                      <div className="font-medium">Patient</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
                <input 
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-400 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500" 
                  name="email"
                  type="email"
                  value={formData.email} 
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Password</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-400 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500" 
                  name="password"
                  value={formData.password} 
                  onChange={handleChange}
                  placeholder="Create a password (min 6 characters)"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-400 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500" 
                  name="confirmPassword"
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Display Name</label>
                <input 
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-400 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500" 
                  name="name"
                  value={formData.name} 
                  onChange={handleChange}
                  placeholder="How should we call you?"
                  required
                />
              </div>

              {/* Doctor-specific fields */}
              {formData.role === 'doctor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Full Name</label>
                    <input 
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-400 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500" 
                      name="fullName"
                      value={formData.fullName} 
                      onChange={handleChange}
                      placeholder="Dr. Your Full Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Specialization</label>
                    <select
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                    >
                      <option value="General Practice">General Practice</option>
                      <option value="Internal Medicine">Internal Medicine</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </>
              )}

              {/* Patient-specific fields */}
              {formData.role === 'patient' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Full Name</label>
                    <input 
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-400 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500" 
                      name="fullName"
                      value={formData.fullName} 
                      onChange={handleChange}
                      placeholder="Your full legal name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Date of Birth</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500" 
                      name="dob"
                      value={formData.dob} 
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Choose Your Doctor</label>
                    <select
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500"
                      name="doctorId"
                      value={formData.doctorId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a doctor</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.full_name} - {doctor.specialization}
                        </option>
                      ))}
                    </select>
                    {doctors.length === 0 && (
                      <p className="text-sm text-dark-400 mt-2">No doctors available. Please contact support.</p>
                    )}
                  </div>
                </>
              )}
              
              {err && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-3 rounded-lg">
                  {err}
                </div>
              )}
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-dark-400 text-sm">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="text-center mt-6">
            <Link 
              to="/" 
              className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
            >
              ← Back to Home
            </Link>
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
