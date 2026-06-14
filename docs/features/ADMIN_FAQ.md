# Admin FAQ - Frequently Asked Questions

**Version**: 4.5.32  
**Last Updated**: December 6, 2025  
**Role**: System Administrator

---

## Table of Contents

1. [General Administration](#general-administration)
2. [User Management](#user-management)
3. [School & Provider Management](#school--provider-management)
4. [Security & Access Control](#security--access-control)
5. [Analytics & Reporting](#analytics--reporting)
6. [Troubleshooting](#troubleshooting)
7. [System Maintenance](#system-maintenance)

---

## General Administration

### Q: What is the difference between Admin, Moderator, and Teacher roles?

**A**: The system has a hierarchical role structure:

- **Admin (God Mode)**:
  - Unrestricted access to all features and data
  - Can create users and assign roles
  - Manages all schools and providers
  - Singleton role (only one admin per system)

- **Moderator (School-Scoped)**:
  - Restricted to ONE assigned school
  - Can approve/reject classes for their school
  - Cannot access other schools' data
  - Cannot create users or providers

- **Teacher (Multi-School)**:
  - Can book classes at ANY school
  - Can work with multiple schools
  - Limited administrative functions
  - Focus on class booking and management

### Q: Can I have multiple admin accounts?

**A**: Technically yes, but it's **not recommended**. The system is designed for a single admin account (God mode). Multiple admins can:

- Lead to accountability issues
- Create confusion about who manages what
- Increase security risk

**Best Practice**: Use ONE admin account, delegate school management to moderators.

### Q: How do I access the admin dashboard?

**A**:

1. Login with admin credentials (username: `admin`)
2. Dashboard appears automatically after login
3. All tabs are accessible (Users, Schools, Providers, Analytics, etc.)
4. Look for purple/indigo colored admin-only sections

### Q: What happens if I forget my admin password?

**A**:

- **Critical**: Only admins can reset passwords
- If you're the sole admin, you'll need database access
- **Recovery Steps**:
  1. Access Convex dashboard directly
  2. Use `users:resetPassword` mutation manually
  3. Or contact repository owner for assistance

**Prevention**: Store admin credentials securely!

---

## User Management

### Q: How do I create a new user?

**A**:

1. Navigate to **Users** tab in admin dashboard
2. Click **"Add User"** button
3. Fill in the form:
   - **Username**: Unique identifier (e.g., `john.smith`)
   - **Role**: Select Teacher, Moderator, or Admin
   - **School**: Required for moderators, optional for teachers
4. Click **"Create User"**
5. System generates default password: `Teacher{username}`
6. Share credentials with the user securely
7. User must change password on first login

**Example**:

- Username: `sarah.jones`
- Default Password: `Teachersarah.jones`
- Role: Teacher

### Q: What is the default password format and why?

**A**: Default password format is `Teacher{username}` (e.g., `TeacherEvan` for user `Evan`)

**Why this format?**

- Easy for admins to remember
- Predictable for communication
- Forces password change on first login
- Not a security risk due to mandatory change

**Security Note**: Users MUST change password on first login (enforced by system).

### Q: Can I view a user's password?

**A**: **No, absolutely not.** The system uses one-way hashing (PBKDF2):

- Passwords are hashed before storage
- Even admins cannot decrypt passwords
- Only the user knows their actual password
- You can only **reset** passwords, not view them

### Q: How do I reset a user's password?

**A**:

1. Go to **Users** tab
2. Find the user in the list
3. Click **"Reset Password"** button
4. Confirm the action
5. Password resets to `Teacher{username}`
6. User's `requirePasswordChange` flag is set to `true`
7. User must change password on next login

**Use Cases**:

- User forgot their password
- Security incident requiring password reset
- Deactivated user being reactivated

### Q: Can I delete multiple users at once?

**A**: **Yes**, the system supports bulk deletion:

1. Navigate to **Users** tab
2. Check the boxes next to users you want to delete
3. Click **"Delete Selected"** button
4. Confirm deletion in the dialog
5. Users are removed from the system

**Warning**: This is a permanent action. Deleted users:

- Lose access immediately
- Have their data preserved in classes/logs
- Cannot be recovered without database backup

### Q: What happens to a user's classes when they're deleted?

**A**:

- **Classes remain** in the database
- Teacher name is cached in class records
- Historical data is preserved
- Audit logs show the deleted user's actions
- Future bookings are not affected (linked by ID)

### Q: Can I change a user's role after creation?

**A**: Currently **not supported** via UI. Changing roles requires:

1. Delete the user
2. Recreate with new role
3. User must reconfigure preferences
4. OR use Convex dashboard to manually update role field

**Future Enhancement**: Role change feature planned.

### Q: Why are some users locked out?

**A**: Account lockout occurs after **5 failed login attempts**:

- Lockout duration: **24 hours**
- Automatically unlocks after expiry
- Visible in user record: `accountLockedUntil` timestamp

**To unlock early** (requires database access):

1. Access Convex dashboard
2. Find user record
3. Set `accountLockedUntil` to `null` or past date
4. Set `failedLoginAttempts` to `0`
5. User can login immediately

---

## School & Provider Management

### Q: What's the difference between a School and a Provider?

**A**:

**School**:

- Traditional educational institution
- Has a moderator for approval workflow
- Examples: "Bangkok International School", "Chiang Mai Academy"
- Classes require moderator approval

**Provider**:

- Alternative teaching organization
- No moderator approval needed
- Examples: Private tutoring, language centers, personal students
- Classes auto-approve (bypasses workflow)

**Key Difference**: Approval workflow presence.

### Q: How do I create a new school?

**A**:

1. Navigate to **Schools** tab
2. Click **"Add School"** button
3. Fill bilingual names:
   - **English Name**: "Bangkok International School"
   - **Thai Name**: "โรงเรียนนานาชาติกรุงเทพ"
4. Optionally assign a moderator
5. Click **"Create School"**
6. School appears in dropdown lists immediately

**Bilingual Requirement**: Both English and Thai names are required.

### Q: Can I assign multiple moderators to one school?

**A**: **Not recommended**, but technically possible:

- Schema allows one moderator per school
- UI enforces one-to-one relationship
- Multiple schools can share a moderator (not ideal)

**Best Practice**: One moderator per school for clear responsibility.

### Q: What happens if a school has no moderator?

**A**:

- Teachers can still book classes at that school
- Classes remain in "pending" status indefinitely
- No approval workflow occurs
- Admin must manually approve classes

**Solution**: Always assign a moderator to active schools.

### Q: How do I create a Provider?

**A**:

1. Navigate to **Providers** tab
2. Click **"Add Provider"** button
3. Fill the form:
   - **English Name**: "ABC Language Center"
   - **Thai Name**: "ศูนย์ภาษา ABC"
   - **Category**: Select from dropdown
     - Personal (teacher's private students)
     - Private (tutoring company)
     - Language School
     - Educational Camp
     - Guardian (parent/guardian)
4. System auto-fills `createdBy` with your user ID
5. Click **"Create Provider"**

**Auto-Approval**: Classes with providerId bypass moderator approval.

### Q: What is the "Guardian" provider category?

**A**: **Guardian category** replaced the old guardian user role:

**Old System** (Deprecated):

- Guardian was a user role
- Limited functionality
- Hard to manage

**New System** (Current):

- Guardian is a provider category
- More flexible
- Better data structure
- Same auto-approval benefit

**Migration**: Existing guardian users were migrated to guardian providers (October 2025).

### Q: Can teachers create providers?

**A**: **Yes**, teachers can create providers:

- Admins can create all provider types
- Teachers can create "personal" and "guardian" categories
- Moderators **cannot** create providers (school-scoped only)

**Use Case**: Teacher managing private students or working with a tutoring company.

### Q: Can I delete a school that has classes?

**A**: **Yes**, but be cautious:

- School deletion is allowed
- Existing classes remain linked (schoolId preserved)
- Students linked to school may become orphaned
- Moderator assignment is removed

**Recommended Steps**:

1. Transfer students to another school
2. Complete/cancel all pending classes
3. Reassign or remove moderator
4. Then delete school

**Alternative**: Mark school as inactive (requires custom field).

---

## Security & Access Control

### Q: How secure are passwords in the system?

**A**: Passwords use **PBKDF2 hashing** (as of November 2025):

- **Algorithm**: SHA-256
- **Iterations**: 100,000 (100x stronger than bcrypt)
- **Hash Size**: 32 bytes
- **Salt Size**: 16 bytes (random per user)
- **Standard**: Web Crypto API (Convex-compatible)

**Security Level**: A+ (industry standard for password storage)

### Q: I heard there's a critical security issue with bcrypt users?

**A**: **Yes, this is critical** and requires immediate action:

**Issue**:

- Bcrypt hashes cannot be verified in Convex runtime
- Temporary bypass allows **ANY password** for bcrypt users
- Major security vulnerability

**Status**: 🔴 **MIGRATION REQUIRED IMMEDIATELY**

**Solution**:

1. Run PowerShell script: `.\scripts\migrate-bcrypt-passwords.ps1`
2. Script resets all bcrypt passwords to `Teacher{username}`
3. Users forced to change password on next login
4. Auto-upgrade to PBKDF2 on password change

**Timeline**:

- Issue Discovered: November 9, 2025
- Migration Tool: Created November 9, 2025
- **Action Required**: Run migration now!

**Check affected users**:

```bash
# In Convex dashboard
migrateBcryptPasswords:countBcryptUsers()
```

### Q: What is the account lockout policy?

**A**:

- **Failed Attempts**: 5 consecutive failures
- **Lockout Duration**: 24 hours
- **Automatic Unlock**: Yes, after 24 hours
- **Counter Reset**: On successful login

**Bypass** (admin only):

- Access database directly
- Reset `failedLoginAttempts` to 0
- Clear `accountLockedUntil` timestamp

### Q: How long do user sessions last?

**A**:

- **Duration**: 24 hours from login
- **Storage**: localStorage (browser)
- **Renewal**: No automatic renewal
- **Expiry**: Forced re-login after 24 hours

**Security Consideration**: localStorage is vulnerable to XSS attacks, but acceptable for private deployment with trusted users.

### Q: Can moderators access data from other schools?

**A**: **No, absolutely not.** Moderators are strictly school-scoped:

**Enforcement**:

- **Backend**: Authorization checks on all mutations
- **Frontend**: UI elements locked/hidden
- **Database**: Queries auto-filtered by schoolId

**What moderators CANNOT do**:

- View other schools' classes
- Approve classes at other schools
- Access other schools' students
- Change school dropdown
- Create provider classes

**Security Fix**: November 1, 2025 - Moderator authorization bypass vulnerability fixed.

### Q: What if a moderator tries to book a class at another school?

**A**: System will **block the action** with a clear error:

```text
Authorization failed: Moderators can only book classes at their assigned school.
Your school: Sangsom Kindergarten (k1xyz789abc).
Attempted school: Bangkok International (k2def456ghi).
```

**Enforcement Layers**:

1. Frontend: School dropdown disabled
2. Backend: Authorization check throws error
3. Database: Query filtering by schoolId

### Q: How do I audit user actions?

**A**: Use the **Audit Logs** feature:

1. Navigate to **Audit Logs** tab in admin dashboard
2. View all recorded actions:
   - User creation/deletion
   - Password resets
   - Class approvals/rejections
   - School assignments
3. Filter by:
   - User
   - Date range
   - Action type
4. Export logs for compliance

**Audit Log Fields**:

- Timestamp
- User ID
- Action type
- Target entity
- Details (JSON)

---

## Analytics & Reporting

### Q: What's the difference between Admin Analytics and Moderator Analytics?

**A**:

**Admin Analytics**:

- **Scope**: All schools, system-wide
- **Summary Cards**: Total schools, teachers, classes, completion rate
- **Breakdown**: Classes by school table
- **Export**: System-wide CSV
- **Location**: Admin Dashboard → Analytics Tab

**Moderator Analytics**:

- **Scope**: Assigned school only
- **Summary Cards**: School classes, attendance, students, avg class size
- **Breakdown**: Student performance table
- **Export**: School-specific CSV
- **Location**: Moderator Dashboard → Analytics Tab

### Q: How do I generate an analytics report?

**A**:

**For Admins**:

1. Navigate to **Admin Analytics** tab
2. View system-wide summary cards
3. Review "Classes by School" table
4. Click **"Export CSV"** button
5. File downloads as `admin-analytics-{date}.csv`

**For Moderators**:

1. Navigate to **Analytics** tab
2. Select date range (start and end dates)
3. Review summary cards and student table
4. Click **"Export CSV"** for records

**Date Range**: Defaults to last 30 days, customizable.

### Q: What do the performance ratings mean?

**A**: Performance ratings are based on **attendance rate**:

- **Excellent** (≥90%): Green badge
  - Student attends 9+ out of 10 classes
  - Highly engaged
- **Good** (70-89%): Blue badge
  - Student attends 7-9 out of 10 classes
  - Satisfactory engagement
- **Needs Improvement** (<70%): Yellow badge
  - Student attends <7 out of 10 classes
  - May need follow-up

**Calculation**: `attendedClasses / totalClasses * 100`

### Q: Can I customize the analytics date range?

**A**: **Yes**, for both admin and moderator:

1. In Analytics view, find date range selectors
2. **Start Date**: Click calendar, select date
3. **End Date**: Click calendar, select date
4. Click **"Apply"** or auto-refresh
5. Summary cards update instantly

**Limits**:

- Start date must be before end date
- Maximum range: No limit (but affects performance)
- Recommended: 90 days or less for performance

### Q: What data is included in the CSV export?

**A**:

**Admin Export** (`admin-analytics-{date}.csv`):

```csv
School,Total Classes,Attendance Rate,Active Students
"Bangkok International",245,87.5%,42
"Chiang Mai Academy",189,92.3%,38
```

**Moderator Export** (`{school-name}-analytics-{date}.csv`):

```csv
Student Name,Total Classes,Attended Classes,Attendance Rate,Avg Class Size,Performance Rating
"John Smith",28,25,89.3%,4.2,"Good"
"Jane Doe",32,30,93.8%,3.8,"Excellent"
```

**Note**: Exports include bilingual headers when language is Thai.

### Q: Why are my analytics showing zero data?

**A**: Several possible reasons:

1. **No classes in date range**:
   - Expand date range
   - Check if classes exist at all

2. **Wrong school filter** (moderators):
   - Verify you're viewing correct school
   - Check if classes are at your assigned school

3. **Status filter**:
   - Analytics may filter by status (attended/approved)
   - Check class statuses

4. **Recent data**:
   - New classes may not be in date range
   - Try "last 90 days" instead of "last 30 days"

**Solution**: Adjust filters and check date range.

---

## Troubleshooting

### Q: Why can't I create a new user?

**A**: Common issues:

1. **Username already exists**:
   - System requires unique usernames
   - Try a different username

2. **Missing required fields**:
   - Username is required
   - Role is required
   - School is required for moderators

3. **Permission issue**:
   - Only admins can create users
   - Verify you're logged in as admin

4. **Database connection**:
   - Check Convex connection status
   - Refresh page and retry

### Q: A moderator says they can't see any classes. What's wrong?

**A**: Troubleshooting steps:

1. **Verify school assignment**:
   - Check user has `schoolId` field
   - Verify school exists

2. **Check classes exist**:
   - Verify classes are booked at that school
   - Check date range filter

3. **Check status filters**:
   - Moderator may have status filter active
   - Try "All Statuses"

4. **Browser cache**:
   - Clear cache and reload
   - Try incognito mode

5. **Role verification**:
   - Ensure user role is "moderator"
   - Check if accidentally set as "teacher"

### Q: Classes are not appearing in the analytics dashboard. Why?

**A**: Analytics only includes classes that:

1. Are within the selected date range
2. Match the user's role scope (school/all)
3. Have a valid status
4. Have associated student data

**Checklist**:

- [ ] Date range includes class dates
- [ ] Classes have status "approved" or "attended"
- [ ] Classes have linked students
- [ ] User has permission to view those classes

### Q: The school dropdown is not locked for a moderator. Is this a bug?

**A**: **Yes, this is a critical bug** (should be fixed as of Nov 1, 2025):

**Expected Behavior**:

- School dropdown should be `disabled={true}`
- Should show `cursor-not-allowed` and `opacity-75`
- Moderator cannot change selected school

**If dropdown is unlocked**:

1. Check frontend version (should be 4.5.14+)
2. Clear browser cache
3. Report bug to admin with:
   - User ID
   - Browser/device info
   - Screenshot

**Security Risk**: Moderator may bypass school scoping (backend should still block).

### Q: Export CSV is not downloading. What should I do?

**A**: Troubleshooting:

1. **Check browser settings**:
   - Allow downloads from the domain
   - Check download folder permissions

2. **Try different browser**:
   - Chrome/Edge recommended
   - Safari may have issues

3. **Check data exists**:
   - Empty analytics = no CSV data
   - Verify analytics show data first

4. **Network issue**:
   - Check internet connection
   - Refresh page and retry

5. **Console errors**:
   - Open browser dev tools (F12)
   - Check for JavaScript errors
   - Share errors with admin

---

## System Maintenance

### Q: How do I back up the system?

**A**: System uses Convex for data storage:

**Backup Methods**:

1. **Convex Dashboard**:
   - Export data via Convex dashboard
   - Download JSON snapshots
   - Scheduled backups (if configured)

2. **CSV Exports**:
   - Export analytics data
   - Export user lists (manual)
   - Export class data (manual)

3. **Database Snapshots**:
   - Convex automatic backups (check plan)
   - Point-in-time recovery available

**Recommended**: Enable automated backups in Convex settings.

### Q: How do I update the system to a new version?

**A**:

**For Vercel-hosted deployments**:

1. Push code to GitHub (triggers auto-deploy)
2. Monitor deployment in Vercel dashboard
3. Run database migrations if needed
4. Test critical workflows

**For Convex updates**:

1. Run `npx convex deploy` from local machine
2. Monitor function deployment
3. Check for schema changes
4. Verify real-time queries work

**Best Practice**: Deploy during low-traffic periods.

### Q: What should I do if Convex goes offline?

**A**: **See Disaster Recovery Protocols** (`.github/copilot-docs/11-disaster-recovery.md`):

**Immediate Steps**:

1. Check Convex status page
2. Notify users of outage
3. Monitor recovery progress
4. Have contingency plan ready

**Recovery**:

- Convex automatically recovers
- No data loss (persistent storage)
- Real-time sync resumes automatically

### Q: How do I monitor system errors?

**A**:

**Error Reports**:

1. Navigate to **Admin Dashboard → Error Reports**
2. View client-side errors
3. Review stack traces
4. Filter by date/user
5. Mark as resolved after fix

**Logging**:

- Browser console (F12 → Console tab)
- Convex logs (Convex dashboard → Logs)
- Vercel logs (Vercel dashboard → Deployments)

**Best Practice**: Check error reports weekly.

### Q: How do I add a new feature or customize the system?

**A**: This requires development knowledge:

**Process**:

1. Clone repository from GitHub
2. Set up local development environment
3. Make changes following patterns
4. Test thoroughly
5. Deploy to production

**Resources**:

- Architecture docs: `.github/copilot-docs/`
- Development workflow: `.github/copilot-docs/06-development.md`
- Code patterns: `.github/copilot-docs/03-patterns.md`

**Recommendation**: Contact repository maintainer for major changes.

---

## Additional Resources

- **Admin & Moderator Guide**: `docs/guides/admin-moderator-guide.md`
- **Moderator FAQ**: `docs/features/MODERATOR_FAQ.md`
- **Feature Documentation**: `docs/features/FEATURES_DOCUMENTATION.md`
- **Security Considerations**: `.github/copilot-docs/05-security.md`
- **Disaster Recovery**: `.github/copilot-docs/11-disaster-recovery.md`

---

## Contact & Support

**Need Help?**

- Check documentation first
- Review FAQ sections
- Contact repository maintainer
- Submit issue on GitHub

**Emergency Contacts**:

- Repository Owner: TeacherEvan
- GitHub: [TeacherEvan/Evan-sClassTracker4.5](https://github.com/TeacherEvan/Evan-sClassTracker4.5)

---

**Document Version**: 1.0.0  
**System Version**: 4.5.32  
**Last Updated**: December 6, 2025
