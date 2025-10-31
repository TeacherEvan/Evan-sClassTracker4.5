# Sangsom Class Registry Index

**School:** Sangsom Kindergarten  
**Academic Year:** 2025  
**Last Updated:** October 31, 2025

## Class Rosters

| Class | Grade Level | Total Students | Status | File |
|-------|-------------|----------------|--------|------|
| K1/1 | Kindergarten 1 | 28 | ✅ Active | [K1-1-roster.md](./K1-1-roster.md) |
| K1/5 | Kindergarten 1 | 27 | ✅ Active | [K1-5-roster.md](./K1-5-roster.md) |
| K1/6 | Kindergarten 1 | 28 | ✅ Active | [K1-6-roster.md](./K1-6-roster.md) |
| K1/9 | Kindergarten 1 | 28 | ✅ Active | [K1-9-roster.md](./K1-9-roster.md) |
| K2/6 | Kindergarten 2 | 27 | ✅ Active | [K2-6-roster.md](./K2-6-roster.md) |

## Summary Statistics

- **Total Classes:** 5
- **Total Students:** 138
- **Average Class Size:** 27.6 students
- **Grade K1 Classes:** 4 (111 students)
- **Grade K2 Classes:** 1 (27 students)

## Import Status

All class rosters have been:

- ✅ Transcribed from paper documents
- ✅ Added to database import files
- ✅ Configured in UI import buttons
- ⏳ Ready for import via Sangsom Student Import feature

## Data Source

All rosters transcribed from paper class lists dated November 2025.

## Notes

- **K1/6**: Contains duplicate student name (LALYN appears twice - students #18 and #20)
- **K1/5**: Image was labeled "K2/8" in handwriting but confirmed as K1/5 roster
- **K2/6**: Used "English Name" column from original roster
- **Duplicate Handling**: Import system automatically skips duplicate students based on name+grade+class matching

## Related Files

- Import Functions: `convex/importSangsomStudents.ts`, `convex/importSangsomStudentsExtra.ts`
- UI Component: `components/sangsom-student-import-button.tsx`
- Migration Tool: `convex/migrateSangsomStudentsToEvents.ts`
