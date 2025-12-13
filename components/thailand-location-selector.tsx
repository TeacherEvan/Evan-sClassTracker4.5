/**
 * Thailand Location Selector Component
 * 
 * Example component demonstrating how to use Thailand location data
 * in forms for student area selection or location dropdowns.
 * 
 * Features:
 * - Province selection (all 77 provinces)
 * - District selection (filtered by province)
 * - Bilingual display (EN/TH)
 * - Grouped by region for better UX
 * - Search functionality
 * - Popular areas quick select
 * 
 * Usage:
 * <ThailandLocationSelector
 *   value={locationValue}
 *   onChange={(location) => setLocation(location)}
 *   language="en"
 * />
 */

'use client';

import { useState, useMemo } from 'react';
import {
  getProvinceOptions,
  getDistrictOptions,
  getBangkokDistrictOptions,
  getPopularTeachingAreas,
  formatLocationPath,
  isValidLocation,
  searchLocations,
} from '@/lib/thailand-locations';
import { toast } from '@/lib/toast';

interface LocationValue {
  provinceId: string;
  districtId?: string;
  displayPath: string;
  displayPathTh: string;
}

interface ThailandLocationSelectorProps {
  value?: LocationValue;
  onChange: (location: LocationValue | null) => void;
  language?: 'en' | 'th';
  showDistrictSelector?: boolean;
  showPopularAreasFirst?: boolean;
  required?: boolean;
  className?: string;
}

export function ThailandLocationSelector({
  value,
  onChange,
  language = 'en',
  showDistrictSelector = true,
  showPopularAreasFirst = false,
  required = false,
  className = '',
}: ThailandLocationSelectorProps) {
  const [selectedProvince, setSelectedProvince] = useState<string>(
    value?.provinceId || ''
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    value?.districtId || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showPopular, setShowPopular] = useState(showPopularAreasFirst);

  // Get all province options grouped by region
  const provinceOptions = useMemo(
    () => getProvinceOptions(language),
    [language]
  );

  // Get districts for selected province
  const districtOptions = useMemo(() => {
    if (!selectedProvince) return [];
    
    // Special handling for Bangkok (50 districts)
    if (selectedProvince === 'bangkok') {
      return getBangkokDistrictOptions(language);
    }
    
    return getDistrictOptions(selectedProvince, language);
  }, [selectedProvince, language]);

  // Get popular teaching areas for quick selection
  const popularAreas = useMemo(
    () => getPopularTeachingAreas(language),
    [language]
  );

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchLocations(searchQuery);
  }, [searchQuery]);

  // Handle province change
  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvince(provinceId);
    setSelectedDistrict(''); // Reset district when province changes
    
    if (!showDistrictSelector || provinceId === '') {
      // If no district selector or clearing selection
      if (provinceId === '') {
        onChange(null);
      } else {
        const displayPath = formatLocationPath(provinceId, undefined, 'en');
        const displayPathTh = formatLocationPath(provinceId, undefined, 'th');
        onChange({
          provinceId,
          displayPath,
          displayPathTh,
        });
      }
    }
  };

  // Handle district change
  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    
    if (!selectedProvince) return;
    
    // Validate location
    if (!isValidLocation(selectedProvince, districtId)) {
      toast.error('Invalid location combination. Please try again.', 'ตัวเลือกสถานที่ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      return;
    }
    
    const displayPath = formatLocationPath(selectedProvince, districtId, 'en');
    const displayPathTh = formatLocationPath(selectedProvince, districtId, 'th');
    
    onChange({
      provinceId: selectedProvince,
      districtId: districtId || undefined,
      displayPath,
      displayPathTh,
    });
  };

  // Handle popular area selection (province:district format)
  const handlePopularAreaSelect = (areaValue: string) => {
    const [provinceId, districtId] = areaValue.split(':');
    
    if (!isValidLocation(provinceId, districtId)) {
      toast.error('Invalid location selection. Please try again.', 'การเลือกสถานที่ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      return;
    }
    
    setSelectedProvince(provinceId);
    setSelectedDistrict(districtId || '');
    
    const displayPath = formatLocationPath(provinceId, districtId, 'en');
    const displayPathTh = formatLocationPath(provinceId, districtId, 'th');
    
    onChange({
      provinceId,
      districtId: districtId || undefined,
      displayPath,
      displayPathTh,
    });
    
    setShowPopular(false); // Hide popular areas after selection
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Box */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'en' ? 'Search Location' : 'ค้นหาสถานที่'}
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            language === 'en' 
              ? 'Search province or district...' 
              : 'ค้นหาจังหวัดหรืออำเภอ...'
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Search Results */}
        {searchResults && (
          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 max-h-40 overflow-y-auto">
            {searchResults.provinces.length > 0 && (
              <div className="mb-2">
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  {language === 'en' ? 'Provinces' : 'จังหวัด'}
                </div>
                {searchResults.provinces.map((prov) => (
                  <button
                    key={prov.id}
                    onClick={() => {
                      handleProvinceChange(prov.id);
                      setSearchQuery('');
                    }}
                    className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  >
                    {language === 'en' ? prov.name : prov.nameTh}
                  </button>
                ))}
              </div>
            )}
            {searchResults.districts.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  {language === 'en' ? 'Districts' : 'อำเภอ/เขต'}
                </div>
                {searchResults.districts.map((dist) => (
                  <button
                    key={dist.id}
                    onClick={() => {
                      handleProvinceChange(dist.provinceId);
                      handleDistrictChange(dist.id);
                      setSearchQuery('');
                    }}
                    className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  >
                    {language === 'en' ? dist.name : dist.nameTh}
                  </button>
                ))}
              </div>
            )}
            {searchResults.provinces.length === 0 && 
             searchResults.districts.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-2">
                {language === 'en' ? 'No results found' : 'ไม่พบผลลัพธ์'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popular Areas Quick Select */}
      {showPopularAreasFirst && showPopular && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {language === 'en' ? 'Popular Teaching Areas' : 'พื้นที่สอนยอดนิยม'}
          </label>
          <select
            onChange={(e) => handlePopularAreaSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              {language === 'en' 
                ? '-- Select popular area --' 
                : '-- เลือกพื้นที่ยอดนิยม --'}
            </option>
            {popularAreas.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
                {language === 'en' && ` / ${area.labelTh}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowPopular(false)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            {language === 'en' 
              ? 'Show all provinces instead' 
              : 'แสดงจังหวัดทั้งหมด'}
          </button>
        </div>
      )}

      {/* Province Selector */}
      {(!showPopular || !showPopularAreasFirst) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {language === 'en' ? 'Province' : 'จังหวัด'}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => handleProvinceChange(e.target.value)}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              {language === 'en' ? '-- Select province --' : '-- เลือกจังหวัด --'}
            </option>
            {provinceOptions.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                data-group={option.group}
              >
                {option.label}
                {language === 'en' && ` / ${option.labelTh}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* District Selector (shown when province selected and feature enabled) */}
      {showDistrictSelector && selectedProvince && districtOptions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {language === 'en' ? 'District / Area' : 'อำเภอ / เขต'}
            <span className="text-gray-500 text-xs ml-2">
              ({language === 'en' ? 'Optional' : 'ไม่บังคับ'})
            </span>
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              {language === 'en' 
                ? '-- Select district (optional) --' 
                : '-- เลือกอำเภอ (ไม่บังคับ) --'}
            </option>
            {districtOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
                {language === 'en' && ` / ${option.labelTh}`}
              </option>
            ))}
          </select>
          <div className="mt-1 text-xs text-gray-500">
            {selectedProvince === 'bangkok' 
              ? (language === 'en' 
                  ? `${districtOptions.length} Bangkok districts available` 
                  : `มี ${districtOptions.length} เขตในกรุงเทพฯ`)
              : (language === 'en'
                  ? `${districtOptions.length} districts available`
                  : `มี ${districtOptions.length} อำเภอ`)}
          </div>
        </div>
      )}

      {/* Selected Location Display */}
      {value && (
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="text-sm font-medium text-gray-700 mb-1">
            {language === 'en' ? 'Selected Location:' : 'สถานที่ที่เลือก:'}
          </div>
          <div className="text-base font-semibold text-blue-900">
            {language === 'en' ? value.displayPath : value.displayPathTh}
          </div>
          {language === 'en' && (
            <div className="text-sm text-gray-600 mt-1">
              {value.displayPathTh}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Example Usage in a Form
 */
export function ExampleStudentForm() {
  const [location, setLocation] = useState<LocationValue | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (location) {
      // Save location in database-friendly format
      const areaValue = location.districtId 
        ? `${location.provinceId}:${location.districtId}`
        : location.provinceId;
      
      console.log('Saving student with area:', areaValue);
      console.log('Display path EN:', location.displayPath);
      console.log('Display path TH:', location.displayPathTh);
      
      // In real implementation:
      // await createStudent({
      //   ...otherFields,
      //   area: areaValue,  // "bangkok:bangkok_39" or "chiang_mai"
      // });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Student Registration</h2>
      
      {/* Other form fields... */}
      
      <ThailandLocationSelector
        value={location || undefined}
        onChange={setLocation}
        language="en"
        showDistrictSelector={true}
        showPopularAreasFirst={true}
        required={true}
        className="mb-6"
      />
      
      <button
        type="submit"
        disabled={!location}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Submit
      </button>
    </form>
  );
}
