# UI Changes Preview

## Student Management Form

### Before
```
┌─────────────────────────────────────────┐
│ Add New Student                     [X] │
├─────────────────────────────────────────┤
│                                         │
│ First Name: [____________] *            │
│ Last Name:  [____________] *            │
│ Grade:      [____________] *            │
│ School:     [▼ Select...  ]             │
│                                         │
│ Guardian Name:  [____________]          │
│ Guardian Phone: [____________]          │
│ Guardian Email: [____________]          │
│                                         │
│        [Add Student]  [Cancel]          │
└─────────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────────┐
│ Add New Student                     [X] │
├─────────────────────────────────────────┤
│                                         │
│ First Name: [____________] *            │
│ Last Name:  [____________] *            │
│                                         │
│ Grade:      [____________] *            │
│ Class:      [▼ Select... ] *    ← NEW! │
│             - K1                        │
│             - K2                        │
│             - K3                        │
│                                         │
│ School:     [▼ Select...  ]             │
│                                         │
│ Guardian Name:  [____________]          │
│ Guardian Phone: [____________]          │
│ Guardian Email: [____________]          │
│                                         │
│        [Add Student]  [Cancel]          │
└─────────────────────────────────────────┘
```

**Note:** The asterisk (*) after "Class" only appears when a school is selected.

## Student List Table

### Before
```
┌──────────────┬────────────┬───────┬─────────────────┬────────────┬─────────┐
│ Student ID   │ Name       │ Grade │ School/Guardian │ Contact    │ Actions │
├──────────────┼────────────┼───────┼─────────────────┼────────────┼─────────┤
│ BANG-JODO-...│ John Doe   │ K1    │ Bangkok School  │ 012-34567  │ ✏️ 🗑️   │
│ BANG-JASM-...│ Jane Smith │ K2    │ Bangkok School  │ 012-89012  │ ✏️ 🗑️   │
└──────────────┴────────────┴───────┴─────────────────┴────────────┴─────────┘
```

### After
```
┌──────────────┬────────────┬───────┬───────┬─────────────────┬────────────┬─────────┐
│ Student ID   │ Name       │ Grade │ Class │ School/Guardian │ Contact    │ Actions │
├──────────────┼────────────┼───────┼───────┼─────────────────┼────────────┼─────────┤
│ BANG-JODO-...│ John Doe   │ K1    │ K1    │ Bangkok School  │ 012-34567  │ ✏️ 🗑️   │
│ BANG-JASM-...│ Jane Smith │ K2    │ K2    │ Bangkok School  │ 012-89012  │ ✏️ 🗑️   │
│ GUAR-MIWA-...│ Mike Wang  │ 5     │ -     │ Parent Wang     │ 012-34590  │ ✏️ 🗑️   │
└──────────────┴────────────┴───────┴───────┴─────────────────┴────────────┴─────────┘
                                      ↑ NEW COLUMN
```

**Notes:**
- Shows class value (K1, K2, K3) for school students
- Shows "-" for guardian-only students
- Class column inserted between Grade and School/Guardian

## Class Booking - Inline Student Creation

### Before
```
┌─────────────────────────────────────────┐
│ Create New Student                      │
├─────────────────────────────────────────┤
│                                         │
│ [______________] First Name             │
│ [______________] Last Name              │
│ [______________] Grade                  │
│ [▼ Select School]                       │
│                                         │
│ [✓ Create & Select Student]             │
└─────────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────────┐
│ Create New Student                      │
├─────────────────────────────────────────┤
│                                         │
│ [______________] First Name             │
│ [______________] Last Name              │
│ [______________] Grade                  │
│ [▼ Select Class] ← NEW!                 │
│   - K1                                  │
│   - K2                                  │
│   - K3                                  │
│ [▼ Select School]                       │
│                                         │
│ [✓ Create & Select Student]             │
└─────────────────────────────────────────┘
```

## Validation Behavior

### Scenario 1: School Selected, No Class
```
┌─────────────────────────────────────────┐
│ ⚠️ Error                                │
├─────────────────────────────────────────┤
│ Class is required for students linked  │
│ to a school                             │
│                                         │
│ ต้องระบุคลาสสำหรับนักเรียนที่          │
│ เชื่อมโยงกับโรงเรียน                    │
└─────────────────────────────────────────┘
```

### Scenario 2: Guardian Only, No Class
```
✅ Allowed - Class is optional for guardian-only students
```

### Scenario 3: School + Class Selected
```
✅ Valid - Student created successfully!
```

## Migration Results Display

After running `npx convex run students:migrateClassField`:

```
┌─────────────────────────────────────────┐
│ Migration Results                       │
├─────────────────────────────────────────┤
│                                         │
│ ✅ Success!                              │
│                                         │
│ Successfully updated 15 student(s)      │
│ with detected class                     │
│                                         │
│ Details:                                │
│ - Scanned: 50 students                  │
│ - Updated: 15 students                  │
│ - Skipped: 35 students                  │
│   (already have class or no school)     │
│                                         │
└─────────────────────────────────────────┘
```

## Class Field States

### When Empty (New Student)
```
Class: [▼ Select Class    ]
       └─────────────────┘
```

### With Value (Existing Student)
```
Class: [▼ K2              ]
       └─────────────────┘
```

### Required Indicator
```
Class: [▼ Select Class    ] *
       └─────────────────┘  ↑ Shows when school is selected
```

## Bilingual Labels

### English
- Label: "Class"
- Placeholder: "Select Class"
- Options: "K1", "K2", "K3"
- Error: "Class is required for students linked to a school"

### Thai
- Label: "คลาส"
- Placeholder: "เลือกคลาส"
- Options: "K1", "K2", "K3"
- Error: "ต้องระบุคลาสสำหรับนักเรียนที่เชื่อมโยงกับโรงเรียน"

## Color Scheme (Following existing theme)

```
Light Mode:
- Background: White (#FFFFFF)
- Text: Gray 900 (#111827)
- Border: Gray 300 (#D1D5DB)
- Focus Ring: Blue 500 (#3B82F6)

Dark Mode:
- Background: Gray 800 (#1F2937)
- Text: White (#FFFFFF)
- Border: Gray 600 (#4B5563)
- Focus Ring: Blue 500 (#3B82F6)
```

## Responsive Behavior

### Desktop (≥768px)
- Grade and Class shown side-by-side in grid layout
- Full table with all columns visible

### Mobile (<768px)
- Grade and Class stack vertically
- Table may scroll horizontally or switch to card view
- Touch-optimized dropdowns

## Accessibility

- ✅ Proper label associations
- ✅ Required field indicators
- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ Focus visible indicators
- ✅ Error messages announced

## User Flow Example

1. Admin clicks "Add Student"
2. Fills First Name: "John"
3. Fills Last Name: "Doe"
4. Fills Grade: "K1"
5. Selects School: "Bangkok School"
   → Class dropdown becomes required (shows *)
6. Selects Class: "K1"
7. Clicks "Add Student"
8. ✅ Student created with class K1
9. Student appears in table with K1 in Class column

## Edge Cases Handled

1. **Guardian-only student**: Class not required
2. **Switching from school to guardian**: Class requirement removed
3. **Switching from guardian to school**: Class requirement added
4. **Editing existing student**: Preserves class value
5. **Migration**: Auto-detects class from existing data
6. **No class in data**: Shows "-" in table
