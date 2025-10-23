# Sangsom Project Schedule Import Guide

## Overview

This document describes the Sangsom Project schedule import functionality that allows administrators to bulk-import class schedule data from the paper-based schedule into the system.

## Background

The Sangsom Project is a teaching initiative with structured activities and project topics scheduled across November 2025 (พ.ศ. 2568). The schedule was originally documented on paper and needed to be digitized into the Class Tracker system.

## Source Data

- **Original Document**: `SangsomProjectApr.md` (transcribed from paper schedule image)
- **Date Range**: November 3-24, 2025 (3-24 พฤศจิกายน พ.ศ. 2568)
- **Schedule Pattern**: 
  - Morning Session: 9:00-10:30 (90 minutes)
  - Late Morning Session: 10:30-12:00 (90 minutes)
- **Total Classes**: 32 classes across 3 weeks
- **Class Levels**: K.1, K.2, K.3, อ.1, อ.2, อ.3
- **Teacher**: พงศกร หน่อไฟ (Pongsak Noi-fai)

## Implementation

### Files Created

1. **`SangsomProjectApr.md`**
   - Transcribed schedule data with both Thai and English translations
   - Includes class codes, topics, and activities
   - Organized by week and day

2. **`convex/seedSangsomProject.ts`**
   - Convex mutation functions for data seeding
   - Functions:
     - `seedSangsomProject`: Main seeding function
     - `checkSangsomData`: Check if data already exists
   - Creates:
     - Sangsom School (`โรงเรียนสังสม`)
     - Moderator user (`sangsom_moderator`)
     - Teacher user (`sangsom_teacher`)
     - Location (Sangsom Classroom)
     - Student records (one per class code)
     - Class bookings with full details

3. **`components/sangsom-seed-button.tsx`**
   - Admin UI component for triggering data import
   - Bilingual interface (English/Thai)
   - Features:
     - Check existing data
     - Seed new data
     - Progress feedback
     - Credential display
     - Summary of created records

4. **`app/page.tsx`** (modified)
   - Added "Data Import" tab to admin navigation
   - Integrated SangsomSeedButton component

## Usage

### Prerequisites

1. Admin access to the system
2. Convex backend running (`npx convex dev`)
3. Database initialized

### Steps to Import

1. **Login as Admin**
   ```
   Username: admin
   Password: TeacherAdmin (or your updated password)
   ```

2. **Navigate to Data Import**
   - Click on the "Data Import" / "นำเข้าข้อมูล" tab in admin navigation
   - You will see the Sangsom Project Data Seeder interface

3. **Check Existing Data (Optional)**
   - Click "Check Existing Data" / "ตรวจสอบข้อมูลที่มีอยู่"
   - System will report if Sangsom data already exists
   - Shows count of existing classes and students

4. **Seed the Data**
   - Click "Seed Sangsom Data" / "เพิ่มข้อมูลสังสม"
   - Wait for processing (may take 10-30 seconds)
   - Success message will display:
     - Number of students created
     - Number of classes created
     - Login credentials for teacher and moderator

5. **Note Credentials**
   After seeding, note the generated credentials:
   ```
   Teacher: sangsom_teacher / TeacherPongsak
   Moderator: sangsom_moderator / TeacherSangsomModerator
   ```

### Viewing the Data

1. **Login as Teacher**
   - Use credentials: `sangsom_teacher / TeacherPongsak`
   - Navigate to Calendar tab
   - Classes will appear in the weekly calendar for November 2025

2. **Class Details**
   Each class includes:
   - **Subject**: Sangsom Project (โครงสังสม)
   - **Lesson Topic**: Project theme (e.g., "Project: Rice" / "โครงงานเรื่อง ข้าว")
   - **Materials**: Activity/song (e.g., "Roll your hands" / "ชุดกิจกรรมสอง Roll your hands")
   - **Duration**: 90 minutes
   - **Status**: Approved (auto-approved for seeded data)
   - **Student**: Assigned by class code (K.1/1, K.2/2, etc.)

## Data Structure

### School
```typescript
{
  name: "Sangsom School",
  nameTh: "โรงเรียนสังสม",
  moderatorId: <generated>
}
```

### Students
One student per class code with naming pattern:
```typescript
{
  firstName: "Student K.1/1", // Example
  lastName: "Sangsom",
  studentId: "SANG-K1-<timestamp>-<random>", // Unique ID
  grade: "K.1",
  class: "/1",
  nickname: "K.1/1",
  schoolId: <Sangsom School ID>
}
```

### Classes
```typescript
{
  teacherId: <sangsom_teacher ID>,
  schoolId: <Sangsom School ID>,
  studentId: <Student ID>,
  locationId: <Sangsom Classroom ID>,
  scheduledDate: <timestamp>, // Date + Time (9:00 or 10:30)
  duration: 90, // minutes
  subject: "Sangsom Project",
  subjectTh: "โครงสังสม",
  lessonTopic: "Project: Rice", // Example (English)
  lessonTopicTh: "โครงงานเรื่อง ข้าว", // Example (Thai)
  materials: "Roll your hands", // Example (activity)
  materialsTh: "ชุดกิจกรรมสอง Roll your hands",
  classType: "regular",
  status: "approved"
}
```

## Idempotency

The seeding script is designed to be idempotent:

1. **School Check**: Checks if "Sangsom School" exists before creating
2. **Student Deduplication**: Checks for existing students by grade+class+schoolId
3. **Class Deduplication**: Checks for existing classes by teacher+date+student
4. **Safe Re-run**: Running multiple times won't create duplicates

## Troubleshooting

### Error: "Sangsom school exists but missing teacher, moderator, or location"

**Solution**: The school exists but associated records are incomplete. Options:
1. Manually delete the Sangsom School via admin UI
2. Re-run the seeder (it will recreate missing records)

### Error: "Student not found for class code: X"

**Solution**: Student creation failed for that class code. Check:
1. Database write permissions
2. Student ID generation logic
3. Re-run the seeder

### Classes Don't Appear in Calendar

**Possible Causes**:
1. **Date Range**: Calendar may be showing different week
   - Solution: Navigate to November 2025 in calendar
2. **Status Filter**: Classes might be filtered out
   - Solution: Check that "approved" status is visible
3. **School Filter**: Wrong school selected (moderator view)
   - Solution: Select "Sangsom School"

### API Error: "seedSangsomProject is not defined"

**Solution**: Convex backend needs to regenerate API:
1. Stop Convex dev server
2. Run `npx convex dev` to restart
3. API types will regenerate automatically
4. Refresh browser

## Sample Schedule Data

### Week 1 (November 3-9, 2025)

| Day | Time | Class | Topic (Thai) | Activity |
|-----|------|-------|--------------|----------|
| Mon 11/3 | 9:00-10:30 | K.1/1 | โครงงานเรื่อง ข้าว | Roll your hands |
| Mon 11/3 | 10:30-12:00 | อ.2/1 | โครงงานเรื่อง ที่กินบัว | เปิดเพลงมา |
| Tue 11/4 | 9:00-10:30 | อ.1/2 | โครงงานเรื่อง กล้วย | OK มะคอะ |
| ... | ... | ... | ... | ... |

(See `SangsomProjectApr.md` for complete schedule)

## Future Enhancements

Possible improvements for this feature:

1. **CSV Import**: Allow importing schedules from CSV files
2. **Template System**: Create reusable schedule templates
3. **Bulk Edit**: Modify multiple classes at once
4. **Schedule Preview**: Preview before importing
5. **Conflict Detection**: Warn about scheduling conflicts
6. **Rollback**: Ability to undo an import
7. **Import History**: Track what was imported and when

## Related Files

- `/SangsomProjectApr.md` - Original schedule transcription
- `/convex/seedSangsomProject.ts` - Backend seeding logic
- `/components/sangsom-seed-button.tsx` - UI component
- `/app/page.tsx` - Admin navigation integration
- `/convex/schema.ts` - Database schema definitions

## Technical Notes

### Date Handling

Thai Buddhist calendar (พ.ศ.) uses year + 543:
- 2568 (Thai) = 2025 (Gregorian)
- November 2568 = November 2025

The seeding script uses Gregorian dates internally:
```typescript
const [year, month, day] = "2025-11-03".split("-").map(Number);
const scheduledDate = new Date(year, month - 1, day, hour, minute).getTime();
```

### Performance

- **Students Created**: ~15-20 unique student records
- **Classes Created**: 32 class bookings
- **Execution Time**: ~5-15 seconds
- **Database Operations**: ~70-80 writes total

### Error Handling

The seeding script includes:
- Try-catch blocks for database operations
- Validation of required fields
- Existence checks before creation
- Detailed error messages
- Transaction-like behavior (creates all or fails early)

## Support

For issues or questions:
1. Check Convex backend logs for errors
2. Verify database initialization completed
3. Review browser console for client-side errors
4. Contact system administrator

---

**Last Updated**: October 23, 2025  
**Version**: 1.0  
**Author**: AI Assistant (via GitHub Copilot)
