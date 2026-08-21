/**
 * Thailand Administrative Regions Data
 *
 * Complete list of Thailand's 77 provinces and their districts with English/Thai names.
 * Source: Wikipedia "List of districts of Thailand" & "List of districts of Bangkok"
 * (DOPA-referenced), cross-validated against the previously populated provinces.
 *
 * Data structure optimized for:
 * - Fast province/district lookups
 * - Fuzzy search matching
 * - Bilingual support (EN default, TH for moderator analytics)
 * - Easy updates as administrative regions evolve
 *
 * Last updated: August 22, 2026
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
  // ===== CENTRAL REGION (22 provinces) =====
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
    searchKey: normalizeForSearch("Phra Nakhon Si Ayutthaya พระนครศรีอยุธยา"),
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
  {
    code: "ATN",
    nameEn: "Ang Thong",
    nameTh: "อ่างทอง",
    searchKey: normalizeForSearch("Ang Thong อ่างทอง"),
    region: "Central",
    districts: [
      {
        nameEn: "Chaiyo",
        nameTh: "ไชโย",
        searchKey: normalizeForSearch("Chaiyo ไชโย"),
      },
      {
        nameEn: "Mueang Ang Thong",
        nameTh: "เมืองอ่างทอง",
        searchKey: normalizeForSearch("Mueang Ang Thong เมืองอ่างทอง"),
      },
      {
        nameEn: "Pa Mok",
        nameTh: "ป่าโมก",
        searchKey: normalizeForSearch("Pa Mok ป่าโมก"),
      },
      {
        nameEn: "Pho Thong",
        nameTh: "โพธิ์ทอง",
        searchKey: normalizeForSearch("Pho Thong โพธิ์ทอง"),
      },
      {
        nameEn: "Samko",
        nameTh: "สามโก้",
        searchKey: normalizeForSearch("Samko สามโก้"),
      },
      {
        nameEn: "Sawaeng Ha",
        nameTh: "แสวงหา",
        searchKey: normalizeForSearch("Sawaeng Ha แสวงหา"),
      },
      {
        nameEn: "Wiset Chai Chan",
        nameTh: "วิเศษชัยชาญ",
        searchKey: normalizeForSearch("Wiset Chai Chan วิเศษชัยชาญ"),
      },
    ],
  },
  {
    code: "CNT2",
    nameEn: "Chai Nat",
    nameTh: "ชัยนาท",
    searchKey: normalizeForSearch("Chai Nat ชัยนาท"),
    region: "Central",
    districts: [
      {
        nameEn: "Hankha",
        nameTh: "หันคา",
        searchKey: normalizeForSearch("Hankha หันคา"),
      },
      {
        nameEn: "Manorom",
        nameTh: "มโนรมย์",
        searchKey: normalizeForSearch("Manorom มโนรมย์"),
      },
      {
        nameEn: "Mueang Chai Nat",
        nameTh: "เมืองชัยนาท",
        searchKey: normalizeForSearch("Mueang Chai Nat เมืองชัยนาท"),
      },
      {
        nameEn: "Noen Kham",
        nameTh: "เนินขาม",
        searchKey: normalizeForSearch("Noen Kham เนินขาม"),
      },
      {
        nameEn: "Nong Mamong",
        nameTh: "หนองมะโมง",
        searchKey: normalizeForSearch("Nong Mamong หนองมะโมง"),
      },
      {
        nameEn: "Sankhaburi",
        nameTh: "สรรคบุรี",
        searchKey: normalizeForSearch("Sankhaburi สรรคบุรี"),
      },
      {
        nameEn: "Sapphaya",
        nameTh: "สรรพยา",
        searchKey: normalizeForSearch("Sapphaya สรรพยา"),
      },
      {
        nameEn: "Wat Sing",
        nameTh: "วัดสิงห์",
        searchKey: normalizeForSearch("Wat Sing วัดสิงห์"),
      },
    ],
  },
  {
    code: "KPP",
    nameEn: "Kamphaeng Phet",
    nameTh: "กำแพงเพชร",
    searchKey: normalizeForSearch("Kamphaeng Phet กำแพงเพชร"),
    region: "Central",
    districts: [
      {
        nameEn: "Bueng Samakkhi",
        nameTh: "บึงสามัคคี",
        searchKey: normalizeForSearch("Bueng Samakkhi บึงสามัคคี"),
      },
      {
        nameEn: "Khanu Woralaksaburi",
        nameTh: "ขาณุวรลักษบุรี",
        searchKey: normalizeForSearch("Khanu Woralaksaburi ขาณุวรลักษบุรี"),
      },
      {
        nameEn: "Khlong Khlung",
        nameTh: "คลองขลุง",
        searchKey: normalizeForSearch("Khlong Khlung คลองขลุง"),
      },
      {
        nameEn: "Khlong Lan",
        nameTh: "คลองลาน",
        searchKey: normalizeForSearch("Khlong Lan คลองลาน"),
      },
      {
        nameEn: "Kosamphi Nakhon",
        nameTh: "โกสัมพีนคร",
        searchKey: normalizeForSearch("Kosamphi Nakhon โกสัมพีนคร"),
      },
      {
        nameEn: "Lan Krabue",
        nameTh: "ลานกระบือ",
        searchKey: normalizeForSearch("Lan Krabue ลานกระบือ"),
      },
      {
        nameEn: "Mueang Kamphaeng Phet",
        nameTh: "เมืองกำแพงเพชร",
        searchKey: normalizeForSearch("Mueang Kamphaeng Phet เมืองกำแพงเพชร"),
      },
      {
        nameEn: "Pang Sila Thong",
        nameTh: "ปางศิลาทอง",
        searchKey: normalizeForSearch("Pang Sila Thong ปางศิลาทอง"),
      },
      {
        nameEn: "Phran Kratai",
        nameTh: "พรานกระต่าย",
        searchKey: normalizeForSearch("Phran Kratai พรานกระต่าย"),
      },
      {
        nameEn: "Sai Ngam",
        nameTh: "ไทรงาม",
        searchKey: normalizeForSearch("Sai Ngam ไทรงาม"),
      },
      {
        nameEn: "Sai Thong Watthana",
        nameTh: "ทรายทองวัฒนา",
        searchKey: normalizeForSearch("Sai Thong Watthana ทรายทองวัฒนา"),
      },
    ],
  },
  {
    code: "LPB",
    nameEn: "Lopburi",
    nameTh: "ลพบุรี",
    searchKey: normalizeForSearch("Lopburi ลพบุรี"),
    region: "Central",
    districts: [
      {
        nameEn: "Ban Mi",
        nameTh: "บ้านหมี่",
        searchKey: normalizeForSearch("Ban Mi บ้านหมี่"),
      },
      {
        nameEn: "Chai Badan",
        nameTh: "ชัยบาดาล",
        searchKey: normalizeForSearch("Chai Badan ชัยบาดาล"),
      },
      {
        nameEn: "Khok Charoen",
        nameTh: "โคกเจริญ",
        searchKey: normalizeForSearch("Khok Charoen โคกเจริญ"),
      },
      {
        nameEn: "Khok Samrong",
        nameTh: "โคกสำโรง",
        searchKey: normalizeForSearch("Khok Samrong โคกสำโรง"),
      },
      {
        nameEn: "Lam Sonthi",
        nameTh: "ลำสนธิ",
        searchKey: normalizeForSearch("Lam Sonthi ลำสนธิ"),
      },
      {
        nameEn: "Mueang Lopburi",
        nameTh: "เมืองลพบุรี",
        searchKey: normalizeForSearch("Mueang Lopburi เมืองลพบุรี"),
      },
      {
        nameEn: "Nong Muang",
        nameTh: "หนองม่วง",
        searchKey: normalizeForSearch("Nong Muang หนองม่วง"),
      },
      {
        nameEn: "Phatthana Nikhom",
        nameTh: "พัฒนานิคม",
        searchKey: normalizeForSearch("Phatthana Nikhom พัฒนานิคม"),
      },
      {
        nameEn: "Sa Bot",
        nameTh: "สระโบสถ์",
        searchKey: normalizeForSearch("Sa Bot สระโบสถ์"),
      },
      {
        nameEn: "Tha Luang",
        nameTh: "ท่าหลวง",
        searchKey: normalizeForSearch("Tha Luang ท่าหลวง"),
      },
      {
        nameEn: "Tha Wung",
        nameTh: "ท่าวุ้ง",
        searchKey: normalizeForSearch("Tha Wung ท่าวุ้ง"),
      },
    ],
  },
  {
    code: "NKN",
    nameEn: "Nakhon Nayok",
    nameTh: "นครนายก",
    searchKey: normalizeForSearch("Nakhon Nayok นครนายก"),
    region: "Central",
    districts: [
      {
        nameEn: "Ban Na",
        nameTh: "บ้านนา",
        searchKey: normalizeForSearch("Ban Na บ้านนา"),
      },
      {
        nameEn: "Mueang Nakhon Nayok",
        nameTh: "เมืองนครนายก",
        searchKey: normalizeForSearch("Mueang Nakhon Nayok เมืองนครนายก"),
      },
      {
        nameEn: "Ongkharak",
        nameTh: "องครักษ์",
        searchKey: normalizeForSearch("Ongkharak องครักษ์"),
      },
      {
        nameEn: "Pak Phli",
        nameTh: "ปากพลี",
        searchKey: normalizeForSearch("Pak Phli ปากพลี"),
      },
    ],
  },
  {
    code: "NPT",
    nameEn: "Nakhon Pathom",
    nameTh: "นครปฐม",
    searchKey: normalizeForSearch("Nakhon Pathom นครปฐม"),
    region: "Central",
    districts: [
      {
        nameEn: "Bang Len",
        nameTh: "บางเลน",
        searchKey: normalizeForSearch("Bang Len บางเลน"),
      },
      {
        nameEn: "Don Tum",
        nameTh: "ดอนตูม",
        searchKey: normalizeForSearch("Don Tum ดอนตูม"),
      },
      {
        nameEn: "Kamphaeng Saen",
        nameTh: "กำแพงแสน",
        searchKey: normalizeForSearch("Kamphaeng Saen กำแพงแสน"),
      },
      {
        nameEn: "Mueang Nakhon Pathom",
        nameTh: "เมืองนครปฐม",
        searchKey: normalizeForSearch("Mueang Nakhon Pathom เมืองนครปฐม"),
      },
      {
        nameEn: "Nakhon Chai Si",
        nameTh: "นครชัยศรี",
        searchKey: normalizeForSearch("Nakhon Chai Si นครชัยศรี"),
      },
      {
        nameEn: "Phutthamonthon",
        nameTh: "พุทธมณฑล",
        searchKey: normalizeForSearch("Phutthamonthon พุทธมณฑล"),
      },
      {
        nameEn: "Sam Phran",
        nameTh: "สามพราน",
        searchKey: normalizeForSearch("Sam Phran สามพราน"),
      },
    ],
  },
  {
    code: "NSW",
    nameEn: "Nakhon Sawan",
    nameTh: "นครสวรรค์",
    searchKey: normalizeForSearch("Nakhon Sawan นครสวรรค์"),
    region: "Central",
    districts: [
      {
        nameEn: "Banphot Phisai",
        nameTh: "บรรพตพิสัย",
        searchKey: normalizeForSearch("Banphot Phisai บรรพตพิสัย"),
      },
      {
        nameEn: "Chum Saeng",
        nameTh: "ชุมแสง",
        searchKey: normalizeForSearch("Chum Saeng ชุมแสง"),
      },
      {
        nameEn: "Chum Ta Bong",
        nameTh: "ชุมตาบง",
        searchKey: normalizeForSearch("Chum Ta Bong ชุมตาบง"),
      },
      {
        nameEn: "Kao Liao",
        nameTh: "เก้าเลี้ยว",
        searchKey: normalizeForSearch("Kao Liao เก้าเลี้ยว"),
      },
      {
        nameEn: "Krok Phra",
        nameTh: "โกรกพระ",
        searchKey: normalizeForSearch("Krok Phra โกรกพระ"),
      },
      {
        nameEn: "Lat Yao",
        nameTh: "ลาดยาว",
        searchKey: normalizeForSearch("Lat Yao ลาดยาว"),
      },
      {
        nameEn: "Mae Poen",
        nameTh: "แม่เปิน",
        searchKey: normalizeForSearch("Mae Poen แม่เปิน"),
      },
      {
        nameEn: "Mae Wong",
        nameTh: "แม่วงก์",
        searchKey: normalizeForSearch("Mae Wong แม่วงก์"),
      },
      {
        nameEn: "Mueang Nakhon Sawan",
        nameTh: "เมืองนครสวรรค์",
        searchKey: normalizeForSearch("Mueang Nakhon Sawan เมืองนครสวรรค์"),
      },
      {
        nameEn: "Nong Bua",
        nameTh: "หนองบัว",
        searchKey: normalizeForSearch("Nong Bua หนองบัว"),
      },
      {
        nameEn: "Phaisali",
        nameTh: "ไพศาลี",
        searchKey: normalizeForSearch("Phaisali ไพศาลี"),
      },
      {
        nameEn: "Phayuha Khiri",
        nameTh: "พยุหะคีรี",
        searchKey: normalizeForSearch("Phayuha Khiri พยุหะคีรี"),
      },
      {
        nameEn: "Tak Fa",
        nameTh: "ตากฟ้า",
        searchKey: normalizeForSearch("Tak Fa ตากฟ้า"),
      },
      {
        nameEn: "Takhli",
        nameTh: "ตาคลี",
        searchKey: normalizeForSearch("Takhli ตาคลี"),
      },
      {
        nameEn: "Tha Tako",
        nameTh: "ท่าตะโก",
        searchKey: normalizeForSearch("Tha Tako ท่าตะโก"),
      },
    ],
  },
  {
    code: "PCN",
    nameEn: "Phetchabun",
    nameTh: "เพชรบูรณ์",
    searchKey: normalizeForSearch("Phetchabun เพชรบูรณ์"),
    region: "Central",
    districts: [
      {
        nameEn: "Bueng Sam Phan",
        nameTh: "บึงสามพัน",
        searchKey: normalizeForSearch("Bueng Sam Phan บึงสามพัน"),
      },
      {
        nameEn: "Chon Daen",
        nameTh: "ชนแดน",
        searchKey: normalizeForSearch("Chon Daen ชนแดน"),
      },
      {
        nameEn: "Khao Kho",
        nameTh: "เขาค้อ",
        searchKey: normalizeForSearch("Khao Kho เขาค้อ"),
      },
      {
        nameEn: "Lom Kao",
        nameTh: "หล่มเก่า",
        searchKey: normalizeForSearch("Lom Kao หล่มเก่า"),
      },
      {
        nameEn: "Lom Sak",
        nameTh: "หล่มสัก",
        searchKey: normalizeForSearch("Lom Sak หล่มสัก"),
      },
      {
        nameEn: "Mueang Phetchabun",
        nameTh: "เมืองเพชรบูรณ์",
        searchKey: normalizeForSearch("Mueang Phetchabun เมืองเพชรบูรณ์"),
      },
      {
        nameEn: "Nam Nao",
        nameTh: "น้ำหนาว",
        searchKey: normalizeForSearch("Nam Nao น้ำหนาว"),
      },
      {
        nameEn: "Nong Phai",
        nameTh: "หนองไผ่",
        searchKey: normalizeForSearch("Nong Phai หนองไผ่"),
      },
      {
        nameEn: "Si Thep",
        nameTh: "ศรีเทพ",
        searchKey: normalizeForSearch("Si Thep ศรีเทพ"),
      },
      {
        nameEn: "Wang Pong",
        nameTh: "วังโป่ง",
        searchKey: normalizeForSearch("Wang Pong วังโป่ง"),
      },
      {
        nameEn: "Wichian Buri",
        nameTh: "วิเชียรบุรี",
        searchKey: normalizeForSearch("Wichian Buri วิเชียรบุรี"),
      },
    ],
  },
  {
    code: "PIT",
    nameEn: "Phichit",
    nameTh: "พิจิตร",
    searchKey: normalizeForSearch("Phichit พิจิตร"),
    region: "Central",
    districts: [
      {
        nameEn: "Bang Mun Nak",
        nameTh: "บางมูลนาก",
        searchKey: normalizeForSearch("Bang Mun Nak บางมูลนาก"),
      },
      {
        nameEn: "Bueng Na Rang",
        nameTh: "บึงนาราง",
        searchKey: normalizeForSearch("Bueng Na Rang บึงนาราง"),
      },
      {
        nameEn: "Dong Charoen",
        nameTh: "ดงเจริญ",
        searchKey: normalizeForSearch("Dong Charoen ดงเจริญ"),
      },
      {
        nameEn: "Mueang Phichit",
        nameTh: "เมืองพิจิตร",
        searchKey: normalizeForSearch("Mueang Phichit เมืองพิจิตร"),
      },
      {
        nameEn: "Pho Prathap Chang",
        nameTh: "โพธิ์ประทับช้าง",
        searchKey: normalizeForSearch("Pho Prathap Chang โพธิ์ประทับช้าง"),
      },
      {
        nameEn: "Pho Thale",
        nameTh: "โพทะเล",
        searchKey: normalizeForSearch("Pho Thale โพทะเล"),
      },
      {
        nameEn: "Sak Lek",
        nameTh: "สากเหล็ก",
        searchKey: normalizeForSearch("Sak Lek สากเหล็ก"),
      },
      {
        nameEn: "Sam Ngam",
        nameTh: "สามง่าม",
        searchKey: normalizeForSearch("Sam Ngam สามง่าม"),
      },
      {
        nameEn: "Taphan Hin",
        nameTh: "ตะพานหิน",
        searchKey: normalizeForSearch("Taphan Hin ตะพานหิน"),
      },
      {
        nameEn: "Thap Khlo",
        nameTh: "ทับคล้อ",
        searchKey: normalizeForSearch("Thap Khlo ทับคล้อ"),
      },
      {
        nameEn: "Wachirabarami",
        nameTh: "วชิรบารมี",
        searchKey: normalizeForSearch("Wachirabarami วชิรบารมี"),
      },
      {
        nameEn: "Wang Sai Phun",
        nameTh: "วังทรายพูน",
        searchKey: normalizeForSearch("Wang Sai Phun วังทรายพูน"),
      },
    ],
  },
  {
    code: "PSL",
    nameEn: "Phitsanulok",
    nameTh: "พิษณุโลก",
    searchKey: normalizeForSearch("Phitsanulok พิษณุโลก"),
    region: "Central",
    districts: [
      {
        nameEn: "Bang Krathum",
        nameTh: "บางกระทุ่ม",
        searchKey: normalizeForSearch("Bang Krathum บางกระทุ่ม"),
      },
      {
        nameEn: "Bang Rakam",
        nameTh: "บางระกำ",
        searchKey: normalizeForSearch("Bang Rakam บางระกำ"),
      },
      {
        nameEn: "Chat Trakan",
        nameTh: "ชาติตระการ",
        searchKey: normalizeForSearch("Chat Trakan ชาติตระการ"),
      },
      {
        nameEn: "Mueang Phitsanulok",
        nameTh: "เมืองพิษณุโลก",
        searchKey: normalizeForSearch("Mueang Phitsanulok เมืองพิษณุโลก"),
      },
      {
        nameEn: "Nakhon Thai",
        nameTh: "นครไทย",
        searchKey: normalizeForSearch("Nakhon Thai นครไทย"),
      },
      {
        nameEn: "Noen Maprang",
        nameTh: "เนินมะปราง",
        searchKey: normalizeForSearch("Noen Maprang เนินมะปราง"),
      },
      {
        nameEn: "Phrom Phiram",
        nameTh: "พรหมพิราม",
        searchKey: normalizeForSearch("Phrom Phiram พรหมพิราม"),
      },
      {
        nameEn: "Wang Thong",
        nameTh: "วังทอง",
        searchKey: normalizeForSearch("Wang Thong วังทอง"),
      },
      {
        nameEn: "Wat Bot",
        nameTh: "วัดโบสถ์",
        searchKey: normalizeForSearch("Wat Bot วัดโบสถ์"),
      },
    ],
  },
  {
    code: "SMH",
    nameEn: "Samut Sakhon",
    nameTh: "สมุทรสาคร",
    searchKey: normalizeForSearch("Samut Sakhon สมุทรสาคร"),
    region: "Central",
    districts: [
      {
        nameEn: "Ban Phaeo",
        nameTh: "บ้านแพ้ว",
        searchKey: normalizeForSearch("Ban Phaeo บ้านแพ้ว"),
      },
      {
        nameEn: "Krathum Baen",
        nameTh: "กระทุ่มแบน",
        searchKey: normalizeForSearch("Krathum Baen กระทุ่มแบน"),
      },
      {
        nameEn: "Mueang Samut Sakhon",
        nameTh: "เมืองสมุทรสาคร",
        searchKey: normalizeForSearch("Mueang Samut Sakhon เมืองสมุทรสาคร"),
      },
    ],
  },
  {
    code: "SMK",
    nameEn: "Samut Songkhram",
    nameTh: "สมุทรสงคราม",
    searchKey: normalizeForSearch("Samut Songkhram สมุทรสงคราม"),
    region: "Central",
    districts: [
      {
        nameEn: "Amphawa",
        nameTh: "อัมพวา",
        searchKey: normalizeForSearch("Amphawa อัมพวา"),
      },
      {
        nameEn: "Bang Khonthi",
        nameTh: "บางคนที",
        searchKey: normalizeForSearch("Bang Khonthi บางคนที"),
      },
      {
        nameEn: "Mueang Samut Songkhram",
        nameTh: "เมืองสมุทรสงคราม",
        searchKey: normalizeForSearch(
          "Mueang Samut Songkhram เมืองสมุทรสงคราม",
        ),
      },
    ],
  },
  {
    code: "SRB",
    nameEn: "Saraburi",
    nameTh: "สระบุรี",
    searchKey: normalizeForSearch("Saraburi สระบุรี"),
    region: "Central",
    districts: [
      {
        nameEn: "Ban Mo",
        nameTh: "บ้านหมอ",
        searchKey: normalizeForSearch("Ban Mo บ้านหมอ"),
      },
      {
        nameEn: "Chaloem Phra Kiat",
        nameTh: "เฉลิมพระเกียรติ",
        searchKey: normalizeForSearch("Chaloem Phra Kiat เฉลิมพระเกียรติ"),
      },
      {
        nameEn: "Don Phut",
        nameTh: "ดอนพุด",
        searchKey: normalizeForSearch("Don Phut ดอนพุด"),
      },
      {
        nameEn: "Kaeng Khoi",
        nameTh: "แก่งคอย",
        searchKey: normalizeForSearch("Kaeng Khoi แก่งคอย"),
      },
      {
        nameEn: "Muak Lek",
        nameTh: "มวกเหล็ก",
        searchKey: normalizeForSearch("Muak Lek มวกเหล็ก"),
      },
      {
        nameEn: "Mueang Saraburi",
        nameTh: "เมืองสระบุรี",
        searchKey: normalizeForSearch("Mueang Saraburi เมืองสระบุรี"),
      },
      {
        nameEn: "Nong Don",
        nameTh: "หนองโดน",
        searchKey: normalizeForSearch("Nong Don หนองโดน"),
      },
      {
        nameEn: "Nong Khae",
        nameTh: "หนองแค",
        searchKey: normalizeForSearch("Nong Khae หนองแค"),
      },
      {
        nameEn: "Nong Saeng",
        nameTh: "หนองแซง",
        searchKey: normalizeForSearch("Nong Saeng หนองแซง"),
      },
      {
        nameEn: "Phra Phutthabat",
        nameTh: "พระพุทธบาท",
        searchKey: normalizeForSearch("Phra Phutthabat พระพุทธบาท"),
      },
      {
        nameEn: "Sao Hai",
        nameTh: "เสาไห้",
        searchKey: normalizeForSearch("Sao Hai เสาไห้"),
      },
      {
        nameEn: "Wang Muang",
        nameTh: "วังม่วง",
        searchKey: normalizeForSearch("Wang Muang วังม่วง"),
      },
      {
        nameEn: "Wihan Daeng",
        nameTh: "วิหารแดง",
        searchKey: normalizeForSearch("Wihan Daeng วิหารแดง"),
      },
    ],
  },
  {
    code: "SBG",
    nameEn: "Sing Buri",
    nameTh: "สิงห์บุรี",
    searchKey: normalizeForSearch("Sing Buri สิงห์บุรี"),
    region: "Central",
    districts: [
      {
        nameEn: "Bang Rachan",
        nameTh: "บางระจัน",
        searchKey: normalizeForSearch("Bang Rachan บางระจัน"),
      },
      {
        nameEn: "In Buri",
        nameTh: "อินทร์บุรี",
        searchKey: normalizeForSearch("In Buri อินทร์บุรี"),
      },
      {
        nameEn: "Khai Bang Rachan",
        nameTh: "ค่ายบางระจัน",
        searchKey: normalizeForSearch("Khai Bang Rachan ค่ายบางระจัน"),
      },
      {
        nameEn: "Mueang Sing Buri",
        nameTh: "เมืองสิงห์บุรี",
        searchKey: normalizeForSearch("Mueang Sing Buri เมืองสิงห์บุรี"),
      },
      {
        nameEn: "Phrom Buri",
        nameTh: "พรหมบุรี",
        searchKey: normalizeForSearch("Phrom Buri พรหมบุรี"),
      },
      {
        nameEn: "Tha Chang",
        nameTh: "ท่าช้าง",
        searchKey: normalizeForSearch("Tha Chang ท่าช้าง"),
      },
    ],
  },
  {
    code: "SKT",
    nameEn: "Sukhothai",
    nameTh: "สุโขทัย",
    searchKey: normalizeForSearch("Sukhothai สุโขทัย"),
    region: "Central",
    districts: [
      {
        nameEn: "Ban Dan Lan Hoi",
        nameTh: "บ้านด่านลานหอย",
        searchKey: normalizeForSearch("Ban Dan Lan Hoi บ้านด่านลานหอย"),
      },
      {
        nameEn: "Khiri Mat",
        nameTh: "คีรีมาศ",
        searchKey: normalizeForSearch("Khiri Mat คีรีมาศ"),
      },
      {
        nameEn: "Kong Krailat",
        nameTh: "กงไกรลาศ",
        searchKey: normalizeForSearch("Kong Krailat กงไกรลาศ"),
      },
      {
        nameEn: "Mueang Sukhothai",
        nameTh: "เมืองสุโขทัย",
        searchKey: normalizeForSearch("Mueang Sukhothai เมืองสุโขทัย"),
      },
      {
        nameEn: "Sawankhalok",
        nameTh: "สวรรคโลก",
        searchKey: normalizeForSearch("Sawankhalok สวรรคโลก"),
      },
      {
        nameEn: "Si Nakhon",
        nameTh: "ศรีนคร",
        searchKey: normalizeForSearch("Si Nakhon ศรีนคร"),
      },
      {
        nameEn: "Si Samrong",
        nameTh: "ศรีสำโรง",
        searchKey: normalizeForSearch("Si Samrong ศรีสำโรง"),
      },
      {
        nameEn: "Si Satchanalai",
        nameTh: "ศรีสัชนาลัย",
        searchKey: normalizeForSearch("Si Satchanalai ศรีสัชนาลัย"),
      },
      {
        nameEn: "Thung Saliam",
        nameTh: "ทุ่งเสลี่ยม",
        searchKey: normalizeForSearch("Thung Saliam ทุ่งเสลี่ยม"),
      },
    ],
  },
  {
    code: "SPU",
    nameEn: "Suphan Buri",
    nameTh: "สุพรรณบุรี",
    searchKey: normalizeForSearch("Suphan Buri สุพรรณบุรี"),
    region: "Central",
    districts: [
      {
        nameEn: "Bang Pla Ma",
        nameTh: "บางปลาม้า",
        searchKey: normalizeForSearch("Bang Pla Ma บางปลาม้า"),
      },
      {
        nameEn: "Dan Chang",
        nameTh: "ด่านช้าง",
        searchKey: normalizeForSearch("Dan Chang ด่านช้าง"),
      },
      {
        nameEn: "Doem Bang Nang Buat",
        nameTh: "เดิมบางนางบวช",
        searchKey: normalizeForSearch("Doem Bang Nang Buat เดิมบางนางบวช"),
      },
      {
        nameEn: "Don Chedi",
        nameTh: "ดอนเจดีย์",
        searchKey: normalizeForSearch("Don Chedi ดอนเจดีย์"),
      },
      {
        nameEn: "Mueang Suphanburi",
        nameTh: "เมืองสุพรรณบุรี",
        searchKey: normalizeForSearch("Mueang Suphanburi เมืองสุพรรณบุรี"),
      },
      {
        nameEn: "Nong Ya Sai",
        nameTh: "หนองหญ้าไซ",
        searchKey: normalizeForSearch("Nong Ya Sai หนองหญ้าไซ"),
      },
      {
        nameEn: "Sam Chuk",
        nameTh: "สามชุก",
        searchKey: normalizeForSearch("Sam Chuk สามชุก"),
      },
      {
        nameEn: "Si Prachan",
        nameTh: "ศรีประจันต์",
        searchKey: normalizeForSearch("Si Prachan ศรีประจันต์"),
      },
      {
        nameEn: "Song Phi Nong",
        nameTh: "สองพี่น้อง",
        searchKey: normalizeForSearch("Song Phi Nong สองพี่น้อง"),
      },
      {
        nameEn: "U Thong",
        nameTh: "อู่ทอง",
        searchKey: normalizeForSearch("U Thong อู่ทอง"),
      },
    ],
  },
  {
    code: "UTN",
    nameEn: "Uthai Thani",
    nameTh: "อุทัยธานี",
    searchKey: normalizeForSearch("Uthai Thani อุทัยธานี"),
    region: "Central",
    districts: [
      {
        nameEn: "Ban Rai",
        nameTh: "บ้านไร่",
        searchKey: normalizeForSearch("Ban Rai บ้านไร่"),
      },
      {
        nameEn: "Huai Khot",
        nameTh: "ห้วยคต",
        searchKey: normalizeForSearch("Huai Khot ห้วยคต"),
      },
      {
        nameEn: "Lan Sak",
        nameTh: "ลานสัก",
        searchKey: normalizeForSearch("Lan Sak ลานสัก"),
      },
      {
        nameEn: "Mueang Uthai Thani",
        nameTh: "เมืองอุทัยธานี",
        searchKey: normalizeForSearch("Mueang Uthai Thani เมืองอุทัยธานี"),
      },
      {
        nameEn: "Nong Chang",
        nameTh: "หนองฉาง",
        searchKey: normalizeForSearch("Nong Chang หนองฉาง"),
      },
      {
        nameEn: "Nong Khayang",
        nameTh: "หนองขาหย่าง",
        searchKey: normalizeForSearch("Nong Khayang หนองขาหย่าง"),
      },
      {
        nameEn: "Sawang Arom",
        nameTh: "สว่างอารมณ์",
        searchKey: normalizeForSearch("Sawang Arom สว่างอารมณ์"),
      },
      {
        nameEn: "Thap Than",
        nameTh: "ทัพทัน",
        searchKey: normalizeForSearch("Thap Than ทัพทัน"),
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
        nameEn: "Chiang Saen",
        nameTh: "เชียงแสน",
        searchKey: normalizeForSearch("Chiang Saen เชียงแสน"),
      },
    ],
  },
  {
    code: "LPG",
    nameEn: "Lampang",
    nameTh: "ลำปาง",
    searchKey: normalizeForSearch("Lampang ลำปาง"),
    region: "North",
    districts: [
      {
        nameEn: "Chae Hom",
        nameTh: "แจ้ห่ม",
        searchKey: normalizeForSearch("Chae Hom แจ้ห่ม"),
      },
      {
        nameEn: "Hang Chat",
        nameTh: "ห้างฉัตร",
        searchKey: normalizeForSearch("Hang Chat ห้างฉัตร"),
      },
      {
        nameEn: "Ko Kha",
        nameTh: "เกาะคา",
        searchKey: normalizeForSearch("Ko Kha เกาะคา"),
      },
      {
        nameEn: "Mae Mo",
        nameTh: "แม่เมาะ",
        searchKey: normalizeForSearch("Mae Mo แม่เมาะ"),
      },
      {
        nameEn: "Mae Phrik",
        nameTh: "แม่พริก",
        searchKey: normalizeForSearch("Mae Phrik แม่พริก"),
      },
      {
        nameEn: "Mae Tha, Lampang",
        nameTh: "แม่ทะ",
        searchKey: normalizeForSearch("Mae Tha, Lampang แม่ทะ"),
      },
      {
        nameEn: "Mueang Lampang",
        nameTh: "เมืองลำปาง",
        searchKey: normalizeForSearch("Mueang Lampang เมืองลำปาง"),
      },
      {
        nameEn: "Mueang Pan",
        nameTh: "เมืองปาน",
        searchKey: normalizeForSearch("Mueang Pan เมืองปาน"),
      },
      {
        nameEn: "Ngao",
        nameTh: "งาว",
        searchKey: normalizeForSearch("Ngao งาว"),
      },
      {
        nameEn: "Soem Ngam",
        nameTh: "เสริมงาม",
        searchKey: normalizeForSearch("Soem Ngam เสริมงาม"),
      },
      {
        nameEn: "Sop Prap",
        nameTh: "สบปราบ",
        searchKey: normalizeForSearch("Sop Prap สบปราบ"),
      },
      {
        nameEn: "Thoen",
        nameTh: "เถิน",
        searchKey: normalizeForSearch("Thoen เถิน"),
      },
      {
        nameEn: "Wang Nuea",
        nameTh: "วังเหนือ",
        searchKey: normalizeForSearch("Wang Nuea วังเหนือ"),
      },
    ],
  },
  {
    code: "LPN",
    nameEn: "Lamphun",
    nameTh: "ลำพูน",
    searchKey: normalizeForSearch("Lamphun ลำพูน"),
    region: "North",
    districts: [
      {
        nameEn: "Ban Hong",
        nameTh: "บ้านโฮ่ง",
        searchKey: normalizeForSearch("Ban Hong บ้านโฮ่ง"),
      },
      {
        nameEn: "Ban Thi",
        nameTh: "บ้านธิ",
        searchKey: normalizeForSearch("Ban Thi บ้านธิ"),
      },
      {
        nameEn: "Li",
        nameTh: "ลี้",
        searchKey: normalizeForSearch("Li ลี้"),
      },
      {
        nameEn: "Mae Tha, Lamphun",
        nameTh: "แม่ทา",
        searchKey: normalizeForSearch("Mae Tha, Lamphun แม่ทา"),
      },
      {
        nameEn: "Mueang Lamphun",
        nameTh: "เมืองลำพูน",
        searchKey: normalizeForSearch("Mueang Lamphun เมืองลำพูน"),
      },
      {
        nameEn: "Pa Sang",
        nameTh: "ป่าซาง",
        searchKey: normalizeForSearch("Pa Sang ป่าซาง"),
      },
      {
        nameEn: "Thung Hua Chang",
        nameTh: "ทุ่งหัวช้าง",
        searchKey: normalizeForSearch("Thung Hua Chang ทุ่งหัวช้าง"),
      },
      {
        nameEn: "Wiang Nong Long",
        nameTh: "เวียงหนองล่อง",
        searchKey: normalizeForSearch("Wiang Nong Long เวียงหนองล่อง"),
      },
    ],
  },
  {
    code: "MHS",
    nameEn: "Mae Hong Son",
    nameTh: "แม่ฮ่องสอน",
    searchKey: normalizeForSearch("Mae Hong Son แม่ฮ่องสอน"),
    region: "North",
    districts: [
      {
        nameEn: "Khun Yuam",
        nameTh: "ขุนยวม",
        searchKey: normalizeForSearch("Khun Yuam ขุนยวม"),
      },
      {
        nameEn: "Mae La Noi",
        nameTh: "แม่ลาน้อย",
        searchKey: normalizeForSearch("Mae La Noi แม่ลาน้อย"),
      },
      {
        nameEn: "Mae Sariang",
        nameTh: "แม่สะเรียง",
        searchKey: normalizeForSearch("Mae Sariang แม่สะเรียง"),
      },
      {
        nameEn: "Mueang Mae Hong Son",
        nameTh: "เมืองแม่ฮ่องสอน",
        searchKey: normalizeForSearch("Mueang Mae Hong Son เมืองแม่ฮ่องสอน"),
      },
      {
        nameEn: "Pai",
        nameTh: "ปาย",
        searchKey: normalizeForSearch("Pai ปาย"),
      },
      {
        nameEn: "Pang Mapha",
        nameTh: "ปางมะผ้า",
        searchKey: normalizeForSearch("Pang Mapha ปางมะผ้า"),
      },
      {
        nameEn: "Sop Moei",
        nameTh: "สบเมย",
        searchKey: normalizeForSearch("Sop Moei สบเมย"),
      },
    ],
  },
  {
    code: "NAN",
    nameEn: "Nan",
    nameTh: "น่าน",
    searchKey: normalizeForSearch("Nan น่าน"),
    region: "North",
    districts: [
      {
        nameEn: "Ban Luang",
        nameTh: "บ้านหลวง",
        searchKey: normalizeForSearch("Ban Luang บ้านหลวง"),
      },
      {
        nameEn: "Bo Kluea",
        nameTh: "บ่อเกลือ",
        searchKey: normalizeForSearch("Bo Kluea บ่อเกลือ"),
      },
      {
        nameEn: "Chaloem Phra Kiat",
        nameTh: "เฉลิมพระเกียรติ",
        searchKey: normalizeForSearch("Chaloem Phra Kiat เฉลิมพระเกียรติ"),
      },
      {
        nameEn: "Chiang Klang",
        nameTh: "เชียงกลาง",
        searchKey: normalizeForSearch("Chiang Klang เชียงกลาง"),
      },
      {
        nameEn: "Mae Charim",
        nameTh: "แม่จริม",
        searchKey: normalizeForSearch("Mae Charim แม่จริม"),
      },
      {
        nameEn: "Mueang Nan",
        nameTh: "เมืองน่าน",
        searchKey: normalizeForSearch("Mueang Nan เมืองน่าน"),
      },
      {
        nameEn: "Na Muen",
        nameTh: "นาหมื่น",
        searchKey: normalizeForSearch("Na Muen นาหมื่น"),
      },
      {
        nameEn: "Na Noi",
        nameTh: "นาน้อย",
        searchKey: normalizeForSearch("Na Noi นาน้อย"),
      },
      {
        nameEn: "Phu Phiang",
        nameTh: "ภูเพียง",
        searchKey: normalizeForSearch("Phu Phiang ภูเพียง"),
      },
      {
        nameEn: "Pua",
        nameTh: "ปัว",
        searchKey: normalizeForSearch("Pua ปัว"),
      },
      {
        nameEn: "Santi Suk",
        nameTh: "สันติสุข",
        searchKey: normalizeForSearch("Santi Suk สันติสุข"),
      },
      {
        nameEn: "Song Khwae",
        nameTh: "สองแคว",
        searchKey: normalizeForSearch("Song Khwae สองแคว"),
      },
      {
        nameEn: "Tha Wang Pha",
        nameTh: "ท่าวังผา",
        searchKey: normalizeForSearch("Tha Wang Pha ท่าวังผา"),
      },
      {
        nameEn: "Thung Chang",
        nameTh: "ทุ่งช้าง",
        searchKey: normalizeForSearch("Thung Chang ทุ่งช้าง"),
      },
      {
        nameEn: "Wiang Sa",
        nameTh: "เวียงสา",
        searchKey: normalizeForSearch("Wiang Sa เวียงสา"),
      },
    ],
  },
  {
    code: "PYA",
    nameEn: "Phayao",
    nameTh: "พะเยา",
    searchKey: normalizeForSearch("Phayao พะเยา"),
    region: "North",
    districts: [
      {
        nameEn: "Chiang Kham",
        nameTh: "เชียงคำ",
        searchKey: normalizeForSearch("Chiang Kham เชียงคำ"),
      },
      {
        nameEn: "Chiang Muan",
        nameTh: "เชียงม่วน",
        searchKey: normalizeForSearch("Chiang Muan เชียงม่วน"),
      },
      {
        nameEn: "Chun",
        nameTh: "จุน",
        searchKey: normalizeForSearch("Chun จุน"),
      },
      {
        nameEn: "Dok Khamtai",
        nameTh: "ดอกคำใต้",
        searchKey: normalizeForSearch("Dok Khamtai ดอกคำใต้"),
      },
      {
        nameEn: "Mae Chai",
        nameTh: "แม่ใจ",
        searchKey: normalizeForSearch("Mae Chai แม่ใจ"),
      },
      {
        nameEn: "Mueang Phayao",
        nameTh: "เมืองพะเยา",
        searchKey: normalizeForSearch("Mueang Phayao เมืองพะเยา"),
      },
      {
        nameEn: "Phu Kamyao",
        nameTh: "ภูกามยาว",
        searchKey: normalizeForSearch("Phu Kamyao ภูกามยาว"),
      },
      {
        nameEn: "Phu Sang",
        nameTh: "ภูซาง",
        searchKey: normalizeForSearch("Phu Sang ภูซาง"),
      },
      {
        nameEn: "Pong",
        nameTh: "ปง",
        searchKey: normalizeForSearch("Pong ปง"),
      },
    ],
  },
  {
    code: "PRE",
    nameEn: "Phrae",
    nameTh: "แพร่",
    searchKey: normalizeForSearch("Phrae แพร่"),
    region: "North",
    districts: [
      {
        nameEn: "Den Chai",
        nameTh: "เด่นชัย",
        searchKey: normalizeForSearch("Den Chai เด่นชัย"),
      },
      {
        nameEn: "Long",
        nameTh: "ลอง",
        searchKey: normalizeForSearch("Long ลอง"),
      },
      {
        nameEn: "Mueang Phrae",
        nameTh: "เมืองแพร่",
        searchKey: normalizeForSearch("Mueang Phrae เมืองแพร่"),
      },
      {
        nameEn: "Nong Muang Khai",
        nameTh: "หนองม่วงไข่",
        searchKey: normalizeForSearch("Nong Muang Khai หนองม่วงไข่"),
      },
      {
        nameEn: "Rong Kwang",
        nameTh: "ร้องกวาง",
        searchKey: normalizeForSearch("Rong Kwang ร้องกวาง"),
      },
      {
        nameEn: "Song",
        nameTh: "สอง",
        searchKey: normalizeForSearch("Song สอง"),
      },
      {
        nameEn: "Sung Men",
        nameTh: "สูงเม่น",
        searchKey: normalizeForSearch("Sung Men สูงเม่น"),
      },
      {
        nameEn: "Wang Chin",
        nameTh: "วังชิ้น",
        searchKey: normalizeForSearch("Wang Chin วังชิ้น"),
      },
    ],
  },
  {
    code: "UTR",
    nameEn: "Uttaradit",
    nameTh: "อุตรดิตถ์",
    searchKey: normalizeForSearch("Uttaradit อุตรดิตถ์"),
    region: "North",
    districts: [
      {
        nameEn: "Ban Khok",
        nameTh: "บ้านโคก",
        searchKey: normalizeForSearch("Ban Khok บ้านโคก"),
      },
      {
        nameEn: "Fak Tha",
        nameTh: "ฟากท่า",
        searchKey: normalizeForSearch("Fak Tha ฟากท่า"),
      },
      {
        nameEn: "Laplae",
        nameTh: "ลับแล",
        searchKey: normalizeForSearch("Laplae ลับแล"),
      },
      {
        nameEn: "Mueang Uttaradit",
        nameTh: "เมืองอุตรดิตถ์",
        searchKey: normalizeForSearch("Mueang Uttaradit เมืองอุตรดิตถ์"),
      },
      {
        nameEn: "Nam Pat",
        nameTh: "น้ำปาด",
        searchKey: normalizeForSearch("Nam Pat น้ำปาด"),
      },
      {
        nameEn: "Phichai",
        nameTh: "พิชัย",
        searchKey: normalizeForSearch("Phichai พิชัย"),
      },
      {
        nameEn: "Tha Pla",
        nameTh: "ท่าปลา",
        searchKey: normalizeForSearch("Tha Pla ท่าปลา"),
      },
      {
        nameEn: "Thong Saen Khan",
        nameTh: "ทองแสนขัน",
        searchKey: normalizeForSearch("Thong Saen Khan ทองแสนขัน"),
      },
      {
        nameEn: "Tron",
        nameTh: "ตรอน",
        searchKey: normalizeForSearch("Tron ตรอน"),
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
        nameEn: "Khok Pho Chai",
        nameTh: "โคกโพธิ์ไชย",
        searchKey: normalizeForSearch("Khok Pho Chai โคกโพธิ์ไชย"),
      },
      {
        nameEn: "Wiang Kao",
        nameTh: "เวียงเก่า",
        searchKey: normalizeForSearch("Wiang Kao เวียงเก่า"),
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
        nameEn: "Nam Khun",
        nameTh: "น้ำขุ่น",
        searchKey: normalizeForSearch("Nam Khun น้ำขุ่น"),
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
        nameEn: "Khong Chiam",
        nameTh: "โขงเจียม",
        searchKey: normalizeForSearch("Khong Chiam โขงเจียม"),
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
        nameEn: "Khueang Nai",
        nameTh: "เขื่องใน",
        searchKey: normalizeForSearch("Khueang Nai เขื่องใน"),
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
        nameEn: "Na Yia",
        nameTh: "นาเยีย",
        searchKey: normalizeForSearch("Na Yia นาเยีย"),
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
  {
    code: "AMN",
    nameEn: "Amnat Charoen",
    nameTh: "อำนาจเจริญ",
    searchKey: normalizeForSearch("Amnat Charoen อำนาจเจริญ"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Chanuman",
        nameTh: "ชานุมาน",
        searchKey: normalizeForSearch("Chanuman ชานุมาน"),
      },
      {
        nameEn: "Hua Taphan",
        nameTh: "หัวตะพาน",
        searchKey: normalizeForSearch("Hua Taphan หัวตะพาน"),
      },
      {
        nameEn: "Lue Amnat",
        nameTh: "ลืออำนาจ",
        searchKey: normalizeForSearch("Lue Amnat ลืออำนาจ"),
      },
      {
        nameEn: "Mueang Amnat Charoen",
        nameTh: "เมืองอำนาจเจริญ",
        searchKey: normalizeForSearch("Mueang Amnat Charoen เมืองอำนาจเจริญ"),
      },
      {
        nameEn: "Pathum Ratchawongsa",
        nameTh: "ปทุมราชวงศา",
        searchKey: normalizeForSearch("Pathum Ratchawongsa ปทุมราชวงศา"),
      },
      {
        nameEn: "Phana",
        nameTh: "พนา",
        searchKey: normalizeForSearch("Phana พนา"),
      },
      {
        nameEn: "Senangkhanikhom",
        nameTh: "เสนางคนิคม",
        searchKey: normalizeForSearch("Senangkhanikhom เสนางคนิคม"),
      },
    ],
  },
  {
    code: "BGK",
    nameEn: "Bueng Kan",
    nameTh: "บึงกาฬ",
    searchKey: normalizeForSearch("Bueng Kan บึงกาฬ"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Bueng Khong Long",
        nameTh: "บึงโขงหลง",
        searchKey: normalizeForSearch("Bueng Khong Long บึงโขงหลง"),
      },
      {
        nameEn: "Bung Khla",
        nameTh: "บุ่งคล้า",
        searchKey: normalizeForSearch("Bung Khla บุ่งคล้า"),
      },
      {
        nameEn: "Mueang Bueng Kan",
        nameTh: "เมืองบึงกาฬ",
        searchKey: normalizeForSearch("Mueang Bueng Kan เมืองบึงกาฬ"),
      },
      {
        nameEn: "Pak Khat",
        nameTh: "ปากคาด",
        searchKey: normalizeForSearch("Pak Khat ปากคาด"),
      },
      {
        nameEn: "Phon Charoen",
        nameTh: "พรเจริญ",
        searchKey: normalizeForSearch("Phon Charoen พรเจริญ"),
      },
      {
        nameEn: "Seka",
        nameTh: "เซกา",
        searchKey: normalizeForSearch("Seka เซกา"),
      },
      {
        nameEn: "Si Wilai",
        nameTh: "ศรีวิไล",
        searchKey: normalizeForSearch("Si Wilai ศรีวิไล"),
      },
      {
        nameEn: "So Phisai",
        nameTh: "โซ่พิสัย",
        searchKey: normalizeForSearch("So Phisai โซ่พิสัย"),
      },
    ],
  },
  {
    code: "BRI",
    nameEn: "Buriram",
    nameTh: "บุรีรัมย์",
    searchKey: normalizeForSearch("Buriram บุรีรัมย์"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Ban Dan",
        nameTh: "บ้านด่าน",
        searchKey: normalizeForSearch("Ban Dan บ้านด่าน"),
      },
      {
        nameEn: "Ban Kruat",
        nameTh: "บ้านกรวด",
        searchKey: normalizeForSearch("Ban Kruat บ้านกรวด"),
      },
      {
        nameEn: "Ban Mai Chaiyaphot",
        nameTh: "บ้านใหม่ไชยพจน์",
        searchKey: normalizeForSearch("Ban Mai Chaiyaphot บ้านใหม่ไชยพจน์"),
      },
      {
        nameEn: "Chaloem Phra Kiat",
        nameTh: "เฉลิมพระเกียรติ",
        searchKey: normalizeForSearch("Chaloem Phra Kiat เฉลิมพระเกียรติ"),
      },
      {
        nameEn: "Chamni",
        nameTh: "ชำนิ",
        searchKey: normalizeForSearch("Chamni ชำนิ"),
      },
      {
        nameEn: "Huai Rat",
        nameTh: "ห้วยราช",
        searchKey: normalizeForSearch("Huai Rat ห้วยราช"),
      },
      {
        nameEn: "Khaen Dong",
        nameTh: "แคนดง",
        searchKey: normalizeForSearch("Khaen Dong แคนดง"),
      },
      {
        nameEn: "Khu Mueang",
        nameTh: "คูเมือง",
        searchKey: normalizeForSearch("Khu Mueang คูเมือง"),
      },
      {
        nameEn: "Krasang",
        nameTh: "กระสัง",
        searchKey: normalizeForSearch("Krasang กระสัง"),
      },
      {
        nameEn: "Lahan Sai",
        nameTh: "ละหานทราย",
        searchKey: normalizeForSearch("Lahan Sai ละหานทราย"),
      },
      {
        nameEn: "Lam Plai Mat",
        nameTh: "ลำปลายมาศ",
        searchKey: normalizeForSearch("Lam Plai Mat ลำปลายมาศ"),
      },
      {
        nameEn: "Mueang Buriram",
        nameTh: "เมืองบุรีรัมย์",
        searchKey: normalizeForSearch("Mueang Buriram เมืองบุรีรัมย์"),
      },
      {
        nameEn: "Na Pho",
        nameTh: "นาโพธิ์",
        searchKey: normalizeForSearch("Na Pho นาโพธิ์"),
      },
      {
        nameEn: "Nang Rong",
        nameTh: "นางรอง",
        searchKey: normalizeForSearch("Nang Rong นางรอง"),
      },
      {
        nameEn: "Non Din Daeng",
        nameTh: "โนนดินแดง",
        searchKey: normalizeForSearch("Non Din Daeng โนนดินแดง"),
      },
      {
        nameEn: "Non Suwan",
        nameTh: "โนนสุวรรณ",
        searchKey: normalizeForSearch("Non Suwan โนนสุวรรณ"),
      },
      {
        nameEn: "Nong Hong",
        nameTh: "หนองหงส์",
        searchKey: normalizeForSearch("Nong Hong หนองหงส์"),
      },
      {
        nameEn: "Nong Ki",
        nameTh: "หนองกี่",
        searchKey: normalizeForSearch("Nong Ki หนองกี่"),
      },
      {
        nameEn: "Pakham",
        nameTh: "ปะคำ",
        searchKey: normalizeForSearch("Pakham ปะคำ"),
      },
      {
        nameEn: "Phlapphla Chai",
        nameTh: "พลับพลาชัย",
        searchKey: normalizeForSearch("Phlapphla Chai พลับพลาชัย"),
      },
      {
        nameEn: "Phutthaisong",
        nameTh: "พุทไธสง",
        searchKey: normalizeForSearch("Phutthaisong พุทไธสง"),
      },
      {
        nameEn: "Prakhon Chai",
        nameTh: "ประโคนชัย",
        searchKey: normalizeForSearch("Prakhon Chai ประโคนชัย"),
      },
      {
        nameEn: "Satuek",
        nameTh: "สตึก",
        searchKey: normalizeForSearch("Satuek สตึก"),
      },
    ],
  },
  {
    code: "CYP",
    nameEn: "Chaiyaphum",
    nameTh: "ชัยภูมิ",
    searchKey: normalizeForSearch("Chaiyaphum ชัยภูมิ"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Bamnet Narong",
        nameTh: "บำเหน็จณรงค์",
        searchKey: normalizeForSearch("Bamnet Narong บำเหน็จณรงค์"),
      },
      {
        nameEn: "Ban Khwao",
        nameTh: "บ้านเขว้า",
        searchKey: normalizeForSearch("Ban Khwao บ้านเขว้า"),
      },
      {
        nameEn: "Ban Thaen",
        nameTh: "บ้านแท่น",
        searchKey: normalizeForSearch("Ban Thaen บ้านแท่น"),
      },
      {
        nameEn: "Chatturat",
        nameTh: "จัตุรัส",
        searchKey: normalizeForSearch("Chatturat จัตุรัส"),
      },
      {
        nameEn: "Kaeng Khro",
        nameTh: "แก้งคร้อ",
        searchKey: normalizeForSearch("Kaeng Khro แก้งคร้อ"),
      },
      {
        nameEn: "Kaset Sombun",
        nameTh: "เกษตรสมบูรณ์",
        searchKey: normalizeForSearch("Kaset Sombun เกษตรสมบูรณ์"),
      },
      {
        nameEn: "Khon San",
        nameTh: "คอนสาร",
        searchKey: normalizeForSearch("Khon San คอนสาร"),
      },
      {
        nameEn: "Khon Sawan",
        nameTh: "คอนสวรรค์",
        searchKey: normalizeForSearch("Khon Sawan คอนสวรรค์"),
      },
      {
        nameEn: "Mueang Chaiyaphum",
        nameTh: "เมืองชัยภูมิ",
        searchKey: normalizeForSearch("Mueang Chaiyaphum เมืองชัยภูมิ"),
      },
      {
        nameEn: "Noen Sa-nga",
        nameTh: "เนินสง่า",
        searchKey: normalizeForSearch("Noen Sa-nga เนินสง่า"),
      },
      {
        nameEn: "Nong Bua Daeng",
        nameTh: "หนองบัวแดง",
        searchKey: normalizeForSearch("Nong Bua Daeng หนองบัวแดง"),
      },
      {
        nameEn: "Nong Bua Rawe",
        nameTh: "หนองบัวระเหว",
        searchKey: normalizeForSearch("Nong Bua Rawe หนองบัวระเหว"),
      },
      {
        nameEn: "Phakdi Chumphon",
        nameTh: "ภักดีชุมพล",
        searchKey: normalizeForSearch("Phakdi Chumphon ภักดีชุมพล"),
      },
      {
        nameEn: "Phu Khiao",
        nameTh: "ภูเขียว",
        searchKey: normalizeForSearch("Phu Khiao ภูเขียว"),
      },
      {
        nameEn: "Sap Yai",
        nameTh: "ซับใหญ่",
        searchKey: normalizeForSearch("Sap Yai ซับใหญ่"),
      },
      {
        nameEn: "Thep Sathit",
        nameTh: "เทพสถิต",
        searchKey: normalizeForSearch("Thep Sathit เทพสถิต"),
      },
    ],
  },
  {
    code: "KLN",
    nameEn: "Kalasin",
    nameTh: "กาฬสินธุ์",
    searchKey: normalizeForSearch("Kalasin กาฬสินธุ์"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Don Chan",
        nameTh: "ดอนจาน",
        searchKey: normalizeForSearch("Don Chan ดอนจาน"),
      },
      {
        nameEn: "Huai Mek",
        nameTh: "ห้วยเม็ก",
        searchKey: normalizeForSearch("Huai Mek ห้วยเม็ก"),
      },
      {
        nameEn: "Huai Phueng",
        nameTh: "ห้วยผึ้ง",
        searchKey: normalizeForSearch("Huai Phueng ห้วยผึ้ง"),
      },
      {
        nameEn: "Kamalasai",
        nameTh: "กมลาไสย",
        searchKey: normalizeForSearch("Kamalasai กมลาไสย"),
      },
      {
        nameEn: "Kham Muang",
        nameTh: "คำม่วง",
        searchKey: normalizeForSearch("Kham Muang คำม่วง"),
      },
      {
        nameEn: "Khao Wong",
        nameTh: "เขาวง",
        searchKey: normalizeForSearch("Khao Wong เขาวง"),
      },
      {
        nameEn: "Khong Chai",
        nameTh: "ฆ้องชัย",
        searchKey: normalizeForSearch("Khong Chai ฆ้องชัย"),
      },
      {
        nameEn: "Kuchinarai",
        nameTh: "กุฉินารายณ์",
        searchKey: normalizeForSearch("Kuchinarai กุฉินารายณ์"),
      },
      {
        nameEn: "Mueang Kalasin",
        nameTh: "เมืองกาฬสินธุ์",
        searchKey: normalizeForSearch("Mueang Kalasin เมืองกาฬสินธุ์"),
      },
      {
        nameEn: "Na Khu",
        nameTh: "นาคู",
        searchKey: normalizeForSearch("Na Khu นาคู"),
      },
      {
        nameEn: "Na Mon",
        nameTh: "นามน",
        searchKey: normalizeForSearch("Na Mon นามน"),
      },
      {
        nameEn: "Nong Kung Si",
        nameTh: "หนองกุงศรี",
        searchKey: normalizeForSearch("Nong Kung Si หนองกุงศรี"),
      },
      {
        nameEn: "Rong Kham",
        nameTh: "ร่องคำ",
        searchKey: normalizeForSearch("Rong Kham ร่องคำ"),
      },
      {
        nameEn: "Sahatsakhan",
        nameTh: "สหัสขันธ์",
        searchKey: normalizeForSearch("Sahatsakhan สหัสขันธ์"),
      },
      {
        nameEn: "Sam Chai",
        nameTh: "สามชัย",
        searchKey: normalizeForSearch("Sam Chai สามชัย"),
      },
      {
        nameEn: "Somdet",
        nameTh: "สมเด็จ",
        searchKey: normalizeForSearch("Somdet สมเด็จ"),
      },
      {
        nameEn: "Tha Khantho",
        nameTh: "ท่าคันโท",
        searchKey: normalizeForSearch("Tha Khantho ท่าคันโท"),
      },
      {
        nameEn: "Yang Talat",
        nameTh: "ยางตลาด",
        searchKey: normalizeForSearch("Yang Talat ยางตลาด"),
      },
    ],
  },
  {
    code: "LOE",
    nameEn: "Loei",
    nameTh: "เลย",
    searchKey: normalizeForSearch("Loei เลย"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Chiang Khan",
        nameTh: "เชียงคาน",
        searchKey: normalizeForSearch("Chiang Khan เชียงคาน"),
      },
      {
        nameEn: "Dan Sai",
        nameTh: "ด่านซ้าย",
        searchKey: normalizeForSearch("Dan Sai ด่านซ้าย"),
      },
      {
        nameEn: "Erawan",
        nameTh: "เอราวัณ",
        searchKey: normalizeForSearch("Erawan เอราวัณ"),
      },
      {
        nameEn: "Mueang Loei",
        nameTh: "เมืองเลย",
        searchKey: normalizeForSearch("Mueang Loei เมืองเลย"),
      },
      {
        nameEn: "Na Duang",
        nameTh: "นาด้วง",
        searchKey: normalizeForSearch("Na Duang นาด้วง"),
      },
      {
        nameEn: "Na Haeo",
        nameTh: "นาแห้ว",
        searchKey: normalizeForSearch("Na Haeo นาแห้ว"),
      },
      {
        nameEn: "Nong Hin",
        nameTh: "หนองหิน",
        searchKey: normalizeForSearch("Nong Hin หนองหิน"),
      },
      {
        nameEn: "Pak Chom",
        nameTh: "ปากชม",
        searchKey: normalizeForSearch("Pak Chom ปากชม"),
      },
      {
        nameEn: "Pha Khao",
        nameTh: "ผาขาว",
        searchKey: normalizeForSearch("Pha Khao ผาขาว"),
      },
      {
        nameEn: "Phu Kradueng",
        nameTh: "ภูกระดึง",
        searchKey: normalizeForSearch("Phu Kradueng ภูกระดึง"),
      },
      {
        nameEn: "Phu Luang",
        nameTh: "ภูหลวง",
        searchKey: normalizeForSearch("Phu Luang ภูหลวง"),
      },
      {
        nameEn: "Phu Ruea",
        nameTh: "ภูเรือ",
        searchKey: normalizeForSearch("Phu Ruea ภูเรือ"),
      },
      {
        nameEn: "Tha Li",
        nameTh: "ท่าลี่",
        searchKey: normalizeForSearch("Tha Li ท่าลี่"),
      },
      {
        nameEn: "Wang Saphung",
        nameTh: "วังสะพุง",
        searchKey: normalizeForSearch("Wang Saphung วังสะพุง"),
      },
    ],
  },
  {
    code: "MSK",
    nameEn: "Maha Sarakham",
    nameTh: "มหาสารคาม",
    searchKey: normalizeForSearch("Maha Sarakham มหาสารคาม"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Borabue",
        nameTh: "บรบือ",
        searchKey: normalizeForSearch("Borabue บรบือ"),
      },
      {
        nameEn: "Chiang Yuen",
        nameTh: "เชียงยืน",
        searchKey: normalizeForSearch("Chiang Yuen เชียงยืน"),
      },
      {
        nameEn: "Chuen Chom",
        nameTh: "ชื่นชม",
        searchKey: normalizeForSearch("Chuen Chom ชื่นชม"),
      },
      {
        nameEn: "Kae Dam",
        nameTh: "แกดำ",
        searchKey: normalizeForSearch("Kae Dam แกดำ"),
      },
      {
        nameEn: "Kantharawichai",
        nameTh: "กันทรวิชัย",
        searchKey: normalizeForSearch("Kantharawichai กันทรวิชัย"),
      },
      {
        nameEn: "Kosum Phisai",
        nameTh: "โกสุมพิสัย",
        searchKey: normalizeForSearch("Kosum Phisai โกสุมพิสัย"),
      },
      {
        nameEn: "Kut Rang",
        nameTh: "กุดรัง",
        searchKey: normalizeForSearch("Kut Rang กุดรัง"),
      },
      {
        nameEn: "Mueang Maha Sarakham",
        nameTh: "เมืองมหาสารคาม",
        searchKey: normalizeForSearch("Mueang Maha Sarakham เมืองมหาสารคาม"),
      },
      {
        nameEn: "Na Chueak",
        nameTh: "นาเชือก",
        searchKey: normalizeForSearch("Na Chueak นาเชือก"),
      },
      {
        nameEn: "Na Dun",
        nameTh: "นาดูน",
        searchKey: normalizeForSearch("Na Dun นาดูน"),
      },
      {
        nameEn: "Phayakkhaphum Phisai",
        nameTh: "พยัคฆภูมิพิสัย",
        searchKey: normalizeForSearch("Phayakkhaphum Phisai พยัคฆภูมิพิสัย"),
      },
      {
        nameEn: "Wapi Pathum",
        nameTh: "วาปีปทุม",
        searchKey: normalizeForSearch("Wapi Pathum วาปีปทุม"),
      },
      {
        nameEn: "Yang Sisurat",
        nameTh: "ยางสีสุราช",
        searchKey: normalizeForSearch("Yang Sisurat ยางสีสุราช"),
      },
    ],
  },
  {
    code: "MKD",
    nameEn: "Mukdahan",
    nameTh: "มุกดาหาร",
    searchKey: normalizeForSearch("Mukdahan มุกดาหาร"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Don Tan",
        nameTh: "ดอนตาล",
        searchKey: normalizeForSearch("Don Tan ดอนตาล"),
      },
      {
        nameEn: "Dong Luang",
        nameTh: "ดงหลวง",
        searchKey: normalizeForSearch("Dong Luang ดงหลวง"),
      },
      {
        nameEn: "Khamcha-i",
        nameTh: "คำชะอี",
        searchKey: normalizeForSearch("Khamcha-i คำชะอี"),
      },
      {
        nameEn: "Mueang Mukdahan",
        nameTh: "เมืองมุกดาหาร",
        searchKey: normalizeForSearch("Mueang Mukdahan เมืองมุกดาหาร"),
      },
      {
        nameEn: "Nikhom Kham Soi",
        nameTh: "นิคมคำสร้อย",
        searchKey: normalizeForSearch("Nikhom Kham Soi นิคมคำสร้อย"),
      },
      {
        nameEn: "Nong Sung",
        nameTh: "หนองสูง",
        searchKey: normalizeForSearch("Nong Sung หนองสูง"),
      },
      {
        nameEn: "Wan Yai",
        nameTh: "หว้านใหญ่",
        searchKey: normalizeForSearch("Wan Yai หว้านใหญ่"),
      },
    ],
  },
  {
    code: "NPN",
    nameEn: "Nakhon Phanom",
    nameTh: "นครพนม",
    searchKey: normalizeForSearch("Nakhon Phanom นครพนม"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Ban Phaeng",
        nameTh: "บ้านแพง",
        searchKey: normalizeForSearch("Ban Phaeng บ้านแพง"),
      },
      {
        nameEn: "Mueang Nakhon Phanom",
        nameTh: "เมืองนครพนม",
        searchKey: normalizeForSearch("Mueang Nakhon Phanom เมืองนครพนม"),
      },
      {
        nameEn: "Na Kae",
        nameTh: "นาแก",
        searchKey: normalizeForSearch("Na Kae นาแก"),
      },
      {
        nameEn: "Na Thom",
        nameTh: "นาทม",
        searchKey: normalizeForSearch("Na Thom นาทม"),
      },
      {
        nameEn: "Na Wa",
        nameTh: "นาหว้า",
        searchKey: normalizeForSearch("Na Wa นาหว้า"),
      },
      {
        nameEn: "Phon Sawan",
        nameTh: "โพนสวรรค์",
        searchKey: normalizeForSearch("Phon Sawan โพนสวรรค์"),
      },
      {
        nameEn: "Pla Pak",
        nameTh: "ปลาปาก",
        searchKey: normalizeForSearch("Pla Pak ปลาปาก"),
      },
      {
        nameEn: "Renu Nakhon",
        nameTh: "เรณูนคร",
        searchKey: normalizeForSearch("Renu Nakhon เรณูนคร"),
      },
      {
        nameEn: "Si Songkhram",
        nameTh: "ศรีสงคราม",
        searchKey: normalizeForSearch("Si Songkhram ศรีสงคราม"),
      },
      {
        nameEn: "Tha Uthen",
        nameTh: "ท่าอุเทน",
        searchKey: normalizeForSearch("Tha Uthen ท่าอุเทน"),
      },
      {
        nameEn: "That Phanom",
        nameTh: "ธาตุพนม",
        searchKey: normalizeForSearch("That Phanom ธาตุพนม"),
      },
      {
        nameEn: "Wang Yang",
        nameTh: "วังยาง",
        searchKey: normalizeForSearch("Wang Yang วังยาง"),
      },
    ],
  },
  {
    code: "NRM",
    nameEn: "Nakhon Ratchasima",
    nameTh: "นครราชสีมา",
    searchKey: normalizeForSearch("Nakhon Ratchasima นครราชสีมา"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Ban Lueam",
        nameTh: "บ้านเหลื่อม",
        searchKey: normalizeForSearch("Ban Lueam บ้านเหลื่อม"),
      },
      {
        nameEn: "Bua Lai",
        nameTh: "บัวลาย",
        searchKey: normalizeForSearch("Bua Lai บัวลาย"),
      },
      {
        nameEn: "Bua Yai",
        nameTh: "บัวใหญ่",
        searchKey: normalizeForSearch("Bua Yai บัวใหญ่"),
      },
      {
        nameEn: "Chakkarat",
        nameTh: "จักราช",
        searchKey: normalizeForSearch("Chakkarat จักราช"),
      },
      {
        nameEn: "Chaloem Phra Kiat",
        nameTh: "เฉลิมพระเกียรติ",
        searchKey: normalizeForSearch("Chaloem Phra Kiat เฉลิมพระเกียรติ"),
      },
      {
        nameEn: "Chok Chai",
        nameTh: "โชคชัย",
        searchKey: normalizeForSearch("Chok Chai โชคชัย"),
      },
      {
        nameEn: "Chum Phuang",
        nameTh: "ชุมพวง",
        searchKey: normalizeForSearch("Chum Phuang ชุมพวง"),
      },
      {
        nameEn: "Dan Khun Thot",
        nameTh: "ด่านขุนทด",
        searchKey: normalizeForSearch("Dan Khun Thot ด่านขุนทด"),
      },
      {
        nameEn: "Huai Thalaeng",
        nameTh: "ห้วยแถลง",
        searchKey: normalizeForSearch("Huai Thalaeng ห้วยแถลง"),
      },
      {
        nameEn: "Kaeng Sanam Nang",
        nameTh: "แก้งสนามนาง",
        searchKey: normalizeForSearch("Kaeng Sanam Nang แก้งสนามนาง"),
      },
      {
        nameEn: "Kham Sakaesaeng",
        nameTh: "ขามสะแกแสง",
        searchKey: normalizeForSearch("Kham Sakaesaeng ขามสะแกแสง"),
      },
      {
        nameEn: "Kham Thale So",
        nameTh: "ขามทะเลสอ",
        searchKey: normalizeForSearch("Kham Thale So ขามทะเลสอ"),
      },
      {
        nameEn: "Khon Buri",
        nameTh: "ครบุรี",
        searchKey: normalizeForSearch("Khon Buri ครบุรี"),
      },
      {
        nameEn: "Khong",
        nameTh: "คง",
        searchKey: normalizeForSearch("Khong คง"),
      },
      {
        nameEn: "Lam Thamenchai",
        nameTh: "ลำทะเมนชัย",
        searchKey: normalizeForSearch("Lam Thamenchai ลำทะเมนชัย"),
      },
      {
        nameEn: "Mueang Nakhon Ratchasima",
        nameTh: "เมืองนครราชสีมา",
        searchKey: normalizeForSearch(
          "Mueang Nakhon Ratchasima เมืองนครราชสีมา",
        ),
      },
      {
        nameEn: "Mueang Yang",
        nameTh: "เมืองยาง",
        searchKey: normalizeForSearch("Mueang Yang เมืองยาง"),
      },
      {
        nameEn: "Non Daeng",
        nameTh: "โนนแดง",
        searchKey: normalizeForSearch("Non Daeng โนนแดง"),
      },
      {
        nameEn: "Non Sung",
        nameTh: "โนนสูง",
        searchKey: normalizeForSearch("Non Sung โนนสูง"),
      },
      {
        nameEn: "Non Thai",
        nameTh: "โนนไทย",
        searchKey: normalizeForSearch("Non Thai โนนไทย"),
      },
      {
        nameEn: "Nong Bun Mak",
        nameTh: "หนองบุญมาก",
        searchKey: normalizeForSearch("Nong Bun Mak หนองบุญมาก"),
      },
      {
        nameEn: "Pak Chong",
        nameTh: "ปากช่อง",
        searchKey: normalizeForSearch("Pak Chong ปากช่อง"),
      },
      {
        nameEn: "Pak Thong Chai",
        nameTh: "ปักธงชัย",
        searchKey: normalizeForSearch("Pak Thong Chai ปักธงชัย"),
      },
      {
        nameEn: "Phimai",
        nameTh: "พิมาย",
        searchKey: normalizeForSearch("Phimai พิมาย"),
      },
      {
        nameEn: "Phra Thong Kham",
        nameTh: "พระทองคำ",
        searchKey: normalizeForSearch("Phra Thong Kham พระทองคำ"),
      },
      {
        nameEn: "Prathai",
        nameTh: "ประทาย",
        searchKey: normalizeForSearch("Prathai ประทาย"),
      },
      {
        nameEn: "Sida",
        nameTh: "สีดา",
        searchKey: normalizeForSearch("Sida สีดา"),
      },
      {
        nameEn: "Sikhio",
        nameTh: "สีคิ้ว",
        searchKey: normalizeForSearch("Sikhio สีคิ้ว"),
      },
      {
        nameEn: "Soeng Sang",
        nameTh: "เสิงสาง",
        searchKey: normalizeForSearch("Soeng Sang เสิงสาง"),
      },
      {
        nameEn: "Sung Noen",
        nameTh: "สูงเนิน",
        searchKey: normalizeForSearch("Sung Noen สูงเนิน"),
      },
      {
        nameEn: "Thepharak",
        nameTh: "เทพารักษ์",
        searchKey: normalizeForSearch("Thepharak เทพารักษ์"),
      },
      {
        nameEn: "Wang Nam Khiao",
        nameTh: "วังน้ำเขียว",
        searchKey: normalizeForSearch("Wang Nam Khiao วังน้ำเขียว"),
      },
    ],
  },
  {
    code: "NBL",
    nameEn: "Nong Bua Lamphu",
    nameTh: "หนองบัวลำภู",
    searchKey: normalizeForSearch("Nong Bua Lamphu หนองบัวลำภู"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Mueang Nongbua Lamphu",
        nameTh: "เมืองหนองบัวลำภู",
        searchKey: normalizeForSearch("Mueang Nongbua Lamphu เมืองหนองบัวลำภู"),
      },
      {
        nameEn: "Na Klang",
        nameTh: "นากลาง",
        searchKey: normalizeForSearch("Na Klang นากลาง"),
      },
      {
        nameEn: "Na Wang",
        nameTh: "นาวัง",
        searchKey: normalizeForSearch("Na Wang นาวัง"),
      },
      {
        nameEn: "Non Sang",
        nameTh: "โนนสัง",
        searchKey: normalizeForSearch("Non Sang โนนสัง"),
      },
      {
        nameEn: "Si Bun Rueang",
        nameTh: "ศรีบุญเรือง",
        searchKey: normalizeForSearch("Si Bun Rueang ศรีบุญเรือง"),
      },
      {
        nameEn: "Suwannakhuha",
        nameTh: "สุวรรณคูหา",
        searchKey: normalizeForSearch("Suwannakhuha สุวรรณคูหา"),
      },
    ],
  },
  {
    code: "NGK",
    nameEn: "Nong Khai",
    nameTh: "หนองคาย",
    searchKey: normalizeForSearch("Nong Khai หนองคาย"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Fao Rai",
        nameTh: "เฝ้าไร่",
        searchKey: normalizeForSearch("Fao Rai เฝ้าไร่"),
      },
      {
        nameEn: "Mueang Nong Khai",
        nameTh: "เมืองหนองคาย",
        searchKey: normalizeForSearch("Mueang Nong Khai เมืองหนองคาย"),
      },
      {
        nameEn: "Pho Tak",
        nameTh: "โพธิ์ตาก",
        searchKey: normalizeForSearch("Pho Tak โพธิ์ตาก"),
      },
      {
        nameEn: "Phon Phisai",
        nameTh: "โพนพิสัย",
        searchKey: normalizeForSearch("Phon Phisai โพนพิสัย"),
      },
      {
        nameEn: "Rattanawapi",
        nameTh: "รัตนวาปี",
        searchKey: normalizeForSearch("Rattanawapi รัตนวาปี"),
      },
      {
        nameEn: "Sakhrai",
        nameTh: "สระใคร",
        searchKey: normalizeForSearch("Sakhrai สระใคร"),
      },
      {
        nameEn: "Sangkhom",
        nameTh: "สังคม",
        searchKey: normalizeForSearch("Sangkhom สังคม"),
      },
      {
        nameEn: "Si Chiang Mai",
        nameTh: "ศรีเชียงใหม่",
        searchKey: normalizeForSearch("Si Chiang Mai ศรีเชียงใหม่"),
      },
      {
        nameEn: "Tha Bo",
        nameTh: "ท่าบ่อ",
        searchKey: normalizeForSearch("Tha Bo ท่าบ่อ"),
      },
    ],
  },
  {
    code: "ROE",
    nameEn: "Roi Et",
    nameTh: "ร้อยเอ็ด",
    searchKey: normalizeForSearch("Roi Et ร้อยเอ็ด"),
    region: "Northeast",
    districts: [
      {
        nameEn: "At Samat",
        nameTh: "อาจสามารถ",
        searchKey: normalizeForSearch("At Samat อาจสามารถ"),
      },
      {
        nameEn: "Changhan",
        nameTh: "จังหาร",
        searchKey: normalizeForSearch("Changhan จังหาร"),
      },
      {
        nameEn: "Chaturaphak Phiman",
        nameTh: "จตุรพักตรพิมาน",
        searchKey: normalizeForSearch("Chaturaphak Phiman จตุรพักตรพิมาน"),
      },
      {
        nameEn: "Chiang Khwan",
        nameTh: "เชียงขวัญ",
        searchKey: normalizeForSearch("Chiang Khwan เชียงขวัญ"),
      },
      {
        nameEn: "Kaset Wisai",
        nameTh: "เกษตรวิสัย",
        searchKey: normalizeForSearch("Kaset Wisai เกษตรวิสัย"),
      },
      {
        nameEn: "Moei Wadi",
        nameTh: "เมยวดี",
        searchKey: normalizeForSearch("Moei Wadi เมยวดี"),
      },
      {
        nameEn: "Mueang Roi Et",
        nameTh: "เมืองร้อยเอ็ด",
        searchKey: normalizeForSearch("Mueang Roi Et เมืองร้อยเอ็ด"),
      },
      {
        nameEn: "Mueang Suang",
        nameTh: "เมืองสรวง",
        searchKey: normalizeForSearch("Mueang Suang เมืองสรวง"),
      },
      {
        nameEn: "Nong Hi",
        nameTh: "หนองฮี",
        searchKey: normalizeForSearch("Nong Hi หนองฮี"),
      },
      {
        nameEn: "Nong Phok",
        nameTh: "หนองพอก",
        searchKey: normalizeForSearch("Nong Phok หนองพอก"),
      },
      {
        nameEn: "Pathum Rat",
        nameTh: "ปทุมรัตต์",
        searchKey: normalizeForSearch("Pathum Rat ปทุมรัตต์"),
      },
      {
        nameEn: "Phanom Phrai",
        nameTh: "พนมไพร",
        searchKey: normalizeForSearch("Phanom Phrai พนมไพร"),
      },
      {
        nameEn: "Pho Chai",
        nameTh: "โพธิ์ชัย",
        searchKey: normalizeForSearch("Pho Chai โพธิ์ชัย"),
      },
      {
        nameEn: "Phon Sai",
        nameTh: "โพนทราย",
        searchKey: normalizeForSearch("Phon Sai โพนทราย"),
      },
      {
        nameEn: "Phon Thong",
        nameTh: "โพนทอง",
        searchKey: normalizeForSearch("Phon Thong โพนทอง"),
      },
      {
        nameEn: "Selaphum",
        nameTh: "เสลภูมิ",
        searchKey: normalizeForSearch("Selaphum เสลภูมิ"),
      },
      {
        nameEn: "Si Somdet",
        nameTh: "ศรีสมเด็จ",
        searchKey: normalizeForSearch("Si Somdet ศรีสมเด็จ"),
      },
      {
        nameEn: "Suwannaphum",
        nameTh: "สุวรรณภูมิ",
        searchKey: normalizeForSearch("Suwannaphum สุวรรณภูมิ"),
      },
      {
        nameEn: "Thawat Buri",
        nameTh: "ธวัชบุรี",
        searchKey: normalizeForSearch("Thawat Buri ธวัชบุรี"),
      },
      {
        nameEn: "Thung Khao Luang",
        nameTh: "ทุ่งเขาหลวง",
        searchKey: normalizeForSearch("Thung Khao Luang ทุ่งเขาหลวง"),
      },
    ],
  },
  {
    code: "SKN",
    nameEn: "Sakon Nakhon",
    nameTh: "สกลนคร",
    searchKey: normalizeForSearch("Sakon Nakhon สกลนคร"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Akat Amnuai",
        nameTh: "อากาศอำนวย",
        searchKey: normalizeForSearch("Akat Amnuai อากาศอำนวย"),
      },
      {
        nameEn: "Ban Muang",
        nameTh: "บ้านม่วง",
        searchKey: normalizeForSearch("Ban Muang บ้านม่วง"),
      },
      {
        nameEn: "Charoen Sin",
        nameTh: "เจริญศิลป์",
        searchKey: normalizeForSearch("Charoen Sin เจริญศิลป์"),
      },
      {
        nameEn: "Kham Ta Kla",
        nameTh: "คำตากล้า",
        searchKey: normalizeForSearch("Kham Ta Kla คำตากล้า"),
      },
      {
        nameEn: "Khok Si Suphan",
        nameTh: "โคกศรีสุพรรณ",
        searchKey: normalizeForSearch("Khok Si Suphan โคกศรีสุพรรณ"),
      },
      {
        nameEn: "Kusuman",
        nameTh: "กุสุมาลย์",
        searchKey: normalizeForSearch("Kusuman กุสุมาลย์"),
      },
      {
        nameEn: "Kut Bak",
        nameTh: "กุดบาก",
        searchKey: normalizeForSearch("Kut Bak กุดบาก"),
      },
      {
        nameEn: "Mueang Sakon Nakhon",
        nameTh: "เมืองสกลนคร",
        searchKey: normalizeForSearch("Mueang Sakon Nakhon เมืองสกลนคร"),
      },
      {
        nameEn: "Nikhom Nam Un",
        nameTh: "นิคมน้ำอูน",
        searchKey: normalizeForSearch("Nikhom Nam Un นิคมน้ำอูน"),
      },
      {
        nameEn: "Phang Khon",
        nameTh: "พังโคน",
        searchKey: normalizeForSearch("Phang Khon พังโคน"),
      },
      {
        nameEn: "Phanna Nikhom",
        nameTh: "พรรณนานิคม",
        searchKey: normalizeForSearch("Phanna Nikhom พรรณนานิคม"),
      },
      {
        nameEn: "Phon Na Kaeo",
        nameTh: "โพนนาแก้ว",
        searchKey: normalizeForSearch("Phon Na Kaeo โพนนาแก้ว"),
      },
      {
        nameEn: "Phu Phan",
        nameTh: "ภูพาน",
        searchKey: normalizeForSearch("Phu Phan ภูพาน"),
      },
      {
        nameEn: "Sawang Daen Din",
        nameTh: "สว่างแดนดิน",
        searchKey: normalizeForSearch("Sawang Daen Din สว่างแดนดิน"),
      },
      {
        nameEn: "Song Dao",
        nameTh: "ส่องดาว",
        searchKey: normalizeForSearch("Song Dao ส่องดาว"),
      },
      {
        nameEn: "Tao Ngoi",
        nameTh: "เต่างอย",
        searchKey: normalizeForSearch("Tao Ngoi เต่างอย"),
      },
      {
        nameEn: "Wanon Niwat",
        nameTh: "วานรนิวาส",
        searchKey: normalizeForSearch("Wanon Niwat วานรนิวาส"),
      },
      {
        nameEn: "Waritchaphum",
        nameTh: "วาริชภูมิ",
        searchKey: normalizeForSearch("Waritchaphum วาริชภูมิ"),
      },
    ],
  },
  {
    code: "SSK",
    nameEn: "Sisaket",
    nameTh: "ศรีสะเกษ",
    searchKey: normalizeForSearch("Sisaket ศรีสะเกษ"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Benchalak",
        nameTh: "เบญจลักษ์",
        searchKey: normalizeForSearch("Benchalak เบญจลักษ์"),
      },
      {
        nameEn: "Bueng Bun",
        nameTh: "บึงบูรพ์",
        searchKey: normalizeForSearch("Bueng Bun บึงบูรพ์"),
      },
      {
        nameEn: "Huai Thap Than",
        nameTh: "ห้วยทับทัน",
        searchKey: normalizeForSearch("Huai Thap Than ห้วยทับทัน"),
      },
      {
        nameEn: "Kantharalak",
        nameTh: "กันทรลักษ์",
        searchKey: normalizeForSearch("Kantharalak กันทรลักษ์"),
      },
      {
        nameEn: "Kanthararom",
        nameTh: "กันทรารมย์",
        searchKey: normalizeForSearch("Kanthararom กันทรารมย์"),
      },
      {
        nameEn: "Khukhan",
        nameTh: "ขุขันธ์",
        searchKey: normalizeForSearch("Khukhan ขุขันธ์"),
      },
      {
        nameEn: "Khun Han",
        nameTh: "ขุนหาญ",
        searchKey: normalizeForSearch("Khun Han ขุนหาญ"),
      },
      {
        nameEn: "Mueang Chan",
        nameTh: "เมืองจันทร์",
        searchKey: normalizeForSearch("Mueang Chan เมืองจันทร์"),
      },
      {
        nameEn: "Mueang Sisaket",
        nameTh: "เมืองศรีสะเกษ",
        searchKey: normalizeForSearch("Mueang Sisaket เมืองศรีสะเกษ"),
      },
      {
        nameEn: "Nam Kliang",
        nameTh: "น้ำเกลี้ยง",
        searchKey: normalizeForSearch("Nam Kliang น้ำเกลี้ยง"),
      },
      {
        nameEn: "Non Khun",
        nameTh: "โนนคูณ",
        searchKey: normalizeForSearch("Non Khun โนนคูณ"),
      },
      {
        nameEn: "Phayu",
        nameTh: "พยุห์",
        searchKey: normalizeForSearch("Phayu พยุห์"),
      },
      {
        nameEn: "Pho Si Suwan",
        nameTh: "โพธิ์ศรีสุวรรณ",
        searchKey: normalizeForSearch("Pho Si Suwan โพธิ์ศรีสุวรรณ"),
      },
      {
        nameEn: "Phrai Bueng",
        nameTh: "ไพรบึง",
        searchKey: normalizeForSearch("Phrai Bueng ไพรบึง"),
      },
      {
        nameEn: "Phu Sing",
        nameTh: "ภูสิงห์",
        searchKey: normalizeForSearch("Phu Sing ภูสิงห์"),
      },
      {
        nameEn: "Prang Ku",
        nameTh: "ปรางค์กู่",
        searchKey: normalizeForSearch("Prang Ku ปรางค์กู่"),
      },
      {
        nameEn: "Rasi Salai",
        nameTh: "ราษีไศล",
        searchKey: normalizeForSearch("Rasi Salai ราษีไศล"),
      },
      {
        nameEn: "Si Rattana",
        nameTh: "ศรีรัตนะ",
        searchKey: normalizeForSearch("Si Rattana ศรีรัตนะ"),
      },
      {
        nameEn: "Sila Lat",
        nameTh: "ศิลาลาด",
        searchKey: normalizeForSearch("Sila Lat ศิลาลาด"),
      },
      {
        nameEn: "Uthumphon Phisai",
        nameTh: "อุทุมพรพิสัย",
        searchKey: normalizeForSearch("Uthumphon Phisai อุทุมพรพิสัย"),
      },
      {
        nameEn: "Wang Hin",
        nameTh: "วังหิน",
        searchKey: normalizeForSearch("Wang Hin วังหิน"),
      },
      {
        nameEn: "Yang Chum Noi",
        nameTh: "ยางชุมน้อย",
        searchKey: normalizeForSearch("Yang Chum Noi ยางชุมน้อย"),
      },
    ],
  },
  {
    code: "SRN",
    nameEn: "Surin",
    nameTh: "สุรินทร์",
    searchKey: normalizeForSearch("Surin สุรินทร์"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Buachet",
        nameTh: "บัวเชด",
        searchKey: normalizeForSearch("Buachet บัวเชด"),
      },
      {
        nameEn: "Chom Phra",
        nameTh: "จอมพระ",
        searchKey: normalizeForSearch("Chom Phra จอมพระ"),
      },
      {
        nameEn: "Chumphon Buri",
        nameTh: "ชุมพลบุรี",
        searchKey: normalizeForSearch("Chumphon Buri ชุมพลบุรี"),
      },
      {
        nameEn: "Kap Choeng",
        nameTh: "กาบเชิง",
        searchKey: normalizeForSearch("Kap Choeng กาบเชิง"),
      },
      {
        nameEn: "Khwao Sinarin",
        nameTh: "เขวาสินรินทร์",
        searchKey: normalizeForSearch("Khwao Sinarin เขวาสินรินทร์"),
      },
      {
        nameEn: "Lamduan",
        nameTh: "ลำดวน",
        searchKey: normalizeForSearch("Lamduan ลำดวน"),
      },
      {
        nameEn: "Mueang Surin",
        nameTh: "เมืองสุรินทร์",
        searchKey: normalizeForSearch("Mueang Surin เมืองสุรินทร์"),
      },
      {
        nameEn: "Non Narai",
        nameTh: "โนนนารายณ์",
        searchKey: normalizeForSearch("Non Narai โนนนารายณ์"),
      },
      {
        nameEn: "Phanom Dong Rak",
        nameTh: "พนมดงรัก",
        searchKey: normalizeForSearch("Phanom Dong Rak พนมดงรัก"),
      },
      {
        nameEn: "Prasat",
        nameTh: "ปราสาท",
        searchKey: normalizeForSearch("Prasat ปราสาท"),
      },
      {
        nameEn: "Rattanaburi",
        nameTh: "รัตนบุรี",
        searchKey: normalizeForSearch("Rattanaburi รัตนบุรี"),
      },
      {
        nameEn: "Samrong Thap",
        nameTh: "สำโรงทาบ",
        searchKey: normalizeForSearch("Samrong Thap สำโรงทาบ"),
      },
      {
        nameEn: "Sangkha",
        nameTh: "สังขะ",
        searchKey: normalizeForSearch("Sangkha สังขะ"),
      },
      {
        nameEn: "Sanom",
        nameTh: "สนม",
        searchKey: normalizeForSearch("Sanom สนม"),
      },
      {
        nameEn: "Si Narong",
        nameTh: "ศรีณรงค์",
        searchKey: normalizeForSearch("Si Narong ศรีณรงค์"),
      },
      {
        nameEn: "Sikhoraphum",
        nameTh: "ศีขรภูมิ",
        searchKey: normalizeForSearch("Sikhoraphum ศีขรภูมิ"),
      },
      {
        nameEn: "Tha Tum",
        nameTh: "ท่าตูม",
        searchKey: normalizeForSearch("Tha Tum ท่าตูม"),
      },
    ],
  },
  {
    code: "UDT",
    nameEn: "Udon Thani",
    nameTh: "อุดรธานี",
    searchKey: normalizeForSearch("Udon Thani อุดรธานี"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Ban Dung",
        nameTh: "บ้านดุง",
        searchKey: normalizeForSearch("Ban Dung บ้านดุง"),
      },
      {
        nameEn: "Ban Phue",
        nameTh: "บ้านผือ",
        searchKey: normalizeForSearch("Ban Phue บ้านผือ"),
      },
      {
        nameEn: "Chai Wan",
        nameTh: "ไชยวาน",
        searchKey: normalizeForSearch("Chai Wan ไชยวาน"),
      },
      {
        nameEn: "Ku Kaeo",
        nameTh: "กู่แก้ว",
        searchKey: normalizeForSearch("Ku Kaeo กู่แก้ว"),
      },
      {
        nameEn: "Kumphawapi",
        nameTh: "กุมภวาปี",
        searchKey: normalizeForSearch("Kumphawapi กุมภวาปี"),
      },
      {
        nameEn: "Kut Chap",
        nameTh: "กุดจับ",
        searchKey: normalizeForSearch("Kut Chap กุดจับ"),
      },
      {
        nameEn: "Mueang Udon Thani",
        nameTh: "เมืองอุดรธานี",
        searchKey: normalizeForSearch("Mueang Udon Thani เมืองอุดรธานี"),
      },
      {
        nameEn: "Na Yung",
        nameTh: "นายูง",
        searchKey: normalizeForSearch("Na Yung นายูง"),
      },
      {
        nameEn: "Nam Som",
        nameTh: "น้ำโสม",
        searchKey: normalizeForSearch("Nam Som น้ำโสม"),
      },
      {
        nameEn: "Non Sa-at",
        nameTh: "โนนสะอาด",
        searchKey: normalizeForSearch("Non Sa-at โนนสะอาด"),
      },
      {
        nameEn: "Nong Han",
        nameTh: "หนองหาน",
        searchKey: normalizeForSearch("Nong Han หนองหาน"),
      },
      {
        nameEn: "Nong Saeng",
        nameTh: "หนองแสง",
        searchKey: normalizeForSearch("Nong Saeng หนองแสง"),
      },
      {
        nameEn: "Nong Wua So",
        nameTh: "หนองวัวซอ",
        searchKey: normalizeForSearch("Nong Wua So หนองวัวซอ"),
      },
      {
        nameEn: "Phen",
        nameTh: "เพ็ญ",
        searchKey: normalizeForSearch("Phen เพ็ญ"),
      },
      {
        nameEn: "Phibun Rak",
        nameTh: "พิบูลย์รักษ์",
        searchKey: normalizeForSearch("Phibun Rak พิบูลย์รักษ์"),
      },
      {
        nameEn: "Prachaksinlapakhom",
        nameTh: "ประจักษ์ศิลปาคม",
        searchKey: normalizeForSearch("Prachaksinlapakhom ประจักษ์ศิลปาคม"),
      },
      {
        nameEn: "Sang Khom",
        nameTh: "สร้างคอม",
        searchKey: normalizeForSearch("Sang Khom สร้างคอม"),
      },
      {
        nameEn: "Si That",
        nameTh: "ศรีธาตุ",
        searchKey: normalizeForSearch("Si That ศรีธาตุ"),
      },
      {
        nameEn: "Thung Fon",
        nameTh: "ทุ่งฝน",
        searchKey: normalizeForSearch("Thung Fon ทุ่งฝน"),
      },
      {
        nameEn: "Wang Sam Mo",
        nameTh: "วังสามหมอ",
        searchKey: normalizeForSearch("Wang Sam Mo วังสามหมอ"),
      },
    ],
  },
  {
    code: "YSO",
    nameEn: "Yasothon",
    nameTh: "ยโสธร",
    searchKey: normalizeForSearch("Yasothon ยโสธร"),
    region: "Northeast",
    districts: [
      {
        nameEn: "Kham Khuean Kaeo",
        nameTh: "คำเขื่อนแก้ว",
        searchKey: normalizeForSearch("Kham Khuean Kaeo คำเขื่อนแก้ว"),
      },
      {
        nameEn: "Kho Wang",
        nameTh: "ค้อวัง",
        searchKey: normalizeForSearch("Kho Wang ค้อวัง"),
      },
      {
        nameEn: "Kut Chum",
        nameTh: "กุดชุม",
        searchKey: normalizeForSearch("Kut Chum กุดชุม"),
      },
      {
        nameEn: "Loeng Nok Tha",
        nameTh: "เลิงนกทา",
        searchKey: normalizeForSearch("Loeng Nok Tha เลิงนกทา"),
      },
      {
        nameEn: "Maha Chana Chai",
        nameTh: "มหาชนะชัย",
        searchKey: normalizeForSearch("Maha Chana Chai มหาชนะชัย"),
      },
      {
        nameEn: "Mueang Yasothon",
        nameTh: "เมืองยโสธร",
        searchKey: normalizeForSearch("Mueang Yasothon เมืองยโสธร"),
      },
      {
        nameEn: "Pa Tio",
        nameTh: "ป่าติ้ว",
        searchKey: normalizeForSearch("Pa Tio ป่าติ้ว"),
      },
      {
        nameEn: "Sai Mun",
        nameTh: "ทรายมูล",
        searchKey: normalizeForSearch("Sai Mun ทรายมูล"),
      },
      {
        nameEn: "Thai Charoen",
        nameTh: "ไทยเจริญ",
        searchKey: normalizeForSearch("Thai Charoen ไทยเจริญ"),
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
        nameTh: "เกาะจันทร์",
        searchKey: normalizeForSearch("Ko Chan เกาะจันทร์"),
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
  {
    code: "CJG",
    nameEn: "Chachoengsao",
    nameTh: "ฉะเชิงเทรา",
    searchKey: normalizeForSearch("Chachoengsao ฉะเชิงเทรา"),
    region: "East",
    districts: [
      {
        nameEn: "Ban Pho",
        nameTh: "บ้านโพธิ์",
        searchKey: normalizeForSearch("Ban Pho บ้านโพธิ์"),
      },
      {
        nameEn: "Bang Khla",
        nameTh: "บางคล้า",
        searchKey: normalizeForSearch("Bang Khla บางคล้า"),
      },
      {
        nameEn: "Bang Nam Priao",
        nameTh: "บางน้ำเปรี้ยว",
        searchKey: normalizeForSearch("Bang Nam Priao บางน้ำเปรี้ยว"),
      },
      {
        nameEn: "Bang Pakong",
        nameTh: "บางปะกง",
        searchKey: normalizeForSearch("Bang Pakong บางปะกง"),
      },
      {
        nameEn: "Khlong Khuean",
        nameTh: "คลองเขื่อน",
        searchKey: normalizeForSearch("Khlong Khuean คลองเขื่อน"),
      },
      {
        nameEn: "Mueang Chachoengsao",
        nameTh: "เมืองฉะเชิงเทรา",
        searchKey: normalizeForSearch("Mueang Chachoengsao เมืองฉะเชิงเทรา"),
      },
      {
        nameEn: "Phanom Sarakham",
        nameTh: "พนมสารคาม",
        searchKey: normalizeForSearch("Phanom Sarakham พนมสารคาม"),
      },
      {
        nameEn: "Plaeng Yao",
        nameTh: "แปลงยาว",
        searchKey: normalizeForSearch("Plaeng Yao แปลงยาว"),
      },
      {
        nameEn: "Ratchasan",
        nameTh: "ราชสาส์น",
        searchKey: normalizeForSearch("Ratchasan ราชสาส์น"),
      },
      {
        nameEn: "Sanam Chai Khet",
        nameTh: "สนามชัยเขต",
        searchKey: normalizeForSearch("Sanam Chai Khet สนามชัยเขต"),
      },
      {
        nameEn: "Tha Takiap",
        nameTh: "ท่าตะเกียบ",
        searchKey: normalizeForSearch("Tha Takiap ท่าตะเกียบ"),
      },
    ],
  },
  {
    code: "CTB",
    nameEn: "Chanthaburi",
    nameTh: "จันทบุรี",
    searchKey: normalizeForSearch("Chanthaburi จันทบุรี"),
    region: "East",
    districts: [
      {
        nameEn: "Kaeng Hang Maeo",
        nameTh: "แก่งหางแมว",
        searchKey: normalizeForSearch("Kaeng Hang Maeo แก่งหางแมว"),
      },
      {
        nameEn: "Khao Khitchakut",
        nameTh: "เขาคิชฌกูฏ",
        searchKey: normalizeForSearch("Khao Khitchakut เขาคิชฌกูฏ"),
      },
      {
        nameEn: "Khlung",
        nameTh: "ขลุง",
        searchKey: normalizeForSearch("Khlung ขลุง"),
      },
      {
        nameEn: "Laem Sing",
        nameTh: "แหลมสิงห์",
        searchKey: normalizeForSearch("Laem Sing แหลมสิงห์"),
      },
      {
        nameEn: "Makham",
        nameTh: "มะขาม",
        searchKey: normalizeForSearch("Makham มะขาม"),
      },
      {
        nameEn: "Mueang Chanthaburi",
        nameTh: "เมืองจันทบุรี",
        searchKey: normalizeForSearch("Mueang Chanthaburi เมืองจันทบุรี"),
      },
      {
        nameEn: "Na Yai Am",
        nameTh: "นายายอาม",
        searchKey: normalizeForSearch("Na Yai Am นายายอาม"),
      },
      {
        nameEn: "Pong Nam Ron",
        nameTh: "โป่งน้ำร้อน",
        searchKey: normalizeForSearch("Pong Nam Ron โป่งน้ำร้อน"),
      },
      {
        nameEn: "Soi Dao",
        nameTh: "สอยดาว",
        searchKey: normalizeForSearch("Soi Dao สอยดาว"),
      },
      {
        nameEn: "Tha Mai",
        nameTh: "ท่าใหม่",
        searchKey: normalizeForSearch("Tha Mai ท่าใหม่"),
      },
    ],
  },
  {
    code: "PRI",
    nameEn: "Prachinburi",
    nameTh: "ปราจีนบุรี",
    searchKey: normalizeForSearch("Prachinburi ปราจีนบุรี"),
    region: "East",
    districts: [
      {
        nameEn: "Ban Sang",
        nameTh: "บ้านสร้าง",
        searchKey: normalizeForSearch("Ban Sang บ้านสร้าง"),
      },
      {
        nameEn: "Kabin Buri",
        nameTh: "กบินทร์บุรี",
        searchKey: normalizeForSearch("Kabin Buri กบินทร์บุรี"),
      },
      {
        nameEn: "Mueang Prachinburi",
        nameTh: "เมืองปราจีนบุรี",
        searchKey: normalizeForSearch("Mueang Prachinburi เมืองปราจีนบุรี"),
      },
      {
        nameEn: "Na Di",
        nameTh: "นาดี",
        searchKey: normalizeForSearch("Na Di นาดี"),
      },
      {
        nameEn: "Prachantakham",
        nameTh: "ประจันตคาม",
        searchKey: normalizeForSearch("Prachantakham ประจันตคาม"),
      },
      {
        nameEn: "Si Maha Phot",
        nameTh: "ศรีมหาโพธิ",
        searchKey: normalizeForSearch("Si Maha Phot ศรีมหาโพธิ"),
      },
      {
        nameEn: "Si Mahosot",
        nameTh: "ศรีมโหสถ",
        searchKey: normalizeForSearch("Si Mahosot ศรีมโหสถ"),
      },
    ],
  },
  {
    code: "SKE",
    nameEn: "Sa Kaeo",
    nameTh: "สระแก้ว",
    searchKey: normalizeForSearch("Sa Kaeo สระแก้ว"),
    region: "East",
    districts: [
      {
        nameEn: "Aranyaprathet",
        nameTh: "อรัญประเทศ",
        searchKey: normalizeForSearch("Aranyaprathet อรัญประเทศ"),
      },
      {
        nameEn: "Khao Chakan",
        nameTh: "เขาฉกรรจ์",
        searchKey: normalizeForSearch("Khao Chakan เขาฉกรรจ์"),
      },
      {
        nameEn: "Khlong Hat",
        nameTh: "คลองหาด",
        searchKey: normalizeForSearch("Khlong Hat คลองหาด"),
      },
      {
        nameEn: "Khok Sung",
        nameTh: "โคกสูง",
        searchKey: normalizeForSearch("Khok Sung โคกสูง"),
      },
      {
        nameEn: "Mueang Sa Kaeo",
        nameTh: "เมืองสระแก้ว",
        searchKey: normalizeForSearch("Mueang Sa Kaeo เมืองสระแก้ว"),
      },
      {
        nameEn: "Ta Phraya",
        nameTh: "ตาพระยา",
        searchKey: normalizeForSearch("Ta Phraya ตาพระยา"),
      },
      {
        nameEn: "Wang Nam Yen",
        nameTh: "วังน้ำเย็น",
        searchKey: normalizeForSearch("Wang Nam Yen วังน้ำเย็น"),
      },
      {
        nameEn: "Wang Sombun",
        nameTh: "วังสมบูรณ์",
        searchKey: normalizeForSearch("Wang Sombun วังสมบูรณ์"),
      },
      {
        nameEn: "Watthana Nakhon",
        nameTh: "วัฒนานคร",
        searchKey: normalizeForSearch("Watthana Nakhon วัฒนานคร"),
      },
    ],
  },
  {
    code: "TRT",
    nameEn: "Trat",
    nameTh: "ตราด",
    searchKey: normalizeForSearch("Trat ตราด"),
    region: "East",
    districts: [
      {
        nameEn: "Bo Rai",
        nameTh: "บ่อไร่",
        searchKey: normalizeForSearch("Bo Rai บ่อไร่"),
      },
      {
        nameEn: "Khao Saming",
        nameTh: "เขาสมิง",
        searchKey: normalizeForSearch("Khao Saming เขาสมิง"),
      },
      {
        nameEn: "Khlong Yai",
        nameTh: "คลองใหญ่",
        searchKey: normalizeForSearch("Khlong Yai คลองใหญ่"),
      },
      {
        nameEn: "Ko Chang",
        nameTh: "เกาะช้าง",
        searchKey: normalizeForSearch("Ko Chang เกาะช้าง"),
      },
      {
        nameEn: "Ko Kut",
        nameTh: "เกาะกูด",
        searchKey: normalizeForSearch("Ko Kut เกาะกูด"),
      },
      {
        nameEn: "Laem Ngop",
        nameTh: "แหลมงอบ",
        searchKey: normalizeForSearch("Laem Ngop แหลมงอบ"),
      },
      {
        nameEn: "Mueang Trat",
        nameTh: "เมืองตราด",
        searchKey: normalizeForSearch("Mueang Trat เมืองตราด"),
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
        nameTh: "เกาะพะงัน",
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
        nameTh: "ท่าฉาง",
        searchKey: normalizeForSearch("Tha Chang ท่าฉาง"),
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
  {
    code: "CPN",
    nameEn: "Chumphon",
    nameTh: "ชุมพร",
    searchKey: normalizeForSearch("Chumphon ชุมพร"),
    region: "South",
    districts: [
      {
        nameEn: "Lamae",
        nameTh: "ละแม",
        searchKey: normalizeForSearch("Lamae ละแม"),
      },
      {
        nameEn: "Lang Suan",
        nameTh: "หลังสวน",
        searchKey: normalizeForSearch("Lang Suan หลังสวน"),
      },
      {
        nameEn: "Mueang Chumphon",
        nameTh: "เมืองชุมพร",
        searchKey: normalizeForSearch("Mueang Chumphon เมืองชุมพร"),
      },
      {
        nameEn: "Pathio",
        nameTh: "ปะทิว",
        searchKey: normalizeForSearch("Pathio ปะทิว"),
      },
      {
        nameEn: "Phato",
        nameTh: "พะโต๊ะ",
        searchKey: normalizeForSearch("Phato พะโต๊ะ"),
      },
      {
        nameEn: "Sawi",
        nameTh: "สวี",
        searchKey: normalizeForSearch("Sawi สวี"),
      },
      {
        nameEn: "Tha Sae",
        nameTh: "ท่าแซะ",
        searchKey: normalizeForSearch("Tha Sae ท่าแซะ"),
      },
      {
        nameEn: "Thung Tako",
        nameTh: "ทุ่งตะโก",
        searchKey: normalizeForSearch("Thung Tako ทุ่งตะโก"),
      },
    ],
  },
  {
    code: "KRB",
    nameEn: "Krabi",
    nameTh: "กระบี่",
    searchKey: normalizeForSearch("Krabi กระบี่"),
    region: "South",
    districts: [
      {
        nameEn: "Ao Luek",
        nameTh: "อ่าวลึก",
        searchKey: normalizeForSearch("Ao Luek อ่าวลึก"),
      },
      {
        nameEn: "Khao Phanom",
        nameTh: "เขาพนม",
        searchKey: normalizeForSearch("Khao Phanom เขาพนม"),
      },
      {
        nameEn: "Khlong Thom",
        nameTh: "คลองท่อม",
        searchKey: normalizeForSearch("Khlong Thom คลองท่อม"),
      },
      {
        nameEn: "Ko Lanta",
        nameTh: "เกาะลันตา",
        searchKey: normalizeForSearch("Ko Lanta เกาะลันตา"),
      },
      {
        nameEn: "Lam Thap",
        nameTh: "ลำทับ",
        searchKey: normalizeForSearch("Lam Thap ลำทับ"),
      },
      {
        nameEn: "Mueang Krabi",
        nameTh: "เมืองกระบี่",
        searchKey: normalizeForSearch("Mueang Krabi เมืองกระบี่"),
      },
      {
        nameEn: "Nuea Khlong",
        nameTh: "เหนือคลอง",
        searchKey: normalizeForSearch("Nuea Khlong เหนือคลอง"),
      },
      {
        nameEn: "Plai Phraya",
        nameTh: "ปลายพระยา",
        searchKey: normalizeForSearch("Plai Phraya ปลายพระยา"),
      },
    ],
  },
  {
    code: "NST",
    nameEn: "Nakhon Si Thammarat",
    nameTh: "นครศรีธรรมราช",
    searchKey: normalizeForSearch("Nakhon Si Thammarat นครศรีธรรมราช"),
    region: "South",
    districts: [
      {
        nameEn: "Bang Khan",
        nameTh: "บางขัน",
        searchKey: normalizeForSearch("Bang Khan บางขัน"),
      },
      {
        nameEn: "Cha-uat",
        nameTh: "ชะอวด",
        searchKey: normalizeForSearch("Cha-uat ชะอวด"),
      },
      {
        nameEn: "Chaloem Phra Kiat",
        nameTh: "เฉลิมพระเกียรติ",
        searchKey: normalizeForSearch("Chaloem Phra Kiat เฉลิมพระเกียรติ"),
      },
      {
        nameEn: "Chang Klang",
        nameTh: "ช้างกลาง",
        searchKey: normalizeForSearch("Chang Klang ช้างกลาง"),
      },
      {
        nameEn: "Chawang",
        nameTh: "ฉวาง",
        searchKey: normalizeForSearch("Chawang ฉวาง"),
      },
      {
        nameEn: "Chian Yai",
        nameTh: "เชียรใหญ่",
        searchKey: normalizeForSearch("Chian Yai เชียรใหญ่"),
      },
      {
        nameEn: "Chulabhorn",
        nameTh: "จุฬาภรณ์",
        searchKey: normalizeForSearch("Chulabhorn จุฬาภรณ์"),
      },
      {
        nameEn: "Hua Sai",
        nameTh: "หัวไทร",
        searchKey: normalizeForSearch("Hua Sai หัวไทร"),
      },
      {
        nameEn: "Khanom",
        nameTh: "ขนอม",
        searchKey: normalizeForSearch("Khanom ขนอม"),
      },
      {
        nameEn: "Lan Saka",
        nameTh: "ลานสกา",
        searchKey: normalizeForSearch("Lan Saka ลานสกา"),
      },
      {
        nameEn: "Mueang Nakhon Si Thammarat",
        nameTh: "เมืองนครศรีธรรมราช",
        searchKey: normalizeForSearch(
          "Mueang Nakhon Si Thammarat เมืองนครศรีธรรมราช",
        ),
      },
      {
        nameEn: "Na Bon",
        nameTh: "นาบอน",
        searchKey: normalizeForSearch("Na Bon นาบอน"),
      },
      {
        nameEn: "Nopphitam",
        nameTh: "นบพิตำ",
        searchKey: normalizeForSearch("Nopphitam นบพิตำ"),
      },
      {
        nameEn: "Pak Phanang",
        nameTh: "ปากพนัง",
        searchKey: normalizeForSearch("Pak Phanang ปากพนัง"),
      },
      {
        nameEn: "Phipun",
        nameTh: "พิปูน",
        searchKey: normalizeForSearch("Phipun พิปูน"),
      },
      {
        nameEn: "Phra Phrom",
        nameTh: "พระพรหม",
        searchKey: normalizeForSearch("Phra Phrom พระพรหม"),
      },
      {
        nameEn: "Phrom Khiri",
        nameTh: "พรหมคีรี",
        searchKey: normalizeForSearch("Phrom Khiri พรหมคีรี"),
      },
      {
        nameEn: "Ron Phibun",
        nameTh: "ร่อนพิบูลย์",
        searchKey: normalizeForSearch("Ron Phibun ร่อนพิบูลย์"),
      },
      {
        nameEn: "Sichon",
        nameTh: "สิชล",
        searchKey: normalizeForSearch("Sichon สิชล"),
      },
      {
        nameEn: "Tha Sala",
        nameTh: "ท่าศาลา",
        searchKey: normalizeForSearch("Tha Sala ท่าศาลา"),
      },
      {
        nameEn: "Tham Phannara",
        nameTh: "ถ้ำพรรณรา",
        searchKey: normalizeForSearch("Tham Phannara ถ้ำพรรณรา"),
      },
      {
        nameEn: "Thung Song",
        nameTh: "ทุ่งสง",
        searchKey: normalizeForSearch("Thung Song ทุ่งสง"),
      },
      {
        nameEn: "Thung Yai",
        nameTh: "ทุ่งใหญ่",
        searchKey: normalizeForSearch("Thung Yai ทุ่งใหญ่"),
      },
    ],
  },
  {
    code: "NBW",
    nameEn: "Narathiwat",
    nameTh: "นราธิวาส",
    searchKey: normalizeForSearch("Narathiwat นราธิวาส"),
    region: "South",
    districts: [
      {
        nameEn: "Bacho",
        nameTh: "บาเจาะ",
        searchKey: normalizeForSearch("Bacho บาเจาะ"),
      },
      {
        nameEn: "Chanae",
        nameTh: "จะแนะ",
        searchKey: normalizeForSearch("Chanae จะแนะ"),
      },
      {
        nameEn: "Cho-airong",
        nameTh: "เจาะไอร้อง",
        searchKey: normalizeForSearch("Cho-airong เจาะไอร้อง"),
      },
      {
        nameEn: "Mueang Narathiwat",
        nameTh: "เมืองนราธิวาส",
        searchKey: normalizeForSearch("Mueang Narathiwat เมืองนราธิวาส"),
      },
      {
        nameEn: "Ra-ngae",
        nameTh: "ระแงะ",
        searchKey: normalizeForSearch("Ra-ngae ระแงะ"),
      },
      {
        nameEn: "Rueso",
        nameTh: "รือเสาะ",
        searchKey: normalizeForSearch("Rueso รือเสาะ"),
      },
      {
        nameEn: "Si Sakhon",
        nameTh: "ศรีสาคร",
        searchKey: normalizeForSearch("Si Sakhon ศรีสาคร"),
      },
      {
        nameEn: "Su-ngai Kolok",
        nameTh: "สุไหงโก-ลก",
        searchKey: normalizeForSearch("Su-ngai Kolok สุไหงโก-ลก"),
      },
      {
        nameEn: "Su-ngai Padi",
        nameTh: "สุไหงปาดี",
        searchKey: normalizeForSearch("Su-ngai Padi สุไหงปาดี"),
      },
      {
        nameEn: "Sukhirin",
        nameTh: "สุคิริน",
        searchKey: normalizeForSearch("Sukhirin สุคิริน"),
      },
      {
        nameEn: "Tak Bai",
        nameTh: "ตากใบ",
        searchKey: normalizeForSearch("Tak Bai ตากใบ"),
      },
      {
        nameEn: "Waeng",
        nameTh: "แว้ง",
        searchKey: normalizeForSearch("Waeng แว้ง"),
      },
      {
        nameEn: "Yi-ngo",
        nameTh: "ยี่งอ",
        searchKey: normalizeForSearch("Yi-ngo ยี่งอ"),
      },
    ],
  },
  {
    code: "PTN",
    nameEn: "Pattani",
    nameTh: "ปัตตานี",
    searchKey: normalizeForSearch("Pattani ปัตตานี"),
    region: "South",
    districts: [
      {
        nameEn: "Kapho",
        nameTh: "กะพ้อ",
        searchKey: normalizeForSearch("Kapho กะพ้อ"),
      },
      {
        nameEn: "Khok Pho",
        nameTh: "โคกโพธิ์",
        searchKey: normalizeForSearch("Khok Pho โคกโพธิ์"),
      },
      {
        nameEn: "Mae Lan",
        nameTh: "แม่ลาน",
        searchKey: normalizeForSearch("Mae Lan แม่ลาน"),
      },
      {
        nameEn: "Mai Kaen",
        nameTh: "ไม้แก่น",
        searchKey: normalizeForSearch("Mai Kaen ไม้แก่น"),
      },
      {
        nameEn: "Mayo",
        nameTh: "มายอ",
        searchKey: normalizeForSearch("Mayo มายอ"),
      },
      {
        nameEn: "Mueang Pattani",
        nameTh: "เมืองปัตตานี",
        searchKey: normalizeForSearch("Mueang Pattani เมืองปัตตานี"),
      },
      {
        nameEn: "Nong Chik",
        nameTh: "หนองจิก",
        searchKey: normalizeForSearch("Nong Chik หนองจิก"),
      },
      {
        nameEn: "Panare",
        nameTh: "ปะนาเระ",
        searchKey: normalizeForSearch("Panare ปะนาเระ"),
      },
      {
        nameEn: "Sai Buri",
        nameTh: "สายบุรี",
        searchKey: normalizeForSearch("Sai Buri สายบุรี"),
      },
      {
        nameEn: "Thung Yang Daeng",
        nameTh: "ทุ่งยางแดง",
        searchKey: normalizeForSearch("Thung Yang Daeng ทุ่งยางแดง"),
      },
      {
        nameEn: "Yarang",
        nameTh: "ยะรัง",
        searchKey: normalizeForSearch("Yarang ยะรัง"),
      },
      {
        nameEn: "Yaring",
        nameTh: "ยะหริ่ง",
        searchKey: normalizeForSearch("Yaring ยะหริ่ง"),
      },
    ],
  },
  {
    code: "PNG",
    nameEn: "Phang Nga",
    nameTh: "พังงา",
    searchKey: normalizeForSearch("Phang Nga พังงา"),
    region: "South",
    districts: [
      {
        nameEn: "Kapong",
        nameTh: "กะปง",
        searchKey: normalizeForSearch("Kapong กะปง"),
      },
      {
        nameEn: "Khura Buri",
        nameTh: "คุระบุรี",
        searchKey: normalizeForSearch("Khura Buri คุระบุรี"),
      },
      {
        nameEn: "Ko Yao",
        nameTh: "เกาะยาว",
        searchKey: normalizeForSearch("Ko Yao เกาะยาว"),
      },
      {
        nameEn: "Mueang Phang Nga",
        nameTh: "เมืองพังงา",
        searchKey: normalizeForSearch("Mueang Phang Nga เมืองพังงา"),
      },
      {
        nameEn: "Takua Pa",
        nameTh: "ตะกั่วป่า",
        searchKey: normalizeForSearch("Takua Pa ตะกั่วป่า"),
      },
      {
        nameEn: "Takua Thung",
        nameTh: "ตะกั่วทุ่ง",
        searchKey: normalizeForSearch("Takua Thung ตะกั่วทุ่ง"),
      },
      {
        nameEn: "Thai Mueang",
        nameTh: "ท้ายเหมือง",
        searchKey: normalizeForSearch("Thai Mueang ท้ายเหมือง"),
      },
      {
        nameEn: "Thap Put",
        nameTh: "ทับปุด",
        searchKey: normalizeForSearch("Thap Put ทับปุด"),
      },
    ],
  },
  {
    code: "PTG",
    nameEn: "Phatthalung",
    nameTh: "พัทลุง",
    searchKey: normalizeForSearch("Phatthalung พัทลุง"),
    region: "South",
    districts: [
      {
        nameEn: "Bang Kaeo",
        nameTh: "บางแก้ว",
        searchKey: normalizeForSearch("Bang Kaeo บางแก้ว"),
      },
      {
        nameEn: "Khao Chaison",
        nameTh: "เขาชัยสน",
        searchKey: normalizeForSearch("Khao Chaison เขาชัยสน"),
      },
      {
        nameEn: "Khuan Khanun",
        nameTh: "ควนขนุน",
        searchKey: normalizeForSearch("Khuan Khanun ควนขนุน"),
      },
      {
        nameEn: "Kong Ra",
        nameTh: "กงหรา",
        searchKey: normalizeForSearch("Kong Ra กงหรา"),
      },
      {
        nameEn: "Mueang Phatthalung",
        nameTh: "เมืองพัทลุง",
        searchKey: normalizeForSearch("Mueang Phatthalung เมืองพัทลุง"),
      },
      {
        nameEn: "Pa Bon",
        nameTh: "ป่าบอน",
        searchKey: normalizeForSearch("Pa Bon ป่าบอน"),
      },
      {
        nameEn: "Pa Phayom",
        nameTh: "ป่าพะยอม",
        searchKey: normalizeForSearch("Pa Phayom ป่าพะยอม"),
      },
      {
        nameEn: "Pak Phayun",
        nameTh: "ปากพะยูน",
        searchKey: normalizeForSearch("Pak Phayun ปากพะยูน"),
      },
      {
        nameEn: "Si Banphot",
        nameTh: "ศรีบรรพต",
        searchKey: normalizeForSearch("Si Banphot ศรีบรรพต"),
      },
      {
        nameEn: "Srinagarindra",
        nameTh: "ศรีนครินทร์",
        searchKey: normalizeForSearch("Srinagarindra ศรีนครินทร์"),
      },
      {
        nameEn: "Tamot",
        nameTh: "ตะโหมด",
        searchKey: normalizeForSearch("Tamot ตะโหมด"),
      },
    ],
  },
  {
    code: "RNG",
    nameEn: "Ranong",
    nameTh: "ระนอง",
    searchKey: normalizeForSearch("Ranong ระนอง"),
    region: "South",
    districts: [
      {
        nameEn: "Kapoe",
        nameTh: "กะเปอร์",
        searchKey: normalizeForSearch("Kapoe กะเปอร์"),
      },
      {
        nameEn: "Kra Buri",
        nameTh: "กระบุรี",
        searchKey: normalizeForSearch("Kra Buri กระบุรี"),
      },
      {
        nameEn: "La-un",
        nameTh: "ละอุ่น",
        searchKey: normalizeForSearch("La-un ละอุ่น"),
      },
      {
        nameEn: "Mueang Ranong",
        nameTh: "เมืองระนอง",
        searchKey: normalizeForSearch("Mueang Ranong เมืองระนอง"),
      },
      {
        nameEn: "Suk Samran",
        nameTh: "สุขสำราญ",
        searchKey: normalizeForSearch("Suk Samran สุขสำราญ"),
      },
    ],
  },
  {
    code: "STN",
    nameEn: "Satun",
    nameTh: "สตูล",
    searchKey: normalizeForSearch("Satun สตูล"),
    region: "South",
    districts: [
      {
        nameEn: "Khuan Don",
        nameTh: "ควนโดน",
        searchKey: normalizeForSearch("Khuan Don ควนโดน"),
      },
      {
        nameEn: "Khuan Kalong",
        nameTh: "ควนกาหลง",
        searchKey: normalizeForSearch("Khuan Kalong ควนกาหลง"),
      },
      {
        nameEn: "La-ngu",
        nameTh: "ละงู",
        searchKey: normalizeForSearch("La-ngu ละงู"),
      },
      {
        nameEn: "Manang",
        nameTh: "มะนัง",
        searchKey: normalizeForSearch("Manang มะนัง"),
      },
      {
        nameEn: "Mueang Satun",
        nameTh: "เมืองสตูล",
        searchKey: normalizeForSearch("Mueang Satun เมืองสตูล"),
      },
      {
        nameEn: "Tha Phae",
        nameTh: "ท่าแพ",
        searchKey: normalizeForSearch("Tha Phae ท่าแพ"),
      },
      {
        nameEn: "Thung Wa",
        nameTh: "ทุ่งหว้า",
        searchKey: normalizeForSearch("Thung Wa ทุ่งหว้า"),
      },
    ],
  },
  {
    code: "SGL",
    nameEn: "Songkhla",
    nameTh: "สงขลา",
    searchKey: normalizeForSearch("Songkhla สงขลา"),
    region: "South",
    districts: [
      {
        nameEn: "Bang Klam",
        nameTh: "บางกล่ำ",
        searchKey: normalizeForSearch("Bang Klam บางกล่ำ"),
      },
      {
        nameEn: "Chana",
        nameTh: "จะนะ",
        searchKey: normalizeForSearch("Chana จะนะ"),
      },
      {
        nameEn: "Hat Yai",
        nameTh: "หาดใหญ่",
        searchKey: normalizeForSearch("Hat Yai หาดใหญ่"),
      },
      {
        nameEn: "Khlong Hoi Khong",
        nameTh: "คลองหอยโข่ง",
        searchKey: normalizeForSearch("Khlong Hoi Khong คลองหอยโข่ง"),
      },
      {
        nameEn: "Khuan Niang",
        nameTh: "ควนเนียง",
        searchKey: normalizeForSearch("Khuan Niang ควนเนียง"),
      },
      {
        nameEn: "Krasae Sin",
        nameTh: "กระแสสินธุ์",
        searchKey: normalizeForSearch("Krasae Sin กระแสสินธุ์"),
      },
      {
        nameEn: "Mueang Songkhla",
        nameTh: "เมืองสงขลา",
        searchKey: normalizeForSearch("Mueang Songkhla เมืองสงขลา"),
      },
      {
        nameEn: "Na Mom",
        nameTh: "นาหม่อม",
        searchKey: normalizeForSearch("Na Mom นาหม่อม"),
      },
      {
        nameEn: "Na Thawi",
        nameTh: "นาทวี",
        searchKey: normalizeForSearch("Na Thawi นาทวี"),
      },
      {
        nameEn: "Ranot",
        nameTh: "ระโนด",
        searchKey: normalizeForSearch("Ranot ระโนด"),
      },
      {
        nameEn: "Rattaphum",
        nameTh: "รัตภูมิ",
        searchKey: normalizeForSearch("Rattaphum รัตภูมิ"),
      },
      {
        nameEn: "Saba Yoi",
        nameTh: "สะบ้าย้อย",
        searchKey: normalizeForSearch("Saba Yoi สะบ้าย้อย"),
      },
      {
        nameEn: "Sadao",
        nameTh: "สะเดา",
        searchKey: normalizeForSearch("Sadao สะเดา"),
      },
      {
        nameEn: "Sathing Phra",
        nameTh: "สทิงพระ",
        searchKey: normalizeForSearch("Sathing Phra สทิงพระ"),
      },
      {
        nameEn: "Singhanakhon",
        nameTh: "สิงหนคร",
        searchKey: normalizeForSearch("Singhanakhon สิงหนคร"),
      },
      {
        nameEn: "Thepha",
        nameTh: "เทพา",
        searchKey: normalizeForSearch("Thepha เทพา"),
      },
    ],
  },
  {
    code: "TRG",
    nameEn: "Trang",
    nameTh: "ตรัง",
    searchKey: normalizeForSearch("Trang ตรัง"),
    region: "South",
    districts: [
      {
        nameEn: "Hat Samran",
        nameTh: "หาดสำราญ",
        searchKey: normalizeForSearch("Hat Samran หาดสำราญ"),
      },
      {
        nameEn: "Huai Yot",
        nameTh: "ห้วยยอด",
        searchKey: normalizeForSearch("Huai Yot ห้วยยอด"),
      },
      {
        nameEn: "Kantang",
        nameTh: "กันตัง",
        searchKey: normalizeForSearch("Kantang กันตัง"),
      },
      {
        nameEn: "Mueang Trang",
        nameTh: "เมืองตรัง",
        searchKey: normalizeForSearch("Mueang Trang เมืองตรัง"),
      },
      {
        nameEn: "Na Yong",
        nameTh: "นาโยง",
        searchKey: normalizeForSearch("Na Yong นาโยง"),
      },
      {
        nameEn: "Palian",
        nameTh: "ปะเหลียน",
        searchKey: normalizeForSearch("Palian ปะเหลียน"),
      },
      {
        nameEn: "Ratsada",
        nameTh: "รัษฎา",
        searchKey: normalizeForSearch("Ratsada รัษฎา"),
      },
      {
        nameEn: "Sikao",
        nameTh: "สิเกา",
        searchKey: normalizeForSearch("Sikao สิเกา"),
      },
      {
        nameEn: "Wang Wiset",
        nameTh: "วังวิเศษ",
        searchKey: normalizeForSearch("Wang Wiset วังวิเศษ"),
      },
      {
        nameEn: "Yan Ta Khao",
        nameTh: "ย่านตาขาว",
        searchKey: normalizeForSearch("Yan Ta Khao ย่านตาขาว"),
      },
    ],
  },
  {
    code: "YLA",
    nameEn: "Yala",
    nameTh: "ยะลา",
    searchKey: normalizeForSearch("Yala ยะลา"),
    region: "South",
    districts: [
      {
        nameEn: "Bannang Sata",
        nameTh: "บันนังสตา",
        searchKey: normalizeForSearch("Bannang Sata บันนังสตา"),
      },
      {
        nameEn: "Betong",
        nameTh: "เบตง",
        searchKey: normalizeForSearch("Betong เบตง"),
      },
      {
        nameEn: "Kabang",
        nameTh: "กาบัง",
        searchKey: normalizeForSearch("Kabang กาบัง"),
      },
      {
        nameEn: "Krong Pinang",
        nameTh: "กรงปินัง",
        searchKey: normalizeForSearch("Krong Pinang กรงปินัง"),
      },
      {
        nameEn: "Mueang Yala",
        nameTh: "เมืองยะลา",
        searchKey: normalizeForSearch("Mueang Yala เมืองยะลา"),
      },
      {
        nameEn: "Raman",
        nameTh: "รามัน",
        searchKey: normalizeForSearch("Raman รามัน"),
      },
      {
        nameEn: "Than To",
        nameTh: "ธารโต",
        searchKey: normalizeForSearch("Than To ธารโต"),
      },
      {
        nameEn: "Yaha",
        nameTh: "ยะหา",
        searchKey: normalizeForSearch("Yaha ยะหา"),
      },
    ],
  },
  // ===== WEST REGION (5 provinces) =====
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
        nameEn: "Umphang",
        nameTh: "อุ้มผาง",
        searchKey: normalizeForSearch("Umphang อุ้มผาง"),
      },
      {
        nameEn: "Wang Chao",
        nameTh: "วังเจ้า",
        searchKey: normalizeForSearch("Wang Chao วังเจ้า"),
      },
    ],
  },
  {
    code: "PCR",
    nameEn: "Phetchaburi",
    nameTh: "เพชรบุรี",
    searchKey: normalizeForSearch("Phetchaburi เพชรบุรี"),
    region: "West",
    districts: [
      {
        nameEn: "Ban Laem",
        nameTh: "บ้านแหลม",
        searchKey: normalizeForSearch("Ban Laem บ้านแหลม"),
      },
      {
        nameEn: "Ban Lat",
        nameTh: "บ้านลาด",
        searchKey: normalizeForSearch("Ban Lat บ้านลาด"),
      },
      {
        nameEn: "Cha-am",
        nameTh: "ชะอำ",
        searchKey: normalizeForSearch("Cha-am ชะอำ"),
      },
      {
        nameEn: "Kaeng Krachan",
        nameTh: "แก่งกระจาน",
        searchKey: normalizeForSearch("Kaeng Krachan แก่งกระจาน"),
      },
      {
        nameEn: "Khao Yoi",
        nameTh: "เขาย้อย",
        searchKey: normalizeForSearch("Khao Yoi เขาย้อย"),
      },
      {
        nameEn: "Mueang Phetchaburi",
        nameTh: "เมืองเพชรบุรี",
        searchKey: normalizeForSearch("Mueang Phetchaburi เมืองเพชรบุรี"),
      },
      {
        nameEn: "Nong Ya Plong",
        nameTh: "หนองหญ้าปล้อง",
        searchKey: normalizeForSearch("Nong Ya Plong หนองหญ้าปล้อง"),
      },
      {
        nameEn: "Tha Yang",
        nameTh: "ท่ายาง",
        searchKey: normalizeForSearch("Tha Yang ท่ายาง"),
      },
    ],
  },
  {
    code: "PKK",
    nameEn: "Prachuap Khiri Khan",
    nameTh: "ประจวบคีรีขันธ์",
    searchKey: normalizeForSearch("Prachuap Khiri Khan ประจวบคีรีขันธ์"),
    region: "West",
    districts: [
      {
        nameEn: "Bang Saphan",
        nameTh: "บางสะพาน",
        searchKey: normalizeForSearch("Bang Saphan บางสะพาน"),
      },
      {
        nameEn: "Bang Saphan Noi",
        nameTh: "บางสะพานน้อย",
        searchKey: normalizeForSearch("Bang Saphan Noi บางสะพานน้อย"),
      },
      {
        nameEn: "Hua Hin",
        nameTh: "หัวหิน",
        searchKey: normalizeForSearch("Hua Hin หัวหิน"),
      },
      {
        nameEn: "Kui Buri",
        nameTh: "กุยบุรี",
        searchKey: normalizeForSearch("Kui Buri กุยบุรี"),
      },
      {
        nameEn: "Mueang Prachuap Khiri Khan",
        nameTh: "เมืองประจวบคีรีขันธ์",
        searchKey: normalizeForSearch(
          "Mueang Prachuap Khiri Khan เมืองประจวบคีรีขันธ์",
        ),
      },
      {
        nameEn: "Pran Buri",
        nameTh: "ปราณบุรี",
        searchKey: normalizeForSearch("Pran Buri ปราณบุรี"),
      },
      {
        nameEn: "Sam Roi Yot",
        nameTh: "สามร้อยยอด",
        searchKey: normalizeForSearch("Sam Roi Yot สามร้อยยอด"),
      },
      {
        nameEn: "Thap Sakae",
        nameTh: "ทับสะแก",
        searchKey: normalizeForSearch("Thap Sakae ทับสะแก"),
      },
    ],
  },
  {
    code: "RCB",
    nameEn: "Ratchaburi",
    nameTh: "ราชบุรี",
    searchKey: normalizeForSearch("Ratchaburi ราชบุรี"),
    region: "West",
    districts: [
      {
        nameEn: "Ban Kha",
        nameTh: "บ้านคา",
        searchKey: normalizeForSearch("Ban Kha บ้านคา"),
      },
      {
        nameEn: "Ban Pong",
        nameTh: "บ้านโป่ง",
        searchKey: normalizeForSearch("Ban Pong บ้านโป่ง"),
      },
      {
        nameEn: "Bang Phae",
        nameTh: "บางแพ",
        searchKey: normalizeForSearch("Bang Phae บางแพ"),
      },
      {
        nameEn: "Chom Bueng",
        nameTh: "จอมบึง",
        searchKey: normalizeForSearch("Chom Bueng จอมบึง"),
      },
      {
        nameEn: "Damnoen Saduak",
        nameTh: "ดำเนินสะดวก",
        searchKey: normalizeForSearch("Damnoen Saduak ดำเนินสะดวก"),
      },
      {
        nameEn: "Mueang Ratchaburi",
        nameTh: "เมืองราชบุรี",
        searchKey: normalizeForSearch("Mueang Ratchaburi เมืองราชบุรี"),
      },
      {
        nameEn: "Pak Tho",
        nameTh: "ปากท่อ",
        searchKey: normalizeForSearch("Pak Tho ปากท่อ"),
      },
      {
        nameEn: "Photharam",
        nameTh: "โพธาราม",
        searchKey: normalizeForSearch("Photharam โพธาราม"),
      },
      {
        nameEn: "Suan Phueng",
        nameTh: "สวนผึ้ง",
        searchKey: normalizeForSearch("Suan Phueng สวนผึ้ง"),
      },
      {
        nameEn: "Wat Phleng",
        nameTh: "วัดเพลง",
        searchKey: normalizeForSearch("Wat Phleng วัดเพลง"),
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
