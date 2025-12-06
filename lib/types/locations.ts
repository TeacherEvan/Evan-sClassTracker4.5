/**
 * Type definitions for Thailand administrative location data
 * 
 * Thailand Administrative Structure:
 * - 6 Regions (ภาค)
 * - 77 Provinces (จังหวัด)
 * - 928 Districts (อำเภอ/เขต)
 * 
 * For this application, we provide:
 * - All 77 provinces with EN/TH names
 * - Major districts in Bangkok and key provinces
 * - Common teaching areas for private tutors
 */

/**
 * Thailand Region (ภาค)
 * 6 main regions of Thailand
 */
export interface ThailandRegion {
  id: string;
  name: string;          // English name
  nameTh: string;        // Thai name
  provinces: string[];   // Province IDs in this region
}

/**
 * Thailand Province (จังหวัด)
 * One of 77 provinces in Thailand
 */
export interface ThailandProvince {
  id: string;
  code: string;          // Official province code (2 digits)
  name: string;          // English name
  nameTh: string;        // Thai name
  regionId: string;      // Parent region ID
  isCapital?: boolean;   // True for Bangkok
  commonAreas?: string[]; // Common teaching areas/districts (IDs)
}

/**
 * Thailand District/Area (อำเภอ/เขต)
 * Major districts and teaching areas
 * Note: Only includes commonly used areas for educational purposes
 */
export interface ThailandDistrict {
  id: string;
  code?: string;         // Official district code (4 digits)
  name: string;          // English name
  nameTh: string;        // Thai name
  provinceId: string;    // Parent province ID
  type: 'district' | 'bangkok_district' | 'teaching_area'; // Type of area
}

/**
 * Full location path for display
 * Example: "Bangkok / Sukhumvit / Thong Lo"
 */
export interface LocationPath {
  region?: ThailandRegion;
  province: ThailandProvince;
  district?: ThailandDistrict;
  fullPath: string;      // "Province, District" or just "Province"
  fullPathTh: string;    // Thai version
}

/**
 * Helper type for dropdown options
 */
export interface LocationOption {
  value: string;         // ID or combined key
  label: string;         // Display label (English)
  labelTh: string;       // Display label (Thai)
  group?: string;        // Optional grouping (e.g., by region or province)
}
