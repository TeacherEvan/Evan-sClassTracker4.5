/**
 * Thailand Administrative Divisions Data
 * 
 * Structure: Regions → Provinces → Districts
 * All names default to English with Thai translations for backend analytics
 * 
 * Data Source: Thailand's administrative divisions (as of 2025)
 * Last Updated: December 2025
 */

export interface ThailandDistrict {
  code: string;        // Unique district code (e.g., "BKK-01")
  nameEn: string;      // English name (PRIMARY - shown to all users)
  nameTh: string;      // Thai name (for moderator analytics only)
}

export interface ThailandProvince {
  code: string;        // Province code (e.g., "BKK")
  nameEn: string;      // English name (PRIMARY)
  nameTh: string;      // Thai name (for analytics)
  districts: ThailandDistrict[];
}

export interface ThailandRegion {
  code: string;        // Region code
  nameEn: string;      // English name (PRIMARY)
  nameTh: string;      // Thai name (for analytics)
  provinces: ThailandProvince[];
}

/**
 * Thailand Administrative Divisions
 * Organized by region for better UX and scalability
 * Covers major provinces and districts commonly used for tutoring services
 */
export const THAILAND_LOCATIONS: ThailandRegion[] = [
  {
    code: "CENTRAL",
    nameEn: "Central Thailand",
    nameTh: "ภาคกลาง",
    provinces: [
      {
        code: "BKK",
        nameEn: "Bangkok",
        nameTh: "กรุงเทพมหานคร",
        districts: [
          { code: "BKK-01", nameEn: "Bang Kapi", nameTh: "บางกะปิ" },
          { code: "BKK-02", nameEn: "Bang Khae", nameTh: "บางแค" },
          { code: "BKK-03", nameEn: "Bang Khen", nameTh: "บางเขน" },
          { code: "BKK-04", nameEn: "Bang Kho Laem", nameTh: "บางคอแหลม" },
          { code: "BKK-05", nameEn: "Bang Khun Thian", nameTh: "บางขุนเทียน" },
          { code: "BKK-06", nameEn: "Bang Na", nameTh: "บางนา" },
          { code: "BKK-07", nameEn: "Bang Phlat", nameTh: "บางพลัด" },
          { code: "BKK-08", nameEn: "Bang Rak", nameTh: "บางรัก" },
          { code: "BKK-09", nameEn: "Bang Sue", nameTh: "บางซื่อ" },
          { code: "BKK-10", nameEn: "Bangkok Noi", nameTh: "บางกอกน้อย" },
          { code: "BKK-11", nameEn: "Bangkok Yai", nameTh: "บางกอกใหญ่" },
          { code: "BKK-12", nameEn: "Bueng Kum", nameTh: "บึงกุ่ม" },
          { code: "BKK-13", nameEn: "Chatuchak", nameTh: "จตุจักร" },
          { code: "BKK-14", nameEn: "Chom Thong", nameTh: "จอมทอง" },
          { code: "BKK-15", nameEn: "Din Daeng", nameTh: "ดินแดง" },
          { code: "BKK-16", nameEn: "Don Mueang", nameTh: "ดอนเมือง" },
          { code: "BKK-17", nameEn: "Dusit", nameTh: "ดุสิต" },
          { code: "BKK-18", nameEn: "Huai Khwang", nameTh: "ห้วยขวาง" },
          { code: "BKK-19", nameEn: "Khan Na Yao", nameTh: "คันนายาว" },
          { code: "BKK-20", nameEn: "Khlong Sam Wa", nameTh: "คลองสามวา" },
          { code: "BKK-21", nameEn: "Khlong San", nameTh: "คลองสาน" },
          { code: "BKK-22", nameEn: "Khlong Toei", nameTh: "คลองเตย" },
          { code: "BKK-23", nameEn: "Lak Si", nameTh: "หลักสี่" },
          { code: "BKK-24", nameEn: "Lat Krabang", nameTh: "ลาดกระบัง" },
          { code: "BKK-25", nameEn: "Lat Phrao", nameTh: "ลาดพร้าว" },
          { code: "BKK-26", nameEn: "Min Buri", nameTh: "มีนบุรี" },
          { code: "BKK-27", nameEn: "Nong Chok", nameTh: "หนองจอก" },
          { code: "BKK-28", nameEn: "Nong Khaem", nameTh: "หนองแขม" },
          { code: "BKK-29", nameEn: "Pathum Wan", nameTh: "ปทุมวัน" },
          { code: "BKK-30", nameEn: "Phasi Charoen", nameTh: "ภาษีเจริญ" },
          { code: "BKK-31", nameEn: "Phaya Thai", nameTh: "พญาไท" },
          { code: "BKK-32", nameEn: "Phra Khanong", nameTh: "พระโขนง" },
          { code: "BKK-33", nameEn: "Phra Nakhon", nameTh: "พระนคร" },
          { code: "BKK-34", nameEn: "Pom Prap Sattru Phai", nameTh: "ป้อมปราบศัตรูพ่าย" },
          { code: "BKK-35", nameEn: "Prawet", nameTh: "ประเวศ" },
          { code: "BKK-36", nameEn: "Rat Burana", nameTh: "ราษฎร์บูรณะ" },
          { code: "BKK-37", nameEn: "Ratchathewi", nameTh: "ราชเทวี" },
          { code: "BKK-38", nameEn: "Sai Mai", nameTh: "สายไหม" },
          { code: "BKK-39", nameEn: "Samphanthawong", nameTh: "สัมพันธวงศ์" },
          { code: "BKK-40", nameEn: "Saphan Sung", nameTh: "สะพานสูง" },
          { code: "BKK-41", nameEn: "Sathon", nameTh: "สาทร" },
          { code: "BKK-42", nameEn: "Suan Luang", nameTh: "สวนหลวง" },
          { code: "BKK-43", nameEn: "Taling Chan", nameTh: "ตลิ่งชัน" },
          { code: "BKK-44", nameEn: "Thawi Watthana", nameTh: "ทวีวัฒนา" },
          { code: "BKK-45", nameEn: "Thon Buri", nameTh: "ธนบุรี" },
          { code: "BKK-46", nameEn: "Thung Khru", nameTh: "ทุ่งครุ" },
          { code: "BKK-47", nameEn: "Vadhana", nameTh: "วัฒนา" },
          { code: "BKK-48", nameEn: "Wang Thonglang", nameTh: "วังทองหลาง" },
          { code: "BKK-49", nameEn: "Yan Nawa", nameTh: "ยานนาวา" },
        ],
      },
      {
        code: "NPT",
        nameEn: "Nonthaburi",
        nameTh: "นนทบุรี",
        districts: [
          { code: "NPT-01", nameEn: "Mueang Nonthaburi", nameTh: "เมืองนนทบุรี" },
          { code: "NPT-02", nameEn: "Bang Bua Thong", nameTh: "บางบัวทอง" },
          { code: "NPT-03", nameEn: "Bang Kruai", nameTh: "บางกรวย" },
          { code: "NPT-04", nameEn: "Bang Yai", nameTh: "บางใหญ่" },
          { code: "NPT-05", nameEn: "Pak Kret", nameTh: "ปากเกร็ด" },
          { code: "NPT-06", nameEn: "Sai Noi", nameTh: "ไทรน้อย" },
        ],
      },
      {
        code: "PBI",
        nameEn: "Pathum Thani",
        nameTh: "ปทุมธานี",
        districts: [
          { code: "PBI-01", nameEn: "Mueang Pathum Thani", nameTh: "เมืองปทุมธานี" },
          { code: "PBI-02", nameEn: "Khlong Luang", nameTh: "คลองหลวง" },
          { code: "PBI-03", nameEn: "Lam Luk Ka", nameTh: "ลำลูกกา" },
          { code: "PBI-04", nameEn: "Lat Lum Kaeo", nameTh: "ลาดหลุมแก้ว" },
          { code: "PBI-05", nameEn: "Nong Suea", nameTh: "หนองเสือ" },
          { code: "PBI-06", nameEn: "Sam Khok", nameTh: "สามโคก" },
          { code: "PBI-07", nameEn: "Thanyaburi", nameTh: "ธัญบุรี" },
        ],
      },
      {
        code: "SPN",
        nameEn: "Samut Prakan",
        nameTh: "สมุทรปราการ",
        districts: [
          { code: "SPN-01", nameEn: "Mueang Samut Prakan", nameTh: "เมืองสมุทรปราการ" },
          { code: "SPN-02", nameEn: "Bang Bo", nameTh: "บางบ่อ" },
          { code: "SPN-03", nameEn: "Bang Phli", nameTh: "บางพลี" },
          { code: "SPN-04", nameEn: "Bang Sao Thong", nameTh: "บางเสาธง" },
          { code: "SPN-05", nameEn: "Phra Pradaeng", nameTh: "พระประแดง" },
          { code: "SPN-06", nameEn: "Phra Samut Chedi", nameTh: "พระสมุทรเจดีย์" },
        ],
      },
      {
        code: "SPK",
        nameEn: "Samut Sakhon",
        nameTh: "สมุทรสาคร",
        districts: [
          { code: "SPK-01", nameEn: "Mueang Samut Sakhon", nameTh: "เมืองสมุทรสาคร" },
          { code: "SPK-02", nameEn: "Ban Phaeo", nameTh: "บ้านแพ้ว" },
          { code: "SPK-03", nameEn: "Krathum Baen", nameTh: "กระทุ่มแบน" },
        ],
      },
    ],
  },
  {
    code: "NORTH",
    nameEn: "Northern Thailand",
    nameTh: "ภาคเหนือ",
    provinces: [
      {
        code: "CNX",
        nameEn: "Chiang Mai",
        nameTh: "เชียงใหม่",
        districts: [
          { code: "CNX-01", nameEn: "Mueang Chiang Mai", nameTh: "เมืองเชียงใหม่" },
          { code: "CNX-02", nameEn: "Chom Thong", nameTh: "จอมทอง" },
          { code: "CNX-03", nameEn: "Doi Saket", nameTh: "ดอยสะเก็ด" },
          { code: "CNX-04", nameEn: "Doi Tao", nameTh: "ดอยเต่า" },
          { code: "CNX-05", nameEn: "Hang Dong", nameTh: "หางดง" },
          { code: "CNX-06", nameEn: "Mae Rim", nameTh: "แม่ริม" },
          { code: "CNX-07", nameEn: "San Kamphaeng", nameTh: "สันกำแพง" },
          { code: "CNX-08", nameEn: "San Pa Tong", nameTh: "สันป่าตอง" },
          { code: "CNX-09", nameEn: "San Sai", nameTh: "สันทราย" },
          { code: "CNX-10", nameEn: "Saraphi", nameTh: "สารภี" },
        ],
      },
      {
        code: "CRI",
        nameEn: "Chiang Rai",
        nameTh: "เชียงราย",
        districts: [
          { code: "CRI-01", nameEn: "Mueang Chiang Rai", nameTh: "เมืองเชียงราย" },
          { code: "CRI-02", nameEn: "Mae Chan", nameTh: "แม่จัน" },
          { code: "CRI-03", nameEn: "Mae Sai", nameTh: "แม่สาย" },
          { code: "CRI-04", nameEn: "Phan", nameTh: "พาน" },
          { code: "CRI-05", nameEn: "Wiang Chai", nameTh: "เวียงชัย" },
        ],
      },
    ],
  },
  {
    code: "NORTHEAST",
    nameEn: "Northeastern Thailand (Isan)",
    nameTh: "ภาคตะวันออกเฉียงเหนือ (อีสาน)",
    provinces: [
      {
        code: "KKN",
        nameEn: "Khon Kaen",
        nameTh: "ขอนแก่น",
        districts: [
          { code: "KKN-01", nameEn: "Mueang Khon Kaen", nameTh: "เมืองขอนแก่น" },
          { code: "KKN-02", nameEn: "Ban Phai", nameTh: "บ้านไผ่" },
          { code: "KKN-03", nameEn: "Chum Phae", nameTh: "ชุมแพ" },
          { code: "KKN-04", nameEn: "Nam Phong", nameTh: "น้ำพอง" },
        ],
      },
      {
        code: "UBN",
        nameEn: "Ubon Ratchathani",
        nameTh: "อุบลราชธานี",
        districts: [
          { code: "UBN-01", nameEn: "Mueang Ubon Ratchathani", nameTh: "เมืองอุบลราชธานี" },
          { code: "UBN-02", nameEn: "Det Udom", nameTh: "เดชอุดม" },
          { code: "UBN-03", nameEn: "Warin Chamrap", nameTh: "วารินชำราบ" },
        ],
      },
    ],
  },
  {
    code: "EAST",
    nameEn: "Eastern Thailand",
    nameTh: "ภาคตะวันออก",
    provinces: [
      {
        code: "CBI",
        nameEn: "Chonburi",
        nameTh: "ชลบุรี",
        districts: [
          { code: "CBI-01", nameEn: "Mueang Chonburi", nameTh: "เมืองชลบุรี" },
          { code: "CBI-02", nameEn: "Bang Lamung (Pattaya)", nameTh: "บางละมุง (พัทยา)" },
          { code: "CBI-03", nameEn: "Phan Thong", nameTh: "พานทอง" },
          { code: "CBI-04", nameEn: "Si Racha", nameTh: "ศรีราชา" },
        ],
      },
      {
        code: "RYG",
        nameEn: "Rayong",
        nameTh: "ระยอง",
        districts: [
          { code: "RYG-01", nameEn: "Mueang Rayong", nameTh: "เมืองระยอง" },
          { code: "RYG-02", nameEn: "Ban Chang", nameTh: "บ้านฉาง" },
          { code: "RYG-03", nameEn: "Klaeng", nameTh: "แกลง" },
        ],
      },
    ],
  },
  {
    code: "SOUTH",
    nameEn: "Southern Thailand",
    nameTh: "ภาคใต้",
    provinces: [
      {
        code: "PKT",
        nameEn: "Phuket",
        nameTh: "ภูเก็ต",
        districts: [
          { code: "PKT-01", nameEn: "Mueang Phuket", nameTh: "เมืองภูเก็ต" },
          { code: "PKT-02", nameEn: "Kathu", nameTh: "กะทู้" },
          { code: "PKT-03", nameEn: "Thalang", nameTh: "ถลาง" },
        ],
      },
      {
        code: "SKA",
        nameEn: "Surat Thani",
        nameTh: "สุราษฎร์ธานี",
        districts: [
          { code: "SKA-01", nameEn: "Mueang Surat Thani", nameTh: "เมืองสุราษฎร์ธานี" },
          { code: "SKA-02", nameEn: "Ko Samui", nameTh: "เกาะสมุย" },
          { code: "SKA-03", nameEn: "Ko Pha-ngan", nameTh: "เกาะพะงัน" },
        ],
      },
    ],
  },
];

/**
 * Helper function to get all districts across all provinces
 */
export function getAllDistricts(): ThailandDistrict[] {
  const districts: ThailandDistrict[] = [];
  for (const region of THAILAND_LOCATIONS) {
    for (const province of region.provinces) {
      districts.push(...province.districts);
    }
  }
  return districts;
}

/**
 * Helper function to get all provinces
 */
export function getAllProvinces(): ThailandProvince[] {
  const provinces: ThailandProvince[] = [];
  for (const region of THAILAND_LOCATIONS) {
    provinces.push(...region.provinces);
  }
  return provinces;
}

/**
 * Helper function to find district by code
 */
export function getDistrictByCode(code: string): ThailandDistrict | undefined {
  for (const region of THAILAND_LOCATIONS) {
    for (const province of region.provinces) {
      const district = province.districts.find(d => d.code === code);
      if (district) return district;
    }
  }
  return undefined;
}

/**
 * Helper function to find province by code
 */
export function getProvinceByCode(code: string): ThailandProvince | undefined {
  for (const region of THAILAND_LOCATIONS) {
    const province = region.provinces.find(p => p.code === code);
    if (province) return province;
  }
  return undefined;
}

/**
 * Helper function for fuzzy search (case-insensitive, partial match)
 */
export function searchDistricts(query: string): ThailandDistrict[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  const allDistricts = getAllDistricts();
  
  return allDistricts.filter(district => 
    district.nameEn.toLowerCase().includes(lowerQuery) ||
    district.nameTh.includes(query) || // Thai search (case-sensitive for Thai)
    district.code.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Helper function to get provinces by region
 */
export function getProvincesByRegion(regionCode: string): ThailandProvince[] {
  const region = THAILAND_LOCATIONS.find(r => r.code === regionCode);
  return region?.provinces || [];
}

/**
 * Helper function to get districts by province
 */
export function getDistrictsByProvince(provinceCode: string): ThailandDistrict[] {
  const province = getProvinceByCode(provinceCode);
  return province?.districts || [];
}

/**
 * Format district for display (with province context)
 */
export function formatDistrictDisplay(districtCode: string): string {
  for (const region of THAILAND_LOCATIONS) {
    for (const province of region.provinces) {
      const district = province.districts.find(d => d.code === districtCode);
      if (district) {
        return `${district.nameEn}, ${province.nameEn}`;
      }
    }
  }
  return districtCode;
}
