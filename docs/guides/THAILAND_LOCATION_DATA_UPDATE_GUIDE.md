# Thailand Location Data Update Guide

**Version:** 1.0  
**Last Updated:** December 6, 2025  
**File:** `lib/thailand-locations.ts`

---

## Overview

This guide explains how to update Thailand's district/province data used in the location dropdown system. The location data is stored in a structured format that supports both English (primary) and Thai (analytics only) names.

---

## Data Structure

### Hierarchy

```text
Region (e.g., "Central Thailand")
  └─ Province (e.g., "Bangkok")
      └─ District (e.g., "Bang Kapi")
```

### Type Definitions

```typescript
interface ThailandDistrict {
  code: string;        // Unique code (e.g., "BKK-01")
  nameEn: string;      // English name (shown to users)
  nameTh: string;      // Thai name (for analytics)
}

interface ThailandProvince {
  code: string;        // Province code (e.g., "BKK")
  nameEn: string;      // English name
  nameTh: string;      // Thai name
  districts: ThailandDistrict[];
}

interface ThailandRegion {
  code: string;        // Region code (e.g., "CENTRAL")
  nameEn: string;      // English name
  nameTh: string;      // Thai name
  provinces: ThailandProvince[];
}
```

---

## Adding New Districts

### Step 1: Locate the Province

Open `lib/thailand-locations.ts` and find the province where you want to add districts.

Example: Adding a district to Bangkok (BKK):

```typescript
{
  code: "BKK",
  nameEn: "Bangkok",
  nameTh: "กรุงเทพมหานคร",
  districts: [
    // Existing districts...
    { code: "BKK-50", nameEn: "New District", nameTh: "เขตใหม่" }, // NEW
  ],
}
```

### Step 2: District Code Format

District codes follow this pattern:

- `{PROVINCE_CODE}-{NUMBER}`
- Example: `BKK-01`, `CNX-05`, `PKT-03`
- Numbers should be sequential within each province
- Use 2-digit zero-padded numbers (01, 02, ..., 99)

### Step 3: Naming Conventions

**English Names:**

- Use official English transliteration
- Capitalize properly (e.g., "Bang Kapi" not "bang kapi")
- Use common spellings (e.g., "Mueang" not "Muang")

**Thai Names:**

- Use correct Thai spelling
- Include district prefix if part of official name (e.g., "เขตบางกะปิ")

---

## Adding New Provinces

### Step 1: Choose Province Code

Province codes should be:

- 3 uppercase letters
- Derived from common abbreviations or airport codes
- Unique across all provinces

Examples:

- Bangkok = `BKK`
- Chiang Mai = `CNX`
- Phuket = `PKT`

### Step 2: Add to Appropriate Region

```typescript
{
  code: "CENTRAL",
  nameEn: "Central Thailand",
  nameTh: "ภาคกลาง",
  provinces: [
    // Existing provinces...
    {
      code: "NEW",
      nameEn: "New Province",
      nameTh: "จังหวัดใหม่",
      districts: [
        { code: "NEW-01", nameEn: "Mueang New Province", nameTh: "เมืองใหม่" },
        // More districts...
      ],
    },
  ],
}
```

---

## Adding New Regions

If Thailand's administrative structure changes to include new regions:

```typescript
export const THAILAND_LOCATIONS: ThailandRegion[] = [
  // Existing regions...
  {
    code: "NEW_REGION",
    nameEn: "New Region Name",
    nameTh: "ชื่อภาคใหม่",
    provinces: [
      {
        code: "PRV",
        nameEn: "Province Name",
        nameTh: "ชื่อจังหวัด",
        districts: [
          { code: "PRV-01", nameEn: "District 1", nameTh: "เขต 1" },
        ],
      },
    ],
  },
];
```

---

## Data Sources & Verification

### Official Sources

1. **Thailand Ministry of Interior**
   - Official administrative division data
   - [https://www.moi.go.th](https://www.moi.go.th)

2. **National Statistical Office (NSO)**
   - Population and area statistics
   - [https://www.nso.go.th](https://www.nso.go.th)

3. **OpenStreetMap Thailand**
   - Community-verified location data
   - [https://www.openstreetmap.org](https://www.openstreetmap.org)

### Verification Checklist

Before adding new locations:

- [ ] Verify spelling from official government sources
- [ ] Check that district codes are unique
- [ ] Confirm Thai translations are correct
- [ ] Test in LocationSelector component
- [ ] Update tests if needed

---

## Testing New Locations

### 1. Build Test

```bash
npm run build
```

Ensure no TypeScript errors.

### 2. Component Test

1. Start development server:

   ```bash
   npx convex dev
   npm run dev
   ```

2. Navigate to Student Management
3. Click "Add Student"
4. Test LocationSelector:
   - Search for new district by English name
   - Search for new district by Thai name
   - Select from province dropdown
   - Verify district appears in results

### 3. Data Integrity Test

Run these helper functions in browser console:

```typescript
import { 
  getAllDistricts, 
  getDistrictByCode,
  searchDistricts 
} from '@/lib/thailand-locations';

// Test 1: Get all districts
const allDistricts = getAllDistricts();
console.log(`Total districts: ${allDistricts.length}`);

// Test 2: Search for new district
const results = searchDistricts("Your New District");
console.log('Search results:', results);

// Test 3: Get by code
const district = getDistrictByCode("YOUR-01");
console.log('District:', district);
```

---

## Performance Considerations

### Current Scale

- **Regions:** 5
- **Provinces:** ~15 major provinces
- **Districts:** ~200 districts

### Performance Guidelines

1. **Keep district count reasonable**
   - Current implementation shows max 20 search results
   - Province selector shows all districts in selected province
   - Bangkok has 50 districts (acceptable)

2. **Lazy loading not needed yet**
   - Data file is ~350 KB (acceptable)
   - All data loads immediately (good UX)
   - Consider lazy loading if data exceeds 1 MB

3. **Search optimization**
   - Current fuzzy search is case-insensitive
   - Searches both English and Thai names
   - Results limited to 20 items (prevents UI lag)

---

## Migration Strategy

### Existing Data Migration

If you need to migrate existing free-text area data to district codes:

1. **Create migration script** (`scripts/migrate-area-to-districts.ts`):

```typescript
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

export const migrateAreaData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    
    for (const student of students) {
      if (student.area && !student.area.includes("-")) {
        // Free-text area detected, needs mapping
        const mappedCode = mapAreaToDistrictCode(student.area);
        
        if (mappedCode) {
          await ctx.db.patch(student._id, {
            area: mappedCode,
          });
        }
      }
    }
  },
});

function mapAreaToDistrictCode(freeText: string): string | null {
  // Implement mapping logic
  // Example: "Bangkok District 1" → "BKK-01"
  return null;
}
```

1. **Run migration:**

   ```bash
   npx convex run --prod scripts/migrateAreaData
   ```

---

## Common Issues

### Issue: District code already exists

**Solution:** Check existing codes in the province, use next sequential number

### Issue: Thai text not displaying correctly

**Solution:** Ensure file is saved as UTF-8, check Thai fonts in browser

### Issue: Search not finding district

**Solution:** Verify spelling matches exactly in both English and Thai

### Issue: Dropdown too slow

**Solution:** Check if districts > 500, consider implementing pagination

---

## Best Practices

1. **Always use official names** from government sources
2. **Keep codes consistent** (same format across all provinces)
3. **Test thoroughly** before deploying to production
4. **Document changes** in git commit messages
5. **Update this guide** if structure changes
6. **Backup data** before major migrations

---

## Future Enhancements

Potential improvements for scalability:

1. **API-based location data**
   - Fetch from Thailand government API
   - Auto-update when districts change
   - Requires stable API endpoint

2. **Subdistrict (Tambon) support**
   - Add another level: District → Subdistrict
   - Useful for rural area precision
   - Increases data size significantly

3. **Postal code integration**
   - Map districts to postal codes
   - Improve address accuracy
   - Useful for billing/shipping

4. **GPS coordinates**
   - Add lat/long to districts
   - Enable map-based selection
   - Useful for distance calculations

---

## Support

For questions or issues with location data updates:

1. Check official Thailand government sources
2. Review this documentation
3. Test changes in development environment first
4. Contact repository maintainer for review

---

## Changelog

### Version 1.0 (December 6, 2025)

- Initial location data structure
- 5 regions, ~15 provinces, ~200 districts
- Bangkok (50 districts) fully mapped
- Major tourist provinces included
- Helper functions for search and filtering
