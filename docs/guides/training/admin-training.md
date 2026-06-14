# Admin Training Guide

**Version**: 4.5.32
**Last Updated**: December 6, 2025
**Training Duration**: 2-3 hours
**Skill Level**: Beginner to Intermediate

---

## Quick Start

This training guide provides step-by-step instructions for new administrators. Complete all 6 modules and the certification checklist to become proficient.

**Prerequisites**:

- Admin account credentials
- Modern web browser
- 2-3 hours of dedicated time

**Training Structure**:

1. Module 1: Getting Started (30 min)
2. Module 2: User Management (45 min)
3. Module 3: School & Provider Management (45 min)
4. Module 4: Analytics & Reporting (30 min)
5. Module 5: Security & Maintenance (30 min)
6. Module 6: Advanced Topics (30 min)

---

## Module 1: Getting Started (30 minutes)

### First Login

1. Open application in browser
2. Login with admin credentials
3. Change password when prompted
4. Explore dashboard tabs

**Practice**: Log in successfully and navigate all tabs

### Understanding Roles

| Role      | Scope        | Key Permission                      |
| --------- | ------------ | ----------------------------------- |
| Admin     | All schools  | Create users, manage everything     |
| Moderator | One school   | Approve classes for assigned school |
| Teacher   | Multi-school | Book classes at any school          |

---

## Module 2: User Management (45 minutes)

### Creating Users

**Creating a Teacher**:

1. Navigate to Users tab
2. Click "Add User"
3. Username: `john.teacher`
4. Role: Teacher
5. School: Leave blank (multi-school)
6. Default password: `Teacherjohn.teacher`

**Creating a Moderator**:

1. Same process as teacher
2. Role: Moderator
3. School: **REQUIRED** - select from dropdown
4. Password format same: `Teacher{username}`

### Password Management

**Resetting Passwords**:

1. Find user in Users tab
2. Click "Reset Password"
3. Confirm action
4. Password resets to `Teacher{username}`
5. User must change on next login

**Practice**: Create test user, reset password, verify forced change

---

## Module 3: School & Provider Management (45 minutes)

### Creating Schools

1. Navigate to Schools tab
2. Click "Add School"
3. English Name: "Bangkok International School"
4. Thai Name: "โรงเรียนนานาชาติกรุงเทพ"
5. Moderator: Select or leave blank
6. Submit

### Provider System

**Categories**:

- Personal (private students)
- Private (tutoring company)
- Language School
- Educational Camp
- Guardian (replaces old guardian role)

**Key Difference**:

- Schools = Require moderator approval
- Providers = Auto-approve classes

**Practice**: Create test school and provider

---

## Module 4: Analytics & Reporting (30 minutes)

### Admin Analytics Dashboard

**Summary Cards**:

1. Total Schools
2. Total Teachers
3. Total Classes
4. Completion Rate

**Exporting Reports**:

1. Navigate to Analytics tab
2. Select date range
3. Click "Export CSV"
4. Open in Excel/Sheets

**Practice**: Generate report for last 30 days

---

## Module 5: Security & Maintenance (30 minutes)

### Critical Security Issue

🚨 **Bcrypt Migration Required**:

- Problem: Bcrypt users can login with ANY password
- Action: Run `.\scripts\migrate-bcrypt-passwords.ps1`
- Check affected users: `migrateBcryptPasswords:countBcryptUsers()`

### Account Lockout

- 5 failed attempts → 24-hour lock
- Manual unlock via Convex dashboard
- Set `accountLockedUntil` to null

### Audit Logs

1. Navigate to Audit Logs tab
2. Review user actions
3. Filter by user, date, action
4. Export for compliance

**Practice**: Review your recent actions in audit log

---

## Module 6: Advanced Topics (30 minutes)

### Notifications

**Creating Broadcast Notification**:

1. Navigate to Notifications tab
2. Click "Create Notification"
3. Title (EN/TH): Both required
4. Message (EN/TH): Both required
5. Type: success/info/warning/error
6. Target: Leave blank for broadcast

### Class Merging

**Merge Duplicate Classes**:

1. Navigate to Classes tab
2. Select duplicate classes
3. Click "Merge Classes"
4. Review preview
5. Confirm merge

### Troubleshooting

**Common Issues**:

1. **Moderator can't see classes**: Check schoolId assignment
2. **CSV won't download**: Allow downloads in browser
3. **User can't login**: Check account lockout status

---

## Certification Checklist

### Required Skills

- [ ] Create users (teacher and moderator)
- [ ] Reset passwords
- [ ] Create schools with bilingual names
- [ ] Assign moderators to schools
- [ ] Create providers
- [ ] Generate analytics reports
- [ ] Export CSV
- [ ] Create notifications
- [ ] Review audit logs
- [ ] Troubleshoot common issues

### Practical Test

Complete these 10 tasks:

1. [ ] Create 2 schools
2. [ ] Create 2 moderators (one per school)
3. [ ] Create 3 teachers
4. [ ] Reset one teacher's password
5. [ ] Generate analytics CSV
6. [ ] Create test notification
7. [ ] Review audit logs
8. [ ] Create 1 provider
9. [ ] Troubleshoot simulated issue
10. [ ] Document all steps taken

**Score**: \_\_\_/10

- 10/10: ✅ Certified
- 8-9/10: ⚠️ Review and retake
- <8/10: ❌ Additional training needed

---

## Additional Resources

- Admin & Moderator Guide: `docs/guides/admin-moderator-guide.md`
- Admin FAQ: `docs/features/ADMIN_FAQ.md`
- Architecture Docs: `.github/copilot-docs/02-architecture.md`
- Security Docs: `.github/copilot-docs/05-security.md`

---

**Document Version**: 1.0.0
**System Version**: 4.5.32
**Last Updated**: December 6, 2025
