# Contributing Guide

## Purpose

This document defines the contribution guidelines for the OneBite Bakery Platform.

It ensures that every contributor follows the same architecture, coding standards, documentation process, and engineering practices.

These rules apply to:

- Human Developers
- AI Coding Assistants
- Future Team Members

No contribution should violate the Architecture Contracts or Engineering Guidelines.

---

# Core Principles

Every contribution must be:

- Small
- Reviewable
- Tested
- Documented
- Backward Compatible

Never mix unrelated features in a single contribution.

---

# Before You Start

Read these documents first:

- 01_VISION.md
- 02_BUSINESS_RULES.md
- 03_DATABASE.md
- 04_API.md
- 15_ARCHITECTURE_CONTRACTS.md
- 16_SECURITY.md
- 17_TECH_STACK.md
- 21_ENGINEERING_GUIDELINES.md
- CURRENT_PROJECT_STATUS.md

Do not start implementation without understanding the existing architecture.

---

# Branch Strategy

Recommended branches:

main

↓

develop

↓

feature/<feature-name>

↓

bugfix/<bug-name>

↓

hotfix/<critical-fix>

Never develop directly on production branches.

---

# Commit Message Convention

Use Conventional Commits.

Examples:

feat: add product inventory management

fix: resolve search pagination bug

docs: update payment architecture

refactor: simplify order repository

test: add authentication integration tests

chore: update dependencies

---

# Pull Request Rules

Each Pull Request should:

- Solve one logical problem.
- Be easy to review.
- Include tests if applicable.
- Update documentation if required.

Large PRs should be split into smaller ones whenever possible.

---

# Coding Standards

Always follow:

09_CODE_STANDARDS.md

21_ENGINEERING_GUIDELINES.md

Never bypass project conventions.

---

# Architecture Rules

Follow strict layering:

Controller

↓

Service

↓

Repository

↓

Database

Rules:

Controllers

- HTTP only

Services

- Business logic only

Repositories

- Persistence only

Utilities

- Shared reusable logic

No shortcuts.

---

# Documentation Rules

Documentation must remain synchronized with implementation.

Whenever architecture changes:

Update:

- API
- Database
- Business Rules
- Security
- Current Project Status

Never leave documentation outdated.

---

# Testing Requirements

Every feature should include appropriate testing.

Minimum:

- TypeScript passes
- ESLint passes
- Build passes

Preferred:

- Unit Tests
- Integration Tests

Commands:

npm run typecheck

npm run lint

npm test

npm run build

---

# Security Rules

Follow:

16_SECURITY.md

Never:

Log secrets

Store plain passwords

Store plain OTPs

Expose internal IDs unnecessarily

Disable validation

Skip authorization

---

# Dependency Rules

Before adding a dependency:

Ask:

Do we really need it?

Prefer:

Built-in Node.js modules

Existing utilities

Well-maintained packages

Avoid unnecessary dependencies.

---

# AI Assistant Guidelines

AI assistants must:

Read project documentation before implementation.

Respect architecture boundaries.

Avoid rewriting unrelated code.

Avoid unnecessary refactoring.

Never introduce breaking changes without approval.

Always stop after completing the requested milestone.

If unsure, ask instead of guessing.

---

# Review Checklist

Before requesting review:

- Code builds successfully.
- Lint passes.
- Tests pass.
- Documentation updated.
- No duplicate logic.
- No architecture violations.

---

# Issue Reporting

Bug reports should include:

- Summary
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment
- Logs (if applicable)

Feature requests should include:

- Problem Statement
- Proposed Solution
- Business Justification

---

# Release Process

Before merging:

- Review completed
- Tests passed
- Documentation updated
- Approval received

Follow:

30_RELEASE_CHECKLIST.md

---

# Code Ownership

Major architectural changes require approval before implementation.

Examples:

Authentication

Payments

Orders

Database

Security

Deployment

---

# Definition of Done

A contribution is complete when:

✓ Code follows architecture

✓ Tests pass

✓ Documentation updated

✓ No security issues introduced

✓ No breaking changes

✓ Ready for review