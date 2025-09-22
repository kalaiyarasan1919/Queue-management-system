# Authentication Setup Guide

This application now supports multiple authentication methods:

## 1. Google OAuth Authentication

To enable Google OAuth login, you need to:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
6. Set the following environment variables:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 2. Local Authentication (Email/Password)

Local authentication is enabled by default. Users can register with email and password.

## 3. Replit Authentication (Legacy)

The original Replit authentication is still available for backward compatibility.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/smartqueue

# Session
SESSION_SECRET=your-super-secret-session-key-here

# Replit Auth (if using Replit)
REPLIT_DOMAINS=your-domain.replit.dev
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc

# Google OAuth (for Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Database Migration

After updating the schema, run the database migration:

```bash
npm run db:push
```

## Features

### Login Page Features:
- **Google OAuth**: One-click login with Google account
- **Replit Auth**: Original Replit authentication
- **Email/Password**: Traditional login with validation
- **Registration**: New user registration with password strength validation
- **Form Validation**: Client-side validation for all inputs
- **Password Visibility Toggle**: Show/hide password functionality
- **Error Handling**: Comprehensive error messages
- **Responsive Design**: Works on all device sizes

### Security Features:
- Password hashing with bcrypt (12 rounds)
- Password strength validation
- Email format validation
- Session management
- CSRF protection
- Input sanitization

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `/login`
3. Test all authentication methods:
   - Google OAuth (requires setup)
   - Replit Auth (if configured)
   - Email/Password registration and login

## Troubleshooting

### Google OAuth Issues:
- Ensure redirect URI is correctly configured
- Check that Google+ API is enabled
- Verify client ID and secret are correct

### Database Issues:
- Run `npm run db:push` to update schema
- Check DATABASE_URL is correct
- Ensure database is running

### Session Issues:
- Verify SESSION_SECRET is set
- Check that cookies are enabled
- Ensure HTTPS in production
