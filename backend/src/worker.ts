import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { setCookie, getCookie } from 'hono/cookie';
import { z } from 'zod';
import type { D1Database, Ai } from '@cloudflare/workers-types';

// ---- Type definitions for environment bindings ----
type Bindings = {
  DB: D1Database;
  AI: Ai;
  JWT_SECRET: string;
};

// ---- Initialize Hono app ----
const app = new Hono<{ Bindings: Bindings }>();

// ---- Utility helper to bypass D1 type strictness ----
const getDB = (c: any) => c.env.DB as any;

// FIXED CORS setup for Hono v4+
app.use(
    '*',
    async (c, next) => {
      const corsMiddleware = cors({
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8787'],
        credentials: true,
        allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
        exposeHeaders: ['Set-Cookie'],
      });
      return corsMiddleware(c, next);
    }
);


// ---- Health check (public) ----
app.get('/api/health', (c) =>
    c.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ---- Admin: fix seed passwords (public) ----
app.post('/api/admin/fix-seed-passwords', async (c) => {
  const body = await c.req.json();
  if (body.key !== 'let-me-fix') return c.json({ error: 'Unauthorized' }, 401);

  const demoHash = hashPassword('demo123');

  await getDB(c)
      .prepare('UPDATE users SET password_hash = ? WHERE email = ?')
      .bind(demoHash, 'dr@demo.com')
      .run();

  await getDB(c)
      .prepare('UPDATE users SET password_hash = ? WHERE email = ?')
      .bind(demoHash, 'pat@demo.com')
      .run();

  return c.json({ message: 'Seed passwords updated' });
});

// ---- Login (public) ----
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);

    const stmt = getDB(c).prepare('SELECT * FROM users WHERE email = ?');
    const user = (await stmt.bind(email).first()) as any;

    if (!user || !verifyPassword(password, user.password_hash))
      return c.json({ error: 'Invalid credentials' }, 401);

    const token = `demo-token-${user.id}-${user.role}`;
    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (err: any) {
    return c.json({ error: 'Invalid request: ' + err.message }, 400);
  }
});

// ---- Logout (public) ----
app.post('/api/auth/logout', (c) => {
  setCookie(c, 'token', '', { maxAge: 0 });
  return c.json({ message: 'Logged out' });
});

// ---- Auth middleware ----
app.use('/api/*', async (c, next) => {
  // Skip auth for public endpoints
  const path = c.req.path;
  if (path === '/api/health' || path === '/api/auth/login' || path === '/api/auth/logout' || path === '/api/admin/fix-seed-passwords') {
    await next();
    return;
  }

  const token = getCookie(c, 'token');
  console.log('Auth middleware token:', token);
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const parts = token.split('-');
  if (parts.length !== 4 || parts[0] !== 'demo' || parts[1] !== 'token')
    return c.json({ error: 'Invalid token' }, 401);

  const userId = parseInt(parts[2]);
  const role = parts[3];
  c.set('jwtPayload', { userId, role });
  await next();
});

// ---- Zod validation schemas ----
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const appointmentSchema = z.object({
  patient_id: z.number(),
  doctor_id: z.number(),
  date: z.string(),
  notes: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),
});

// ---- Password helpers ----
function hashPassword(password: string): string {
  return btoa(password + 'salt');
}
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// ---- Protected Routes ----

// Get current user
app.get('/api/auth/me', async (c) => {
  const payload = c.get('jwtPayload') as any;
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);

  const stmt = getDB(c).prepare('SELECT * FROM users WHERE id = ?');
  const user = (await stmt.bind(payload.userId).first()) as any;

  if (!user) return c.json({ error: 'User not found' }, 404);

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
  });
});

// Get all patients (doctor only)
app.get('/api/patients', async (c) => {
  const payload = c.get('jwtPayload') as any;
  if (!payload || payload.role !== 'doctor')
    return c.json({ error: 'Unauthorized' }, 401);

  const stmt = getDB(c).prepare(`
    SELECT p.*, u.email
    FROM patients p
           JOIN users u ON p.user_id = u.id
  `);
  const patients = await stmt.all();
  return c.json({ patients });
});

// Get patient by ID
app.get('/api/patients/:id', async (c) => {
  const payload = c.get('jwtPayload') as any;
  const patientId = parseInt(c.req.param('id'));

  if (!payload) return c.json({ error: 'Unauthorized' }, 401);

  // Patients can only see their own data
  if (payload.role === 'patient') {
    const patientStmt = getDB(c).prepare('SELECT * FROM patients WHERE user_id = ?');
    const patient = (await patientStmt.bind(payload.userId).first()) as any;
    
    if (!patient || patient.id !== patientId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }

  const stmt = getDB(c).prepare(`
    SELECT p.*, u.email
    FROM patients p
           JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `);
  const patient = (await stmt.bind(patientId).first()) as any;

  if (!patient) return c.json({ error: 'Patient not found' }, 404);

  return c.json({ patient });
});

// Get appointments for a patient
app.get('/api/patients/:id/appointments', async (c) => {
  const payload = c.get('jwtPayload') as any;
  const patientId = parseInt(c.req.param('id'));

  if (!payload) return c.json({ error: 'Unauthorized' }, 401);

  // Patients can only see their own appointments
  if (payload.role === 'patient') {
    const patientStmt = getDB(c).prepare('SELECT * FROM patients WHERE user_id = ?');
    const patient = (await patientStmt.bind(payload.userId).first()) as any;
    
    if (!patient || patient.id !== patientId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }

  const stmt = getDB(c).prepare(`
    SELECT a.*, d.full_name as doctor_name, d.specialization
    FROM appointments a
           JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = ?
    ORDER BY a.date DESC
  `);
  const appointments = await stmt.bind(patientId).all();

  return c.json({ appointments });
});

// Create new appointment (doctor only)
app.post('/api/appointments', async (c) => {
  const payload = c.get('jwtPayload') as any;
  if (!payload || payload.role !== 'doctor') {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const appointment = appointmentSchema.parse(body);

    const stmt = getDB(c).prepare(`
      INSERT INTO appointments (patient_id, doctor_id, date, notes, medications, allergies)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      appointment.patient_id,
      appointment.doctor_id,
      appointment.date,
      appointment.notes || '',
      appointment.medications || '',
      appointment.allergies || ''
    ).run();

    return c.json({ 
      appointment: {
        id: result.meta.last_row_id,
        ...appointment
      }
    }, 201);
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// Update appointment (doctor only)
app.put('/api/appointments/:id', async (c) => {
  const payload = c.get('jwtPayload') as any;
  if (!payload || payload.role !== 'doctor') {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const appointmentId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const updates = appointmentSchema.partial().parse(body);

    const stmt = getDB(c).prepare(`
      UPDATE appointments 
      SET patient_id = COALESCE(?, patient_id),
          doctor_id = COALESCE(?, doctor_id),
          date = COALESCE(?, date),
          notes = COALESCE(?, notes),
          medications = COALESCE(?, medications),
          allergies = COALESCE(?, allergies)
      WHERE id = ?
    `);
    
    await stmt.bind(
      updates.patient_id,
      updates.doctor_id,
      updates.date,
      updates.notes,
      updates.medications,
      updates.allergies,
      appointmentId
    ).run();

    return c.json({ message: 'Appointment updated' });
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// AI Summary (doctor/patient)
app.get('/api/patients/:id/ai-summary', async (c) => {
  const payload = c.get('jwtPayload') as any;
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);

  const patientId = parseInt(c.req.param('id'));

  // Patients can only see their own summary
  if (payload.role === 'patient') {
    const patientStmt = getDB(c).prepare('SELECT * FROM patients WHERE user_id = ?');
    const patient = (await patientStmt.bind(payload.userId).first()) as any;
    
    if (!patient || patient.id !== patientId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }

  try {
    // Get patient info
    const patientStmt = getDB(c).prepare(`
      SELECT p.*, u.email
      FROM patients p
             JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `);
    const patient = (await patientStmt.bind(patientId).first()) as any;

    if (!patient) return c.json({ error: 'Patient not found' }, 404);

    // Get all appointments
    const appointmentsStmt = getDB(c).prepare(`
      SELECT a.*, d.full_name as doctor_name, d.specialization
      FROM appointments a
             JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = ?
      ORDER BY a.date DESC
    `);
    const appointments = await appointmentsStmt.bind(patientId).all();

    // Prepare data for AI
    const patientData = {
      name: patient.full_name,
      dob: patient.dob,
      appointments: appointments.map((apt: any) => ({
        date: apt.date,
        doctor: apt.doctor_name,
        specialization: apt.specialization,
        notes: apt.notes,
        medications: apt.medications,
        allergies: apt.allergies
      }))
    };

    // Create prompt for AI
    const prompt = `Please provide a comprehensive medical summary for ${patientData.name} (DOB: ${patientData.dob}). 

Appointment History:
${patientData.appointments.map((apt: any) => `
Date: ${apt.date}
Doctor: ${apt.doctor} (${apt.specialization})
Notes: ${apt.notes}
Medications: ${apt.medications}
Allergies: ${apt.allergies}
`).join('\n')}

Please summarize:
1. Key medical conditions and concerns
2. Current medications and their purposes
3. Known allergies and sensitivities
4. Recent trends or patterns in health
5. Recommendations for ongoing care

Keep the summary professional, concise, and easy to understand.`;

    // Call Cloudflare Workers AI
    const aiResponse = await (c.env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000
    });

    return c.json({
      summary: (aiResponse as any).response,
      patient: patientData
    });

  } catch (error) {
    console.error('AI Summary error:', error);
    return c.json({ error: 'Failed to generate AI summary' }, 500);
  }
});

export default app;
