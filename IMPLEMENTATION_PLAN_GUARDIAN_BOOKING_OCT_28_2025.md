# Implementation Plan: Guardian Student Booking Feature - October 28, 2025

## Overview

Enhance class booking to support two distinct workflows for teachers:

1. **REQUEST** - For school-linked students (existing flow, requires moderator approval)
2. **BOOK** - For guardian-linked students (new flow, auto-approved)

## Current State Analysis

### ✅ Existing Infrastructure

The system already has guardian student support:

- **Schema**: `students` table has `guardianId`, `guardianName`, `guardianTitle` fields
- **Auto-approval**: `classes.isGuardianLinked` bypasses moderator approval
- **Role**: `users.role` includes `"guardian"` type
- **Detection**: Class booking already checks if student has `guardianId` and sets `isGuardianLinked: true`

### ❌ Missing Features

1. **Button Text**: Currently shows "Request Class" for teachers (should be "Req/Book Class")
2. **Birth Date**: Schema has `dateOfBirth` but not enforced for guardian students
3. **Area Field**: No field to store teaching area/location for unique ID generation
4. **Duplicate Prevention**: No validation to prevent duplicate guardian students
5. **Guardian Student Creation UI**: No specialized form for creating guardian students with required fields

## User Requirements

### Teacher Workflow

#### Mode 1: REQUEST (School Students)

```
Teacher → Select School Student → Request Class → Status: "pending" → Moderator Reviews
```

#### Mode 2: BOOK (Guardian Students)

```
Teacher → Create/Select Guardian Student → Book Class → Status: "approved" (auto)
```

### Guardian Student Requirements

When creating a guardian student, teachers must provide:

1. **firstName** - Student first name (required)
2. **lastName** - Student last name (optional for Thai students)
3. **birthDate** - Date of birth (required for unique ID)
4. **area** - Teaching location area (required for unique ID)
5. **guardianName** - Parent/guardian name (optional)
6. **guardianPhone** - Contact number (optional)

### Unique ID Generation

Format for guardian students:

```
{AREA_CODE}-{NAME_HASH}-{BIRTH_HASH}-{RANDOM}

Example: BKK01-JATH-19920115-X7Y2
```

**Components**:

- `AREA_CODE`: First 5 chars of area, uppercase (e.g., "BKK01" from "Bangkok District 1")
- `NAME_HASH`: First 2 chars of firstName + first 2 chars of lastName
- `BIRTH_HASH`: Birth date as YYYYMMDD (e.g., "19920115")
- `RANDOM`: 4-char random string for collision prevention

## Implementation Steps

### Step 1: Update Schema ✏️

**File**: `convex/schema.ts`

Add `area` field to `students` table:

```typescript
students: defineTable({
  // ... existing fields
  dateOfBirth: v.optional(v.number()), // Make required for guardian students
  area: v.optional(v.string()), // Teaching location area (required for guardian students)
  // ... rest of fields
})
  .index("by_student_id", ["studentId"])
  .index("by_school", ["schoolId"])
  .index("by_guardian", ["guardianName"])
  .index("by_guardian_id", ["guardianId"])
  .index("by_created_by", ["createdBy"])
  .index("by_area", ["area"]) // NEW INDEX
```

### Step 2: Update Student ID Generation ✏️

**File**: `convex/students.ts`

Modify `generateStudentId` to handle guardian students:

```typescript
// NEW: Guardian student ID generator
function generateGuardianStudentId(
  firstName: string, 
  lastName: string, 
  birthDate: number, 
  area: string
): string {
  const areaCode = area.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const nameHash = `${firstName.substring(0, 2)}${lastName.substring(0, 2)}`.toUpperCase();
  const birthHash = new Date(birthDate).toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${areaCode}-${nameHash}-${birthHash}-${random}`;
}

// MODIFY: Existing function to route based on student type
function generateStudentId(
  firstName: string, 
  lastName: string, 
  schoolIdOrArea: string,
  isGuardian: boolean = false,
  birthDate?: number
): string {
  if (isGuardian && birthDate) {
    return generateGuardianStudentId(firstName, lastName, birthDate, schoolIdOrArea);
  }
  
  // Existing school student ID generation
  const timestamp = Date.now().toString(36);
  const nameHash = `${firstName.substring(0, 2)}${lastName.substring(0, 2)}`.toUpperCase();
  const schoolHash = schoolIdOrArea.substring(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${schoolHash}-${nameHash}-${timestamp}-${random}`;
}
```

### Step 3: Add Duplicate Prevention ✏️

**File**: `convex/students.ts`

In `create` mutation, add validation before inserting:

```typescript
export const create = mutation({
  handler: async (ctx, args) => {
    // ... existing validation
    
    // NEW: Duplicate prevention for guardian students
    if (args.guardianId || args.guardianName) {
      // Check if guardian student with same details exists
      if (!args.dateOfBirth || !args.area) {
        throw new Error("Guardian students must have birthDate and area");
      }
      
      // Search for existing guardian student with same name + birthDate + area
      const existingGuardianStudents = await ctx.db
        .query("students")
        .withIndex("by_area", (q) => q.eq("area", args.area!))
        .collect();
      
      const duplicate = existingGuardianStudents.find(s => 
        s.firstName.toLowerCase() === args.firstName.toLowerCase() &&
        s.lastName.toLowerCase() === (args.lastName || "").toLowerCase() &&
        s.dateOfBirth === args.dateOfBirth
      );
      
      if (duplicate) {
        throw new Error(
          `Guardian student already exists: ${duplicate.firstName} ${duplicate.lastName} (${duplicate.studentId})`
        );
      }
    }
    
    // Generate appropriate student ID
    const isGuardian = !!(args.guardianId || args.guardianName);
    const schoolIdForHash = args.schoolId || "NOSCHOOL";
    
    let studentId = generateStudentId(
      args.firstName,
      args.lastName || "",
      isGuardian ? args.area! : schoolIdForHash,
      isGuardian,
      args.dateOfBirth
    );
    
    // ... rest of creation logic
  }
});
```

### Step 4: Update Button Text ✏️

**File**: `components/class-booking.tsx`

Change button text for teachers (around line 645):

```typescript
<button
  onClick={() => setShowForm(!showForm)}
  className="flex-1 md:flex-none bg-blue-500 text-white px-4 py-3 md:py-2 rounded-xl md:rounded-lg hover:bg-blue-600 active:scale-95 transition-all font-medium flex items-center justify-center gap-2 touch-manipulation shadow-lg shadow-blue-500/20 text-base md:text-sm"
>
  <Calendar className="w-5 h-5" />
  {userRole === "moderator" || userRole === "admin"
    ? t("Book Class", "จองชั้นเรียน")
    : t("Req/Book Class", "ขอ/จองชั้นเรียน")} {/* CHANGED */}
</button>
```

### Step 5: Enhance Student Creation Form ✏️

**File**: `components/class-booking.tsx`

Add conditional fields for guardian students in the student creation section:

```typescript
{/* Student Creation Form - around line 1050 */}
{creatingStudent && (
  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 space-y-3">
    {/* Existing fields: nickname, grade, class, school */}
    
    {/* NEW: Student Type Selection */}
    <div>
      <label className="block text-sm font-medium mb-1">
        {t("Student Type", "ประเภทนักเรียน")} *
      </label>
      <select
        value={studentType}
        onChange={(e) => setStudentType(e.target.value as "school" | "guardian")}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
      >
        <option value="school">{t("School Student (Request)", "นักเรียนโรงเรียน (ขออนุมัติ)")}</option>
        <option value="guardian">{t("Guardian Student (Book)", "นักเรียนผู้ปกครอง (จองตรง)")}</option>
      </select>
    </div>
    
    {/* CONDITIONAL: Show school selector for school students */}
    {studentType === "school" && (
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("School", "โรงเรียน")} *
        </label>
        <select
          value={newStudentSchoolId}
          onChange={(e) => setNewStudentSchoolId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
        >
          <option value="">{t("Select school", "เลือกโรงเรียน")}</option>
          {schools?.map(school => (
            <option key={school._id} value={school._id}>{school.name}</option>
          ))}
        </select>
      </div>
    )}
    
    {/* CONDITIONAL: Show birthDate and area for guardian students */}
    {studentType === "guardian" && (
      <>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("Date of Birth", "วันเกิด")} *
          </label>
          <input
            type="date"
            value={guardianBirthDate}
            onChange={(e) => setGuardianBirthDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("Teaching Area", "พื้นที่สอน")} *
          </label>
          <input
            type="text"
            value={guardianArea}
            onChange={(e) => setGuardianArea(e.target.value)}
            placeholder={t("e.g., Bangkok District 1", "เช่น กรุงเทพ เขต 1")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("Guardian Name", "ชื่อผู้ปกครอง")}
          </label>
          <input
            type="text"
            value={newGuardianName}
            onChange={(e) => setNewGuardianName(e.target.value)}
            placeholder={t("Parent/Guardian name", "ชื่อผู้ปกครอง")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("Guardian Phone", "เบอร์ผู้ปกครอง")}
          </label>
          <input
            type="tel"
            value={newGuardianPhone}
            onChange={(e) => setNewGuardianPhone(e.target.value)}
            placeholder={t("Contact number", "เบอร์ติดต่อ")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
        </div>
      </>
    )}
    
    {/* Submit button */}
    <button
      onClick={handleCreateStudent}
      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg"
    >
      {t("Create Student", "สร้างนักเรียน")}
    </button>
  </div>
)}
```

### Step 6: Add State Variables ✏️

**File**: `components/class-booking.tsx`

Add new state variables (around line 70):

```typescript
const [studentType, setStudentType] = useState<"school" | "guardian">("school");
const [guardianBirthDate, setGuardianBirthDate] = useState("");
const [guardianArea, setGuardianArea] = useState("");
const [newGuardianName, setNewGuardianName] = useState("");
const [newGuardianPhone, setNewGuardianPhone] = useState("");
```

### Step 7: Update Student Creation Handler ✏️

**File**: `components/class-booking.tsx`

Modify `handleCreateStudent` function (around line 600):

```typescript
const handleCreateStudent = async () => {
  if (!newStudentNickname.trim() || !newStudentGrade.trim()) {
    setError(t("Please fill in required fields", "กรุณากรอกข้อมูลที่จำเป็น"));
    return;
  }
  
  // Validation based on student type
  if (studentType === "school" && !newStudentSchoolId) {
    setError(t("Please select a school", "กรุณาเลือกโรงเรียน"));
    return;
  }
  
  if (studentType === "guardian") {
    if (!guardianBirthDate || !guardianArea.trim()) {
      setError(t(
        "Guardian students require birth date and area",
        "นักเรียนผู้ปกครองต้องระบุวันเกิดและพื้นที่"
      ));
      return;
    }
  }
  
  setLoading(true);
  try {
    const newStudentData = await createStudent({
      firstName: newStudentNickname,
      lastName: "",
      nickname: newStudentNickname,
      grade: newStudentGrade,
      class: newStudentClass || undefined,
      schoolId: studentType === "school" ? newStudentSchoolId as Id<"schools"> : undefined,
      guardianId: studentType === "guardian" ? userId : undefined, // Link to teacher as guardian
      guardianName: studentType === "guardian" ? newGuardianName || undefined : undefined,
      guardianPhone: studentType === "guardian" ? newGuardianPhone || undefined : undefined,
      dateOfBirth: studentType === "guardian" ? new Date(guardianBirthDate).getTime() : undefined,
      area: studentType === "guardian" ? guardianArea : undefined,
      createdBy: userId,
    });

    setStudentId(newStudentData.id);
    if (studentType === "school") {
      setSchoolId(newStudentSchoolId as Id<"schools">);
    }

    // Reset form
    setCreatingStudent(false);
    setNewStudentNickname("");
    setNewStudentGrade("");
    setNewStudentClass("");
    setNewStudentSchoolId("");
    setGuardianBirthDate("");
    setGuardianArea("");
    setNewGuardianName("");
    setNewGuardianPhone("");

    toast.success("Student created successfully!", "สร้างข้อมูลนักเรียนสำเร็จ!");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to create student");
    toast.error(
      err instanceof Error ? err.message : "Failed to create student",
      err instanceof Error ? err.message : "สร้างนักเรียนไม่สำเร็จ"
    );
  } finally {
    setLoading(false);
  }
};
```

### Step 8: Update Student Selector Visual ✏️

**File**: `components/hierarchical-student-selector.tsx`

Add visual distinction for guardian students:

```typescript
{/* In student display */}
<div className="flex items-center gap-2">
  <span>{student.firstName} {student.lastName}</span>
  {student.guardianId && (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
      {t("Guardian", "ผู้ปกครอง")}
    </span>
  )}
  {student.schoolId && (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
      {t("School", "โรงเรียน")}
    </span>
  )}
</div>
```

## Testing Plan

### Test Case 1: Create Guardian Student

1. Login as teacher
2. Click "Req/Book Class"
3. Click "Create New Student"
4. Select "Guardian Student (Book)"
5. Fill in: Name, Grade, Birth Date, Area
6. Submit
7. **Verify**: Student created with guardian-format ID (e.g., `BKK01-JATH-19920115-X7Y2`)

### Test Case 2: Duplicate Prevention

1. Try to create another guardian student with same name + birthDate + area
2. **Verify**: Error message: "Guardian student already exists"

### Test Case 3: Book Guardian Student Class

1. Select the guardian student from dropdown
2. Fill in class details
3. Submit booking
4. **Verify**: Class status = "approved" (not "pending")
5. **Verify**: No moderator notification sent

### Test Case 4: Request School Student Class

1. Select a school-linked student from dropdown
2. Fill in class details
3. Submit booking
4. **Verify**: Class status = "pending"
5. **Verify**: Moderator receives notification

### Test Case 5: UI Distinction

1. Open student selector
2. **Verify**: Guardian students show purple "Guardian" badge
3. **Verify**: School students show blue "School" badge

## Migration Considerations

### Backward Compatibility

- ✅ Existing students without `area` field will continue to work
- ✅ Existing guardian students without `dateOfBirth` will continue to work
- ✅ New validation only applies to NEW guardian students

### Data Migration (Optional)

If you want to enforce the new fields on existing guardian students:

```typescript
// Migration script (convex/migrations/addAreaToGuardianStudents.ts)
export const addAreaToGuardianStudents = mutation({
  handler: async (ctx) => {
    const guardianStudents = await ctx.db
      .query("students")
      .filter(q => q.neq(q.field("guardianId"), undefined))
      .collect();
    
    for (const student of guardianStudents) {
      if (!student.area) {
        await ctx.db.patch(student._id, {
          area: "UNKNOWN", // Default area for existing students
        });
      }
    }
    
    return { updated: guardianStudents.length };
  }
});
```

## Error Handling

### Validation Errors

```typescript
// Guardian student without birthDate
throw new Error(t(
  "Guardian students must have a birth date",
  "นักเรียนผู้ปกครองต้องระบุวันเกิด"
));

// Guardian student without area
throw new Error(t(
  "Guardian students must have a teaching area",
  "นักเรียนผู้ปกครองต้องระบุพื้นที่สอน"
));

// Duplicate student
throw new Error(t(
  "A guardian student with this name and birth date already exists in this area",
  "มีนักเรียนผู้ปกครองชื่อนี้และวันเกิดนี้ในพื้นที่นี้อยู่แล้ว"
));
```

## UI/UX Improvements

### Visual Feedback

1. **Student Type Toggle**: Clear radio buttons or toggle for "School" vs "Guardian"
2. **Conditional Fields**: Only show relevant fields based on student type
3. **Student Badges**: Color-coded badges in student selector
4. **Auto-approval Badge**: Show "✓ Auto-approved" badge for guardian student bookings

### Bilingual Support

All new text strings have English/Thai translations:

- "Req/Book Class" / "ขอ/จองชั้นเรียน"
- "Student Type" / "ประเภทนักเรียน"
- "School Student (Request)" / "นักเรียนโรงเรียน (ขออนุมัติ)"
- "Guardian Student (Book)" / "นักเรียนผู้ปกครอง (จองตรง)"
- "Teaching Area" / "พื้นที่สอน"

## Security Considerations

### Permission Checks

- ✅ Only teachers can create guardian students linked to themselves
- ✅ Moderators/admins can create any type of student
- ✅ Student creation validates `createdBy` user exists

### Data Validation

- ✅ Birth date must be in the past
- ✅ Area field max length: 100 characters
- ✅ Name fields max length: 100 characters (existing)

## Performance Impact

### Query Optimization

- **New index**: `by_area` on students table
- **Duplicate check**: O(n) where n = students in same area (typically < 100)
- **Impact**: Negligible - adds ~10ms to student creation

### Bundle Size

- **No new dependencies**
- **Code additions**: ~200 lines
- **Impact**: < 5KB

## Documentation Updates

### Files to Update

1. ✏️ `docs/ARCHITECTURE.md` - Add guardian student workflow diagram
2. ✏️ `convex/schema.ts` - Add JSDoc comments for new `area` field
3. ✏️ `.github/copilot-instructions.md` - Document guardian student creation pattern
4. ✏️ `CHANGELOG.md` - Add entry for guardian student enhancements

## Deployment Checklist

- [ ] Schema changes deployed (add `area` field + index)
- [ ] Backend mutations updated (student creation, ID generation)
- [ ] Frontend UI updated (button text, student creation form)
- [ ] Student selector updated (visual badges)
- [ ] Test all 5 test cases
- [ ] Update documentation
- [ ] Create implementation summary document

## Rollback Plan

If issues arise:

1. **Schema rollback**: `area` field is optional, won't break existing code
2. **Code rollback**: Revert commits, redeploy previous version
3. **Data cleanup**: No data corruption risk - new students can be soft-deleted

---

**Implementation Status**: Ready to proceed  
**Estimated Time**: 2-3 hours  
**Risk Level**: ⚠️ LOW (incremental changes, backward compatible)
