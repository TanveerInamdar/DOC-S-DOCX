CREATE TABLE IF NOT EXISTS users (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     email TEXT UNIQUE NOT NULL,
                                     password_plain TEXT NOT NULL,
                                     role TEXT NOT NULL CHECK (role IN ('doctor', 'patient')),
    name TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS patients (
                                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                                        user_id INTEGER NOT NULL,
                                        full_name TEXT NOT NULL,
                                        dob TEXT,
                                        FOREIGN KEY (user_id) REFERENCES users(id)
    );

CREATE TABLE IF NOT EXISTS doctors (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       user_id INTEGER NOT NULL,
                                       full_name TEXT NOT NULL,
                                       specialization TEXT,
                                       FOREIGN KEY (user_id) REFERENCES users(id)
    );

CREATE TABLE IF NOT EXISTS appointments (
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

INSERT OR IGNORE INTO users (id, email, password_plain, role, name) VALUES
  (1, 'dr@demo.com',  'demo123', 'doctor',  'Dr. Rivera'),
  (2, 'pat@demo.com', 'demo123', 'patient', 'Alex Patient'),
  (3, 'patient2@demo.com', 'demo123', 'patient', 'Sarah Johnson'),
  (4, 'patient3@demo.com', 'demo123', 'patient', 'Michael Chen'),
  (5, 'patient4@demo.com', 'demo123', 'patient', 'Emily Rodriguez'),
  (6, 'patient5@demo.com', 'demo123', 'patient', 'James Wilson'),
  (7, 'patient6@demo.com', 'demo123', 'patient', 'Maria Garcia');

INSERT OR IGNORE INTO doctors (id, user_id, full_name, specialization) VALUES
  (1, 1, 'Dr. Rivera', 'Internal Medicine');

INSERT OR IGNORE INTO patients (id, user_id, full_name, dob) VALUES
  (1, 2, 'Alex Patient', '1995-08-03'),
  (2, 3, 'Sarah Johnson', '1988-03-15'),
  (3, 4, 'Michael Chen', '1992-11-22'),
  (4, 5, 'Emily Rodriguez', '1985-06-30'),
  (5, 6, 'James Wilson', '1978-09-14'),
  (6, 7, 'Maria Garcia', '1990-12-08');

INSERT OR IGNORE INTO appointments (id, patient_id, doctor_id, date, notes, medications, allergies) VALUES
  -- Alex Patient
  (1, 1, 1, '2025-07-14', 'Follow up on mild chest tightness, no acute distress.', 'atorvastatin 10mg qd', 'penicillin'),
  (2, 1, 1, '2025-09-02', 'Seasonal allergies, advised nasal spray and hydration.', 'fluticasone nasal spray', 'penicillin'),
  (3, 1, 1, '2025-10-10', 'Intermittent headaches, likely tension related. Stretching advised.', 'ibuprofen prn', 'penicillin'),
  
  -- Sarah Johnson
  (4, 2, 1, '2025-05-20', 'Annual physical. Blood pressure slightly elevated, recommend lifestyle changes.', 'lisinopril 10mg qd', 'sulfa drugs'),
  (5, 2, 1, '2025-08-15', 'Follow-up for hypertension. BP improved with medication.', 'lisinopril 10mg qd', 'sulfa drugs'),
  (6, 2, 1, '2025-10-05', 'Reported mild fatigue. Labs ordered to check thyroid function.', 'lisinopril 10mg qd, levothyroxine 50mcg qd', 'sulfa drugs'),
  
  -- Michael Chen
  (7, 3, 1, '2025-06-10', 'Complained of knee pain after running. Recommended rest and ice.', 'naproxen 500mg bid prn', 'none'),
  (8, 3, 1, '2025-09-20', 'Routine check-up. All vitals normal. Encouraged continued exercise.', 'none', 'none'),
  
  -- Emily Rodriguez
  (9, 4, 1, '2025-04-12', 'Type 2 diabetes management. A1C at 7.2%, discussed diet modifications.', 'metformin 1000mg bid, atorvastatin 20mg qd', 'penicillin, latex'),
  (10, 4, 1, '2025-07-18', 'Diabetes follow-up. A1C improved to 6.8%. Continue current regimen.', 'metformin 1000mg bid, atorvastatin 20mg qd', 'penicillin, latex'),
  (11, 4, 1, '2025-10-08', 'Annual diabetic foot exam. No neuropathy detected. Good control maintained.', 'metformin 1000mg bid, atorvastatin 20mg qd', 'penicillin, latex'),
  
  -- James Wilson
  (12, 5, 1, '2025-03-25', 'COPD exacerbation. Prescribed antibiotics and increased inhaler use.', 'albuterol inhaler prn, tiotropium 18mcg qd, azithromycin 250mg qd', 'aspirin'),
  (13, 5, 1, '2025-06-30', 'COPD stable. Pulmonary function test shows mild improvement.', 'albuterol inhaler prn, tiotropium 18mcg qd', 'aspirin'),
  (14, 5, 1, '2025-09-28', 'Routine COPD management. Encouraged smoking cessation program.', 'albuterol inhaler prn, tiotropium 18mcg qd', 'aspirin'),
  
  -- Maria Garcia
  (15, 6, 1, '2025-08-05', 'Prenatal visit - 12 weeks. All labs normal. Started prenatal vitamins.', 'prenatal vitamins qd', 'shellfish'),
  (16, 6, 1, '2025-09-15', 'Prenatal visit - 18 weeks. Ultrasound scheduled. Feeling well.', 'prenatal vitamins qd', 'shellfish'),
  (17, 6, 1, '2025-10-12', 'Prenatal visit - 22 weeks. Baby growing well. No complications.', 'prenatal vitamins qd, iron supplement', 'shellfish');
