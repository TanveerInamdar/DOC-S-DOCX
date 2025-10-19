Skip to content
Navigation Menu
TanveerInamdar
DOC-S-DOCX

Type / to search
Code
Issues
Pull requests
Actions
Projects
Wiki
Security
1
Insights
Settings
DOC-S-DOCX
/
README.md
in
main

Edit

Preview
Indent mode

Spaces
Indent size

2
Line wrap mode

No wrap
Editing README.md file contents
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
# DOCS DOCX — Doctor AI App

AI powered doctor patient platform for unified medical records and instant medical history summaries. DOCS DOCX enables doctors to securely access a patient’s complete medical history across multiple clinics while patients can view their history in a read only mode. The platform is built for hackathon scale efficiency on Cloudflare Workers, with AI summaries powered by Cloudflare Workers AI.

---

## 🚀 Features

### Dual Roles
- **Doctor**: Full access to patient history, appointments, notes, and reports
- **Patient**: Read only access to personal medical records

### AI Summary
- Automatically summarizes all past appointments and doctor notes for quick insights

### Secure Auth
- Cookie based authentication (optional Clerk integration)

### View Reports
- Doctors and patients can view uploaded lab or test reports (stored in R2)

### Extensible
- Architecture allows future additions like OCR and text to speech

---

## 🧱 Tech Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React + Vite |
| Backend   | Hono (Cloudflare Worker) |
| Database  | Cloudflare D1 (SQLite on the edge) |
| Storage   | Cloudflare R2 |
| AI        | Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`) |
| Auth (optional) | Clerk |
| Dev Tooling | Wrangler |

---

## 🏗️ Architecture Overview

```text
[ React (Vite) UI ]
        |
        v
[ Hono API — Cloudflare Worker ]
        |
  +-----+------+
  |            |
  v            v
[D1 Database] [R2 Storage]
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

Create a .env file:

CLERK_SECRET_KEY=<your_clerk_key_if_using_auth>
CORS_ORIGINS=http://localhost:5173
JWT_SECRET=local_dev_secret

4. Configure wrangler.toml
name = "docs-docx"
compatibility_date = "2024-10-01"

[vars]
CORS_ORIGINS = "http://localhost:5173"

[[d1_databases]]
binding = "DB"
database_name = "DOCS_DB"
database_id = "<your_d1_id>"

[[r2_buckets]]
binding = "R2"
Built at HackTX 2025
Use Control + Shift + m to toggle the tab key moving focus. Alternatively, use esc then tab to move to the next interactive element on the page.
No file chosen
Attach files by dragging & dropping, selecting or pasting them.
New File at / · TanveerInamdar/DOC-S-DOCX 
