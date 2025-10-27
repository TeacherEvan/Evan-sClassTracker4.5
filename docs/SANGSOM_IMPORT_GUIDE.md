# Sangsom School K1/9 Student Import Guide

This guide explains how to import the 27 students from K1/9 class roster into the system.

## Files Created

1. **`docs/sangsom-students-k1-9.md`** - Student roster with Thai names and English nicknames
2. **`convex/importSangsomStudents.ts`** - Convex mutations for bulk import
3. **`scripts/import-sangsom-k19.ts`** - Import script (optional CLI method)

## Students to Import (27 total)

TAWAN, MARISSA, KHUN, LUKA, JANJAO, Leo, Xiao yi, NADA, JAYLERR, PROD, ALYN, RYKER, SKILL, GRACE, FU, FEI, PUNNA, ORANGE, SHINA, Anchan, DIN, PEPPER, MIFYNN, PORJAI, LUNA, PUNN, Phupha

## Import Methods

### Method 1: Convex Dashboard (Recommended - Easiest)

1. **Start Convex Dev Server**

   ```powershell
   npx convex dev
   ```

2. **Open Convex Dashboard**
   - Go to: <https://dashboard.convex.dev>
   - Select your project

3. **Find School ID**
   - Go to "Functions" tab
   - Run `importSangsomStudents:findSangsomSchool`
   - Copy the `schoolId` from the result
   - If not found, create "Sangsom School" first via the UI

4. **Get Your User ID**
   - In Functions tab, run `users:list`
   - Find your admin or teacher account
   - Copy the `_id` field

5. **Run Import**
   - In Functions tab, find `importSangsomStudents:importK19Students`
   - Click "Run Function"
   - Enter arguments:

     ```json
     {
       "schoolId": "paste_school_id_here",
       "createdBy": "paste_your_user_id_here"
     }
     ```

   - Click "Run"

6. **Check Results**
   - The function will return:
     - `imported`: Number of students successfully added
     - `failed`: Number of duplicates or errors
     - `results`: List of imported students with their IDs
     - `errors`: List of any errors (usually duplicates)

### Method 2: Via Script (Advanced)

1. **Add User ID to .env.local**

   ```env
   ADMIN_USER_ID=your_admin_or_teacher_user_id
   ```

2. **Run Import Script**

   ```powershell
   npx tsx scripts/import-sangsom-k19.ts
   ```

### Method 3: Manual Entry (Time-consuming)

Use the Student Management UI to add each student one by one:

- Login as teacher/admin
- Go to Students tab
- Click "Add New Student"
- Fill in: Nickname, Grade (K1), Class (/9), School (Sangsom)

## What Gets Created

For each student:

- **First Name**: English nickname (e.g., "TAWAN", "Leo")
- **Last Name**: Empty (Thai single-name pattern)
- **Student ID**: Auto-generated (e.g., `SANG-TAWA-abc123-XY4Z`)
- **Grade**: K1
- **Class**: /9
- **School**: Sangsom School
- **Nickname**: Same as first name
- **Notes**: Thai name stored here (e.g., "Thai name: ทะวาน")

## Duplicate Handling

The import script automatically:

- Checks for existing students with same nickname + grade + class
- Skips duplicates and reports them in `errors` array
- Shows existing student IDs for reference

## Troubleshooting

### "Sangsom School not found"

→ Create the school first via School Management UI or seed script

### "User not found"

→ Check that the `createdBy` user ID is correct

### "All students show as duplicates"

→ They're already imported! Check Students tab in UI

### Import script fails

→ Make sure:

- Convex is running (`npx convex dev`)
- `.env.local` has `NEXT_PUBLIC_CONVEX_URL`
- You have `tsx` installed (`npm install`)

## Next Steps After Import

1. **Verify in UI**
   - Login to the app
   - Go to Students tab
   - Filter by Sangsom School
   - Should see all 27 K1/9 students

2. **Start Booking Classes**
   - Teachers can now book classes with these students
   - Use the Class Booking feature
   - Students will appear in dropdown when school is selected

3. **Import More Classes**
   - If you have more class rosters (e.g., K1/1, K2/5)
   - Share the images
   - We'll create similar import files

## Files You Can Delete After Import

Once students are successfully imported, you can optionally remove:

- `scripts/import-sangsom-k19.ts` (if you used dashboard method)

Keep these for reference:

- `docs/sangsom-students-k1-9.md` (roster documentation)
- `convex/importSangsomStudents.ts` (can be reused for re-import if needed)
