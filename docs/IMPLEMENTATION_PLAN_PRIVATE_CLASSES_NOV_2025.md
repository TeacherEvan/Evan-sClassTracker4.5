# Private Classes Implementation Plan

**Date:** November 1, 2025  
**Teachers:** Che, Cale, and Lee  
**Duration:** 12 weeks recurring (Nov 4, 2025 - Jan 26, 2026)

## 📋 Overview

### Teachers

1. **T. Che** - Private classes for K2/8, K2/2, K2/7 students
2. **T. Cale** - Private classes for K1/7, K2/4, K2/7, K1/8 students
3. **T. Lee** - Private classes for K1/1 students (Tuesday-Friday only)

### Schedule Pattern

- **Time:** 15:00-16:00 (3:00 PM - 4:00 PM)
- **Frequency:** Weekly recurring
- **Duration:** 12 weeks
- **Start Date:** Monday, November 4, 2025
- **End Date:** Friday, January 23, 2026

---

## 🎯 Implementation Steps

### Phase 1: Data Preparation ✅ COMPLETE

- [x] Extract schedule from images
- [x] Verify student codes and names
- [x] Create markdown documentation
- [x] Identify special cases (one-time classes, date ranges)

### Phase 2: Database Schema Review

- [ ] Verify students exist in system
- [ ] Confirm teacher usernames (Che and Cale)
- [ ] Check location names match system
- [ ] Validate class code format

### Phase 3: Create Convex Mutation

- [ ] Build mutation to seed private classes
- [ ] Handle recurring weekly bookings (12 weeks)
- [ ] Handle special cases:
  - One-time class (1816 BRAVE - Wednesday only)
  - Date-specific range (1718 MILIN - 7 Nov to 30 Jan)
- [ ] Set `isGuardianLinked: true` for auto-approval
- [ ] Link to existing students by student code

### Phase 4: Implementation

- [ ] Create mutation file
- [ ] Test with small batch
- [ ] Execute full seed
- [ ] Verify bookings in UI

### Phase 5: Validation

- [ ] Confirm all classes created
- [ ] Check recurring pattern correct
- [ ] Verify auto-approval status
- [ ] Validate student linkage

---

## 📊 T. Che Private Classes - Breakdown

### Total Students: 12 unique students

### Total Weekly Sessions: 5 days × 12 weeks = 60 sessions

### Students per session: 2-3 students

| Day | Location | Students | Count |
|-----|----------|----------|-------|
| Monday | OLD MUSIC TOILET | BEYOND, KARTOON, GRACE | 3 |
| Tuesday | OLD MUSIC TOILET | NANI, WINTER | 2 |
| Wednesday | OLD MUSIC TOILET | PING, PANGPRAW, GRACE | 3 |
| Thursday | OLD MUSIC TOILET | BLUEFIN, KIRIN, T,me | 3 |
| Friday | OLD MUSIC TOILET | Layn, Bua | 2 |

**Student Codes:**

- 2804 BEYOND (K2/8)
- 2818 KARTOON (K2/8)
- 2814 GRACE (K2/8) - **Appears Monday & Wednesday**
- 2812 NANI (K2/8)
- 2824 WINTER (K2/8)
- 2204 PING (K2/2)
- 2706 PANGPRAW (K2/7)
- 2810 BLUEFIN (K2/8)
- 2805 KIRIN (K2/8)
- 2824 T,me (K2/8)
- 2827 Layn (K2/8)
- 2816 Bua (K2/8)

---

## 📊 T. CALE Private Classes - Breakdown

### Total Students: 13 unique students

### Total Weekly Sessions: 5 days × 12 weeks = 60 sessions (with exceptions)

### Students per session: 3 students

| Day | Location | Students | Count | Notes |
|-----|----------|----------|-------|-------|
| Monday | Big kitchen | Davin, LALYNN, PANGPRAW | 3 | |
| Tuesday | Big kitchen | Link, THAM, IU | 3 | |
| Wednesday | OLD TEG | THAMESN'E, Davin, BRAVE | 3 | BRAVE = ONE TIME ONLY |
| Thursday | Big kitchen | Link, ARSENE, RUNRUN | 3 | |
| Friday | Big kitchen | THAMESN'E, Ampere, MILIN | 3 | MILIN = 7/11/25-30/1/26 |

**Student Codes:**

- 2419 Davin (K2/4) - **Appears Monday & Wednesday**
- 2706 LALYNN (K2/7)
- 2705 PANGPRAW (K2/7)
- 1717 Link (K1/7) - **Appears Tuesday & Thursday**
- 1724 THAM (K1/7)
- 1704 IU (K1/7)
- 2712 THAMESN'E (K2/7) - **Appears Wednesday & Friday**
- 1816 BRAVE (K1/8) - **ONE TIME ONLY (first Wednesday)**
- 1704 ARSENE (K1/7)
- 1720 RUNRUN (K1/7)
- 1712 Ampere (K1/7)
- 1718 MILIN (K1/7) - **SPECIFIC DATE RANGE: 7 Nov 2025 - 30 Jan 2026**

---

## 📊 T. Lee Private Classes - Breakdown

### Total Students: 6 unique students (4 regular + 2 trial)

### Total Weekly Sessions: 4 days × 12 weeks = 48 sessions (with exceptions)

### Students per session: 1-2 students

| Day | Location | Students | Count | Notes |
|-----|----------|----------|-------|-------|
| Monday | - | - | 0 | No classes |
| Tuesday | PLAY ROOM B.5 | NARA, MANOW | 2 | |
| Wednesday | PLAY ROOM B.5 | MASTER, NARA | 2 | |
| Thursday | PLAY ROOM B.5 | NARA, MIU | 2 | |
| Friday | PLAY ROOM B.5 | MARINE try 1, Thang Thang try 1 | 2 | ONE TIME ONLY |

**Student Codes:**

- 1105 NARA (K1/1) - **Appears Tuesday, Wednesday & Thursday**
- 1125 MANOW (K1/1)
- 1103 MASTER (K1/1)
- 1108 MIU (K1/1)
- 2015 MARINE try 1 (K2/0) - **ONE TIME ONLY (first Friday)**
- 2021 Thang Thang try 1 (K2/0) - **ONE TIME ONLY (first Friday)**

---

## ⚠️ Special Cases to Handle

### 1. One-Time Classes

**Student:** 1816 BRAVE (Cale)  
**Day:** Wednesday only (first occurrence)  
**Date:** November 6, 2025  
**Action:** Create single booking, NOT recurring

**Students:** 2015 MARINE try 1, 2021 Thang Thang try 1 (Lee)  
**Day:** Friday only (first occurrence)  
**Date:** November 8, 2025  
**Action:** Create single bookings, NOT recurring

### 2. Date-Specific Range

**Student:** 1718 MILIN (Cale)  
**Start:** November 7, 2025 (Friday)  
**End:** January 30, 2026 (Friday)  
**Action:** Create recurring Fridays ONLY within this date range (12 weeks)

### 3. Recurring Students

Some students appear multiple days per week:

- **2814 GRACE** (Che): Monday & Wednesday
- **2419 Davin** (Cale): Monday & Wednesday
- **1717 Link** (Cale): Tuesday & Thursday
- **2712 THAMESN'E** (Cale): Wednesday & Friday
- **1105 NARA** (Lee): Tuesday, Wednesday & Thursday

---

## 🔧 Technical Implementation Details

### Mutation Structure

```typescript
export const seedPrivateClasses = mutation({
  args: {
    teacherUsername: v.union(v.literal("Che"), v.literal("Cale"), v.literal("Lee")),
    weeksCount: v.optional(v.number()),  // Default 12 weeks
    testMode: v.optional(v.boolean()),   // If true, only creates Week 1
  },
  handler: async (ctx, args) => {
    // 1. Get teacher by username
    // 2. Select appropriate schedule (CHE_SCHEDULE, CALE_SCHEDULE, or LEE_SCHEDULE)
    // 3. Get or create locations
    // 4. Loop through weeks (12 or 1 in test mode)
    // 5. For each day in schedule, create bookings
    // 6. Handle special cases:
    //    - Regular students (all weeks)
    //    - One-time students (week 0 only)
    //    - Date-range students (within date boundaries)
    // 7. Set isGuardianLinked: true for auto-approval
    // 8. Return summary with created bookings and errors
  }
});
```

### Class Booking Pattern (From Pattern #16)

- Use recurring weekly booking pattern
- Set `isGuardianLinked: true` for auto-approval
- Set `status: "approved"` (skip moderator)
- Duration: 60 minutes (15:00-16:00)

### Date Calculation

- **Start:** Monday, November 4, 2025
- **Week 1:** Nov 4-8
- **Week 2:** Nov 11-15
- **Week 3:** Nov 18-22
- **Week 4:** Nov 25-29
- **Week 5:** Dec 2-6
- **Week 6:** Dec 9-13
- **Week 7:** Dec 16-20
- **Week 8:** Dec 23-27 (Christmas week)
- **Week 9:** Dec 30 - Jan 3 (New Year)
- **Week 10:** Jan 6-10
- **Week 11:** Jan 13-17
- **Week 12:** Jan 20-24, 2026

---

## 📝 Implementation Status

### Phase 1: Data Preparation ✅ COMPLETE

- ✅ Extract schedule from images (Che, Cale, Lee)
- ✅ Verify student codes and names
- ✅ Create markdown documentation for all 3 teachers
- ✅ Identify special cases (one-time classes, date ranges)

### Phase 2: Database Schema Review ✅ COMPLETE

- ✅ Teacher usernames verified (Che, Cale, Lee)
- ✅ Location schema reviewed (requires schoolId, type: "guardian")
- ✅ Class schema supports isGuardianLinked for auto-approval

### Phase 3: Create Convex Mutation ✅ COMPLETE

- ✅ Built mutation `convex/seedPrivateClasses.ts`
- ✅ Supports all 3 teachers via union type
- ✅ Handles recurring weekly bookings (12 weeks)
- ✅ Special cases implemented:
  - ✅ One-time students (BRAVE, MARINE, Thang Thang)
  - ✅ Date-range students (MILIN: Nov 7 - Jan 30)
- ✅ Auto-approval via `isGuardianLinked: true`
- ✅ Student lookup by XXYY code format
- ✅ Location auto-creation with guardian type
- ✅ Test mode for Week 1 only

### Phase 4: Deployment ✅ COMPLETE

- ✅ TypeScript compilation successful
- ✅ Convex deployment successful
- ✅ Mutation available in Convex dashboard

### Phase 5: Testing & Validation (NEXT)

- ⏳ Test with `testMode: true` (1 week only)
- ⏳ Verify student lookups work correctly
- ⏳ Check special cases (BRAVE, MILIN, trial students)
- ⏳ Execute full 12-week seed for all teachers
- ⏳ Validate in UI (Classes tab, Calendar view)

---

## 📝 Next Actions

1. **Test mutation** with `testMode: true` for each teacher
2. **Verify results** in Convex dashboard
3. **Execute full seed** for all 12 weeks
4. **Create UI trigger** (optional) - admin button to reseed if needed
5. **Validate in calendar** - check recurring patterns

---

## 🎓 Student Lookup Reference

### Parse Student Code Format

Format: `XXYY NAME`

- **XX** = Class (K1, K2, etc.)
- **YY** = Student number
- **NAME** = Student name

Example: `2419 Davin`

- Class: K2/4 (อ.2/4)
- Number: 19
- Name: Davin

### Database Query Pattern

```typescript
// Find student by code
const studentCode = "2419"; // K2/4, #19
const [gradeCode, numberStr] = [studentCode.slice(0, 2), studentCode.slice(2)];
const grade = gradeCode[0] === "1" ? "K1" : "K2";
const classNum = gradeCode[1];
const studentNumber = parseInt(numberStr);

// Query by grade, class, and number
const student = await ctx.db
  .query("students")
  .filter(q => 
    q.and(
      q.eq(q.field("grade"), `${grade}/${classNum}`),
      q.eq(q.field("studentNumber"), studentNumber)
    )
  )
  .first();
```

---

## ✅ Completion Checklist

- [x] Teachers verified in system (Che, Cale, Lee)
- [ ] All students exist and verified
- [x] Locations auto-created with guardian type
- [x] Mutation created and deployed (`convex/seedPrivateClasses.ts`)
- [ ] Week 1 test successful (testMode: true)
- [ ] Full 12-week seed executed
- [ ] Special cases handled correctly (BRAVE, MILIN, trial students)
- [ ] UI validation complete
- [x] Documentation updated
- [ ] Teachers notified of schedule

---

**Estimated Total Bookings:**

- **T. Che:** 60 bookings (5 days × 12 weeks, all recurring)
- **T. Cale:** 59 bookings (5 days × 12 weeks - BRAVE is one-time only, MILIN is date-range)
- **T. Lee:** 45 bookings (4 days × 12 weeks - MARINE and Thang Thang are one-time only)
- **Grand Total:** ~164 private class bookings across all 3 teachers

---

## 📂 Files Created

1. `docs/Images/PvtClasses/T_Che_2-8_Schedule.md` - Che's schedule documentation
2. `docs/Images/PvtClasses/T_CALE_1-7_Schedule.md` - Cale's schedule documentation
3. `docs/Images/PvtClasses/T_Lee_1-1_Schedule.md` - Lee's schedule documentation
4. `convex/seedPrivateClasses.ts` - Main seeding mutation with all 3 teachers
5. `docs/IMPLEMENTATION_PLAN_PRIVATE_CLASSES_NOV_2025.md` - This comprehensive plan
