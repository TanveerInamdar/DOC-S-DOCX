🩺 DOCS - Doctor AI App

AI powered doctor patient platform for unified medical records and instant summaries.

DOCS enables doctors to securely access a patient’s complete medical history (appointments, notes, medications, allergies, and reports) across multiple clinics, while patients can view their history in a read only mode.
Built for hackathon scale efficiency and extensibility on Cloudflare Workers, with AI summaries powered by Cloudflare Workers AI.

🚀 Features

Dual Roles

Doctor, full access to patient records, can add or edit appointments and notes.

Patient, read only access to personal medical history.

AI Summary

Automatically summarizes all past appointments and notes for quick insights.

Secure Auth

User sessions with cookie based authentication (optional, Clerk integration).

View Reports

Patients and doctors can view uploaded lab or test reports.

Extensible

Designed for future integration with Gemini for OCR and ElevenLabs for text to speech.

🧱 Tech Stack
Layer	Tech
Frontend	React + Vite
Backend	Hono (Cloudflare Worker)
Database	Cloudflare D1 (SQLite on edge)
Storage	Cloudflare R2
AI	Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct)
Auth (optional)	Clerk
Runtime	Local dev with Wrangler
🏗️ Architecture Overview
[ React (Vite) UI ]
        |
        v
[ Hono API on Cloudflare Worker ]
        |
 +------+-------+
 |              |
 v              v
[D1 Database]  [R2 Storage]
        |
        v
[Workers AI] -> Summarizes history and notes

⚙️ Local Setup
1. Clone the repo
git clone https://github.com/TanveerInamdar/DOC-S-DOCX
cd DOC-S-DOCX

2. Install dependencies
npm install

3. Add environment variables

Create a .env file in the project root:

CLERK_SECRET_KEY=<your_clerk_key_if_using_auth>
CORS_ORIGINS=http://localhost:5173
JWT_SECRET=local_dev_secret

4. Configure wrangler.toml
name = "docs"
compatibility_date = "2024-10-01"

[vars]
CORS_ORIGINS = "http://localhost:5173"

[[d1_databases]]
binding = "DB"
database_name = "DOCS_DB"
database_id = "<your_d1_id>"

[[r2_buckets]]
binding = "R2"
bucket_name = "docs-reports"

5. Start backend
npx wrangler dev


This starts your Cloudflare Worker at http://127.0.0.1:8787

6. Start frontend
cd frontend
npm run dev


Open http://localhost:5173

🧪 API Overview
Endpoint	Method	Description
/api/health	GET	Health check
/api/patients/me	GET	Fetch current user record
/api/appointments	POST	Add new appointment
/api/summary/:id	GET	Get AI medical summary
/api/reports	GET	List test reports
🧠 AI Summary Flow

Collect all past appointments, doctor notes, medications, and allergies from D1.

Combine and send them as a text prompt to Workers AI (Llama 3.1).

Store the generated summary back into D1 or cache for reuse.

Display it under the AI Summary tab in the doctor dashboard.

🪄 Future Enhancements

OCR test reports using Gemini Flash 2.0.

Text to speech doctor notes via ElevenLabs API.

Secure federated login with Clerk or Cloudflare Access.

Notifications via Cloudflare Queues.

🧰 Developer Notes

Backend framework, Hono with cookie based sessions.

AI calls, via env.AI.run using Workers AI bindings.

Database, uses D1 SQL commands (c.env.DB.prepare().bind().run()).

Test locally, Workers emulate Cloudflare APIs via wrangler dev.

Deployment, npx wrangler deploy.

🧾 License

MIT License © 2025 Team DOCS
Built at HackTX 2025 🎓

🙌 Contributors
