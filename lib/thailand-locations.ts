/**
 * Thailand Administrative Location Data
 * Complete bilingual (EN/TH) mapping for dropdowns and analytics
 * 
 * Data Source: Official Thailand Administrative Structure (as of 2024, verified December 2025)
 * 
 * 
 * Structure:
 * - 6 Regions (ภาค)
 * - 77 Provinces (จังหวัด) - ALL PROVINCES INCLUDED
 * - Selected Districts (อำเภอ/เขต) - Bangkok districts + major teaching areas
 * 
 * Usage:
 * - Student area field (students.area)
 * - Location dropdowns
 * - Analytics and reporting
 * - Moderator dashboards
 * 
 * Note: Thai is for backend/moderator analytics ONLY per bilingual pattern
 */

import type { 
  ThailandRegion, 
  ThailandProvince, 
  ThailandDistrict,
  LocationOption
} from './types/locations';

// Re-export types for convenience
export type { 
  ThailandRegion, 
  ThailandProvince, 
  ThailandDistrict,
  LocationOption,
  LocationPath
} from './types/locations';

/**
 * 6 Regions of Thailand (ภาค)
 * Official geographic regions used for administrative purposes
 */
export const THAILAND_REGIONS: ThailandRegion[] = [
  {
    id: 'central',
    name: 'Central Thailand',
    nameTh: 'ภาคกลาง',
    provinces: [
      'bangkok', 'samut_prakan', 'nonthaburi', 'pathum_thani', 'phra_nakhon_si_ayutthaya',
      'ang_thong', 'lop_buri', 'sing_buri', 'chai_nat', 'saraburi', 'chon_buri', 'rayong',
      'chanthaburi', 'trat', 'chachoengsao', 'prachin_buri', 'nakhon_nayok', 'sa_kaeo',
      'nakhon_pathom', 'suphan_buri', 'samut_sakhon', 'samut_songkhram', 'phetchaburi',
      'prachuap_khiri_khan', 'kanchanaburi', 'ratchaburi'
    ]
  },
  {
    id: 'northern',
    name: 'Northern Thailand',
    nameTh: 'ภาคเหนือ',
    provinces: [
      'chiang_mai', 'chiang_rai', 'mae_hong_son', 'lampang', 'lamphun', 'uttaradit',
      'phrae', 'nan', 'phayao', 'kamphaeng_phet', 'tak', 'sukhothai', 'phitsanulok',
      'phichit', 'phetchabun', 'nakhon_sawan', 'uthai_thani'
    ]
  },
  {
    id: 'northeastern',
    name: 'Northeastern Thailand (Isan)',
    nameTh: 'ภาคตะวันออกเฉียงเหนือ',
    provinces: [
      'nakhon_ratchasima', 'buriram', 'surin', 'si_sa_ket', 'ubon_ratchathani', 
      'yasothon', 'chaiyaphum', 'amnat_charoen', 'nong_bua_lam_phu', 'khon_kaen',
      'udon_thani', 'loei', 'nong_khai', 'maha_sarakham', 'roi_et', 'kalasin',
      'sakon_nakhon', 'nakhon_phanom', 'mukdahan', 'bueng_kan'
    ]
  },
  {
    id: 'eastern',
    name: 'Eastern Thailand',
    nameTh: 'ภาคตะวันออก',
    provinces: [
      'chon_buri', 'rayong', 'chanthaburi', 'trat', 'sa_kaeo', 'prachin_buri'
    ]
  },
  {
    id: 'western',
    name: 'Western Thailand',
    nameTh: 'ภาคตะวันตก',
    provinces: [
      'kanchanaburi', 'tak', 'ratchaburi'
    ]
  },
  {
    id: 'southern',
    name: 'Southern Thailand',
    nameTh: 'ภาคใต้',
    provinces: [
      'chumphon', 'ranong', 'surat_thani', 'phang_nga', 'phuket', 'krabi', 
      'nakhon_si_thammarat', 'trang', 'phatthalung', 'satun', 'songkhla', 'pattani',
      'yala', 'narathiwat'
    ]
  }
];

/**
 * All 77 Provinces of Thailand (จังหวัด)
 * Complete list with official codes, EN/TH names, and region mapping
 */
export const THAILAND_PROVINCES: ThailandProvince[] = [
  // Central Region (26 provinces)
  { id: 'bangkok', code: '10', name: 'Bangkok', nameTh: 'กรุงเทพมหานคร', regionId: 'central', isCapital: true, commonAreas: ['bangkok_01', 'bangkok_02', 'bangkok_03', 'bangkok_04', 'bangkok_05'] },
  { id: 'samut_prakan', code: '11', name: 'Samut Prakan', nameTh: 'สมุทรปราการ', regionId: 'central' },
  { id: 'nonthaburi', code: '12', name: 'Nonthaburi', nameTh: 'นนทบุรี', regionId: 'central' },
  { id: 'pathum_thani', code: '13', name: 'Pathum Thani', nameTh: 'ปทุมธานี', regionId: 'central' },
  { id: 'phra_nakhon_si_ayutthaya', code: '14', name: 'Phra Nakhon Si Ayutthaya', nameTh: 'พระนครศรีอยุธยา', regionId: 'central' },
  { id: 'ang_thong', code: '15', name: 'Ang Thong', nameTh: 'อ่างทอง', regionId: 'central' },
  { id: 'lop_buri', code: '16', name: 'Lop Buri', nameTh: 'ลพบุรี', regionId: 'central' },
  { id: 'sing_buri', code: '17', name: 'Sing Buri', nameTh: 'สิงห์บุรี', regionId: 'central' },
  { id: 'chai_nat', code: '18', name: 'Chai Nat', nameTh: 'ชัยนาท', regionId: 'central' },
  { id: 'saraburi', code: '19', name: 'Saraburi', nameTh: 'สระบุรี', regionId: 'central' },
  { id: 'chon_buri', code: '20', name: 'Chon Buri', nameTh: 'ชลบุรี', regionId: 'central' },
  { id: 'rayong', code: '21', name: 'Rayong', nameTh: 'ระยอง', regionId: 'central' },
  { id: 'chanthaburi', code: '22', name: 'Chanthaburi', nameTh: 'จันทบุรี', regionId: 'central' },
  { id: 'trat', code: '23', name: 'Trat', nameTh: 'ตราด', regionId: 'central' },
  { id: 'chachoengsao', code: '24', name: 'Chachoengsao', nameTh: 'ฉะเชิงเทรา', regionId: 'central' },
  { id: 'prachin_buri', code: '25', name: 'Prachin Buri', nameTh: 'ปราจีนบุรี', regionId: 'central' },
  { id: 'nakhon_nayok', code: '26', name: 'Nakhon Nayok', nameTh: 'นครนายก', regionId: 'central' },
  { id: 'sa_kaeo', code: '27', name: 'Sa Kaeo', nameTh: 'สระแก้ว', regionId: 'central' },
  { id: 'nakhon_pathom', code: '73', name: 'Nakhon Pathom', nameTh: 'นครปฐม', regionId: 'central' },
  { id: 'suphan_buri', code: '72', name: 'Suphan Buri', nameTh: 'สุพรรณบุรี', regionId: 'central' },
  { id: 'samut_sakhon', code: '74', name: 'Samut Sakhon', nameTh: 'สมุทรสาคร', regionId: 'central' },
  { id: 'samut_songkhram', code: '75', name: 'Samut Songkhram', nameTh: 'สมุทรสงคราม', regionId: 'central' },
  { id: 'phetchaburi', code: '76', name: 'Phetchaburi', nameTh: 'เพชรบุรี', regionId: 'central' },
  { id: 'prachuap_khiri_khan', code: '77', name: 'Prachuap Khiri Khan', nameTh: 'ประจวบคีรีขันธ์', regionId: 'central' },
  { id: 'kanchanaburi', code: '71', name: 'Kanchanaburi', nameTh: 'กาญจนบุรี', regionId: 'central' },
  { id: 'ratchaburi', code: '70', name: 'Ratchaburi', nameTh: 'ราชบุรี', regionId: 'central' },

  // Northern Region (17 provinces)
  { id: 'chiang_mai', code: '50', name: 'Chiang Mai', nameTh: 'เชียงใหม่', regionId: 'northern', commonAreas: ['chiang_mai_01', 'chiang_mai_02'] },
  { id: 'chiang_rai', code: '57', name: 'Chiang Rai', nameTh: 'เชียงราย', regionId: 'northern' },
  { id: 'mae_hong_son', code: '58', name: 'Mae Hong Son', nameTh: 'แม่ฮ่องสอน', regionId: 'northern' },
  { id: 'lampang', code: '52', name: 'Lampang', nameTh: 'ลำปาง', regionId: 'northern' },
  { id: 'lamphun', code: '51', name: 'Lamphun', nameTh: 'ลำพูน', regionId: 'northern' },
  { id: 'uttaradit', code: '53', name: 'Uttaradit', nameTh: 'อุตรดิตถ์', regionId: 'northern' },
  { id: 'phrae', code: '54', name: 'Phrae', nameTh: 'แพร่', regionId: 'northern' },
  { id: 'nan', code: '55', name: 'Nan', nameTh: 'น่าน', regionId: 'northern' },
  { id: 'phayao', code: '56', name: 'Phayao', nameTh: 'พะเยา', regionId: 'northern' },
  { id: 'kamphaeng_phet', code: '62', name: 'Kamphaeng Phet', nameTh: 'กำแพงเพชร', regionId: 'northern' },
  { id: 'tak', code: '63', name: 'Tak', nameTh: 'ตาก', regionId: 'northern' },
  { id: 'sukhothai', code: '64', name: 'Sukhothai', nameTh: 'สุโขทัย', regionId: 'northern' },
  { id: 'phitsanulok', code: '65', name: 'Phitsanulok', nameTh: 'พิษณุโลก', regionId: 'northern' },
  { id: 'phichit', code: '66', name: 'Phichit', nameTh: 'พิจิตร', regionId: 'northern' },
  { id: 'phetchabun', code: '67', name: 'Phetchabun', nameTh: 'เพชรบูรณ์', regionId: 'northern' },
  { id: 'nakhon_sawan', code: '60', name: 'Nakhon Sawan', nameTh: 'นครสวรรค์', regionId: 'northern' },
  { id: 'uthai_thani', code: '61', name: 'Uthai Thani', nameTh: 'อุทัยธานี', regionId: 'northern' },

  // Northeastern Region (20 provinces)
  { id: 'nakhon_ratchasima', code: '30', name: 'Nakhon Ratchasima', nameTh: 'นครราชสีมา', regionId: 'northeastern' },
  { id: 'buriram', code: '31', name: 'Buriram', nameTh: 'บุรีรัมย์', regionId: 'northeastern' },
  { id: 'surin', code: '32', name: 'Surin', nameTh: 'สุรินทร์', regionId: 'northeastern' },
  { id: 'si_sa_ket', code: '33', name: 'Si Sa Ket', nameTh: 'ศรีสะเกษ', regionId: 'northeastern' },
  { id: 'ubon_ratchathani', code: '34', name: 'Ubon Ratchathani', nameTh: 'อุบลราชธานี', regionId: 'northeastern' },
  { id: 'yasothon', code: '35', name: 'Yasothon', nameTh: 'ยโสธร', regionId: 'northeastern' },
  { id: 'chaiyaphum', code: '36', name: 'Chaiyaphum', nameTh: 'ชัยภูมิ', regionId: 'northeastern' },
  { id: 'amnat_charoen', code: '37', name: 'Amnat Charoen', nameTh: 'อำนาจเจริญ', regionId: 'northeastern' },
  { id: 'nong_bua_lam_phu', code: '39', name: 'Nong Bua Lam Phu', nameTh: 'หนองบัวลำภู', regionId: 'northeastern' },
  { id: 'khon_kaen', code: '40', name: 'Khon Kaen', nameTh: 'ขอนแก่น', regionId: 'northeastern' },
  { id: 'udon_thani', code: '41', name: 'Udon Thani', nameTh: 'อุดรธานี', regionId: 'northeastern' },
  { id: 'loei', code: '42', name: 'Loei', nameTh: 'เลย', regionId: 'northeastern' },
  { id: 'nong_khai', code: '43', name: 'Nong Khai', nameTh: 'หนองคาย', regionId: 'northeastern' },
  { id: 'maha_sarakham', code: '44', name: 'Maha Sarakham', nameTh: 'มหาสารคาม', regionId: 'northeastern' },
  { id: 'roi_et', code: '45', name: 'Roi Et', nameTh: 'ร้อยเอ็ด', regionId: 'northeastern' },
  { id: 'kalasin', code: '46', name: 'Kalasin', nameTh: 'กาฬสินธุ์', regionId: 'northeastern' },
  { id: 'sakon_nakhon', code: '47', name: 'Sakon Nakhon', nameTh: 'สกลนคร', regionId: 'northeastern' },
  { id: 'nakhon_phanom', code: '48', name: 'Nakhon Phanom', nameTh: 'นครพนม', regionId: 'northeastern' },
  { id: 'mukdahan', code: '49', name: 'Mukdahan', nameTh: 'มุกดาหาร', regionId: 'northeastern' },
  { id: 'bueng_kan', code: '38', name: 'Bueng Kan', nameTh: 'บึงกาฬ', regionId: 'northeastern' },

  // Southern Region (14 provinces)
  { id: 'chumphon', code: '86', name: 'Chumphon', nameTh: 'ชุมพร', regionId: 'southern' },
  { id: 'ranong', code: '85', name: 'Ranong', nameTh: 'ระนอง', regionId: 'southern' },
  { id: 'surat_thani', code: '84', name: 'Surat Thani', nameTh: 'สุราษฎร์ธานี', regionId: 'southern' },
  { id: 'phang_nga', code: '82', name: 'Phang Nga', nameTh: 'พังงา', regionId: 'southern' },
  { id: 'phuket', code: '83', name: 'Phuket', nameTh: 'ภูเก็ต', regionId: 'southern' },
  { id: 'krabi', code: '81', name: 'Krabi', nameTh: 'กระบี่', regionId: 'southern' },
  { id: 'nakhon_si_thammarat', code: '80', name: 'Nakhon Si Thammarat', nameTh: 'นครศรีธรรมราช', regionId: 'southern' },
  { id: 'trang', code: '92', name: 'Trang', nameTh: 'ตรัง', regionId: 'southern' },
  { id: 'phatthalung', code: '93', name: 'Phatthalung', nameTh: 'พัทลุง', regionId: 'southern' },
  { id: 'satun', code: '91', name: 'Satun', nameTh: 'สตูล', regionId: 'southern' },
  { id: 'songkhla', code: '90', name: 'Songkhla', nameTh: 'สงขลา', regionId: 'southern' },
  { id: 'pattani', code: '94', name: 'Pattani', nameTh: 'ปัตตานี', regionId: 'southern' },
  { id: 'yala', code: '95', name: 'Yala', nameTh: 'ยะลา', regionId: 'southern' },
  { id: 'narathiwat', code: '96', name: 'Narathiwat', nameTh: 'นราธิวาส', regionId: 'southern' },
];

/**
 * Bangkok Districts (50 districts - เขต)
 * Complete list of all Bangkok administrative districts
 * These are the most commonly used for private tutoring
 */
export const BANGKOK_DISTRICTS: ThailandDistrict[] = [
  // Inner Bangkok (Central Business District)
  { id: 'bangkok_01', code: '1001', name: 'Phra Nakhon', nameTh: 'พระนคร', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_02', code: '1002', name: 'Dusit', nameTh: 'ดุสิต', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_03', code: '1003', name: 'Nong Chok', nameTh: 'หนองจอก', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_04', code: '1004', name: 'Bang Rak', nameTh: 'บางรัก', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_05', code: '1005', name: 'Bang Khen', nameTh: 'บางเขน', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_06', code: '1006', name: 'Bang Kapi', nameTh: 'บางกะปิ', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_07', code: '1007', name: 'Pathum Wan', nameTh: 'ปทุมวัน', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_08', code: '1008', name: 'Pom Prap Sattru Phai', nameTh: 'ป้อมปราบศัตรูพ่าย', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_09', code: '1009', name: 'Phra Khanong', nameTh: 'พระโขนง', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_10', code: '1010', name: 'Min Buri', nameTh: 'มีนบุรี', provinceId: 'bangkok', type: 'bangkok_district' },
  
  // Eastern Bangkok (Sukhumvit Area)
  { id: 'bangkok_11', code: '1011', name: 'Lat Krabang', nameTh: 'ลาดกระบัง', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_12', code: '1012', name: 'Yan Nawa', nameTh: 'ยานนาวา', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_13', code: '1013', name: 'Samphanthawong', nameTh: 'สัมพันธวงศ์', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_14', code: '1014', name: 'Phaya Thai', nameTh: 'พญาไท', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_15', code: '1015', name: 'Thon Buri', nameTh: 'ธนบุรี', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_16', code: '1016', name: 'Bangkok Yai', nameTh: 'บางกอกใหญ่', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_17', code: '1017', name: 'Huai Khwang', nameTh: 'ห้วยขวาง', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_18', code: '1018', name: 'Khlong San', nameTh: 'คลองสาน', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_19', code: '1019', name: 'Taling Chan', nameTh: 'ตลิ่งชัน', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_20', code: '1020', name: 'Bangkok Noi', nameTh: 'บางกอกน้อย', provinceId: 'bangkok', type: 'bangkok_district' },
  
  // Western Bangkok
  { id: 'bangkok_21', code: '1021', name: 'Bang Khun Thian', nameTh: 'บางขุนเทียน', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_22', code: '1022', name: 'Phasi Charoen', nameTh: 'ภาษีเจริญ', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_23', code: '1023', name: 'Nong Khaem', nameTh: 'หนองแขม', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_24', code: '1024', name: 'Rat Burana', nameTh: 'ราษฎร์บูรณะ', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_25', code: '1025', name: 'Bang Phlat', nameTh: 'บางพลัด', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_26', code: '1026', name: 'Din Daeng', nameTh: 'ดินแดง', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_27', code: '1027', name: 'Bueng Kum', nameTh: 'บึงกุ่ม', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_28', code: '1028', name: 'Sathon', nameTh: 'สาทร', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_29', code: '1029', name: 'Bang Sue', nameTh: 'บางซื่อ', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_30', code: '1030', name: 'Chatuchak', nameTh: 'จตุจักร', provinceId: 'bangkok', type: 'bangkok_district' },
  
  // Northern Bangkok
  { id: 'bangkok_31', code: '1031', name: 'Bang Kho Laem', nameTh: 'บางคอแหลม', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_32', code: '1032', name: 'Prawet', nameTh: 'ประเวศ', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_33', code: '1033', name: 'Khlong Toei', nameTh: 'คลองเตย', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_34', code: '1034', name: 'Suan Luang', nameTh: 'สวนหลวง', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_35', code: '1035', name: 'Chom Thong', nameTh: 'จอมทอง', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_36', code: '1036', name: 'Don Mueang', nameTh: 'ดอนเมือง', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_37', code: '1037', name: 'Ratchathewi', nameTh: 'ราชเทวี', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_38', code: '1038', name: 'Lat Phrao', nameTh: 'ลาดพร้าว', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_39', code: '1039', name: 'Watthana', nameTh: 'วัฒนา', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_40', code: '1040', name: 'Bang Na', nameTh: 'บางนา', provinceId: 'bangkok', type: 'bangkok_district' },
  
  // Outer Bangkok
  { id: 'bangkok_41', code: '1041', name: 'Thawi Watthana', nameTh: 'ทวีวัฒนา', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_42', code: '1042', name: 'Thung Khru', nameTh: 'ทุ่งครุ', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_43', code: '1043', name: 'Bang Bon', nameTh: 'บางบอน', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_44', code: '1044', name: 'Lak Si', nameTh: 'หลักสี่', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_45', code: '1045', name: 'Sai Mai', nameTh: 'สายไหม', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_46', code: '1046', name: 'Khan Na Yao', nameTh: 'คันนายาว', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_47', code: '1047', name: 'Saphan Sung', nameTh: 'สะพานสูง', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_48', code: '1048', name: 'Wang Thonglang', nameTh: 'วังทองหลาง', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_49', code: '1049', name: 'Khlong Sam Wa', nameTh: 'คลองสามวา', provinceId: 'bangkok', type: 'bangkok_district' },
  { id: 'bangkok_50', code: '1050', name: 'Bang Khae', nameTh: 'บางแค', provinceId: 'bangkok', type: 'bangkok_district' },
];

/**
 * Major Districts in Key Provinces
 * Selected districts in major cities for private tutoring
 */
export const MAJOR_DISTRICTS: ThailandDistrict[] = [
  // Chiang Mai (25 districts - showing major ones)
  { id: 'chiang_mai_01', name: 'Mueang Chiang Mai', nameTh: 'เมืองเชียงใหม่', provinceId: 'chiang_mai', type: 'district' },
  { id: 'chiang_mai_02', name: 'Hang Dong', nameTh: 'หางดง', provinceId: 'chiang_mai', type: 'district' },
  { id: 'chiang_mai_03', name: 'San Sai', nameTh: 'สันทราย', provinceId: 'chiang_mai', type: 'district' },
  { id: 'chiang_mai_04', name: 'Mae Rim', nameTh: 'แม่ริม', provinceId: 'chiang_mai', type: 'district' },
  { id: 'chiang_mai_05', name: 'Doi Saket', nameTh: 'ดอยสะเก็ด', provinceId: 'chiang_mai', type: 'district' },
  
  // Chiang Rai
  { id: 'chiang_rai_01', name: 'Mueang Chiang Rai', nameTh: 'เมืองเชียงราย', provinceId: 'chiang_rai', type: 'district' },
  { id: 'chiang_rai_02', name: 'Mae Sai', nameTh: 'แม่สาย', provinceId: 'chiang_rai', type: 'district' },
  
  // Chon Buri (Pattaya Area)
  { id: 'chon_buri_01', name: 'Mueang Chon Buri', nameTh: 'เมืองชลบุรี', provinceId: 'chon_buri', type: 'district' },
  { id: 'chon_buri_02', name: 'Bang Lamung (Pattaya)', nameTh: 'บางละมุง (พัทยา)', provinceId: 'chon_buri', type: 'district' },
  { id: 'chon_buri_03', name: 'Si Racha', nameTh: 'ศรีราชา', provinceId: 'chon_buri', type: 'district' },
  
  // Phuket
  { id: 'phuket_01', name: 'Mueang Phuket', nameTh: 'เมืองภูเก็ต', provinceId: 'phuket', type: 'district' },
  { id: 'phuket_02', name: 'Kathu', nameTh: 'กะทู้', provinceId: 'phuket', type: 'district' },
  { id: 'phuket_03', name: 'Thalang', nameTh: 'ถลาง', provinceId: 'phuket', type: 'district' },
  
  // Nakhon Ratchasima (Korat)
  { id: 'nakhon_ratchasima_01', name: 'Mueang Nakhon Ratchasima', nameTh: 'เมืองนครราชสีมา', provinceId: 'nakhon_ratchasima', type: 'district' },
  
  // Khon Kaen
  { id: 'khon_kaen_01', name: 'Mueang Khon Kaen', nameTh: 'เมืองขอนแก่น', provinceId: 'khon_kaen', type: 'district' },
  
  // Udon Thani
  { id: 'udon_thani_01', name: 'Mueang Udon Thani', nameTh: 'เมืองอุดรธานี', provinceId: 'udon_thani', type: 'district' },
  
  // Songkhla (Hat Yai)
  { id: 'songkhla_01', name: 'Mueang Songkhla', nameTh: 'เมืองสงขลา', provinceId: 'songkhla', type: 'district' },
  { id: 'songkhla_02', name: 'Hat Yai', nameTh: 'หาดใหญ่', provinceId: 'songkhla', type: 'district' },
];

/**
 * All districts combined for easy lookup
 */
export const THAILAND_DISTRICTS: ThailandDistrict[] = [
  ...BANGKOK_DISTRICTS,
  ...MAJOR_DISTRICTS,
];

/**
 * Helper Functions for Location Data
 */

/**
 * Get region by ID
 */
export function getRegionById(regionId: string): ThailandRegion | undefined {
  return THAILAND_REGIONS.find(r => r.id === regionId);
}

/**
 * Get province by ID
 */
export function getProvinceById(provinceId: string): ThailandProvince | undefined {
  return THAILAND_PROVINCES.find(p => p.id === provinceId);
}

/**
 * Get district by ID
 */
export function getDistrictById(districtId: string): ThailandDistrict | undefined {
  return THAILAND_DISTRICTS.find(d => d.id === districtId);
}

/**
 * Get all provinces in a region
 */
export function getProvincesByRegion(regionId: string): ThailandProvince[] {
  return THAILAND_PROVINCES.filter(p => p.regionId === regionId);
}

/**
 * Get all districts in a province
 */
export function getDistrictsByProvince(provinceId: string): ThailandDistrict[] {
  return THAILAND_DISTRICTS.filter(d => d.provinceId === provinceId);
}

/**
 * Convert provinces to dropdown options
 * Grouped by region for better UX
 */
export function getProvinceOptions(language: 'en' | 'th' = 'en'): LocationOption[] {
  return THAILAND_PROVINCES.map(province => {
    const region = getRegionById(province.regionId);
    return {
      value: province.id,
      label: language === 'en' ? province.name : province.nameTh,
      labelTh: province.nameTh,
      group: region ? (language === 'en' ? region.name : region.nameTh) : undefined,
    };
  });
}

/**
 * Convert districts to dropdown options
 * Can be filtered by province
 */
export function getDistrictOptions(
  provinceId?: string, 
  language: 'en' | 'th' = 'en'
): LocationOption[] {
  const districts = provinceId 
    ? getDistrictsByProvince(provinceId)
    : THAILAND_DISTRICTS;
  
  return districts.map(district => ({
    value: district.id,
    label: language === 'en' ? district.name : district.nameTh,
    labelTh: district.nameTh,
  }));
}

/**
 * Get Bangkok districts as dropdown options
 * Commonly used for private tutoring in Bangkok
 */
export function getBangkokDistrictOptions(language: 'en' | 'th' = 'en'): LocationOption[] {
  return BANGKOK_DISTRICTS.map(district => ({
    value: district.id,
    label: language === 'en' ? district.name : district.nameTh,
    labelTh: district.nameTh,
  }));
}

/**
 * Format full location path for display
 * Example: "Bangkok, Sukhumvit" or "Chiang Mai, Mueang"
 */
export function formatLocationPath(
  provinceId: string,
  districtId?: string,
  language: 'en' | 'th' = 'en'
): string {
  const province = getProvinceById(provinceId);
  if (!province) return '';
  
  const provinceName = language === 'en' ? province.name : province.nameTh;
  
  if (districtId) {
    const district = getDistrictById(districtId);
    if (district) {
      const districtName = language === 'en' ? district.name : district.nameTh;
      return `${provinceName}, ${districtName}`;
    }
  }
  
  return provinceName;
}

/**
 * Search locations by text (supports both EN and TH)
 */
export function searchLocations(query: string): {
  provinces: ThailandProvince[];
  districts: ThailandDistrict[];
} {
  const lowerQuery = query.toLowerCase();
  
  const provinces = THAILAND_PROVINCES.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.nameTh.includes(query)
  );
  
  const districts = THAILAND_DISTRICTS.filter(d => 
    d.name.toLowerCase().includes(lowerQuery) ||
    d.nameTh.includes(query)
  );
  
  return { provinces, districts };
}

/**
 * Validate if a location combination is valid
 */
export function isValidLocation(provinceId: string, districtId?: string): boolean {
  const province = getProvinceById(provinceId);
  if (!province) return false;
  
  if (districtId) {
    const district = getDistrictById(districtId);
    if (!district) return false;
    
    // Check if district belongs to province
    return district.provinceId === provinceId;
  }
  
  return true;
}

/**
 * Get popular teaching areas (Bangkok districts + major city centers)
 * Useful for quick selection in student forms
 */
export function getPopularTeachingAreas(language: 'en' | 'th' = 'en'): LocationOption[] {
  // Bangkok + Major provincial capitals
  const popularAreas = [
    ...BANGKOK_DISTRICTS.slice(0, 20), // Top 20 Bangkok districts
    ...MAJOR_DISTRICTS.filter(d => d.name.startsWith('Mueang')), // Provincial capitals
  ];
  
  return popularAreas.map(area => {
    const province = getProvinceById(area.provinceId);
    const displayName = language === 'en' 
      ? `${area.name}${province?.id !== 'bangkok' ? ` (${province?.name})` : ''}`
      : `${area.nameTh}${province?.id !== 'bangkok' ? ` (${province?.nameTh})` : ''}`;
    
    return {
      value: area.id,
      label: displayName,
      labelTh: area.nameTh,
      group: province ? (language === 'en' ? province.name : province.nameTh) : undefined,
    };
  });
}
