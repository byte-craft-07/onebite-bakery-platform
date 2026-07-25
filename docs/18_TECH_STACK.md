# Tech Stack

# TECHNOLOGY STACK

Project

OneBite Bakery Platform

Brand

OneBite Bakery

Tagline

हर जश्न का पहला निवाला।

Version

1.0

Purpose

This document defines the official technology stack for the OneBite Bakery Platform.

Every developer and AI agent must follow this stack unless a documented architectural decision approves a change.

---

# DESIGN PRINCIPLES

- Type Safety First
- Mobile First
- Performance First
- Security First
- Developer Experience
- Scalability
- Long-Term Maintainability

---

# FRONTEND

Framework

React 19

Language

TypeScript

Build Tool

Vite

Routing

React Router

Styling

Tailwind CSS

Animations

Framer Motion

Icons

Lucide React

State Management

Zustand

Server State

TanStack Query

Forms

React Hook Form

Validation

Zod

Notifications

React Hot Toast

Carousel

Embla Carousel

Skeleton Loading

React Loading Skeleton

Date Handling

date-fns

Charts (Future)

Recharts

---

# BACKEND

Runtime

Node.js LTS

Framework

Express.js

Language

TypeScript

Database

MongoDB Atlas

ODM

Mongoose

Validation

Zod

Authentication

JWT

Password Strategy

OTP Authentication

Logging

Pino

Environment Variables

dotenv

Security

Helmet

Compression

compression

Rate Limiting

express-rate-limit

CORS

cors

Sanitization

express-mongo-sanitize

Cookie Parser

cookie-parser

Unique IDs

uuid

---

# DATABASE

Engine

MongoDB

Hosting

MongoDB Atlas

Architecture

Repository Pattern

Soft Delete

Supported

Indexes

Optimized

Pagination

Cursor Ready

Transactions

Supported where required

---

# FILE STORAGE

Provider

Cloudinary

Supported Formats

JPG

JPEG

PNG

WEBP

Maximum Upload

5 MB

Naming

Randomized

Optimization

Automatic

---

# AUTHENTICATION

Method

Mobile OTP

Access Token

HttpOnly Secure Cookie

Refresh Token

HttpOnly Secure Cookie

Session Rotation

Enabled

OTP Storage

Hashed

OTP Expiry

5 Minutes

---

# CLIENT STORAGE

LocalStorage

Guest Cart

Recently Viewed

Theme Preference

Temporary UI Preferences

Never Store

JWT

Refresh Token

OTP

Sensitive Data

---

# SECURITY

Helmet

Enabled

Rate Limiting

Enabled

CORS

Whitelist Only

Mongo Sanitization

Enabled

Validation

Zod

HTTPS

Production Only

Security Headers

Enabled

---

# USER EXPERIENCE

Skeleton Loading

Enabled

Lazy Loading

Enabled

Responsive Images

Enabled

Blur Image Placeholder

Enabled

Infinite Scroll

Future

Dark Mode

Future

Offline Support

Future

PWA

Future

---

# API

Architecture

REST

Version

/api/v1/

Response Format

Standardized

Pagination

Supported

Error Handling

Global

---

# DEVELOPMENT TOOLS

Package Manager

npm

Linting

ESLint

Formatting

Prettier

Git Hooks

Husky

Pre Commit

lint-staged

Commit Convention

Conventional Commits

Documentation

Markdown

---

# TESTING

Unit Testing

Vitest

API Testing

Supertest

Future

E2E

Playwright

Performance

Lighthouse

---

# DEPLOYMENT

Frontend

Vercel (Preferred)

Backend

Render / Railway / VPS

Reverse Proxy

Nginx

Process Manager

PM2

SSL

Let's Encrypt

---

# MONITORING

Application Logs

Pino

Health Endpoints

/health

/ready

/live

Future

Sentry

Grafana

Prometheus

---

# CODING RULES

- TypeScript Strict Mode
- No `any`
- Thin Controllers
- Business Logic in Services
- Repository Pattern
- Shared Utilities
- Reusable Components
- Feature-Based Architecture

---

# LIBRARY CHANGE POLICY

No library may be replaced without:

1. Technical evaluation
2. Performance comparison
3. Migration impact assessment
4. Documentation update
5. Approval

---

# FUTURE TECHNOLOGIES

Possible additions after Version 1

- Redis
- BullMQ
- WebSockets
- Push Notifications
- Elasticsearch
- Meilisearch
- AI Recommendation Engine
- Multi-Branch Support
- Razorpay
- Google Analytics
- Cloudflare CDN

---

# GOLDEN RULE

Prefer mature, well-maintained technologies over trendy ones.

Stability, security, and maintainability always take priority over novelty.
