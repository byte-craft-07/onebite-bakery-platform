# 21_ENGINEERING_GUIDEL

# The Online Bakery Platform

## Purpose

This document defines the engineering rules that every developer and AI coding assistant must follow.

These rules are mandatory.

No implementation should violate them without explicit approval.

---

# Project Vision

The Online Bakery is not only a bakery website.

It is a Celebration Commerce Platform.

Customers should be able to purchase everything required for a celebration from one platform.

---

# Read Before Coding

Every implementation must first read:

01_VISION.md

02_BUSINESS_RULES.md

03_DATABASE.md

04_API.md

05_DESIGN_SYSTEM.md

06_USER_FLOW.md

07_DECISIONS.md

08_AGENTS.md

09_CODE_STANDARDS.md

10_ROADMAP.md

15_ARCHITECTURE_CONTRACTS.md

16_SECURITY.md

17_TECH_STACK.md

18_PRODUCT_STRATEGY.md

19_FUTURE_ROADMAP.md

20_DEVELOPER_GUIDELINES.md

Never start implementation without understanding these documents.

---

# Architecture Rules

Follow:

Controller

↓

Service

↓

Repository

↓

Database

Controllers

- Validate requests
- Return responses
- Never access MongoDB directly

Services

- Business logic only

Repositories

- Database operations only

Database layer

- No business logic

---

# Repository Pattern

Always use repositories.

Never access Mongoose directly from controllers or services.

---

# Module Structure

Each module must follow:

module/

controller/

service/

repository/

routes/

dto/

validators/

constants/

types/

model/

index.ts

Keep naming consistent.

---

# Business Rules

Never hardcode business values.

Examples

Minimum Home Delivery Amount

Delivery Radius

Maximum OTP Attempts

OTP Expiry

Combo Rules

Everything must come from configuration or settings.

---

# Product Rules

Product Types

NORMAL

COMBO

CUSTOM_CAKE

Decoration items are normal products.

Combo products reference existing products.

Products may belong to multiple occasions.

Categories and Occasions are independent.

---

# Security Rules

Never store:

OTP

Refresh Token

Passwords

in plain text.

Always hash.

Use HttpOnly cookies.

Never expose secrets.

Never log sensitive values.

Validate every request.

Sanitize every input.

---

# API Rules

Public APIs

Return only safe fields.

Owner APIs

Require authentication.

Admin-only operations must verify role.

Always return consistent response format.

---

# Database Rules

Soft delete wherever applicable.

Use indexes.

Name indexes consistently.

Never duplicate data unnecessarily.

Prefer references over copied data.

---

# Code Quality

TypeScript Strict

No any

No duplicate logic

SOLID Principles

Repository Pattern

Feature-first architecture

Avoid circular dependencies.

---

# Testing Rules

Every milestone must pass:

npm run typecheck

npm run lint

npm test

npm run build

Critical features require unit tests.

Integration tests should be added when appropriate.

---

# Documentation Rules

Whenever architecture changes:

Update documentation.

Never let implementation and documentation diverge.

---

# AI Coding Assistant Rules

Before changing code:

Read project documentation.

Respect existing architecture.

Maintain backward compatibility.

Never rebuild completed modules.

Update existing implementations instead.

Never rename files without reason.

Never replace architecture with personal preference.

If a previous design appears incorrect:

Stop.

Explain the issue.

Wait for approval.

---

# Milestone Rules

Implement only the approved milestone.

Never implement future milestone features.

Never expand scope without approval.

---

# Pull Request / Commit Rules

Each milestone should produce:

Files Created

Files Modified

Architecture Summary

Security Review

Technical Debt

Test Summary

Self Review

Only then create a commit.

---

# Definition of Done

A milestone is complete only when:

✓ Scope completed

✓ Documentation updated

✓ Tests passing

✓ Build passing

✓ Lint passing

✓ Typecheck passing

✓ Self review completed

✓ Technical debt documented

✓ Architecture respected

Only after that may the milestone be approved.

---

# Long-Term Principles

Prioritize:

Maintainability

Scalability

Security

Performance

Readability

Consistency

Avoid shortcuts.

Build for years, not weeks.

---

# Final Rule

When uncertain:

Do not guess.

Read the documentation.

Analyze the existing implementation.

Ask for clarification if necessary.

Consistency is more important than speed.