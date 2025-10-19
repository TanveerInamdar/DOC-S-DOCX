import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'

export default function Login({ onLoggedIn }) {
  const [email, setEmail] = useState('dr@demo.com')
  const [password, setPassword] = useState('demo123')
  const [err, setErr] = useState('')
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      const r = await api.post('/api/login', { email, password })
      // Store user in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(r.data.user))
      onLoggedIn?.(r.data.user)
      if (r.data.user.role === 'doctor') nav('/doctor')
      else nav('/patient')
    } catch (e) {
      setErr(e?.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark-100 mb-2">Welcome Back</h1>
              <p className="text-dark-300">Sign in to access your dashboard</p>
            </div>
            
            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
                <input 
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-400 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500" 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Password</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-dark-100 placeholder-dark-400 brand-ring transition-all duration-200 hover:border-slate-500 focus:border-brand-500" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
              
              {err && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-3 rounded-lg">
                  {err}
                </div>
              )}
              
              <button 
                type="submit"
                className="w-full btn-primary py-3 text-lg font-semibold"
              >
                Sign in
              </button>
            </form>

                   {/* Demo Accounts */}
                   <div className="mt-8 pt-6 border-t border-slate-700/50">
                     <h3 className="font-semibold text-dark-200 mb-4 text-center">Demo Accounts</h3>
                     <div className="space-y-3">
                       <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                         <div>
                           <span className="font-medium text-brand-300">Doctor:</span>
                           <div className="text-sm text-dark-300">dr@demo.com / demo123</div>
                         </div>
                         <div className="w-2 h-2 bg-brand-400 rounded-full"></div>
                       </div>
                       
                       {/* Patient Accounts */}
                       <div className="space-y-2">
                         <div className="text-xs text-dark-400 font-medium">Patients:</div>
                         <div className="grid grid-cols-2 gap-2 text-xs">
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
                         <div className="text-xs text-dark-500 text-center">All patients use password: demo123</div>
                       </div>
                     </div>
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
