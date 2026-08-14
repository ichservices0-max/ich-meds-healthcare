# 🏥 HealthCare Patient Portal

A production-grade full-stack healthcare application featuring real-time chat, WebRTC video consultations, geolocation doctor search, and a premium dark glassmorphism UI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Framer Motion |
| Backend | Node.js + Express, Socket.io |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (7-day tokens) |
| Real-Time | Socket.io (chat + WebRTC signaling) |
| Video | WebRTC via Simple-Peer |
| Files | Multer → local `/uploads` folder |

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (port 5432)
- npm

## Quick Start

### 1. Setup Database

```bash
# Create the database in PostgreSQL
psql -U postgres -c "CREATE DATABASE healthcare_db;"
```

### 2. Backend Setup

```bash
cd backend

# Environment (already copied from .env.example)
# Edit .env and set your PostgreSQL credentials:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/healthcare_db"
# JWT_SECRET="any-long-random-string"

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Seed the database (creates test user + 3 doctors)
npm run seed

# Start backend (port 5000)
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start frontend (port 3000)
npm run dev
```

### 4. Open the app

Navigate to **http://localhost:3000**

## Test Credentials

| Field | Value |
|-------|-------|
| Email | `patient@test.com` |
| Password | `password123` |

## Seeded Doctors

| Doctor | Specialty | Rating | Fee | Online |
|--------|-----------|--------|-----|--------|
| Dr. Sarah Chen | Cardiologist | ⭐ 4.9 | ₹500 | 🟢 Yes |
| Dr. Raj Patel | General Physician | ⭐ 4.7 | ₹300 | ⚫ No |
| Dr. Priya Sharma | Dermatologist | ⭐ 4.8 | ₹400 | 🟢 Yes |

## Feature Map

| Feature | Route |
|---------|-------|
| Dashboard Home | `/dashboard` |
| Find Doctors (+ Geolocation) | `/dashboard/doctors` |
| Book Appointment (Slide-up Drawer) | Click "Book Now" on any doctor |
| Appointment History | `/dashboard/appointments` |
| Live Chat (Socket.io) | Click "Join Chat" on confirmed appointment |
| Video Call (WebRTC) | Click "Join Video" on confirmed appointment |
| Medical Records Vault | `/dashboard/records` |
| Notifications | `/dashboard/notifications` |
| Help Center | `/dashboard/help` |
| Settings | `/dashboard/settings` |

## Framer Motion Animations

1. **Staggered fade-slide** — Dashboard stat cards and doctor cards animate in with 0.1s delay each
2. **Slide-up drawer** — BookingDrawer and ChatPanel slide from `y: "100%"` to `y: 0`
3. **Active pulse ring** — LivePulseRing component loops `scale: 1 → 1.4 → 1` for online doctors

## Project Structure

```
healthcare-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 8 models, 3 enums
│   │   └── seed.ts             # Test data
│   ├── src/
│   │   ├── lib/prisma.ts       # Singleton PrismaClient
│   │   ├── middleware/auth.ts  # protectPatient JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.ts         # Register, Login, Forgot/Reset Password
│   │   │   ├── doctors.ts      # Search + Haversine geo-filter
│   │   │   ├── appointments.ts # Book, list, cancel (atomic transactions)
│   │   │   ├── records.ts      # File upload/download
│   │   │   ├── notifications.ts
│   │   │   └── messages.ts     # Chat history
│   │   ├── socket/index.ts     # Socket.io + WebRTC signaling
│   │   └── server.ts           # Express app
│   └── uploads/                # Uploaded medical records
│
└── frontend/
    ├── app/
    │   ├── (auth)/             # Login, Register, Forgot Password
    │   └── (dashboard)/        # 7 protected pages
    ├── components/
    │   ├── DoctorCard.tsx
    │   ├── BookingDrawer.tsx
    │   ├── ChatPanel.tsx
    │   ├── VideoConsultation.tsx
    │   └── LivePulseRing.tsx
    ├── contexts/               # Auth + Theme contexts
    └── lib/                    # API client, Socket, Auth helpers
```

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new patient |
| POST | `/api/auth/login` | ❌ | Login → JWT |
| POST | `/api/auth/forgot-password` | ❌ | Get mock reset token |
| POST | `/api/auth/reset-password` | ❌ | Set new password |
| GET | `/api/auth/me` | ✅ | Current patient |

### Doctors
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/doctors/search` | ❌ | Search with geo filter |
| GET | `/api/doctors/specialties` | ❌ | Distinct specialties |
| GET | `/api/doctors/:id` | ❌ | Doctor + slots |

### Appointments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/appointments` | ✅ | Book appointment |
| GET | `/api/appointments` | ✅ | Patient's appointments |
| GET | `/api/appointments/:id` | ✅ | Single appointment |
| PATCH | `/api/appointments/:id/status` | ✅ | Cancel |
| DELETE | `/api/appointments/:id` | ✅ | Delete |

### Records
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/records/upload` | ✅ | Upload file (10MB max) |
| GET | `/api/records` | ✅ | List records |
| DELETE | `/api/records/:id` | ✅ | Delete + remove file |

## Socket.io Events

| Event (Client → Server) | Description |
|-------------------------|-------------|
| `join-room` | Join appointment chat room |
| `send-message` | Send chat message (persisted to DB) |
| `webrtc-offer` | WebRTC offer relay |
| `webrtc-answer` | WebRTC answer relay |
| `webrtc-ice-candidate` | ICE candidate relay |
| `doctor-status` | Update doctor online/offline |

| Event (Server → Client) | Description |
|-------------------------|-------------|
| `new-message` | New chat message in room |
| `webrtc-offer` | Relayed offer |
| `webrtc-answer` | Relayed answer |
| `webrtc-ice-candidate` | Relayed ICE candidate |
| `doctor-online-status` | Doctor status change broadcast |
