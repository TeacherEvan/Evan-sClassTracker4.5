/**
 * Thailand Location Data
 * 
 * Provides provinces, districts, and common areas for student location selection.
 * This data supports the duplicate detection system which requires at least 2
 * location fields (district, province, area) for provider-linked students.
 */

export interface Province {
  nameEn: string;
  nameTh: string;
  districts: District[];
}

export interface District {
  nameEn: string;
  nameTh: string;
  areas?: string[]; // Optional common areas/neighborhoods
}

/**
 * Major provinces in Thailand
 * Focus on major cities and educational centers where private tutoring is common
 */
export const THAILAND_PROVINCES: Province[] = [
  {
    nameEn: "Bangkok",
    nameTh: "กรุงเทพมหานคร",
    districts: [
      { nameEn: "Sathon", nameTh: "สาทร", areas: ["Silom", "Yen Akat", "Surawong"] },
      { nameEn: "Pathum Wan", nameTh: "ปทุมวัน", areas: ["Siam", "MBK", "Ratchathewi"] },
      { nameEn: "Watthana", nameTh: "วัฒนา", areas: ["Sukhumvit", "Thong Lo", "Ekkamai"] },
      { nameEn: "Khlong Toei", nameTh: "คลองเตย", areas: ["Asoke", "Rama IV", "Phra Khanong"] },
      { nameEn: "Bang Khen", nameTh: "บางเขน", areas: ["Lat Phrao", "Senanikom"] },
      { nameEn: "Huai Khwang", nameTh: "ห้วยขวาง", areas: ["Ratchada", "Din Daeng"] },
      { nameEn: "Phaya Thai", nameTh: "พญาไท", areas: ["Victory Monument", "Ari"] },
      { nameEn: "Bang Rak", nameTh: "บางรัก", areas: ["Sathorn", "Si Phraya"] },
      { nameEn: "Lat Krabang", nameTh: "ลาดกระบัง", areas: ["Suvarnabhumi Airport Area"] },
      { nameEn: "Bang Na", nameTh: "บางนา", areas: ["Mega Bangna", "Bearing"] },
    ],
  },
  {
    nameEn: "Chiang Mai",
    nameTh: "เชียงใหม่",
    districts: [
      { nameEn: "Mueang Chiang Mai", nameTh: "เมืองเชียงใหม่", areas: ["Old City", "Nimman", "Chang Phueak"] },
      { nameEn: "Hang Dong", nameTh: "หางดง" },
      { nameEn: "San Sai", nameTh: "สันทราย" },
      { nameEn: "Saraphi", nameTh: "สารภี" },
    ],
  },
  {
    nameEn: "Phuket",
    nameTh: "ภูเก็ต",
    districts: [
      { nameEn: "Mueang Phuket", nameTh: "เมืองภูเก็ต", areas: ["Patong", "Phuket Town", "Kata", "Karon"] },
      { nameEn: "Kathu", nameTh: "กะทู้" },
      { nameEn: "Thalang", nameTh: "ถลาง" },
    ],
  },
  {
    nameEn: "Nonthaburi",
    nameTh: "นนทบุรี",
    districts: [
      { nameEn: "Mueang Nonthaburi", nameTh: "เมืองนนทบุรี" },
      { nameEn: "Bang Yai", nameTh: "บางใหญ่" },
      { nameEn: "Pak Kret", nameTh: "ปากเกร็ด" },
    ],
  },
  {
    nameEn: "Samut Prakan",
    nameTh: "สมุทรปราการ",
    districts: [
      { nameEn: "Mueang Samut Prakan", nameTh: "เมืองสมุทรปราการ" },
      { nameEn: "Bang Phli", nameTh: "บางพลี" },
      { nameEn: "Phra Pradaeng", nameTh: "พระประแดง" },
    ],
  },
  {
    nameEn: "Khon Kaen",
    nameTh: "ขอนแก่น",
    districts: [
      { nameEn: "Mueang Khon Kaen", nameTh: "เมืองขอนแก่น" },
      { nameEn: "Ban Phai", nameTh: "บ้านไผ่" },
    ],
  },
  {
    nameEn: "Chonburi",
    nameTh: "ชลบุรี",
    districts: [
      { nameEn: "Mueang Chonburi", nameTh: "เมืองชลบุรี" },
      { nameEn: "Pattaya", nameTh: "พัทยา", areas: ["North Pattaya", "Central Pattaya", "Jomtien"] },
      { nameEn: "Si Racha", nameTh: "ศรีราชา" },
    ],
  },
  {
    nameEn: "Rayong",
    nameTh: "ระยอง",
    districts: [
      { nameEn: "Mueang Rayong", nameTh: "เมืองระยอง" },
      { nameEn: "Ban Chang", nameTh: "บ้านฉาง" },
    ],
  },
];

/**
 * Get districts for a specific province (by English or Thai name)
 */
export function getDistricts(provinceName: string): District[] {
  const province = THAILAND_PROVINCES.find(
    (p) => p.nameEn === provinceName || p.nameTh === provinceName
  );
  return province?.districts || [];
}

/**
 * Get areas for a specific district (by English or Thai name)
 */
export function getAreas(districtName: string): string[] {
  for (const province of THAILAND_PROVINCES) {
    const district = province.districts.find(
      (d) => d.nameEn === districtName || d.nameTh === districtName
    );
    if (district?.areas) {
      return district.areas;
    }
  }
  return [];
}

/**
 * Find province for a given district name
 */
export function getProvinceForDistrict(districtName: string): Province | undefined {
  return THAILAND_PROVINCES.find((p) =>
    p.districts.some((d) => d.nameEn === districtName || d.nameTh === districtName)
  );
}
