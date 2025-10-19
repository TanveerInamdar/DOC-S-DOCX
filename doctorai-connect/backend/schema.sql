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
  (2, 'pat@demo.com', 'demo123', 'patient', 'Alex Patient');

INSERT OR IGNORE INTO doctors (id, user_id, full_name, specialization) VALUES
  (1, 1, 'Dr. Rivera', 'Internal Medicine');

INSERT OR IGNORE INTO patients (id, user_id, full_name, dob) VALUES
  (1, 2, 'Alex Patient', '1995-08-03');

INSERT OR IGNORE INTO appointments (id, patient_id, doctor_id, date, notes, medications, allergies) VALUES
  (1, 1, 1, '2025-07-14', 'Follow up on mild chest tightness, no acute distress.', 'atorvastatin 10mg qd', 'penicillin'),
  (2, 1, 1, '2025-09-02', 'Seasonal allergies, advised nasal spray and hydration.', 'fluticasone nasal spray', 'penicillin'),
  (3, 1, 1, '2025-10-10', 'Intermittent headaches, likely tension related. Stretching advised.', 'ibuprofen prn', 'penicillin');
