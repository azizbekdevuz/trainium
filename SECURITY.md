# Security Policy

## Supported Versions

Trainium is actively maintained. Security updates are provided for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

We recommend always using the latest release.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in Trainium, please report it responsibly:

1. **Private disclosure** — Open a [GitHub Security Advisory](https://github.com/azizbekdevuz/trainium/security/advisories/new) (preferred), or contact the maintainers privately via your preferred channel listed in the repository.

2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
   - Your contact information for follow-up

3. **Response** — We aim to acknowledge reports within 48 hours and provide an initial assessment within 7 days.

4. **Disclosure** — We will coordinate with you on disclosure timing. We appreciate your patience and responsible disclosure.

### What We Consider In Scope

- Authentication and authorization bypass
- SQL injection, XSS, CSRF
- Sensitive data exposure (credentials, tokens, PII)
- Payment-related vulnerabilities (Stripe, Toss Payments integration)
- Privilege escalation (admin/staff access)
- Socket.IO or real-time notification abuse

### Out of Scope

- Issues in dependencies (report upstream; we will update dependencies)
- Social engineering or physical attacks
- Denial of service requiring significant resources
- Issues in third-party services (Stripe, Toss, Resend, etc.)

## Security Practices in This Project

- **Authentication**: NextAuth.js with JWT, bcrypt for passwords
- **API**: Session validation, role-based access control, Zod input validation
- **Database**: Prisma ORM (parameterized queries)
- **Payments**: Server-side intent creation, webhook validation, idempotency
- **File uploads**: Type validation, size limits, path traversal prevention

Thank you for helping keep Trainium and its users safe.
