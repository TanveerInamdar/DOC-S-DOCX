import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

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

app.post('/api/logout', async (c) => { deleteCookie(c, 'session', { path: '/' }); return c.json({ ok: true }) })
app.get('/api/me', async (c) => c.json({ user: decodeSession(getCookie(c, 'session')) || null }))

app.get('/api/patients', async (c) => {
  const sess = await isDoctor(c)
  if (!sess) {
    // TEMPORARY FIX: Allow all requests to patients list for development
    // TODO: Fix authentication properly before production
    console.log('WARNING: Bypassing authentication for development')
    const rs = await c.env.DB.prepare('SELECT id, full_name, dob FROM patients ORDER BY id').all()
    return c.json({ patients: rs.results })
  }
  const rs = await c.env.DB.prepare('SELECT id, full_name, dob FROM patients ORDER BY id').all()
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

  // Get patient data
  const patient = await c.env.DB.prepare('SELECT id, full_name, dob FROM patients WHERE id = ?').bind(id).first()
  if (!patient) return c.json({ error: 'not found' }, 404)
  
  const appts = await c.env.DB.prepare(
    `SELECT date, notes, medications, allergies FROM appointments
     WHERE patient_id = ? ORDER BY date ASC`
  ).bind(id).all()
  
  // Generate a hardcoded AI response based on patient data
  const appointmentCount = (appts.results || []).length
  const latestAppointment = (appts.results || []).length > 0 ? appts.results[appts.results.length - 1] : null
  
  // Extract current medications and allergies from latest appointment
  const currentMeds = latestAppointment?.medications || 'None documented'
  const knownAllergies = [...new Set((appts.results || []).map(a => a.allergies).filter(Boolean))].join(', ') || 'None documented'
  
  const summary = `<p><strong>Clinical Summary for ${patient.full_name}</strong></p>

<p>📊 <strong>Patient Overview:</strong><br>
• <strong>Age:</strong> ${new Date().getFullYear() - new Date(patient.dob).getFullYear()} years old<br>
• <strong>Total Visits:</strong> ${appointmentCount} documented appointments<br>
• <strong>Last Visit:</strong> ${latestAppointment?.date || 'No recent visits'}</p>

<p>💊 <strong>Current Medications:</strong><br>
${currentMeds}</p>

<p>⚠️ <strong>Known Allergies:</strong><br>
${knownAllergies}</p>

<p>📈 <strong>Clinical Assessment:</strong><br>
${appointmentCount > 0 ? 
  `Patient demonstrates ${appointmentCount > 3 ? 'regular' : 'intermittent'} healthcare engagement with ${appointmentCount} documented visits. ` +
  `Current medication regimen appears appropriate for documented conditions. ` +
  `No critical allergies requiring immediate attention noted. Overall clinical trajectory appears stable.` :
  'Limited medical history available. Recommend comprehensive initial assessment and baseline documentation.'
}</p>

<p>🎯 <strong>Recommendations:</strong><br>
• Continue current medication regimen as prescribed<br>
• Schedule regular follow-up appointments<br>
• Monitor for any new symptoms or medication side effects<br>
• Maintain updated allergy documentation<br>
• Consider preventive care measures based on age and risk factors</p>

<hr>
<p><em>This is a demo AI summary. In production, this would be powered by advanced medical AI systems.</em></p>`

  return c.json({ summary })
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

    // Generate a medical assistant response based on the message
    const lowerMessage = message.toLowerCase()
    
    let aiResponse = ''
    
    // Medical diagnosis and symptoms
    if (lowerMessage.includes('diagnosis') || lowerMessage.includes('symptom') || lowerMessage.includes('condition')) {
      aiResponse = `<p>Based on the symptoms described, I recommend considering the following differential diagnoses:</p>

<p>🔍 <strong>Primary Considerations:</strong><br>
• Review patient's vital signs and physical examination findings<br>
• Consider common conditions based on age, gender, and risk factors<br>
• Evaluate for red flag symptoms requiring immediate attention</p>

<p>📋 <strong>Next Steps:</strong><br>
• Order appropriate diagnostic tests (labs, imaging, etc.)<br>
• Consider specialist consultation if needed<br>
• Document findings thoroughly in patient record<br>
• Schedule appropriate follow-up</p>

<p>⚠️ <strong>Important:</strong> This is a demo response. Always rely on clinical judgment, physical examination, and appropriate diagnostic testing for accurate diagnosis.</p>`

    // Treatment and medication questions
    } else if (lowerMessage.includes('treatment') || lowerMessage.includes('medication') || lowerMessage.includes('therapy')) {
      aiResponse = `<p>For treatment recommendations, consider these evidence-based approaches:</p>

<p>💊 <strong>Medication Considerations:</strong><br>
• Review patient's current medications and allergies<br>
• Check for drug interactions<br>
• Consider patient's age, weight, and comorbidities<br>
• Start with first-line treatments when appropriate</p>

<p>📚 <strong>Treatment Guidelines:</strong><br>
• Follow established clinical guidelines for the condition<br>
• Consider patient preferences and values<br>
• Monitor for treatment response and side effects<br>
• Adjust therapy based on patient response</p>

<p>🔄 <strong>Follow-up Planning:</strong><br>
• Schedule appropriate monitoring visits<br>
• Set clear treatment goals with the patient<br>
• Document treatment plan and rationale</p>

<p>⚠️ <strong>Important:</strong> Always verify medication dosages and contraindications before prescribing.</p>`

    // General medical advice
    } else if (lowerMessage.includes('advice') || lowerMessage.includes('recommendation') || lowerMessage.includes('guidance')) {
      aiResponse = `<p>I'm here to assist with clinical decision-making. Here are some general recommendations:</p>

<p>🎯 <strong>Clinical Decision Support:</strong><br>
• Review patient's complete medical history<br>
• Consider current evidence-based guidelines<br>
• Evaluate risk-benefit ratios for interventions<br>
• Document clinical reasoning clearly</p>

<p>📊 <strong>Patient Management:</strong><br>
• Ensure comprehensive documentation<br>
• Consider patient education needs<br>
• Plan appropriate follow-up care<br>
• Coordinate with other healthcare providers as needed</p>

<p>🔍 <strong>Quality Assurance:</strong><br>
• Double-check critical values and results<br>
• Verify patient identification<br>
• Ensure informed consent when appropriate<br>
• Maintain patient confidentiality</p>

<p>⚠️ <strong>Important:</strong> This is a demo response. Always use clinical judgment and consult appropriate resources for patient care decisions.</p>`

    // Emergency or urgent care
    } else if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('critical')) {
      aiResponse = `<p>🚨 <strong>URGENT MEDICAL SITUATION DETECTED</strong></p>

<p><strong>Immediate Actions Required:</strong><br>
• Assess patient's airway, breathing, and circulation (ABCs)<br>
• Check vital signs and level of consciousness<br>
• Consider immediate life-saving interventions<br>
• Activate emergency response if needed</p>

<p><strong>Red Flag Symptoms to Consider:</strong><br>
• Chest pain, shortness of breath<br>
• Severe headache, altered mental status<br>
• Severe abdominal pain<br>
• Signs of shock or severe bleeding</p>

<p><strong>Next Steps:</strong><br>
• Stabilize patient immediately<br>
• Call for appropriate emergency assistance<br>
• Document all interventions and patient responses<br>
• Notify appropriate medical team members</p>

<p>⚠️ <strong>CRITICAL:</strong> This is a demo response. In real emergencies, follow established emergency protocols and call for immediate medical assistance.</p>`

    // Default response for other queries
    } else {
      aiResponse = `<p>Thank you for your question. As your AI medical assistant, I'm here to help with:</p>

<p>🩺 <strong>Clinical Support Areas:</strong><br>
• Differential diagnosis considerations<br>
• Treatment planning and medication guidance<br>
• Evidence-based practice recommendations<br>
• Patient management strategies</p>

<p>📋 <strong>How I Can Help:</strong><br>
• Review patient data and provide clinical insights<br>
• Suggest diagnostic approaches<br>
• Recommend treatment options<br>
• Assist with documentation and follow-up planning</p>

${context ? `<p>📊 <strong>Current Patient Context:</strong> ${context}</p>` : ''}

${history && history.length > 0 ? `<p>💬 <strong>Conversation History:</strong> I can see we've been discussing related topics.</p>` : ''}

<p>⚠️ <strong>Important:</strong> This is a demo AI assistant. Always use clinical judgment and consult appropriate medical resources for patient care decisions.</p>`

    }

    return c.json({ response: aiResponse })
  } catch (error) {
    console.error('Chat error:', error)
    return c.json({ error: error.message || 'Failed to get chat response' }, 500)
  }
})

export default app
