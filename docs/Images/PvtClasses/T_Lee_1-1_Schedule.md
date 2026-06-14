# T. Lee Private Classes Schedule (1/1)

**Duration**: 12 weeks (Nov 4, 2025 - Jan 24, 2026)  
**Time**: 15:00-16:00 (3:00 PM - 4:00 PM)  
**Location**: PLAY ROOM B.5 (ALL classes)

---

## Weekly Schedule

### Monday

- **No Classes**

### Tuesday

**Location**: PLAY ROOM B.5

- 1105 NARA
- 1125 MANOW

### Wednesday

**Location**: PLAY ROOM B.5

- 1103 MASTER
- 1105 NARA

### Thursday

**Location**: PLAY ROOM B.5

- 1105 NARA
- 1108 MIU

### Friday

**Location**: PLAY ROOM B.5

- 2015 MARINE try 1 (One-time trial - Week 1 only)
- 2021 Thang Thang try 1 (One-time trial - Week 1 only)

---

## Student Breakdown

### Regular Students (All 12 weeks)

| Code | Student Name | Days          |
| ---- | ------------ | ------------- |
| 1105 | NARA         | Tue, Wed, Thu |
| 1125 | MANOW        | Tue           |
| 1103 | MASTER       | Wed           |
| 1108 | MIU          | Thu           |

### Trial Students (One-time - Week 1 only)

| Code | Student Name | Day | Notes       |
| ---- | ------------ | --- | ----------- |
| 2015 | MARINE       | Fri | Trial class |
| 2021 | Thang Thang  | Fri | Trial class |

---

## Summary Statistics

- **Total Regular Students**: 4 unique students
- **Total Trial Students**: 2 (Week 1 Friday only)
- **Classes per Week**: 8 regular + 2 trial (Week 1) = 10 total Week 1, 8 for Weeks 2-12
- **Total Classes (12 weeks)**: (8 × 12) + 2 trial = 98 classes
- **Most Frequent Student**: NARA (3 days/week)
- **Location**: PLAY ROOM B.5 (100% of classes)

---

## Implementation Notes

1. **Auto-Approval**: All classes set to `status: "approved"` and `isGuardianLinked: true`
2. **Guardian Title**: "Private Student" for regular, "Private Student (One-Time)" for trials
3. **Location Creation**: Auto-creates "PLAY ROOM B.5" if it doesn't exist
4. **Trial Students**: Only created in Week 1 (first Friday)
5. **Student Lookup**: Uses XXYY code format (e.g., 1105 = K1/1 student #5)

---

**Source**: LeaPvtClasses.jpg  
**Processed**: November 1, 2025
