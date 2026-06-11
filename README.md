# College Appointment System — Backend API

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![NodeMailer](https://img.shields.io/badge/NodeMailer-0F9DCE?style=flat&logo=gmail&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

A Node.js + MongoDB REST API enabling students to book appointments with professors.

---

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Email:** NodeMailer (appointment confirmation & cancellation alerts)

---

## Project Structure

```
appointment-system/
├── config/
│   └── db.js                   # MongoDB connection
├── src/
│   ├── app.js                  # Entry point
│   ├── models/
│   │   ├── User.js             # Student & Professor model
│   │   ├── Slot.js             # Professor availability slots
│   │   └── Appointment.js      # Booking records
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── slotController.js
│   │   └── appointmentController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── slots.js
│   │   └── appointments.js
│   └── middleware/
│       └── auth.js             # JWT protect + role authorize
├── .env.example
└── package.json
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 3. Start server
npm start          # production
npm run dev        # development with nodemon
```

---

## Environment Variables

| Variable        | Description                      | Default                              |
|-----------------|----------------------------------|--------------------------------------|
| `PORT`          | Server port                      | `3000`                               |
| `MONGO_URI`     | MongoDB connection string        | `mongodb://localhost:27017/college_appointments` |
| `JWT_SECRET`    | Secret key for JWT signing       | *(required)*                         |
| `JWT_EXPIRES_IN`| JWT expiry duration              | `7d`                                 |
| `EMAIL`         | Gmail address for NodeMailer     | *(required)*                         |
| `EMAIL_PASS`    | Gmail app password for NodeMailer| *(required)*                         |

---

## API Reference

All protected routes require the header:
```
Authorization: Bearer <token>
```

---

### Auth

#### Register
```
POST /api/auth/register
```
**Body:**
```json
{
  "name": "Alice",
  "email": "alice@college.edu",
  "password": "secret123",
  "role": "student"        // "student" | "professor"
}
```
**Response `201`:**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "Alice", "email": "alice@college.edu", "role": "student" }
}
```

---

#### Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "email": "alice@college.edu",
  "password": "secret123"
}
```
**Response `200`:**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "Alice", "email": "alice@college.edu", "role": "student" }
}
```

---

### Slots

#### Add Availability Slots *(Professor only)*
```
POST /api/slots
Authorization: Bearer <professor_token>
```
**Body** (array of slots, or single object):
```json
[
  { "startTime": "2025-01-15T09:00:00.000Z", "endTime": "2025-01-15T09:30:00.000Z" },
  { "startTime": "2025-01-15T10:00:00.000Z", "endTime": "2025-01-15T10:30:00.000Z" }
]
```
**Response `201`:**
```json
{
  "success": true,
  "count": 2,
  "slots": [ { "_id": "...", "professor": "...", "startTime": "...", "endTime": "...", "isBooked": false } ]
}
```

---

#### Get Available Slots for a Professor *(Any authenticated user)*
```
GET /api/slots/:professorId
Authorization: Bearer <token>
```
**Response `200`:**
```json
{
  "success": true,
  "count": 2,
  "slots": [ { "_id": "...", "startTime": "...", "endTime": "...", "isBooked": false } ]
}
```
> Only returns **future, unbooked** slots sorted by start time.

---

### Appointments

#### Book an Appointment *(Student only)*
```
POST /api/appointments
Authorization: Bearer <student_token>
```
**Body:**
```json
{
  "slotId": "<slot_id>"
}
```
**Response `201`:**
```json
{
  "success": true,
  "appointment": {
    "_id": "...",
    "slot": { "startTime": "...", "endTime": "..." },
    "student": { "name": "Alice", "email": "alice@college.edu" },
    "professor": { "name": "Prof. Smith", "email": "smith@college.edu" },
    "status": "booked"
  }
}
```
> Uses a **MongoDB transaction** to atomically lock the slot and create the booking — no double-booking possible.

---

#### Get My Appointments *(Student or Professor)*
```
GET /api/appointments
Authorization: Bearer <token>
```
**Response `200`:**
```json
{
  "success": true,
  "count": 1,
  "appointments": [ { ... } ]
}
```
> Students see their own bookings. Professors see all bookings assigned to them.

---

#### Cancel an Appointment *(Professor only)*
```
PATCH /api/appointments/:id/cancel
Authorization: Bearer <professor_token>
```
**Response `200`:**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully.",
  "appointment": { "...", "status": "cancelled", "cancelledAt": "..." }
}
```
> Cancelling an appointment automatically **frees the slot** so another student can book it.

---

## User Flow Walkthrough

```
Step 1: Student A1 registers & logs in
  POST /api/auth/register  { role: "student" }
  POST /api/auth/login

Step 2: Professor P1 registers & logs in
  POST /api/auth/register  { role: "professor" }
  POST /api/auth/login

Step 3: Professor P1 adds available slots
  POST /api/slots  [{ startTime: T1 }, { startTime: T2 }]

Step 4: Student A1 views P1's available slots
  GET /api/slots/:P1_id

Step 5: Student A1 books slot T1
  POST /api/appointments  { slotId: <T1_slot_id> }

Step 6: Student A2 registers, logs in, books slot T2
  POST /api/auth/register + login
  POST /api/appointments  { slotId: <T2_slot_id> }

Step 7: Professor P1 cancels A1's appointment
  PATCH /api/appointments/:appointment_id/cancel
```

---

## Key Design Decisions

| Concern | Solution |
|---|---|
| **No double booking** | MongoDB transaction atomically sets `isBooked=true` before creating appointment |
| **Concurrent race conditions** | `findOneAndUpdate` with filter `{ isBooked: false }` acts as an atomic compare-and-swap |
| **Unique slot index** | Compound unique index on `(professor, startTime)` prevents duplicate slots |
| **Slot freed on cancel** | Transaction resets `isBooked=false` so the slot becomes bookable again |
| **Passwords** | bcrypt hashed at salt rounds 12; never returned in API responses via `select: false` |
| **Email Notifications** | NodeMailer sends confirmation email on booking & cancellation |
| **Role enforcement** | Middleware-level `authorize()` guard — no business logic leakage |
