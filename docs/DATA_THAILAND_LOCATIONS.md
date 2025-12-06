# Thailand Location Data - Documentation & Maintenance Guide

**Version:** 1.0  
**Last Updated:** December 2025  
**Status:** ✅ Complete - All 77 provinces, 50 Bangkok districts, major teaching areas

## Overview

This document describes the Thailand administrative location data system used throughout Evan's Class Tracker. The system provides comprehensive, scalable bilingual (EN/TH) location data for:

- Student area fields
- Location dropdowns in forms
- Analytics and reporting
- Moderator dashboards

## Data Structure

### Hierarchy

```text
Region (ภาค) - 6 regions
  └── Province (จังหวัด) - 77 provinces
       └── District/Area (อำเภอ/เขต) - 928 total (selected major areas included)
```

### Files

- **`lib/types/locations.ts`** - TypeScript type definitions
- **`lib/thailand-locations.ts`** - Complete location data with helper functions
- **`docs/DATA_THAILAND_LOCATIONS.md`** - This documentation file

## Complete Coverage

### ✅ Regions (6/6)

- Central Thailand (ภาคกลาง) - 26 provinces
- Northern Thailand (ภาคเหนือ) - 17 provinces
- Northeastern Thailand/Isan (ภาคตะวันออกเฉียงเหนือ) - 20 provinces
- Eastern Thailand (ภาคตะวันออก) - 6 provinces
- Western Thailand (ภาคตะวันตก) - 5 provinces
- Southern Thailand (ภาคใต้) - 14 provinces

### ✅ Provinces (77/77)

All 77 provinces of Thailand included with:

- Official 2-digit province code
- English name
- Thai name (ชื่อภาษาไทย)
- Region assignment
- Capital flag (Bangkok)

### ✅ Districts (Selected)

- **Bangkok**: All 50 districts (เขต) - Complete coverage
- **Major Cities**: Provincial capitals (Mueang districts)
- **Teaching Areas**: Popular private tutoring locations

## Data Sources

### Official References

1. **Department of Provincial Administration (DOPA)**
   - Official Thai government administrative structure
   - Province codes (2 digits) and district codes (4 digits)
   - URL: <https://www.dopa.go.th/>

2. **National Statistical Office (NSO)**
   - Population data and administrative changes
   - URL: <http://statbbi.nso.go.th/>

3. **Bangkok Metropolitan Administration (BMA)**
   - 50 Bangkok districts official list
   - URL: <https://www.bangkok.go.th/>

### Translation Standards

- **English Names**: Official RTGS (Royal Thai General System) romanization
- **Thai Names**: Official Thai script from government sources
- **Common Variants**: Standardized (e.g., "Chiang Mai" not "Chiangmai")

## Usage Examples

### 1. Province Dropdown (All 77 Provinces)

```typescript
import { getProvinceOptions } from '@/lib/thailand-locations';

// Get all provinces grouped by region
const provinces = getProvinceOptions('en');

// Use in select component
<Select>
  {provinces.map(option => (
    <Option 
      key={option.value} 
      value={option.value}
      group={option.group}  // Region grouping
    >
      {option.label} / {option.labelTh}
    </Option>
  ))}
</Select>
```

### 2. Bangkok Districts Dropdown

```typescript
import { getBangkokDistrictOptions } from '@/lib/thailand-locations';

const bangkokDistricts = getBangkokDistrictOptions('en');
// Returns all 50 Bangkok districts
```

### 3. Province → District Cascading

```typescript
import { 
  getProvinceOptions, 
  getDistrictsByProvince,
  getDistrictOptions 
} from '@/lib/thailand-locations';

// Step 1: Select province
const [selectedProvince, setSelectedProvince] = useState('');

// Step 2: Load districts for selected province
const districts = getDistrictOptions(selectedProvince, 'en');
```

### 4. Popular Teaching Areas

```typescript
import { getPopularTeachingAreas } from '@/lib/thailand-locations';

// Get top teaching areas (Bangkok districts + provincial capitals)
const popularAreas = getPopularTeachingAreas('en');
// Quick selection for private tutors
```

### 5. Search Functionality

```typescript
import { searchLocations } from '@/lib/thailand-locations';

// Search supports both English and Thai
const results = searchLocations('Bangkok');
// Returns: { provinces: [...], districts: [...] }

const resultsth = searchLocations('เชียงใหม่');
// Also works with Thai input
```

### 6. Format Display Path

```typescript
import { formatLocationPath } from '@/lib/thailand-locations';

// Show full location path
const path = formatLocationPath('bangkok', 'bangkok_39', 'en');
// Returns: "Bangkok, Watthana"

const pathTh = formatLocationPath('bangkok', 'bangkok_39', 'th');
// Returns: "กรุงเทพมหานคร, วัฒนา"
```

### 7. Validation

```typescript
import { isValidLocation } from '@/lib/thailand-locations';

// Validate province + district combination
const valid = isValidLocation('bangkok', 'bangkok_39');
// Returns: true (Watthana is in Bangkok)

const invalid = isValidLocation('bangkok', 'chiang_mai_01');
// Returns: false (Mueang Chiang Mai is not in Bangkok)
```

## Student Area Field Integration

### Current Schema

```typescript
// convex/schema.ts
students: defineTable({
  // ...
  area: v.optional(v.string()), // "Bangkok District 1" format
  // ...
})
```

### Recommended Storage Format

#### Option 1: Combined String (Current)

```typescript
area: "bangkok:bangkok_39"  // province:district
area: "chiang_mai"           // province only
```

#### Option 2: Structured (Future Enhancement)

```typescript
// Add new fields if needed
provinceId: v.optional(v.string()),
districtId: v.optional(v.string()),
```

### Display Examples

```typescript
// For analytics/moderator view
const student = await ctx.db.get(studentId);
if (student.area) {
  const [provinceId, districtId] = student.area.split(':');
  const display = formatLocationPath(provinceId, districtId, 'en');
  // Shows: "Bangkok, Watthana"
}
```

## Bilingual Pattern Compliance

### ✅ Developer UI (English + Thai)

- Dropdown labels show both: "Bangkok / กรุงเทพมหานคร"
- System-generated fields use both languages
- Moderator analytics display both

### ✅ User Content (Single Language)

- Students/teachers enter location ONCE
- No forced bilingual data entry
- System handles display based on preference

### Example Form

```typescript
// ✅ CORRECT: Single selection, system provides both
<Select 
  label="Teaching Area"
  options={getPopularTeachingAreas('en')}
  // Shows: "Bangkok, Watthana / กรุงเทพมหานคร, วัฒนา"
/>

// ❌ WRONG: Don't force users to enter both
<Input label="Area (English)" />
<Input label="พื้นที่ (Thai)" />
```

## Maintenance & Updates

### When to Update

1. **Government Changes** (Rare - every few years)
   - New province created (last: Bueng Kan in 2011)
   - District boundary changes
   - Name spelling updates

2. **Teaching Area Additions** (As needed)
   - New popular private tutoring areas
   - Expanding to new provinces

### How to Update

#### Adding a New Province

```typescript
// lib/thailand-locations.ts

// 1. Add to region's province list
export const THAILAND_REGIONS: ThailandRegion[] = [
  {
    id: 'northeastern',
    provinces: [..., 'new_province_id']  // Add here
  }
];

// 2. Add province definition
export const THAILAND_PROVINCES: ThailandProvince[] = [
  // ...
  { 
    id: 'new_province_id', 
    code: '97',  // Next available code
    name: 'New Province', 
    nameTh: 'จังหวัดใหม่', 
    regionId: 'northeastern' 
  },
];
```

#### Adding New Districts

```typescript
// lib/thailand-locations.ts

export const MAJOR_DISTRICTS: ThailandDistrict[] = [
  // ...
  { 
    id: 'new_province_01', 
    code: '9701',  // Optional district code
    name: 'Mueang New Province', 
    nameTh: 'เมืองจังหวัดใหม่', 
    provinceId: 'new_province_id', 
    type: 'district' 
  },
];
```

#### Updating Names/Translations

```typescript
// Simply edit the existing entry
{ 
  id: 'bangkok', 
  name: 'Bangkok',  // Update if romanization changes
  nameTh: 'กรุงเทพมหานคร'  // Update if official Thai changes
}
```

### Testing Updates

```bash
# 1. Type check
npm run type-check

# 2. Build test
npm run build

# 3. Test in development
npm run dev
# Navigate to any location dropdown
```

### Validation Checklist

- [ ] Province code unique (2 digits)
- [ ] District code unique (4 digits, optional)
- [ ] English name uses official RTGS romanization
- [ ] Thai name matches official government spelling
- [ ] Province assigned to correct region
- [ ] District assigned to correct province
- [ ] No duplicate IDs
- [ ] Build succeeds with no TypeScript errors

## Migration Path

### Current System

- `students.area`: Free text field (e.g., "Bangkok District 1")
- No validation or standardization

### Phase 1: Soft Migration (Recommended)

1. Keep `area` field for backward compatibility
2. Add validation to accept standardized IDs
3. Update UI to use dropdowns with new data
4. Gradual data cleanup as users edit students

### Phase 2: Hard Migration (Future)

1. Add `provinceId` and `districtId` fields to schema
2. Migrate existing `area` values to structured IDs
3. Deprecate `area` field
4. Update all queries to use new fields

## API Reference

### Core Functions

```typescript
// Region operations
getRegionById(regionId: string): ThailandRegion | undefined
getProvincesByRegion(regionId: string): ThailandProvince[]

// Province operations
getProvinceById(provinceId: string): ThailandProvince | undefined
getProvinceOptions(language?: 'en' | 'th'): LocationOption[]

// District operations
getDistrictById(districtId: string): ThailandDistrict | undefined
getDistrictsByProvince(provinceId: string): ThailandDistrict[]
getDistrictOptions(provinceId?: string, language?: 'en' | 'th'): LocationOption[]
getBangkokDistrictOptions(language?: 'en' | 'th'): LocationOption[]

// Helper functions
formatLocationPath(provinceId: string, districtId?: string, language?: 'en' | 'th'): string
searchLocations(query: string): { provinces, districts }
isValidLocation(provinceId: string, districtId?: string): boolean
getPopularTeachingAreas(language?: 'en' | 'th'): LocationOption[]
```

## Future Enhancements

### Short Term

- [ ] Add sub-district (ตำบล) data for major areas
- [ ] Add postal codes for each district
- [ ] Add geographic coordinates for mapping
- [ ] Add population data for analytics

### Long Term

- [ ] Auto-update system from government APIs
- [ ] Historical data tracking (name changes over time)
- [ ] Integration with Thai address autocomplete services
- [ ] Map visualization of teaching areas

## Government Resources

### Official Data Sources

1. **DOPA GIS Portal**: <https://stat.bora.dopa.go.th/gis/>
2. **Thailand Postal Code Database**: <https://www.thailandpost.com/>
3. **RTGS Romanization**: <http://www.royin.go.th/>

### Update Frequency

- **Province/District Changes**: Check annually (January)
- **Romanization Updates**: Check with Royal Institute announcements
- **BMA Districts**: Check Bangkok.go.th for any restructuring

## Change Log

### Version 1.0 (December 2025)

- ✅ Initial release
- ✅ All 77 provinces included
- ✅ All 50 Bangkok districts included
- ✅ Major provincial capitals included
- ✅ Complete bilingual EN/TH mapping
- ✅ Helper functions for dropdowns and validation
- ✅ TypeScript type definitions
- ✅ Comprehensive documentation

## Support & Questions

For questions or updates to this data:

1. Check official government sources listed above
2. Review CHANGELOG.md for recent updates
3. Create GitHub issue with `data` and `location` labels
4. Tag with `enhancement` for new district requests

## License & Attribution

**Data Source**: Thailand Department of Provincial Administration (Public Domain)  
**Romanization**: Royal Thai General System of Transcription (RTGS)  
**Implementation**: Evan's Class Tracker 4.5  
**Maintainer**: TeacherEvan

---

**Last Reviewed**: December 6, 2025  
**Next Review**: January 2026 (Annual government data check)
