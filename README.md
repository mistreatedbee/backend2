# Mobile Health App Backend - MongoDB Real-time Implementation

## Overview

This backend implements a real-time healthcare management system using MongoDB Change Streams and Socket.IO for instant updates across Doctor, Patient, and Admin interfaces.

## Key Features

- ✅ **Real-time Updates**: MongoDB Change Streams + Socket.IO
- ✅ **Email Verification**: Secure token-based email verification
- ✅ **Password Reset**: Forgot password flow with secure tokens
- ✅ **Admin Doctor Deletion**: Soft and hard delete with transactions
- ✅ **Enhanced Notifications**: Full sender/receiver metadata
- ✅ **Audit Logging**: Complete action tracking

## MongoDB Collections

### Users
- Stores doctors, patients, and admins
- Email verification tokens (hashed, TTL indexed)
- Password reset tokens (hashed, TTL indexed)
- Soft delete support (isActive, deletedAt)

### Appointments
- Links patients and doctors
- Supports online and in-person types
- Real-time status updates

### Notifications
- Full sender/receiver metadata
- Real-time delivery via Socket.IO
- Read/unread tracking

### DoctorAvailability
- Time slot management
- Real-time availability updates

### AuditLogs
- Complete action history
- Actor and target tracking

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file:

```env
MONGO_URI=mongodb://localhost:27017/mobilehealth
# Or MongoDB Atlas connection string

FRONTEND_URL=http://localhost:5173
PORT=5000

# Email Configuration (choose one)
# Option 1: Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Option 2: SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password

EMAIL_FROM=noreply@mobilehealth.app
```

### 3. Run Migration

```bash
node backend/scripts/migrate.js
```

This will:
- Add `isActive` and `deletedAt` to existing users
- Migrate `password` to `passwordHash`
- Create all necessary indexes

### 4. Create Indexes (if needed separately)

```bash
node backend/scripts/createIndexes.js
```

### 5. Start Server

```bash
npm run dev
```

## MongoDB Change Streams

Change streams are automatically set up on:
- `users` collection
- `appointments` collection
- `notifications` collection
- `doctorAvailability` collection

Events are emitted via Socket.IO to appropriate rooms:
- `user:<userId>` - User-specific updates
- `doctor:<doctorId>` - Doctor-specific updates
- `patient:all` - All patients
- `admin:all` - All admins
- `notifications:<userId>` - User notifications

## API Endpoints

### Auth
- `POST /api/auth/register` - Register patient
- `POST /api/auth/register-doctor` - Register doctor
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me/:id` - Get current user

### Admin
- `GET /api/admin/patients` - Get all patients
- `GET /api/admin/doctors` - Get all doctors
- `DELETE /api/admin/doctors/:doctorId` - Delete doctor (soft by default)
  - Body: `{ hard: true }` for hard delete
- `POST /api/admin/doctors/:doctorId/restore` - Restore deleted doctor
- `GET /api/admin/stats` - Get statistics

### Notifications
- `GET /api/notifications?userId=<id>` - Get user notifications
- `GET /api/notifications/unread-count?userId=<id>` - Get unread count
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Real-time Events

### Client → Server
- `join:user` - Join user room
- `join:doctor` - Join doctor room
- `join:patient` - Join patient room
- `join:admin` - Join admin room
- `join:notifications` - Join notifications room

### Server → Client
- `user:updated` - User data changed
- `appointment:updated` - Appointment changed
- `notification:new` - New notification
- `availability:updated` - Availability changed

## Security Features

1. **Token Hashing**: All tokens (email verification, password reset) are hashed using SHA-256
2. **Password Hashing**: Bcrypt with salt rounds
3. **Rate Limiting**: Email verification and password reset limited to 3 requests/hour
4. **TTL Indexes**: Automatic cleanup of expired tokens
5. **Soft Delete**: Data retention with soft delete
6. **Audit Logging**: Complete action history

## Transactions

Critical operations use MongoDB transactions:
- Doctor deletion (soft/hard)
- Appointment cancellation
- Notification creation

## Testing Checklist

- [ ] Signup → Email verification → Verify → Real-time update
- [ ] Forgot password → Reset → Login works
- [ ] Doctor sets availability → Patients see in real-time
- [ ] Patient books appointment → Doctor notified instantly
- [ ] Admin deletes doctor → Appointments cancelled → Notifications sent
- [ ] All notifications include sender metadata
- [ ] Change streams emit events correctly

## MongoDB Requirements

- **Replica Set**: Required for change streams (Atlas has this by default)
- **Transactions**: Require replica set or sharded cluster
- **Indexes**: All indexes created automatically via migration

## Troubleshooting

### Change Streams Not Working
- Ensure MongoDB is a replica set (not standalone)
- Check MongoDB Atlas cluster tier (M0 free tier may have limitations)
- Verify connection string includes replica set name

### Email Not Sending
- Check email service credentials
- Verify SMTP settings
- Check spam folder
- Use console transport for development

### Transactions Failing
- Ensure MongoDB is replica set
- Check error logs for specific issues
- Verify session handling

## Production Considerations

1. **Redis**: Use Redis for rate limiting and Socket.IO scaling
2. **Email Service**: Use SendGrid, Mailgun, or AWS SES
3. **Monitoring**: Set up MongoDB monitoring and alerts
4. **Backup**: Regular database backups
5. **Security**: Use environment variables, never commit secrets
6. **Scaling**: Use Redis adapter for Socket.IO in multi-instance deployments

