"use client";

import { useState, useEffect } from "react";
import { THAILAND_PROVINCES, getDistricts, getAreas } from "@/lib/thailand-locations";

interface LocationSelectorProps {
  province?: string;
  district?: string;
  area?: string;
  onProvinceChange: (province: string) => void;
  onDistrictChange: (district: string) => void;
  onAreaChange: (area: string) => void;
  language: "en" | "th";
  required?: boolean;
  disabled?: boolean;
}

/**
 * LocationSelector Component
 * 
 * Cascading dropdown selector for Province → District → Area
 * Supports bilingual display (English/Thai)
 * Used for student location input to support duplicate detection
 * 
 * Requirements:
 * - At least 2 of 3 fields must be filled for provider students
 * - Validates location data for duplicate detection
 */
export default function LocationSelector({
  province,
  district,
  area,
  onProvinceChange,
  onDistrictChange,
  onAreaChange,
  language,
  required = false,
  disabled = false,
}: LocationSelectorProps) {
  const [availableDistricts, setAvailableDistricts] = useState<ReturnType<typeof getDistricts>>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  // Update available districts when province changes
  useEffect(() => {
    if (province) {
      const districts = getDistricts(province);
      setAvailableDistricts(districts);
      
      // Reset district and area if current district is not in new province
      const districtExists = districts.some(d => d.nameEn === district || d.nameTh === district);
      if (!districtExists) {
        onDistrictChange("");
        onAreaChange("");
        setAvailableAreas([]);
      }
    } else {
      setAvailableDistricts([]);
      setAvailableAreas([]);
    }
  }, [province, district, onDistrictChange, onAreaChange]);

  // Update available areas when district changes
  useEffect(() => {
    if (district) {
      const areas = getAreas(district);
      setAvailableAreas(areas);
      
      // Reset area if it's not in the new district
      if (area && !areas.includes(area)) {
        onAreaChange("");
      }
    } else {
      setAvailableAreas([]);
    }
  }, [district, area, onAreaChange]);

  return (
    <div className="space-y-3">
      {/* Province Selector */}
      <div>
        <label htmlFor="province" className="block text-sm font-medium mb-1">
          {language === "en" ? "Province" : "จังหวัด"}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          id="province"
          value={province || ""}
          onChange={(e) => onProvinceChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
        >
          <option value="">
            {language === "en" ? "Select Province" : "เลือกจังหวัด"}
          </option>
          {THAILAND_PROVINCES.map((p) => (
            <option key={p.nameEn} value={p.nameEn}>
              {language === "en" ? p.nameEn : p.nameTh}
            </option>
          ))}
        </select>
      </div>

      {/* District Selector */}
      <div>
        <label htmlFor="district" className="block text-sm font-medium mb-1">
          {language === "en" ? "District" : "เขต/อำเภอ"}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          id="district"
          value={district || ""}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={disabled || !province}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
        >
          <option value="">
            {language === "en" 
              ? (province ? "Select District" : "Select Province First")
              : (province ? "เลือกเขต/อำเภอ" : "เลือกจังหวัดก่อน")
            }
          </option>
          {availableDistricts.map((d) => (
            <option key={d.nameEn} value={d.nameEn}>
              {language === "en" ? d.nameEn : d.nameTh}
            </option>
          ))}
        </select>
      </div>

      {/* Area/Neighborhood Selector (Optional) */}
      {availableAreas.length > 0 && (
        <div>
          <label htmlFor="area" className="block text-sm font-medium mb-1">
            {language === "en" ? "Area/Neighborhood (Optional)" : "พื้นที่/ย่าน (ไม่บังคับ)"}
          </label>
          <select
            id="area"
            value={area || ""}
            onChange={(e) => onAreaChange(e.target.value)}
            disabled={disabled || !district}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
          >
            <option value="">
              {language === "en" ? "Select Area (Optional)" : "เลือกพื้นที่ (ไม่บังคับ)"}
            </option>
            {availableAreas.map((areaOption) => (
              <option key={areaOption} value={areaOption}>
                {areaOption}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Custom Area Input (if no predefined areas) */}
      {!availableAreas.length && district && (
        <div>
          <label htmlFor="area-custom" className="block text-sm font-medium mb-1">
            {language === "en" ? "Area/Neighborhood (Optional)" : "พื้นที่/ย่าน (ไม่บังคับ)"}
          </label>
          <input
            id="area-custom"
            type="text"
            value={area || ""}
            onChange={(e) => onAreaChange(e.target.value)}
            disabled={disabled}
            placeholder={language === "en" ? "Enter area name" : "ระบุชื่อพื้นที่"}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* Helper Text */}
      {required && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === "en" 
            ? "At least 2 location fields are required for accurate duplicate detection"
            : "ต้องระบุข้อมูลสถานที่อย่างน้อย 2 ช่องเพื่อการตรวจสอบข้อมูลซ้ำที่แม่นยำ"
          }
        </p>
      )}
    </div>
  );
}
