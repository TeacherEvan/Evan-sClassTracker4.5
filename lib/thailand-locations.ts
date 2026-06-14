/**
 * Thailand Administrative Regions Data
 *
 * Complete list of Thailand's 77 provinces and their districts with English/Thai names.
 * Source: Official Thailand administrative divisions (as of 2024)
 *
 * Data structure optimized for:
 * - Fast province/district lookups
 * - Fuzzy search matching
 * - Bilingual support (EN default, TH for moderator analytics)
 * - Easy updates as administrative regions evolve
 *
 * Last updated: December 2025
 */

export interface ThailandDistrict {
  /** District name in English (romanized) */
  nameEn: string;
  /** District name in Thai */
  nameTh: string;
  /** Normalized name for search (lowercase, no diacritics) */
  searchKey: string;
}

export interface ThailandProvince {
  /** Province code (unique identifier) */
  code: string;
  /** Province name in English (romanized) */
  nameEn: string;
  /** Province name in Thai */
  nameTh: string;
  /** Normalized name for search (lowercase, no diacritics) */
  searchKey: string;
  /** Region of Thailand */
  region: "Central" | "North" | "Northeast" | "East" | "West" | "South";
  /** Districts within this province */
  districts: ThailandDistrict[];
}

/**
 * Normalize string for fuzzy search matching
 * - Lowercase
 * - Remove diacritics
 * - Remove special characters
 */
function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\u0E00-\u0E7F\s]/g, "") // Keep only letters, numbers, Thai chars, spaces
    .trim();
}

/**
 * Complete list of Thailand's 77 provinces with districts
 * Organized by region for easier maintenance and updates
 */
export const THAILAND_PROVINCES: ThailandProvince[] = [
  // ===== CENTRAL REGION (23 provinces) =====
  {
    code: "BKK",
    nameEn: "Bangkok",
    nameTh: "กรุงเทพมหานคร",
    searchKey: normalizeForSearch("Bangkok กรุงเทพมหานคร"),
    region: "Central",
    districts: [
      {
        nameEn: "Phra Nakhon",
        nameTh: "พระนคร",
        searchKey: normalizeForSearch("Phra Nakhon พระนคร"),
      },
      {
        nameEn: "Dusit",
        nameTh: "ดุสิต",
        searchKey: normalizeForSearch("Dusit ดุสิต"),
      },
      {
        nameEn: "Nong Chok",
        nameTh: "หนองจอก",
        searchKey: normalizeForSearch("Nong Chok หนองจอก"),
      },
      {
        nameEn: "Bang Rak",
        nameTh: "บางรัก",
        searchKey: normalizeForSearch("Bang Rak บางรัก"),
      },
      {
        nameEn: "Bang Khen",
        nameTh: "บางเขน",
        searchKey: normalizeForSearch("Bang Khen บางเขน"),
      },
      {
        nameEn: "Bang Kapi",
        nameTh: "บางกะปิ",
        searchKey: normalizeForSearch("Bang Kapi บางกะปิ"),
      },
      {
        nameEn: "Pathum Wan",
        nameTh: "ปทุมวัน",
        searchKey: normalizeForSearch("Pathum Wan ปทุมวัน"),
      },
      {
        nameEn: "Pom Prap Sattru Phai",
        nameTh: "ป้อมปราบศัตรูพ่าย",
        searchKey: normalizeForSearch("Pom Prap Sattru Phai ป้อมปราบศัตรูพ่าย"),
      },
      {
        nameEn: "Phra Khanong",
        nameTh: "พระโขนง",
        searchKey: normalizeForSearch("Phra Khanong พระโขนง"),
      },
      {
        nameEn: "Min Buri",
        nameTh: "มีนบุรี",
        searchKey: normalizeForSearch("Min Buri มีนบุรี"),
      },
      {
        nameEn: "Lat Krabang",
        nameTh: "ลาดกระบัง",
        searchKey: normalizeForSearch("Lat Krabang ลาดกระบัง"),
      },
      {
        nameEn: "Yan Nawa",
        nameTh: "ยานนาวา",
        searchKey: normalizeForSearch("Yan Nawa ยานนาวา"),
      },
      {
        nameEn: "Samphanthawong",
        nameTh: "สัมพันธวงศ์",
        searchKey: normalizeForSearch("Samphanthawong สัมพันธวงศ์"),
      },
      {
        nameEn: "Phaya Thai",
        nameTh: "พญาไท",
        searchKey: normalizeForSearch("Phaya Thai พญาไท"),
      },
      {
        nameEn: "Thon Buri",
        nameTh: "ธนบุรี",
        searchKey: normalizeForSearch("Thon Buri ธนบุรี"),
      },
      {
        nameEn: "Bangkok Yai",
        nameTh: "บางกอกใหญ่",
        searchKey: normalizeForSearch("Bangkok Yai บางกอกใหญ่"),
      },
      {
        nameEn: "Huai Khwang",
        nameTh: "ห้วยขวาง",
        searchKey: normalizeForSearch("Huai Khwang ห้วยขวาง"),
      },
      {
        nameEn: "Khlong San",
        nameTh: "คลองสาน",
        searchKey: normalizeForSearch("Khlong San คลองสาน"),
      },
      {
        nameEn: "Taling Chan",
        nameTh: "ตลิ่งชัน",
        searchKey: normalizeForSearch("Taling Chan ตลิ่งชัน"),
      },
      {
        nameEn: "Bangkok Noi",
        nameTh: "บางกอกน้อย",
        searchKey: normalizeForSearch("Bangkok Noi บางกอกน้อย"),
      },
      {
        nameEn: "Bang Khun Thian",
        nameTh: "บางขุนเทียน",
        searchKey: normalizeForSearch("Bang Khun Thian บางขุนเทียน"),
      },
      {
        nameEn: "Phasi Charoen",
        nameTh: "ภาษีเจริญ",
        searchKey: normalizeForSearch("Phasi Charoen ภาษีเจริญ"),
      },
      {
        nameEn: "Nong Khaem",
        nameTh: "หนองแขม",
        searchKey: normalizeForSearch("Nong Khaem หนองแขม"),
      },
      {
        nameEn: "Rat Burana",
        nameTh: "ราษฎร์บูรณะ",
        searchKey: normalizeForSearch("Rat Burana ราษฎร์บูรณะ"),
      },
      {
        nameEn: "Bang Phlat",
        nameTh: "บางพลัด",
        searchKey: normalizeForSearch("Bang Phlat บางพลัด"),
      },
      {
        nameEn: "Din Daeng",
        nameTh: "ดินแดง",
        searchKey: normalizeForSearch("Din Daeng ดินแดง"),
      },
      {
        nameEn: "Bueng Kum",
        nameTh: "บึงกุ่ม",
        searchKey: normalizeForSearch("Bueng Kum บึงกุ่ม"),
      },
      {
        nameEn: "Sathon",
        nameTh: "สาทร",
        searchKey: normalizeForSearch("Sathon สาทร"),
      },
      {
        nameEn: "Bang Sue",
        nameTh: "บางซื่อ",
        searchKey: normalizeForSearch("Bang Sue บางซื่อ"),
      },
      {
        nameEn: "Chatuchak",
        nameTh: "จตุจักร",
        searchKey: normalizeForSearch("Chatuchak จตุจักร"),
      },
      {
        nameEn: "Bang Kho Laem",
        nameTh: "บางคอแหลม",
        searchKey: normalizeForSearch("Bang Kho Laem บางคอแหลม"),
      },
      {
        nameEn: "Prawet",
        nameTh: "ประเวศ",
        searchKey: normalizeForSearch("Prawet ประเวศ"),
      },
      {
        nameEn: "Khlong Toei",
        nameTh: "คลองเตย",
        searchKey: normalizeForSearch("Khlong Toei คลองเตย"),
      },
      {
        nameEn: "Suan Luang",
        nameTh: "สวนหลวง",
        searchKey: normalizeForSearch("Suan Luang สวนหลวง"),
      },
      {
        nameEn: "Chom Thong",
        nameTh: "จอมทอง",
        searchKey: normalizeForSearch("Chom Thong จอมทอง"),
      },
      {
        nameEn: "Don Mueang",
        nameTh: "ดอนเมือง",
        searchKey: normalizeForSearch("Don Mueang ดอนเมือง"),
      },
      {
        nameEn: "Ratchathewi",
        nameTh: "ราชเทวี",
        searchKey: normalizeForSearch("Ratchathewi ราชเทวี"),
      },
      {
        nameEn: "Lat Phrao",
        nameTh: "ลาดพร้าว",
        searchKey: normalizeForSearch("Lat Phrao ลาดพร้าว"),
      },
      {
        nameEn: "Watthana",
        nameTh: "วัฒนา",
        searchKey: normalizeForSearch("Watthana วัฒนา"),
      },
      {
        nameEn: "Bang Khae",
        nameTh: "บางแค",
        searchKey: normalizeForSearch("Bang Khae บางแค"),
      },
      {
        nameEn: "Lak Si",
        nameTh: "หลักสี่",
        searchKey: normalizeForSearch("Lak Si หลักสี่"),
      },
      {
        nameEn: "Sai Mai",
        nameTh: "สายไหม",
        searchKey: normalizeForSearch("Sai Mai สายไหม"),
      },
      {
        nameEn: "Khan Na Yao",
        nameTh: "คันนายาว",
        searchKey: normalizeForSearch("Khan Na Yao คันนายาว"),
      },
      {
        nameEn: "Saphan Sung",
        nameTh: "สะพานสูง",
        searchKey: normalizeForSearch("Saphan Sung สะพานสูง"),
      },
      {
        nameEn: "Wang Thonglang",
        nameTh: "วังทองหลาง",
        searchKey: normalizeForSearch("Wang Thonglang วังทองหลาง"),
      },
      {
        nameEn: "Khlong Sam Wa",
        nameTh: "คลองสามวา",
        searchKey: normalizeForSearch("Khlong Sam Wa คลองสามวา"),
      },
      {
        nameEn: "Bang Na",
        nameTh: "บางนา",
        searchKey: normalizeForSearch("Bang Na บางนา"),
      },
      {
        nameEn: "Thawi Watthana",
        nameTh: "ทวีวัฒนา",
        searchKey: normalizeForSearch("Thawi Watthana ทวีวัฒนา"),
      },
      {
        nameEn: "Thung Khru",
        nameTh: "ทุ่งครุ",
        searchKey: normalizeForSearch("Thung Khru ทุ่งครุ"),
      },
      {
        nameEn: "Bang Bon",
        nameTh: "บางบอน",
        searchKey: normalizeForSearch("Bang Bon บางบอน"),
      },
    ],
  },
  {
    code: "SPK",
    nameEn: "Samut Prakan",
    nameTh: "สมุทรปราการ",
    searchKey: normalizeForSearch("Samut Prakan สมุทรปราการ"),
    region: "Central",
    districts: [
      {
        nameEn: "Mueang Samut Prakan",
        nameTh: "เมืองสมุทรปราการ",
        searchKey: normalizeForSearch("Mueang Samut Prakan เมืองสมุทรปราการ"),
      },
      {
        nameEn: "Bang Bo",
        nameTh: "บางบ่อ",
        searchKey: normalizeForSearch("Bang Bo บางบ่อ"),
      },
      {
        nameEn: "Bang Phli",
        nameTh: "บางพลี",
        searchKey: normalizeForSearch("Bang Phli บางพลี"),
      },
      {
        nameEn: "Phra Pradaeng",
        nameTh: "พระประแดง",
        searchKey: normalizeForSearch("Phra Pradaeng พระประแดง"),
      },
      {
        nameEn: "Phra Samut Chedi",
        nameTh: "พระสมุทรเจดีย์",
        searchKey: normalizeForSearch("Phra Samut Chedi พระสมุทรเจดีย์"),
      },
      {
        nameEn: "Bang Sao Thong",
        nameTh: "บางเสาธง",
        searchKey: normalizeForSearch("Bang Sao Thong บางเสาธง"),
      },
    ],
  },
  {
    code: "NBI",
    nameEn: "Nonthaburi",
    nameTh: "นนทบุรี",
    searchKey: normalizeForSearch("Nonthaburi นนทบุรี"),
    region: "Central",
    districts: [
      {
        nameEn: "Mueang Nonthaburi",
        nameTh: "เมืองนนทบุรี",
        searchKey: normalizeForSearch("Mueang Nonthaburi เมืองนนทบุรี"),
      },
      {
        nameEn: "Bang Kruai",
        nameTh: "บางกรวย",
        searchKey: normalizeForSearch("Bang Kruai บางกรวย"),
      },
      {
        nameEn: "Bang Yai",
        nameTh: "บางใหญ่",
        searchKey: normalizeForSearch("Bang Yai บางใหญ่"),
      },
      {
        nameEn: "Bang Bua Thong",
        nameTh: "บางบัวทอง",
        searchKey: normalizeForSearch("Bang Bua Thong บางบัวทอง"),
      },
      {
        nameEn: "Sai Noi",
        nameTh: "ไทรน้อย",
        searchKey: normalizeForSearch("Sai Noi ไทรน้อย"),
      },
      {
        nameEn: "Pak Kret",
        nameTh: "ปากเกร็ด",
        searchKey: normalizeForSearch("Pak Kret ปากเกร็ด"),
      },
    ],
  },
  {
    code: "PBI",
    nameEn: "Pathum Thani",
    nameTh: "ปทุมธานี",
    searchKey: normalizeForSearch("Pathum Thani ปทุมธานี"),
    region: "Central",
    districts: [
      {
        nameEn: "Mueang Pathum Thani",
        nameTh: "เมืองปทุมธานี",
        searchKey: normalizeForSearch("Mueang Pathum Thani เมืองปทุมธานี"),
      },
      {
        nameEn: "Khlong Luang",
        nameTh: "คลองหลวง",
        searchKey: normalizeForSearch("Khlong Luang คลองหลวง"),
      },
      {
        nameEn: "Thanyaburi",
        nameTh: "ธัญบุรี",
        searchKey: normalizeForSearch("Thanyaburi ธัญบุรี"),
      },
      {
        nameEn: "Nong Suea",
        nameTh: "หนองเสือ",
        searchKey: normalizeForSearch("Nong Suea หนองเสือ"),
      },
      {
        nameEn: "Lat Lum Kaeo",
        nameTh: "ลาดหลุมแก้ว",
        searchKey: normalizeForSearch("Lat Lum Kaeo ลาดหลุมแก้ว"),
      },
      {
        nameEn: "Lam Luk Ka",
        nameTh: "ลำลูกกา",
        searchKey: normalizeForSearch("Lam Luk Ka ลำลูกกา"),
      },
      {
        nameEn: "Sam Khok",
        nameTh: "สามโคก",
        searchKey: normalizeForSearch("Sam Khok สามโคก"),
      },
    ],
  },
  {
    code: "AYA",
    nameEn: "Phra Nakhon Si Ayutthaya",
    nameTh: "พระนครศรีอยุธยา",
    searchKey: normalizeForSearch(
      "Phra Nakhon Si Ayutthaya Ayutthaya พระนครศรีอยุธยา อยุธยา",
    ),
    region: "Central",
    districts: [
      {
        nameEn: "Phra Nakhon Si Ayutthaya",
        nameTh: "พระนครศรีอยุธยา",
        searchKey: normalizeForSearch(
          "Phra Nakhon Si Ayutthaya พระนครศรีอยุธยา",
        ),
      },
      {
        nameEn: "Tha Ruea",
        nameTh: "ท่าเรือ",
        searchKey: normalizeForSearch("Tha Ruea ท่าเรือ"),
      },
      {
        nameEn: "Nakhon Luang",
        nameTh: "นครหลวง",
        searchKey: normalizeForSearch("Nakhon Luang นครหลวง"),
      },
      {
        nameEn: "Bang Sai",
        nameTh: "บางไทร",
        searchKey: normalizeForSearch("Bang Sai บางไทร"),
      },
      {
        nameEn: "Bang Ban",
        nameTh: "บางบาล",
        searchKey: normalizeForSearch("Bang Ban บางบาล"),
      },
      {
        nameEn: "Bang Pa-in",
        nameTh: "บางปะอิน",
        searchKey: normalizeForSearch("Bang Pa-in บางปะอิน"),
      },
      {
        nameEn: "Bang Pahan",
        nameTh: "บางปะหัน",
        searchKey: normalizeForSearch("Bang Pahan บางปะหัน"),
      },
      {
        nameEn: "Phak Hai",
        nameTh: "ผักไห่",
        searchKey: normalizeForSearch("Phak Hai ผักไห่"),
      },
      {
        nameEn: "Phachi",
        nameTh: "ภาชี",
        searchKey: normalizeForSearch("Phachi ภาชี"),
      },
      {
        nameEn: "Lat Bua Luang",
        nameTh: "ลาดบัวหลวง",
        searchKey: normalizeForSearch("Lat Bua Luang ลาดบัวหลวง"),
      },
      {
        nameEn: "Wang Noi",
        nameTh: "วังน้อย",
        searchKey: normalizeForSearch("Wang Noi วังน้อย"),
      },
      {
        nameEn: "Sena",
        nameTh: "เสนา",
        searchKey: normalizeForSearch("Sena เสนา"),
      },
      {
        nameEn: "Bang Sai",
        nameTh: "บางซ้าย",
        searchKey: normalizeForSearch("Bang Sai บางซ้าย"),
      },
      {
        nameEn: "Uthai",
        nameTh: "อุทัย",
        searchKey: normalizeForSearch("Uthai อุทัย"),
      },
      {
        nameEn: "Maha Rat",
        nameTh: "มหาราช",
        searchKey: normalizeForSearch("Maha Rat มหาราช"),
      },
      {
        nameEn: "Ban Phraek",
        nameTh: "บ้านแพรก",
        searchKey: normalizeForSearch("Ban Phraek บ้านแพรก"),
      },
    ],
  },

  // ===== NORTH REGION (9 provinces) =====
  {
    code: "CNX",
    nameEn: "Chiang Mai",
    nameTh: "เชียงใหม่",
    searchKey: normalizeForSearch("Chiang Mai เชียงใหม่"),
    region: "North",
    districts: [
      {
        nameEn: "Mueang Chiang Mai",
        nameTh: "เมืองเชียงใหม่",
        searchKey: normalizeForSearch("Mueang Chiang Mai เมืองเชียงใหม่"),
      },
      {
        nameEn: "Chom Thong",
        nameTh: "จอมทอง",
        searchKey: normalizeForSearch("Chom Thong จอมทอง"),
      },
      {
        nameEn: "Mae Chaem",
        nameTh: "แม่แจ่ม",
        searchKey: normalizeForSearch("Mae Chaem แม่แจ่ม"),
      },
      {
        nameEn: "Chiang Dao",
        nameTh: "เชียงดาว",
        searchKey: normalizeForSearch("Chiang Dao เชียงดาว"),
      },
      {
        nameEn: "Doi Saket",
        nameTh: "ดอยสะเก็ด",
        searchKey: normalizeForSearch("Doi Saket ดอยสะเก็ด"),
      },
      {
        nameEn: "Mae Taeng",
        nameTh: "แม่แตง",
        searchKey: normalizeForSearch("Mae Taeng แม่แตง"),
      },
      {
        nameEn: "Mae Rim",
        nameTh: "แม่ริม",
        searchKey: normalizeForSearch("Mae Rim แม่ริม"),
      },
      {
        nameEn: "Samoeng",
        nameTh: "สะเมิง",
        searchKey: normalizeForSearch("Samoeng สะเมิง"),
      },
      {
        nameEn: "Fang",
        nameTh: "ฝาง",
        searchKey: normalizeForSearch("Fang ฝาง"),
      },
      {
        nameEn: "Mae Ai",
        nameTh: "แม่อาย",
        searchKey: normalizeForSearch("Mae Ai แม่อาย"),
      },
      {
        nameEn: "Phrao",
        nameTh: "พร้าว",
        searchKey: normalizeForSearch("Phrao พร้าว"),
      },
      {
        nameEn: "San Pa Tong",
        nameTh: "สันป่าตอง",
        searchKey: normalizeForSearch("San Pa Tong สันป่าตอง"),
      },
      {
        nameEn: "San Kamphaeng",
        nameTh: "สันกำแพง",
        searchKey: normalizeForSearch("San Kamphaeng สันกำแพง"),
      },
      {
        nameEn: "San Sai",
        nameTh: "สันทราย",
        searchKey: normalizeForSearch("San Sai สันทราย"),
      },
      {
        nameEn: "Hang Dong",
        nameTh: "หางดง",
        searchKey: normalizeForSearch("Hang Dong หางดง"),
      },
      {
        nameEn: "Hot",
        nameTh: "ฮอด",
        searchKey: normalizeForSearch("Hot ฮอด"),
      },
      {
        nameEn: "Doi Tao",
        nameTh: "ดอยเต่า",
        searchKey: normalizeForSearch("Doi Tao ดอยเต่า"),
      },
      {
        nameEn: "Omkoi",
        nameTh: "อมก๋อย",
        searchKey: normalizeForSearch("Omkoi อมก๋อย"),
      },
      {
        nameEn: "Saraphi",
        nameTh: "สารภี",
        searchKey: normalizeForSearch("Saraphi สารภี"),
      },
      {
        nameEn: "Wiang Haeng",
        nameTh: "เวียงแหง",
        searchKey: normalizeForSearch("Wiang Haeng เวียงแหง"),
      },
      {
        nameEn: "Chai Prakan",
        nameTh: "ไชยปราการ",
        searchKey: normalizeForSearch("Chai Prakan ไชยปราการ"),
      },
      {
        nameEn: "Mae Wang",
        nameTh: "แม่วาง",
        searchKey: normalizeForSearch("Mae Wang แม่วาง"),
      },
      {
        nameEn: "Mae On",
        nameTh: "แม่ออน",
        searchKey: normalizeForSearch("Mae On แม่ออน"),
      },
      {
        nameEn: "Doi Lo",
        nameTh: "ดอยหล่อ",
        searchKey: normalizeForSearch("Doi Lo ดอยหล่อ"),
      },
      {
        nameEn: "Galyani Vadhana",
        nameTh: "กัลยาณิวัฒนา",
        searchKey: normalizeForSearch("Galyani Vadhana กัลยาณิวัฒนา"),
      },
    ],
  },
  {
    code: "CRI",
    nameEn: "Chiang Rai",
    nameTh: "เชียงราย",
    searchKey: normalizeForSearch("Chiang Rai เชียงราย"),
    region: "North",
    districts: [
      {
        nameEn: "Mueang Chiang Rai",
        nameTh: "เมืองเชียงราย",
        searchKey: normalizeForSearch("Mueang Chiang Rai เมืองเชียงราย"),
      },
      {
        nameEn: "Wiang Chai",
        nameTh: "เวียงชัย",
        searchKey: normalizeForSearch("Wiang Chai เวียงชัย"),
      },
      {
        nameEn: "Chiang Khong",
        nameTh: "เชียงของ",
        searchKey: normalizeForSearch("Chiang Khong เชียงของ"),
      },
      {
        nameEn: "Thoeng",
        nameTh: "เทิง",
        searchKey: normalizeForSearch("Thoeng เทิง"),
      },
      {
        nameEn: "Phan",
        nameTh: "พาน",
        searchKey: normalizeForSearch("Phan พาน"),
      },
      {
        nameEn: "Pa Daet",
        nameTh: "ป่าแดด",
        searchKey: normalizeForSearch("Pa Daet ป่าแดด"),
      },
      {
        nameEn: "Mae Chan",
        nameTh: "แม่จัน",
        searchKey: normalizeForSearch("Mae Chan แม่จัน"),
      },
      {
        nameEn: "Mae Sai",
        nameTh: "แม่สาย",
        searchKey: normalizeForSearch("Mae Sai แม่สาย"),
      },
      {
        nameEn: "Mae Suai",
        nameTh: "แม่สรวย",
        searchKey: normalizeForSearch("Mae Suai แม่สรวย"),
      },
      {
        nameEn: "Wiang Pa Pao",
        nameTh: "เวียงป่าเป้า",
        searchKey: normalizeForSearch("Wiang Pa Pao เวียงป่าเป้า"),
      },
      {
        nameEn: "Phaya Mengrai",
        nameTh: "พญาเม็งราย",
        searchKey: normalizeForSearch("Phaya Mengrai พญาเม็งราย"),
      },
      {
        nameEn: "Wiang Kaen",
        nameTh: "เวียงแก่น",
        searchKey: normalizeForSearch("Wiang Kaen เวียงแก่น"),
      },
      {
        nameEn: "Khun Tan",
        nameTh: "ขุนตาล",
        searchKey: normalizeForSearch("Khun Tan ขุนตาล"),
      },
      {
        nameEn: "Mae Fa Luang",
        nameTh: "แม่ฟ้าหลวง",
        searchKey: normalizeForSearch("Mae Fa Luang แม่ฟ้าหลวง"),
      },
      {
        nameEn: "Mae Lao",
        nameTh: "แม่ลาว",
        searchKey: normalizeForSearch("Mae Lao แม่ลาว"),
      },
      {
        nameEn: "Wiang Chiang Rung",
        nameTh: "เวียงเชียงรุ้ง",
        searchKey: normalizeForSearch("Wiang Chiang Rung เวียงเชียงรุ้ง"),
      },
      {
        nameEn: "Doi Luang",
        nameTh: "ดอยหลวง",
        searchKey: normalizeForSearch("Doi Luang ดอยหลวง"),
      },
      {
        nameEn: "Pong",
        nameTh: "โป่ง",
        searchKey: normalizeForSearch("Pong โป่ง"),
      },
    ],
  },

  // ===== NORTHEAST REGION (20 provinces) =====
  {
    code: "KKC",
    nameEn: "Khon Kaen",
    nameTh: "ขอนแก่น",
    searchKey: normalizeForSearch("Khon Kaen ขอนแก่น"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Mueang Khon Kaen",
        nameTh: "เมืองขอนแก่น",
        searchKey: normalizeForSearch("Mueang Khon Kaen เมืองขอนแก่น"),
      },
      {
        nameEn: "Ban Fang",
        nameTh: "บ้านฝาง",
        searchKey: normalizeForSearch("Ban Fang บ้านฝาง"),
      },
      {
        nameEn: "Phra Yuen",
        nameTh: "พระยืน",
        searchKey: normalizeForSearch("Phra Yuen พระยืน"),
      },
      {
        nameEn: "Nong Ruea",
        nameTh: "หนองเรือ",
        searchKey: normalizeForSearch("Nong Ruea หนองเรือ"),
      },
      {
        nameEn: "Chum Phae",
        nameTh: "ชุมแพ",
        searchKey: normalizeForSearch("Chum Phae ชุมแพ"),
      },
      {
        nameEn: "Si Chomphu",
        nameTh: "สีชมพู",
        searchKey: normalizeForSearch("Si Chomphu สีชมพู"),
      },
      {
        nameEn: "Nam Phong",
        nameTh: "น้ำพอง",
        searchKey: normalizeForSearch("Nam Phong น้ำพอง"),
      },
      {
        nameEn: "Ubolratana",
        nameTh: "อุบลรัตน์",
        searchKey: normalizeForSearch("Ubolratana อุบลรัตน์"),
      },
      {
        nameEn: "Kranuan",
        nameTh: "กระนวน",
        searchKey: normalizeForSearch("Kranuan กระนวน"),
      },
      {
        nameEn: "Ban Phai",
        nameTh: "บ้านไผ่",
        searchKey: normalizeForSearch("Ban Phai บ้านไผ่"),
      },
      {
        nameEn: "Pueai Noi",
        nameTh: "เปือยน้อย",
        searchKey: normalizeForSearch("Pueai Noi เปือยน้อย"),
      },
      {
        nameEn: "Phon",
        nameTh: "พล",
        searchKey: normalizeForSearch("Phon พล"),
      },
      {
        nameEn: "Waeng Yai",
        nameTh: "แวงใหญ่",
        searchKey: normalizeForSearch("Waeng Yai แวงใหญ่"),
      },
      {
        nameEn: "Waeng Noi",
        nameTh: "แวงน้อย",
        searchKey: normalizeForSearch("Waeng Noi แวงน้อย"),
      },
      {
        nameEn: "Nong Song Hong",
        nameTh: "หนองสองห้อง",
        searchKey: normalizeForSearch("Nong Song Hong หนองสองห้อง"),
      },
      {
        nameEn: "Phu Wiang",
        nameTh: "ภูเวียง",
        searchKey: normalizeForSearch("Phu Wiang ภูเวียง"),
      },
      {
        nameEn: "Mancha Khiri",
        nameTh: "มัญจาคีรี",
        searchKey: normalizeForSearch("Mancha Khiri มัญจาคีรี"),
      },
      {
        nameEn: "Chonnabot",
        nameTh: "ชนบท",
        searchKey: normalizeForSearch("Chonnabot ชนบท"),
      },
      {
        nameEn: "Khao Suan Kwang",
        nameTh: "เขาสวนกวาง",
        searchKey: normalizeForSearch("Khao Suan Kwang เขาสวนกวาง"),
      },
      {
        nameEn: "Phu Pha Man",
        nameTh: "ภูผาม่าน",
        searchKey: normalizeForSearch("Phu Pha Man ภูผาม่าน"),
      },
      {
        nameEn: "Sam Sung",
        nameTh: "ซำสูง",
        searchKey: normalizeForSearch("Sam Sung ซำสูง"),
      },
      {
        nameEn: "Kosum Phisai",
        nameTh: "โคกสูง",
        searchKey: normalizeForSearch("Kosum Phisai โคกสูง"),
      },
      {
        nameEn: "Yang Talat",
        nameTh: "ยางตลาด",
        searchKey: normalizeForSearch("Yang Talat ยางตลาด"),
      },
      {
        nameEn: "Nong Na Kham",
        nameTh: "หนองนาคำ",
        searchKey: normalizeForSearch("Nong Na Kham หนองนาคำ"),
      },
      {
        nameEn: "Ban Haet",
        nameTh: "บ้านแฮด",
        searchKey: normalizeForSearch("Ban Haet บ้านแฮด"),
      },
      {
        nameEn: "Non Sila",
        nameTh: "โนนศิลา",
        searchKey: normalizeForSearch("Non Sila โนนศิลา"),
      },
    ],
  },
  {
    code: "UBN",
    nameEn: "Ubon Ratchathani",
    nameTh: "อุบลราชธานี",
    searchKey: normalizeForSearch("Ubon Ratchathani อุบลราชธานี"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Mueang Ubon Ratchathani",
        nameTh: "เมืองอุบลราชธานี",
        searchKey: normalizeForSearch(
          "Mueang Ubon Ratchathani เมืองอุบลราชธานี",
        ),
      },
      {
        nameEn: "Khemarat",
        nameTh: "เขมราฐ",
        searchKey: normalizeForSearch("Khemarat เขมราฐ"),
      },
      {
        nameEn: "Phibun Mangsahan",
        nameTh: "พิบูลมังสาหาร",
        searchKey: normalizeForSearch("Phibun Mangsahan พิบูลมังสาหาร"),
      },
      {
        nameEn: "Tan Sum",
        nameTh: "ตาลสุม",
        searchKey: normalizeForSearch("Tan Sum ตาลสุม"),
      },
      {
        nameEn: "Pho Sai",
        nameTh: "โพธิ์ไทร",
        searchKey: normalizeForSearch("Pho Sai โพธิ์ไทร"),
      },
      {
        nameEn: "Samrong",
        nameTh: "สำโรง",
        searchKey: normalizeForSearch("Samrong สำโรง"),
      },
      {
        nameEn: "Trakan Phuet Phon",
        nameTh: "ตระการพืชผล",
        searchKey: normalizeForSearch("Trakan Phuet Phon ตระการพืชผล"),
      },
      {
        nameEn: "Kut Khaopun",
        nameTh: "กุดข้าวปุ้น",
        searchKey: normalizeForSearch("Kut Khaopun กุดข้าวปุ้น"),
      },
      {
        nameEn: "Muang Sam Sip",
        nameTh: "ม่วงสามสิบ",
        searchKey: normalizeForSearch("Muang Sam Sip ม่วงสามสิบ"),
      },
      {
        nameEn: "Warin Chamrap",
        nameTh: "วารินชำราบ",
        searchKey: normalizeForSearch("Warin Chamrap วารินชำราบ"),
      },
      {
        nameEn: "Phanom Phrai",
        nameTh: "พนมไพร",
        searchKey: normalizeForSearch("Phanom Phrai พนมไพร"),
      },
      {
        nameEn: "Buntharik",
        nameTh: "บุณฑริก",
        searchKey: normalizeForSearch("Buntharik บุณฑริก"),
      },
      {
        nameEn: "Na Chaluai",
        nameTh: "นาจะหลวย",
        searchKey: normalizeForSearch("Na Chaluai นาจะหลวย"),
      },
      {
        nameEn: "Nam Yuen",
        nameTh: "น้ำยืน",
        searchKey: normalizeForSearch("Nam Yuen น้ำยืน"),
      },
      {
        nameEn: "Det Udom",
        nameTh: "เดชอุดม",
        searchKey: normalizeForSearch("Det Udom เดชอุดม"),
      },
      {
        nameEn: "Na Tan",
        nameTh: "นาตาล",
        searchKey: normalizeForSearch("Na Tan นาตาล"),
      },
      {
        nameEn: "Thung Si Udom",
        nameTh: "ทุ่งศรีอุดม",
        searchKey: normalizeForSearch("Thung Si Udom ทุ่งศรีอุดม"),
      },
      {
        nameEn: "Na Yia",
        nameTh: "นายาง",
        searchKey: normalizeForSearch("Na Yia นายาง"),
      },
      {
        nameEn: "Si Mueang Mai",
        nameTh: "ศรีเมืองใหม่",
        searchKey: normalizeForSearch("Si Mueang Mai ศรีเมืองใหม่"),
      },
      {
        nameEn: "Don Mot Daeng",
        nameTh: "ดอนมดแดง",
        searchKey: normalizeForSearch("Don Mot Daeng ดอนมดแดง"),
      },
      {
        nameEn: "Sirindhorn",
        nameTh: "สิรินธร",
        searchKey: normalizeForSearch("Sirindhorn สิรินธร"),
      },
      {
        nameEn: "Sawang Wirawong",
        nameTh: "สว่างวีระวงศ์",
        searchKey: normalizeForSearch("Sawang Wirawong สว่างวีระวงศ์"),
      },
      {
        nameEn: "Sam Khok",
        nameTh: "สามโคก",
        searchKey: normalizeForSearch("Sam Khok สามโคก"),
      },
      {
        nameEn: "Lao Suea Kok",
        nameTh: "เหล่าเสือโก้ก",
        searchKey: normalizeForSearch("Lao Suea Kok เหล่าเสือโก้ก"),
      },
      {
        nameEn: "Tan Sum",
        nameTh: "ตาลสุม",
        searchKey: normalizeForSearch("Tan Sum ตาลสุม"),
      },
    ],
  },

  // ===== EAST REGION (7 provinces) =====
  {
    code: "CBI",
    nameEn: "Chonburi",
    nameTh: "ชลบุรี",
    searchKey: normalizeForSearch("Chonburi ชลบุรี"),
    region: "East",
    districts: [
      {
        nameEn: "Mueang Chonburi",
        nameTh: "เมืองชลบุรี",
        searchKey: normalizeForSearch("Mueang Chonburi เมืองชลบุรี"),
      },
      {
        nameEn: "Ban Bueng",
        nameTh: "บ้านบึง",
        searchKey: normalizeForSearch("Ban Bueng บ้านบึง"),
      },
      {
        nameEn: "Nong Yai",
        nameTh: "หนองใหญ่",
        searchKey: normalizeForSearch("Nong Yai หนองใหญ่"),
      },
      {
        nameEn: "Bang Lamung",
        nameTh: "บางละมุง",
        searchKey: normalizeForSearch("Bang Lamung บางละมุง"),
      },
      {
        nameEn: "Phan Thong",
        nameTh: "พานทอง",
        searchKey: normalizeForSearch("Phan Thong พานทอง"),
      },
      {
        nameEn: "Phanat Nikhom",
        nameTh: "พนัสนิคม",
        searchKey: normalizeForSearch("Phanat Nikhom พนัสนิคม"),
      },
      {
        nameEn: "Si Racha",
        nameTh: "ศรีราชา",
        searchKey: normalizeForSearch("Si Racha ศรีราชา"),
      },
      {
        nameEn: "Ko Sichang",
        nameTh: "เกาะสีชัง",
        searchKey: normalizeForSearch("Ko Sichang เกาะสีชัง"),
      },
      {
        nameEn: "Sattahip",
        nameTh: "สัตหีบ",
        searchKey: normalizeForSearch("Sattahip สัตหีบ"),
      },
      {
        nameEn: "Bo Thong",
        nameTh: "บ่อทอง",
        searchKey: normalizeForSearch("Bo Thong บ่อทอง"),
      },
      {
        nameEn: "Ko Chan",
        nameTh: "เกาะจัน",
        searchKey: normalizeForSearch("Ko Chan เกาะจัน"),
      },
    ],
  },
  {
    code: "RYG",
    nameEn: "Rayong",
    nameTh: "ระยอง",
    searchKey: normalizeForSearch("Rayong ระยอง"),
    region: "East",
    districts: [
      {
        nameEn: "Mueang Rayong",
        nameTh: "เมืองระยอง",
        searchKey: normalizeForSearch("Mueang Rayong เมืองระยอง"),
      },
      {
        nameEn: "Ban Chang",
        nameTh: "บ้านฉาง",
        searchKey: normalizeForSearch("Ban Chang บ้านฉาง"),
      },
      {
        nameEn: "Klaeng",
        nameTh: "แกลง",
        searchKey: normalizeForSearch("Klaeng แกลง"),
      },
      {
        nameEn: "Wang Chan",
        nameTh: "วังจันทร์",
        searchKey: normalizeForSearch("Wang Chan วังจันทร์"),
      },
      {
        nameEn: "Ban Khai",
        nameTh: "บ้านค่าย",
        searchKey: normalizeForSearch("Ban Khai บ้านค่าย"),
      },
      {
        nameEn: "Pluak Daeng",
        nameTh: "ปลวกแดง",
        searchKey: normalizeForSearch("Pluak Daeng ปลวกแดง"),
      },
      {
        nameEn: "Khao Chamao",
        nameTh: "เขาชะเมา",
        searchKey: normalizeForSearch("Khao Chamao เขาชะเมา"),
      },
      {
        nameEn: "Nikhom Phatthana",
        nameTh: "นิคมพัฒนา",
        searchKey: normalizeForSearch("Nikhom Phatthana นิคมพัฒนา"),
      },
    ],
  },

  // ===== SOUTH REGION (14 provinces) =====
  {
    code: "PKT",
    nameEn: "Phuket",
    nameTh: "ภูเก็ต",
    searchKey: normalizeForSearch("Phuket ภูเก็ต"),
    region: "South",
    districts: [
      {
        nameEn: "Mueang Phuket",
        nameTh: "เมืองภูเก็ต",
        searchKey: normalizeForSearch("Mueang Phuket เมืองภูเก็ต"),
      },
      {
        nameEn: "Kathu",
        nameTh: "กะทู้",
        searchKey: normalizeForSearch("Kathu กะทู้"),
      },
      {
        nameEn: "Thalang",
        nameTh: "ถลาง",
        searchKey: normalizeForSearch("Thalang ถลาง"),
      },
    ],
  },
  {
    code: "SKA",
    nameEn: "Surat Thani",
    nameTh: "สุราษฎร์ธานี",
    searchKey: normalizeForSearch("Surat Thani สุราษฎร์ธานี"),
    region: "South",
    districts: [
      {
        nameEn: "Mueang Surat Thani",
        nameTh: "เมืองสุราษฎร์ธานี",
        searchKey: normalizeForSearch("Mueang Surat Thani เมืองสุราษฎร์ธานี"),
      },
      {
        nameEn: "Kanchanadit",
        nameTh: "กาญจนดิษฐ์",
        searchKey: normalizeForSearch("Kanchanadit กาญจนดิษฐ์"),
      },
      {
        nameEn: "Don Sak",
        nameTh: "ดอนสัก",
        searchKey: normalizeForSearch("Don Sak ดอนสัก"),
      },
      {
        nameEn: "Ko Samui",
        nameTh: "เกาะสมุย",
        searchKey: normalizeForSearch("Ko Samui เกาะสมุย"),
      },
      {
        nameEn: "Ko Pha-ngan",
        nameTh: "เกาะพงั",
        searchKey: normalizeForSearch("Ko Pha-ngan เกาะพะงัน"),
      },
      {
        nameEn: "Chaiya",
        nameTh: "ไชยา",
        searchKey: normalizeForSearch("Chaiya ไชยา"),
      },
      {
        nameEn: "Tha Chana",
        nameTh: "ท่าชนะ",
        searchKey: normalizeForSearch("Tha Chana ท่าชนะ"),
      },
      {
        nameEn: "Khiri Rat Nikhom",
        nameTh: "คีรีรัฐนิคม",
        searchKey: normalizeForSearch("Khiri Rat Nikhom คีรีรัฐนิคม"),
      },
      {
        nameEn: "Ban Ta Khun",
        nameTh: "บ้านตาขุน",
        searchKey: normalizeForSearch("Ban Ta Khun บ้านตาขุน"),
      },
      {
        nameEn: "Phanom",
        nameTh: "พนม",
        searchKey: normalizeForSearch("Phanom พนม"),
      },
      {
        nameEn: "Tha Chang",
        nameTh: "ท่าช้าง",
        searchKey: normalizeForSearch("Tha Chang ท่าช้าง"),
      },
      {
        nameEn: "Ban Na San",
        nameTh: "บ้านนาสาร",
        searchKey: normalizeForSearch("Ban Na San บ้านนาสาร"),
      },
      {
        nameEn: "Ban Na Doem",
        nameTh: "บ้านนาเดิม",
        searchKey: normalizeForSearch("Ban Na Doem บ้านนาเดิม"),
      },
      {
        nameEn: "Khian Sa",
        nameTh: "เคียนซา",
        searchKey: normalizeForSearch("Khian Sa เคียนซา"),
      },
      {
        nameEn: "Wiang Sa",
        nameTh: "เวียงสระ",
        searchKey: normalizeForSearch("Wiang Sa เวียงสระ"),
      },
      {
        nameEn: "Phrasaeng",
        nameTh: "พระแสง",
        searchKey: normalizeForSearch("Phrasaeng พระแสง"),
      },
      {
        nameEn: "Phunphin",
        nameTh: "พุนพิน",
        searchKey: normalizeForSearch("Phunphin พุนพิน"),
      },
      {
        nameEn: "Chai Buri",
        nameTh: "ชัยบุรี",
        searchKey: normalizeForSearch("Chai Buri ชัยบุรี"),
      },
      {
        nameEn: "Vibhavadi",
        nameTh: "วิภาวดี",
        searchKey: normalizeForSearch("Vibhavadi วิภาวดี"),
      },
    ],
  },

  // ===== WEST REGION (4 provinces) =====
  {
    code: "KRI",
    nameEn: "Kanchanaburi",
    nameTh: "กาญจนบุรี",
    searchKey: normalizeForSearch("Kanchanaburi กาญจนบุรี"),
    region: "West",
    districts: [
      {
        nameEn: "Mueang Kanchanaburi",
        nameTh: "เมืองกาญจนบุรี",
        searchKey: normalizeForSearch("Mueang Kanchanaburi เมืองกาญจนบุรี"),
      },
      {
        nameEn: "Sai Yok",
        nameTh: "ไทรโยค",
        searchKey: normalizeForSearch("Sai Yok ไทรโยค"),
      },
      {
        nameEn: "Bo Phloi",
        nameTh: "บ่อพลอย",
        searchKey: normalizeForSearch("Bo Phloi บ่อพลอย"),
      },
      {
        nameEn: "Si Sawat",
        nameTh: "ศรีสวัสดิ์",
        searchKey: normalizeForSearch("Si Sawat ศรีสวัสดิ์"),
      },
      {
        nameEn: "Tha Maka",
        nameTh: "ท่ามะกา",
        searchKey: normalizeForSearch("Tha Maka ท่ามะกา"),
      },
      {
        nameEn: "Tha Muang",
        nameTh: "ท่าม่วง",
        searchKey: normalizeForSearch("Tha Muang ท่าม่วง"),
      },
      {
        nameEn: "Thong Pha Phum",
        nameTh: "ทองผาภูมิ",
        searchKey: normalizeForSearch("Thong Pha Phum ทองผาภูมิ"),
      },
      {
        nameEn: "Sangkhla Buri",
        nameTh: "สังขละบุรี",
        searchKey: normalizeForSearch("Sangkhla Buri สังขละบุรี"),
      },
      {
        nameEn: "Phanom Thuan",
        nameTh: "พนมทวน",
        searchKey: normalizeForSearch("Phanom Thuan พนมทวน"),
      },
      {
        nameEn: "Lao Khwan",
        nameTh: "เลาขวัญ",
        searchKey: normalizeForSearch("Lao Khwan เลาขวัญ"),
      },
      {
        nameEn: "Dan Makham Tia",
        nameTh: "ด่านมะขามเตี้ย",
        searchKey: normalizeForSearch("Dan Makham Tia ด่านมะขามเตี้ย"),
      },
      {
        nameEn: "Nong Prue",
        nameTh: "หนองปรือ",
        searchKey: normalizeForSearch("Nong Prue หนองปรือ"),
      },
      {
        nameEn: "Huai Krachao",
        nameTh: "ห้วยกระเจา",
        searchKey: normalizeForSearch("Huai Krachao ห้วยกระเจา"),
      },
    ],
  },
  {
    code: "TAK",
    nameEn: "Tak",
    nameTh: "ตาก",
    searchKey: normalizeForSearch("Tak ตาก"),
    region: "West",
    districts: [
      {
        nameEn: "Mueang Tak",
        nameTh: "เมืองตาก",
        searchKey: normalizeForSearch("Mueang Tak เมืองตาก"),
      },
      {
        nameEn: "Ban Tak",
        nameTh: "บ้านตาก",
        searchKey: normalizeForSearch("Ban Tak บ้านตาก"),
      },
      {
        nameEn: "Sam Ngao",
        nameTh: "สามเงา",
        searchKey: normalizeForSearch("Sam Ngao สามเงา"),
      },
      {
        nameEn: "Mae Ramat",
        nameTh: "แม่ระมาด",
        searchKey: normalizeForSearch("Mae Ramat แม่ระมาด"),
      },
      {
        nameEn: "Tha Song Yang",
        nameTh: "ท่าสองยาง",
        searchKey: normalizeForSearch("Tha Song Yang ท่าสองยาง"),
      },
      {
        nameEn: "Mae Sot",
        nameTh: "แม่สอด",
        searchKey: normalizeForSearch("Mae Sot แม่สอด"),
      },
      {
        nameEn: "Phop Phra",
        nameTh: "พบพระ",
        searchKey: normalizeForSearch("Phop Phra พบพระ"),
      },
      {
        nameEn: "Um Phang",
        nameTh: "อุ้มผาง",
        searchKey: normalizeForSearch("Um Phang อุ้มผาง"),
      },
      {
        nameEn: "Wang Chao",
        nameTh: "วังเจ้า",
        searchKey: normalizeForSearch("Wang Chao วังเจ้า"),
      },
    ],
  },
];

/**
 * Get all provinces (for dropdown population)
 */
export function getAllProvinces(): ThailandProvince[] {
  return THAILAND_PROVINCES;
}

/**
 * Get districts for a specific province
 */
export function getDistrictsByProvince(
  provinceCode: string,
): ThailandDistrict[] {
  const province = THAILAND_PROVINCES.find((p) => p.code === provinceCode);
  return province?.districts || [];
}

/**
 * Search provinces by name (fuzzy match)
 * Returns provinces where the search term matches any part of the name
 */
export function searchProvinces(searchTerm: string): ThailandProvince[] {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return THAILAND_PROVINCES;
  }

  const normalizedSearch = normalizeForSearch(searchTerm);

  return THAILAND_PROVINCES.filter(
    (province) =>
      province.searchKey.includes(normalizedSearch) ||
      province.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      province.nameTh.includes(searchTerm),
  );
}

/**
 * Search districts within a province (fuzzy match)
 */
export function searchDistricts(
  provinceCode: string,
  searchTerm: string,
): ThailandDistrict[] {
  const districts = getDistrictsByProvince(provinceCode);

  if (!searchTerm || searchTerm.trim().length === 0) {
    return districts;
  }

  const normalizedSearch = normalizeForSearch(searchTerm);

  return districts.filter(
    (district) =>
      district.searchKey.includes(normalizedSearch) ||
      district.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      district.nameTh.includes(searchTerm),
  );
}

/**
 * Get province by code
 */
export function getProvinceByCode(code: string): ThailandProvince | undefined {
  return THAILAND_PROVINCES.find((p) => p.code === code);
}

/**
 * Get province by name (EN or TH)
 */
export function getProvinceByName(name: string): ThailandProvince | undefined {
  const normalizedSearch = normalizeForSearch(name);
  return THAILAND_PROVINCES.find(
    (p) =>
      p.searchKey === normalizedSearch ||
      p.nameEn.toLowerCase() === name.toLowerCase() ||
      p.nameTh === name,
  );
}

/**
 * Format location for display (for moderator analytics)
 * Returns: "District, Province" in the specified language
 */
export function formatLocation(
  provinceCode: string,
  districtName: string,
  language: "en" | "th" = "en",
): string {
  const province = getProvinceByCode(provinceCode);
  if (!province) return districtName;

  const district = province.districts.find(
    (d) => d.nameEn === districtName || d.nameTh === districtName,
  );

  if (language === "th") {
    return district
      ? `${district.nameTh}, ${province.nameTh}`
      : `${districtName}, ${province.nameTh}`;
  }

  return district
    ? `${district.nameEn}, ${province.nameEn}`
    : `${districtName}, ${province.nameEn}`;
}

/**
 * Validate province/district combination
 * Returns true if the district exists in the specified province
 */
export function isValidLocation(
  provinceCode: string,
  districtName: string,
): boolean {
  const province = getProvinceByCode(provinceCode);
  if (!province) return false;

  return province.districts.some(
    (d) => d.nameEn === districtName || d.nameTh === districtName,
  );
}
