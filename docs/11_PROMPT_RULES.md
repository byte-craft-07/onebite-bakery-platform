# Prompt Rules

# CODEX PROMPT RULES

This document defines how AI (Codex) should be instructed
during the development of the The Online Bakery Platform.

The objective is to generate production-quality code,
avoid regressions, and keep development predictable.

---

# PRIMARY RULE

Never ask AI to build the entire project at once.

Break development into small, testable tasks.

Each prompt should focus on only one feature or one sprint.

---

# BEFORE WRITING CODE

Always read:

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

11_PROMPT_RULES.md

Never start coding without understanding these documents.

---

# PROMPT TYPES

## CREATE

Used when creating something new.

Example

Create Product Module

Create Authentication

Create Order Module

---

## MODIFY

Used when updating existing functionality.

Never rewrite unrelated files.

Only change what is necessary.

---

## REFACTOR

Improve code quality.

Never change business logic.

Never break existing APIs.

Never change database schema unless requested.

---

## FIX

Only fix the reported issue.

Do not redesign the project.

Do not refactor unrelated code.

---

## REVIEW

Analyze code.

Find

Performance issues

Security issues

Bug risks

Scalability problems

Do not modify code unless requested.

---

## TEST

Write tests only.

Do not modify production code unless required.

---

# OUTPUT RULES

Always explain

What changed

Why it changed

Files created

Files modified

Breaking changes

Migration required

Next recommended step

---

# FILE CREATION RULES

Before creating a file

Check whether it already exists.

Avoid duplicate files.

Reuse existing modules whenever possible.

---

# SAFE EDIT RULE

Never delete code without explanation.

Never overwrite files blindly.

Preserve existing functionality.

---

# DATABASE RULE

Never modify schemas without approval.

Never remove existing fields.

Always create migrations if needed.

---

# API RULE

Never break existing endpoints.

If changes are required

Create

/api/v2/

instead of breaking

/api/v1/

---

# TYPESCRIPT RULES

Strict Mode

No any

Prefer interfaces

Strong typing everywhere

---

# SECURITY RULES

Never expose secrets.

Never log JWT.

Never trust client input.

Always validate requests.

---

# PERFORMANCE RULES

Avoid unnecessary renders.

Optimize database queries.

Use pagination.

Use indexes.

Lazy load heavy components.

---

# UI RULES

Follow

05_DESIGN_SYSTEM.md

Exactly.

Never invent random colors.

Never invent new spacing.

Never change typography.

---

# DOCUMENTATION RULE

Whenever architecture changes

Update documentation first.

Then update code.

---

# GIT RULE

Every completed feature should end with

Working Build

Documentation Update

Meaningful Commit

---

# IF REQUIREMENTS ARE UNCLEAR

Do not guess.

List assumptions.

Ask for clarification.

Wait for confirmation before implementation.

---

# TASK SIZE LIMIT

One prompt = One feature.

Examples

✅ Authentication

✅ Product Module

✅ Cart Module

❌ Entire Backend

❌ Complete Website

---

# DEFINITION OF DONE

Feature compiles successfully.

No TypeScript errors.

No ESLint errors.

No duplicate code.

API tested.

Documentation updated.

Git ready.

---

# GOLDEN RULE

Quality over speed.

Correct architecture over quick implementation.

Always optimize for long-term maintainability.
