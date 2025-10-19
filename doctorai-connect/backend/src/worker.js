import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { GoogleGenerativeAI } from '@google/generative-ai'

const app = new Hono()

app.use('*', async (c, next) => {
  const origins = (c.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s => s.trim())
  return cors({ origin: origins, credentials: true })(c, next)
})

function encodeSession(data) { return btoa(JSON.stringify(data)) }
function decodeSession(raw) { try { return raw ? JSON.parse(atob(raw)) : null } catch { return null } }
async function requireSession(c) { const s = decodeSession(getCookie(c, 'session')); if (!s) return c.json({ error: 'unauthorized' }, 401); return s }
async function isDoctor(c) { const s = decodeSession(getCookie(c, 'session')); return s && s.role === 'doctor' ? s : null }

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/debug', async (c) => {
  const cookies = getCookie(c, 'session')
  const session = decodeSession(cookies)
  return c.json({ 
    hasCookie: !!cookies,
    session: session,
    headers: {
      origin: c.req.header('Origin'),
      cookie: c.req.header('Cookie')
    }
  })
})

app.post('/api/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}))
  if (!email || !password) return c.json({ error: 'email and password required' }, 400)
  const user = await c.env.DB.prepare('SELECT id, email, password_plain, role, name FROM users WHERE email = ?').bind(email).first()
  if (!user || user.password_plain !== password) return c.json({ error: 'invalid credentials' }, 401)

  let patientId = null, doctorId = null
  if (user.role === 'patient') {
    const p = await c.env.DB.prepare('SELECT id FROM patients WHERE user_id = ?').bind(user.id).first()
    patientId = p?.id ?? null
  } else {
    const d = await c.env.DB.prepare('SELECT id FROM doctors WHERE user_id = ?').bind(user.id).first()
    doctorId = d?.id ?? null
  }
  const session = { userId: user.id, role: user.role, patientId, doctorId, name: user.name, email: user.email }
  setCookie(c, 'session', encodeSession(session), { 
    httpOnly: false,  // Allow JavaScript to read it
    sameSite: 'Lax', 
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  })
  return c.json({ ok: true, user: { id: user.id, role: user.role, name: user.name, email: user.email, patientId, doctorId } })
})

app.post('/api/signup', async (c) => {
  const { email, password, name, role, fullName, dob, specialization, doctorId } = await c.req.json().catch(() => ({}))
  
  if (!email || !password || !name || !role) {
    return c.json({ error: 'email, password, name, and role are required' }, 400)
  }
  
  if (!['doctor', 'patient'].includes(role)) {
    return c.json({ error: 'role must be doctor or patient' }, 400)
  }
  
  // Check if email already exists
  const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existingUser) {
    return c.json({ error: 'email already exists' }, 400)
  }
  
  try {
    // Create user
    const userResult = await c.env.DB.prepare(
      'INSERT INTO users (email, password_plain, role, name) VALUES (?, ?, ?, ?)'
    ).bind(email, password, role, name).run()
    
    const userId = userResult.meta.last_row_id
    
    let patientId = null, doctorId_result = null
    
    if (role === 'doctor') {
      // Create doctor record
      const doctorResult = await c.env.DB.prepare(
        'INSERT INTO doctors (user_id, full_name, specialization) VALUES (?, ?, ?)'
      ).bind(userId, fullName || name, specialization || 'General Practice').run()
      
      doctorId_result = doctorResult.meta.last_row_id
    } else if (role === 'patient') {
      // Create patient record
      const patientResult = await c.env.DB.prepare(
        'INSERT INTO patients (user_id, doctor_id, full_name, dob) VALUES (?, ?, ?, ?)'
      ).bind(userId, doctorId || null, fullName || name, dob || null).run()
      
      patientId = patientResult.meta.last_row_id
    }
    
    // Create session
    const session = { userId, role, patientId, doctorId: doctorId_result, name, email }
    setCookie(c, 'session', encodeSession(session), { 
      httpOnly: false,
      sameSite: 'Lax', 
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })
    
    return c.json({ 
      ok: true, 
      user: { id: userId, role, name, email, patientId, doctorId: doctorId_result } 
    })
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ error: 'failed to create account' }, 500)
  }
})

app.post('/api/logout', async (c) => { deleteCookie(c, 'session', { path: '/' }); return c.json({ ok: true }) })
app.get('/api/me', async (c) => c.json({ user: decodeSession(getCookie(c, 'session')) || null }))

app.get('/api/doctors', async (c) => {
  try {
    const doctors = await c.env.DB.prepare(
      'SELECT d.id, d.full_name, d.specialization, u.email FROM doctors d JOIN users u ON d.user_id = u.id ORDER BY d.full_name'
    ).all()
    
    return c.json({ doctors: doctors.results || [] })
  } catch (error) {
    console.error('Failed to fetch doctors:', error)
    return c.json({ error: 'failed to fetch doctors' }, 500)
  }
})

app.get('/api/patients', async (c) => {
  const sess = await isDoctor(c)
  if (!sess) {
    // TEMPORARY: Allow all requests for testing, but log the issue
    console.log('WARNING: Authentication failed, allowing all patients for testing')
    const rs = await c.env.DB.prepare('SELECT id, full_name, dob FROM patients ORDER BY id').all()
    return c.json({ patients: rs.results })
  }
  
  // Filter patients by doctor - each doctor only sees their own patients
  const rs = await c.env.DB.prepare(
    'SELECT id, full_name, dob FROM patients WHERE doctor_id = ? ORDER BY id'
  ).bind(sess.doctorId).all()
  
  return c.json({ patients: rs.results })
})

app.get('/api/patients/:id', async (c) => {
  // TEMPORARY: Bypass auth check for development
  // const sess = await requireSession(c); if (!sess || !sess.userId) return
  const id = Number(c.req.param('id')); if (Number.isNaN(id)) return c.json({ error: 'bad id' }, 400)
  // if (sess.role === 'patient' && sess.patientId !== id) return c.json({ error: 'forbidden' }, 403)

  const patient = await c.env.DB.prepare('SELECT id, full_name, dob FROM patients WHERE id = ?').bind(id).first()
  if (!patient) return c.json({ error: 'not found' }, 404)
  const appts = await c.env.DB.prepare(
      `SELECT a.id, a.date, a.notes, a.medications, a.allergies, d.full_name AS doctor_name
     FROM appointments a JOIN doctors d ON d.id = a.doctor_id
     WHERE a.patient_id = ? ORDER BY date DESC`
  ).bind(id).all()
  return c.json({ patient, appointments: appts.results })
})

app.post('/api/appointments', async (c) => {
  const sess = await isDoctor(c); if (!sess) return c.json({ error: 'forbidden' }, 403)
  const { patient_id, date, notes, medications, allergies } = await c.req.json().catch(() => ({}))
  if (!patient_id || !date) return c.json({ error: 'patient_id and date required' }, 400)
  const info = await c.env.DB.prepare(
      `INSERT INTO appointments (patient_id, doctor_id, date, notes, medications, allergies)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(patient_id, sess.doctorId, date, notes || '', medications || '', allergies || '').run()
  return c.json({ ok: true, id: info.lastRowId })
})

app.post('/api/patients/:id/ai-summary', async (c) => {
  const sess = await requireSession(c); if (!sess) return
  const id = Number(c.req.param('id')); if (Number.isNaN(id)) return c.json({ error: 'bad id' }, 400)
  if (sess.role === 'patient' && sess.patientId !== id) return c.json({ error: 'forbidden' }, 403)

  try {
    // Get patient data
    const patient = await c.env.DB.prepare('SELECT id, full_name, dob FROM patients WHERE id = ?').bind(id).first()
    if (!patient) return c.json({ error: 'not found' }, 404)
    
    const appts = await c.env.DB.prepare(
      `SELECT date, notes, medications, allergies FROM appointments
       WHERE patient_id = ? ORDER BY date ASC`
    ).bind(id).all()
    
    // Prepare data for Workers AI
    const appointmentCount = (appts.results || []).length
    const appointmentsData = (appts.results || []).map(apt => ({
      date: apt.date,
      notes: apt.notes,
      medications: apt.medications,
      allergies: apt.allergies
    }))
    
    // Use Cloudflare Workers AI for patient summary
    const prompt = `You are a medical AI assistant. Generate a comprehensive clinical summary for the following patient:

Patient Information:
- Name: ${patient.full_name}
- Date of Birth: ${patient.dob}
- Age: ${new Date().getFullYear() - new Date(patient.dob).getFullYear()} years old

Appointment History (${appointmentCount} total visits):
${appointmentsData.map((apt, i) => `
Visit ${i + 1} (${apt.date}):
- Notes: ${apt.notes || 'None'}
- Medications: ${apt.medications || 'None'}
- Allergies: ${apt.allergies || 'None'}
`).join('')}

Please provide a professional medical summary that includes:
1. Patient overview and demographics
2. Current medications and known allergies
3. Clinical assessment based on visit history
4. Evidence-based recommendations for ongoing care
5. Any red flags or areas requiring attention

Format the response in HTML with proper medical terminology and professional formatting. Include appropriate medical disclaimers.`

    // Use Cloudflare Workers AI binding
    const response = await c.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI assistant helping healthcare professionals generate clinical summaries.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const summary = response.response || 'Unable to generate summary at this time.'

    return c.json({ summary })
  } catch (error) {
    console.error('Workers AI summary error:', error)
    return c.json({ error: 'Failed to generate AI summary' }, 500)
  }
})

app.post('/api/chat', async (c) => {
  // TEMPORARY: Allow chat without strict authentication for development
  const sess = decodeSession(getCookie(c, 'session'))
  if (!sess) {
    console.log('WARNING: Chat accessed without authentication')
  }
  
  try {
    const { message, context, history } = await c.req.json()
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400)
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    // Build context for the AI
    let contextPrompt = `You are a medical AI assistant helping healthcare professionals with clinical decision support. 
    
User Question: ${message}

${context ? `Current Patient Context: ${context}` : ''}

${history && history.length > 0 ? `Previous conversation history: ${JSON.stringify(history.slice(-5))}` : ''}

Please provide a helpful, evidence-based medical response. Include:
- Clinical considerations
- Evidence-based recommendations
- Important disclaimers about AI assistance

CRITICAL: Respond ONLY in plain text. Do NOT use HTML tags, markdown, or any formatting. Use simple line breaks and dashes (-) for bullet points. Keep responses under 200 words.`

    const result = await model.generateContent(contextPrompt)
    const response = await result.response
    const aiResponse = response.text()

    return c.json({ response: aiResponse })
  } catch (error) {
    console.error('Gemini chat error:', error)
    return c.json({ error: error.message || 'Failed to get chat response' }, 500)
  }
})

export default app
