# Deployment

# DEPLOYMENT GUIDE

Project

OneBite Bakery Platform

Brand

OneBite Bakery

Tagline

हर जश्न का पहला निवाला।

Version

1.0

Purpose

This document defines the production deployment process
for the OneBite Bakery Platform.

Deployment must be repeatable, secure, and predictable.

---

# DEPLOYMENT STRATEGY

Development

↓

Testing

↓

Staging (Optional)

↓

Production

Never deploy directly without passing all release checks.

---

# SERVER REQUIREMENTS

Operating System

Ubuntu 24.04 LTS

Minimum

2 vCPU

4 GB RAM

40 GB SSD

Recommended

4 vCPU

8 GB RAM

80+ GB SSD

---

# SOFTWARE

Node.js LTS

Git

Nginx

PM2

MongoDB Atlas

Cloudinary

---

# DOMAIN

Production

onebitebakery.com

Admin

admin.onebitebakery.com

API

api.onebitebakery.com

---

# SSL

Use Let's Encrypt.

Force HTTPS.

Enable automatic certificate renewal.

Reject HTTP traffic.

---

# ENVIRONMENT VARIABLES

Production .env

PORT

NODE_ENV

MONGODB_URI

JWT_SECRET

JWT_REFRESH_SECRET

CLIENT_URL

ADMIN_URL

API_URL

CLOUDINARY_CLOUD_NAME

CLOUDINARY_API_KEY

CLOUDINARY_API_SECRET

OTP_PROVIDER

OTP_API_KEY

UPI_ID

Never commit .env.

---

# DATABASE

MongoDB Atlas

Use IP whitelist.

Enable authentication.

Create indexes before production.

Enable automated backups.

---

# PROCESS MANAGER

Use PM2.

Application

backend

Auto restart

Enabled

Startup on reboot

Enabled

Log rotation

Enabled

---

# REVERSE PROXY

Use Nginx.

Responsibilities

SSL

Compression

Caching

Security Headers

Static Assets

Reverse Proxy

---

# SECURITY

Helmet enabled.

Rate Limiter enabled.

CORS configured.

Compression enabled.

Environment variables verified.

Production secrets rotated.

---

# FRONTEND BUILD

Run production build.

Verify

No warnings

No errors

Optimized assets

Lazy loading working

Responsive layout

---

# BACKEND BUILD

Verify

TypeScript

ESLint

Build

Health endpoint

Database connection

Environment validation

---

# HEALTH ENDPOINTS

GET

/api/v1/health

GET

/api/v1/ready

GET

/api/v1/live

All must return healthy status.

---

# DEPLOYMENT CHECKLIST

Backend build successful

Frontend build successful

Database connected

Indexes created

Environment variables verified

Cloudinary configured

OTP provider configured

UPI details verified

SSL active

Nginx running

PM2 running

Health checks passed

---

# POST DEPLOYMENT TESTS

Homepage loads

Products visible

Search works

OTP Login works

Add to Cart works

Checkout works

Pickup Order works

Delivery Order works

Custom Cake works

Review works

Favorites work

Admin Login works

Dashboard works

Settings save correctly

---

# MONITORING

Monitor

CPU

RAM

Disk

Response Time

Error Rate

Server Logs

Database Status

Future

Sentry

Grafana

Prometheus

Uptime Robot

---

# LOGS

Separate logs

Application

Errors

Access

PM2

Rotate logs automatically.

Never store logs forever.

---

# BACKUPS

Database

Daily

Images

Cloudinary

Configuration

Git Repository

Verify restore regularly.

---

# ROLLBACK PLAN

If deployment fails

Stop new deployment

Restore previous version

Restart PM2

Verify health endpoints

Confirm database integrity

Notify owner

---

# VERSIONING

Git Tag

Example

v1.0.0

Every production deployment must have a Git tag.

---

# RELEASE PROCESS

1. Run tests

2. Run lint

3. Run build

4. Security review

5. Backup database

6. Deploy backend

7. Deploy frontend

8. Verify health

9. Smoke testing

10. Monitor logs

11. Announce release

---

# DISASTER RECOVERY

In case of server failure

Provision new server

Restore repository

Restore environment

Restore database

Restore Cloudinary configuration

Deploy application

Verify health

Resume service

---

# GOLDEN RULE

Never deploy on Friday evening.

Always keep a rollback plan.

Production stability is more important than deployment speed.
