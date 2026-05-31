# Algorithmic Arena

A modern web-based algorithm visualization platform built with React, TypeScript, and Express.js. This platform allows users to visualize and understand how various algorithms work through interactive animations and real-time visualization.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Frontend](#frontend)
- [Backend](#backend)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Build & Deployment](#build--deployment)

## 🎯 Overview

**Algorithmic Arena** is a comprehensive visualization tool designed to help developers, students, and computer science enthusiasts understand complex algorithms through interactive, step-by-step visualizations. The platform provides a user-friendly interface to explore sorting algorithms, searching algorithms, graph algorithms, and more.

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Vite 5.4.19** - Lightning-fast build tool
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Shadcn/ui** - High-quality React UI components
- **React Router DOM 6.30.1** - Client-side routing
- **Framer Motion 12.38.0** - Animation library
- **Recharts 2.15.4** - Data visualization components
- **React Hook Form 7.61.1** - Form state management
- **TanStack Query 5.83.0** - Server state management
- **Zod 3.25.76** - TypeScript-first schema validation

### Backend
- **Express.js 5.2.1** - Web framework
- **TypeScript 6.0.2** - Type-safe backend code
- **Prisma 5.22.0** - Modern ORM for database
- **JWT (jsonwebtoken 9.0.3)** - Authentication tokens
- **bcryptjs 3.0.3** - Password hashing
- **CORS 2.8.6** - Cross-origin resource sharing

### Development Tools
- **ESLint 9.32.0** - Code quality & linting
- **Vitest 3.2.4** - Fast unit testing framework
- **Playwright 1.57.0** - End-to-end testing
- **PostCSS 8.5.6** - CSS transformations
- **SWC** - Rust-based JavaScript compiler for fast builds

## 📁 Project Structure

```
algorithmic-arena-main-/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   ├── pages/                    # Page components
│   ├── lib/                      # Utilities and helpers
│   ├── styles/                   # Global styles
│   └── App.tsx                   # Main app component
├── server/                       # Backend Express application
│   ├── src/                      # Server source code
│   ├── package.json              # Server dependencies
│   └── prisma/                   # Database schema
├── public/                       # Static assets
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── package.json                  # Frontend dependencies
├── vitest.config.ts              # Vitest configuration
├── playwright.config.ts          # Playwright configuration
└── eslint.config.js              # ESLint configuration
```

## ✨ Features

### Algorithm Visualization
- **Step-by-step execution** - Watch algorithms execute step-by-step with detailed state tracking
- **Real-time animation** - Smooth animations powered by Framer Motion
- **Interactive controls** - Play, pause, reset, and adjust animation speed
- **Multiple algorithms** - Sorting, searching, and graph algorithms

### User Interface
- **Modern Design** - Clean, intuitive interface built with Shadcn/ui components
- **Responsive Layout** - Works seamlessly on desktop and tablet devices
- **Dark Mode Support** - Built-in theme switching with Next Themes
- **Accessibility** - Accessible UI components from Radix UI

### Data Management
- **Form Validation** - Robust form handling with React Hook Form and Zod
- **Server State Management** - Efficient server data caching with TanStack Query
- **Charts & Graphs** - Visualize algorithm complexity with Recharts

## 🎨 Frontend

### Key Technologies
- **React 18** - Latest React with hooks and concurrent features
- **TypeScript** - Full type safety across the application
- **Vite** - Next-generation frontend tooling for fast development
- **Tailwind CSS** - Utility-first CSS for rapid UI development
- **Framer Motion** - Powerful animation library for smooth transitions
- **Shadcn/ui** - Customizable, accessible component library

### Available Scripts
```bash
npm run dev           # Start development server (port 8080)
npm run build         # Build for production
npm run build:dev     # Build in development mode
npm run lint          # Run ESLint
npm run preview       # Preview production build
npm run test          # Run tests once
npm run test:watch    # Run tests in watch mode
```

### Development Server
- **Host**: `[::]` (IPv6)
- **Port**: `8080`
- **HMR**: Enabled with overlay disabled for better UX

## 🖥️ Backend

### API Features
- **Express.js Server** - RESTful API for algorithm services
- **Authentication** - JWT-based authentication with bcrypt password hashing
- **Database** - Prisma ORM for type-safe database operations
- **CORS Support** - Secure cross-origin requests
- **Error Handling** - Comprehensive error handling and logging

### Available Scripts
```bash
npm start    # Start the server with tsx
npm test     # Run tests
```

### Environment Setup
The server uses environment variables for configuration (typically in `.env` file):
- Database connection strings
- JWT secrets
- API keys and authentication tokens

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn/bun
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/devank26/algorithmic-arena-main-.git
cd algorithmic-arena-main-
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install server dependencies**
```bash
cd server
npm install
cd ..
```

4. **Set up environment variables**
Create a `.env` file in the server directory with necessary configurations.

### Running the Application

**Development Mode:**

Terminal 1 - Frontend:
```bash
npm run dev
```
Frontend will be available at `http://localhost:8080`

Terminal 2 - Backend:
```bash
cd server
npm start
```

## 💻 Development

### Code Quality
- **ESLint** - Enforces consistent code style
- **TypeScript** - Provides type safety
- **Component-based architecture** - Modular and reusable components

### Best Practices
- Type-safe code with TypeScript throughout
- Reusable React components with hooks
- Form validation with React Hook Form + Zod
- Responsive design with Tailwind CSS
- Server state management with TanStack Query

## 🧪 Testing

### Frontend Testing
```bash
npm run test          # Run vitest once
npm run test:watch    # Watch mode
```

### E2E Testing
```bash
npx playwright test   # Run Playwright tests
```

### Configuration
- **Vitest** - Unit and integration tests with jsdom
- **Playwright** - End-to-end testing framework

## 📦 Build & Deployment

### Production Build
```bash
npm run build
```

Build output will be in the `dist/` directory, ready for deployment.

### Development Build
```bash
npm run build:dev
```

## 📝 Configuration Files

- **vite.config.ts** - Vite build configuration with React plugin
- **tsconfig.json** - TypeScript compiler options
- **tailwind.config.ts** - Tailwind CSS customization
- **eslint.config.js** - ESLint rules and plugins
- **vitest.config.ts** - Vitest testing configuration
- **playwright.config.ts** - Playwright testing configuration
- **components.json** - Shadcn/ui configuration

## 🔐 Security

- **Password Hashing** - bcryptjs for secure password storage
- **JWT Tokens** - Secure token-based authentication
- **CORS** - Restricted cross-origin requests
- **Environment Variables** - Sensitive data stored in .env files
- **Type Safety** - TypeScript prevents many security vulnerabilities

## 📚 Dependencies Highlights

### Core Dependencies
- React 18.3.1, React DOM, React Router
- TypeScript for type safety
- Tailwind CSS + PostCSS for styling
- Framer Motion for animations
- Recharts for data visualization
- Zod for schema validation

### UI Components (Radix UI)
- Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, Select, Tabs, Toast, Tooltip, and more

### Development Dependencies
- Vite 5.4.19 - Build tool
- Vitest 3.2.4 - Testing framework
- Playwright 1.57.0 - E2E testing
- ESLint 9.32.0 - Linting
- TypeScript 5.8.3+ - Type checking

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows the ESLint rules
- All tests pass
- TypeScript has no type errors
- Components are documented

## 📄 License

This project is licensed under the ISC License.

## 📧 Contact

For questions or support, please reach out to devank01@gmail.com

---

**Happy Algorithm Visualizing!** 🎉
