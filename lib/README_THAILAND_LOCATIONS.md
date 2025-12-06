# Thailand Locations Data

**File:** `thailand-locations.ts`  
**Purpose:** Centralized location data for student location dropdowns

## Quick Reference

### Data Structure

```text
THAILAND_LOCATIONS (Array)
  └─ Region
      └─ Province
          └─ District (with code, nameEn, nameTh)
```

### Usage Example

```typescript
import { LocationSelector } from '@/components/location-selector';

// In your component
<LocationSelector
  value={area}           // District code (e.g., "BKK-01")
  onChange={setArea}     // Update function
  placeholder="Select teaching location"
/>
```

### Helper Functions

```typescript
import {
  getAllDistricts,           // Get all districts (flat array)
  getAllProvinces,           // Get all provinces (flat array)
  getDistrictByCode,         // Find district by code
  getProvinceByCode,         // Find province by code
  searchDistricts,           // Fuzzy search (EN/TH)
  getProvincesByRegion,      // Get provinces in a region
  getDistrictsByProvince,    // Get districts in a province
  formatDistrictDisplay,     // Format as "District, Province"
} from '@/lib/thailand-locations';
```

## Current Coverage

- **Regions:** 5 (Central, North, Northeast, East, South)
- **Provinces:** 15 major provinces
- **Districts:** ~200 districts
- **Bangkok:** 50 districts (complete)

## Common Tasks

### Adding a District

1. Find the province object in `THAILAND_LOCATIONS`
2. Add to `districts` array with unique code
3. Format: `{ code: "PRV-##", nameEn: "Name", nameTh: "ชื่อ" }`
4. Test build: `npm run build`

### Adding a Province

1. Find the appropriate region
2. Add to `provinces` array with 3-letter code
3. Include at least one district
4. Test in LocationSelector component

## Data Format Rules

1. **District Codes:** `{PROVINCE_CODE}-{2-DIGIT-NUMBER}`
   - Example: `BKK-01`, `CNX-10`, `PKT-03`
2. **Province Codes:** 3 uppercase letters
   - Example: `BKK`, `CNX`, `PKT`
3. **Region Codes:** ALL_CAPS with underscores
   - Example: `CENTRAL`, `NORTH`, `NORTHEAST`

## Default Behavior

**When no search/selection:**

- Shows top 10 Bangkok districts (most common)

**When searching:**

- Fuzzy match on English and Thai names
- Limited to 20 results for performance

**When province selected:**

- Shows all districts in that province

## For Complete Documentation

See: `docs/guides/THAILAND_LOCATION_DATA_UPDATE_GUIDE.md`

Includes:

- Official data sources
- Migration strategies
- Testing procedures
- Performance guidelines
- Future enhancements
