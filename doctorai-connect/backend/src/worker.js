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
  setCookie(c, 'session', encodeSession(session), { httpOnly: true, sameSite: 'Lax', path: '/' })
  return c.json({ ok: true, user: { id: user.id, role: user.role, name: user.name, email: user.email, patientId, doctorId } })
})

app.post('/api/logout', async (c) => { deleteCookie(c, 'session', { path: '/' }); return c.json({ ok: true }) })
app.get('/api/me', async (c) => c.json({ user: decodeSession(getCookie(c, 'session')) || null }))

app.get('/api/patients', async (c) => {
  const sess = await isDoctor(c); if (!sess) return c.json({ error: 'forbidden' }, 403)
  const rs = await c.env.DB.prepare('SELECT id, full_name, dob FROM patients ORDER BY id').all()
  return c.json({ patients: rs.results })
})

app.get('/api/patients/:id', async (c) => {
  const sess = await requireSession(c); if (!sess || !sess.userId) return
  const id = Number(c.req.param('id')); if (Number.isNaN(id)) return c.json({ error: 'bad id' }, 400)
  if (sess.role === 'patient' && sess.patientId !== id) return c.json({ error: 'forbidden' }, 403)

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

  const appts = await c.env.DB.prepare(
      `SELECT date, notes, medications, allergies FROM appointments
     WHERE patient_id = ? ORDER BY date ASC`
  ).bind(id).all()
  const lines = (appts.results || []).map(r => `Date: ${r.date}
Notes: ${r.notes}
Medications: ${r.medications}
Allergies: ${r.allergies}`).join('\n\n')

  if (!c.env.AI) return c.json({ summary: 'Workers AI not available in this environment.' })
  const system = 'You are a medical scribe generating a brief, non diagnostic summary for a doctor. Use bullet points and keep it under 150 words. Include trends, meds, and allergies.'
  const user = `Patient history:\n\n${lines}\n\nCreate a crisp summary.`
  const resp = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    max_tokens: 300
  })
  const summary = resp?.response || 'No summary.'
  return c.json({ summary })
})

export default app
