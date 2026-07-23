# RESERVA

This is the repo for the **Reserva** project, a full-stack web application built with the **MERN-stack** (MongoDB, Express.js, React, Node.js) for the Software Development Skills: Full-Stack 2025-26 course. You can find the coursework files and learning diary in https://github.com/pedrohsetti/Full-Stack-Development.

## About Reserva

**Reserva** is an event management and scheduling platform for small businesses.

It's a full-stack web application built with the **MERN stack** that enables small businesses to manage appointments, events, staff, customers, and business operations from a single platform.

## Demo


## Usage

To run the application locally, follow these steps:

1. Clone the repository:

   ```bash
        git clone https://github.com/pedrohsetti/reserva.git
   ```

2. Rename the `.envexample` file to `.env` and fill in your MongoDB connection string and JWT secrets.

3. Install dependencies for both the client and server:

   ```bash
        # Backend dependencies
        npm install
        # Frontend dependencies
        cd client
        npm install
   ```

4. Run the application:

   ```bash
        # Start the backend server
        npm run server
   ```


## Features

### Authentication

- User authentication
- JWT access token
- Password hashing with bcrypt
- Role-based authorization

Roles include:

- Platform Admin
- Business Owner
- Staff Member
- Customer

## Business Management

Each business has its own workspace containing:

- Business profile
- Contact information
- Opening hours
- Services
- Staff
- Customers
- Appointments
- Events
- Analytics

Reserva uses a **multi-tenant architecture**, ensuring each business only has access to its own data.

## Appointment System

Customers can:

- Browse available services
- Select a staff member
- Choose an available date and time
- Book appointments
- Reschedule
- Cancel appointments
- View booking history

Business owners can:

- Configure working hours
- Set appointment durations
- Add breaks and buffer times
- Block unavailable dates
- Manage staff schedules

## Event Management

Businesses can organize:

- Workshops
- Classes
- Webinars
- Conferences
- Community events
- Training sessions

Each event supports:

- Capacity limits
- Waiting lists
- Registration
- QR code check-in
- Multiple ticket types
- Event analytics

## Customer Management (CRM)

Every customer has a dedicated profile including:

- Contact information
- Appointment history
- Event attendance
- Loyalty status

This allows businesses to build stronger relationships with returning customers.

## Staff Management

Business owners can:

- Create staff accounts
- Assign services
- Configure working schedules
- Track appointments
- Monitor workload

## Dashboard & Analytics

The dashboard provides real-time insights such as:

- Daily appointments
- Upcoming events
- Revenue overview
- Most popular services
- Customer growth
- Attendance rate
- No-show rate
- Staff utilization

## Notifications

Notifications are logged for:

- Booking confirmations
- Appointment reminders
- Event reminders
- Cancellations
- Schedule changes

### Future implementations:

- Email notifications
- Push notifications
- SMS notifications

## QR Check-In

Every booking or event registration generates a QR code.

Businesses can scan customer QR codes during check-in to instantly mark attendance.

- Fast check-in
- Attendance tracking
- Event statistics

## Payments

Businesses can choose between:

- Pay online
- Deposit only
- Pay on arrival

### Future implementations:

Support for online payments through:

- Stripe
- PayPal
- MobilePay

## AI Features *(Planned)*

Reserva aims to integrate AI to improve business operations.

Examples include:

### AI Business Insights

Receive insights like:

> Saturdays generate 42% more appointments.

> Haircut customers typically return every 4 weeks.

### AI Scheduling

Automatically suggest the best appointment times while minimizing schedule gaps.

## System Architecture

```
                    Customers
                        │
                        ▼
                React Frontend
                        │
                    REST API
                        │
               Express Backend
                        │
        Authentication Middleware
                        │
                  Business Logic
                        │
                    MongoDB
```

## Tech Stack

### Frontend

- React
- CSS
- React Redux

### Backend

- Node.js
- Express.js
- JWT Authentication
- bcrypt

### Database

- MongoDB
- Mongoose

### DevOps *(Planned)*

- Docker
- Docker Compose
- GitHub Actions

## Project Structure

```
reserva/
│
├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   └── utils/
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   ├── utils/
│   └── config/
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Typical Booking Flow

```
Customer visits booking page
            │
            ▼
Selects a service
            │
            ▼
Chooses a staff member
            │
            ▼
Selects an available time slot
            │
            ▼
Booking validation
            │
            ▼
Appointment created
            │
            ▼
Confirmation email sent
            │
            ▼
Appointment appears on dashboard
```

## Event Registration Flow

```
Customer registers
        │
        ▼
Capacity check
        │
        ▼
Registration created
        │
        ▼
QR Code generated
        │
        ▼
Confirmation email
        │
        ▼
Check-in at event
```

---

## Roadmap

### Version 1 (MVP)

- Authentication
- Businesses
- Services
- Staff
- Customers
- Appointments
- Calendar
- Dashboard
- Notifications

---

### Version 2

- Event management
- QR check-in
- Waiting lists
- Email notifications
- Analytics
- Payments

---

### Version 3

- AI assistant
- Loyalty program
- Public booking pages
- Customer reviews
- Google Calendar integration
- Outlook integration
- WhatsApp notifications

## Project Goals

Reserva was built to demonstrate modern full-stack software engineering concepts including:

- RESTful API design
- Authentication & Authorization
- Multi-tenant architecture
- CRUD operations
- Real-time communication
- Database modeling
- Responsive UI/UX
- Clean architecture

## Author

Developed by **Pedro Henrique Setti** as a portfolio project demonstrating full-stack web development with the MERN stack.
