# eQueue 2.0 - Digital Queue Management System

## Overview

eQueue 2.0 is a comprehensive digital queue management system designed for government offices and public services. The application enables citizens to book appointments, receive digital tokens, and track queue status in real-time. It supports multiple departments (RTO, Income Certificate, Aadhar Services, etc.) with role-based access for citizens, clerks, and administrators.

The system features multi-language support (English, Hindi, Tamil), priority queuing for special categories (senior citizens, differently-abled), real-time WebSocket updates, and comprehensive analytics for queue management optimization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: Custom i18n implementation supporting English, Hindi, and Tamil

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with role-based route protection
- **Real-time Communication**: WebSocket server for live queue updates
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage

### Database Architecture
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Design**: 
  - Users table with role-based access (citizen, clerk, admin)
  - Departments with multi-language support and working hours
  - Services linked to departments with estimated processing times
  - Counters assigned to specific clerks and departments
  - Appointments with priority queuing and status tracking
  - Announcements for system-wide notifications

### Real-time Features
- **WebSocket Integration**: Live queue status updates
- **Event Broadcasting**: Counter status changes and queue movements
- **Display Board**: Real-time digital signage for queue information

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Role-based Access**: Three-tier system (citizen, clerk, admin)
- **Route Protection**: Middleware-based authentication checks

### Multi-language Support
- **Implementation**: Custom React context with localStorage persistence
- **Supported Languages**: English (en), Hindi (hi), Tamil (ta)
- **Database**: Language-specific columns for department and service names
- **UI**: Dynamic translation keys with fallback to English

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation

### UI & Styling
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production

### Replit Integration
- **@replit/vite-plugin-***: Development environment enhancements
- **openid-client**: OpenID Connect authentication
- **passport**: Authentication middleware

### Real-time Communication
- **ws**: WebSocket implementation for real-time updates
- **connect-pg-simple**: PostgreSQL session store

### Additional Tools
- **date-fns**: Date manipulation and formatting
- **memoizee**: Function memoization for performance
- **wouter**: Lightweight client-side routing