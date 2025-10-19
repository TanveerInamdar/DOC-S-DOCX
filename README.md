# DOC'S DOCX

A modern medical portal application that connects doctors and patients with AI-powered medical summaries and real-time chat assistance.

## 🚀 Features

### For Doctors
- **Patient Management**: View and manage patient records
- **Appointment Scheduling**: Add and track patient appointments
- **AI Medical Summaries**: Generate comprehensive patient summaries using Cloudflare Workers AI
- **AI Medical Copilot**: Real-time chat assistance powered by Google Gemini AI
- **Patient Records Lookup**: Search and view detailed patient histories

### For Patients
- **Secure Login**: Access personal medical records
- **Appointment History**: View past appointments and medical notes
- **Medication Tracking**: See current medications and allergies
- **Privacy Protection**: Only access your own medical data

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Cloudflare Workers** (serverless)
- **Hono** web framework
- **Cloudflare D1** (SQLite database)
- **Cloudflare Workers AI** (Llama 2 7B for patient summaries)
- **Google Gemini AI** (for medical copilot chat)

### Database
- **SQLite** via Cloudflare D1
- **Tables**: users, patients, doctors, appointments

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd doctorai-connect
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configure environment**
   
   Update `backend/wrangler.toml` with your Cloudflare settings:
   ```toml
   [vars]
   GEMINI_API_KEY = "your-gemini-api-key"
   CORS_ORIGINS = "http://127.0.0.1:5173,http://localhost:5173"
   ```

4. **Set up database**
   ```bash
   cd backend
   npx wrangler d1 execute doctorai --file=schema.sql
   ```

5. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npx wrangler dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8787

## 🎯 Demo Instructions

### Demo Accounts

The application comes with pre-configured demo accounts:

#### Doctor Account
- **Email**: `dr@demo.com`
- **Password**: `demo123`
- **Access**: Full doctor dashboard with patient management

#### Patient Accounts
- **Email**: `pat6@demo.com` (Maria Garcia)
- **Password**: `demo123`
- **Access**: Personal medical records only

**Other Patient Accounts Available:**
- `pat@demo.com` - Alex Patient
- `pat2@demo.com` - Sarah Johnson  
- `pat3@demo.com` - Michael Chen
- `pat4@demo.com` - Emily Rodriguez
- `pat5@demo.com` - James Wilson
- `pat6@demo.com` - Maria Garcia
- `pat8@demo.com` - Karthick Jayakumar
- `pat9@demo.com` - David Thompson
- `pat10@demo.com` - Lisa Anderson
- `pat11@demo.com` - Robert Martinez

### Demo Walkthrough

#### 1. Doctor Dashboard Demo

1. **Login as Doctor**
   - Go to http://localhost:5173
   - Click "Login"
   - Use: `dr@demo.com` / `demo123`

2. **Navigate to Patients**
   - Click "Patients" in the header
   - View the patient list with search functionality

3. **Select a Patient**
   - Click on "Sarah Johnson" or any patient
   - View their medical information, appointments, and history

4. **Test AI Features**
   - **AI Summary**: Click "Generate AI Summary" to see Cloudflare Workers AI in action
   - **AI Copilot**: Use the chat interface on the right to ask medical questions

5. **Add Appointment**
   - Click "Add Appointment" in the header
   - Fill out appointment details and save

#### 2. Patient Dashboard Demo

1. **Login as Patient**
   - Go to http://localhost:5173
   - Click "Login"
   - Use: `pat6@demo.com` / `demo123`

2. **View Medical Records**
   - See personal information and patient ID
   - View past appointments with notes and medications
   - Check current medications and allergies

3. **Security Test**
   - Try accessing other patient data (will be blocked)
   - Only your own records are accessible

#### 3. AI Features Demo

**AI Medical Summary (Cloudflare Workers AI)**
- Uses Llama 2 7B model
- Generates comprehensive patient summaries
- Includes clinical assessments and recommendations

**AI Medical Copilot (Google Gemini)**
- Real-time medical chat assistance
- Provides clinical decision support
- Concise, evidence-based responses
- Plain text format for easy reading

### Demo Scenarios

#### Scenario 1: New Patient Consultation
1. Login as doctor
2. Select a patient with existing records
3. Generate AI summary for quick overview
4. Use AI copilot to ask about treatment options
5. Add new appointment with notes

#### Scenario 2: Patient Record Review
1. Login as patient
2. Review appointment history
3. Check current medications
4. Verify allergy information
5. Contact doctor if needed

#### Scenario 3: AI-Assisted Diagnosis
1. Login as doctor
2. Select patient with symptoms
3. Use AI copilot to explore differential diagnoses
4. Generate AI summary for comprehensive view
5. Plan treatment approach

## 🔧 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration
- `POST /api/logout` - User logout
- `GET /api/me` - Get current user

### Patients
- `GET /api/patients` - List patients (doctors only)
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients/:id/ai-summary` - Generate AI summary

### Appointments
- `POST /api/appointments` - Create appointment (doctors only)

### AI Chat
- `POST /api/chat` - AI copilot chat

## 🔒 Security Features

- **Role-based Access Control**: Doctors and patients have different permissions
- **Data Isolation**: Patients can only access their own records
- **Session Management**: Secure cookie-based authentication
- **CORS Protection**: Configured for specific origins
- **Input Validation**: All inputs are validated and sanitized

## 🚀 Deployment

### Cloudflare Workers Deployment

1. **Configure Cloudflare**
   ```bash
   npx wrangler login
   ```

2. **Deploy Database**
   ```bash
   npx wrangler d1 create doctorai
   npx wrangler d1 execute doctorai --file=schema.sql --remote
   ```

3. **Deploy Worker**
   ```bash
   npx wrangler deploy
   ```

4. **Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   # Deploy to your preferred hosting service
   ```

## 📊 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_plain TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'patient')),
    name TEXT NOT NULL
);

-- Patients table
CREATE TABLE patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    dob TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Doctors table
CREATE TABLE doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    specialization TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Appointments table
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    medications TEXT,
    allergies TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
```

## 🤖 AI Models Used

### Cloudflare Workers AI
- **Model**: `@cf/meta/llama-2-7b-chat-int8`
- **Purpose**: Patient medical summaries
- **Features**: Clinical assessments, recommendations, professional formatting

### Google Gemini AI
- **Model**: `gemini-2.5-flash`
- **Purpose**: Real-time medical chat assistance
- **Features**: Clinical decision support, evidence-based responses

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS_ORIGINS in wrangler.toml includes your frontend URL

2. **Database Connection**
   - Verify D1 database is created and schema is applied
   - Check database_id in wrangler.toml

3. **AI API Errors**
   - Verify GEMINI_API_KEY is set correctly
   - Check Cloudflare Workers AI binding is configured

4. **Authentication Issues**
   - Clear browser cookies and try again
   - Check session cookie settings

### Development Tips

- Use `npx wrangler dev` for local development
- Check browser console for frontend errors
- Monitor Cloudflare Workers logs for backend issues
- Use `npx wrangler d1 execute doctorai --command="SELECT * FROM users"` to check database

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**DOC'S DOCX** - Modernizing healthcare with AI-powered medical management.
