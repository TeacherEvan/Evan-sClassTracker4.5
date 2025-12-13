/**
 * Help content for the Class Tracker application
 * Provides bilingual (English/Thai) feature descriptions and guides
 *
 * MIGRATION NOTE (Nov 2025):
 * Guardian role is being migrated to the provider system.
 * Guardian-specific help content marked as DEPRECATED will be removed in Phase 3.
 * See: docs/migrations/GUARDIAN_ROLE_REMOVAL_REPORT_NOV_9_2025.md
 */

export interface HelpFeature {
  id: string;
  icon: string; // Lucide icon name
  title: string;
  titleTh: string;
  shortDescription: string;
  shortDescriptionTh: string;
  detailedDescription: string;
  detailedDescriptionTh: string;
  steps?: HelpStep[];
  roles: ("teacher" | "moderator" | "admin")[]; // Guardian role migrated to provider system (Nov 2025)
}

export interface HelpStep {
  step: number;
  description: string;
  descriptionTh: string;
  tip?: string;
  tipTh?: string;
}

export interface HelpCategory {
  id: string;
  title: string;
  titleTh: string;
  icon: string;
  features: HelpFeature[];
}

export const helpCategories: HelpCategory[] = [
  {
    id: "booking",
    title: "Class Booking",
    titleTh: "การจองชั้นเรียน",
    icon: "Calendar",
    features: [
      {
        id: "book-class",
        icon: "CalendarPlus",
        title: "Book a Class",
        titleTh: "จองชั้นเรียน",
        shortDescription: "Schedule classes with students at schools",
        shortDescriptionTh: "จัดตารางชั้นเรียนกับนักเรียนที่โรงเรียน",
        detailedDescription: "Teachers can book classes by selecting a school, student, location, date and time. The booking is sent to the school's moderator for approval. Teachers can add optional details like subject, lesson topic, duration, and preparation notes.",
        detailedDescriptionTh: "ครูสามารถจองชั้นเรียนได้โดยเลือกโรงเรียน นักเรียน สถานที่ วันที่และเวลา การจองจะถูกส่งไปยังผู้ดูแลโรงเรียนเพื่ออนุมัติ ครูสามารถเพิ่มรายละเอียดเสริมเช่น วิชา หัวข้อบทเรียน ระยะเวลา และหมายเหตุการเตรียมการ",
        steps: [
          {
            step: 1,
            description: "Click 'Classes' or 'Class Requests' tab",
            descriptionTh: "คลิกแท็บ 'ชั้นเรียน' หรือ 'คำขอชั้นเรียน'",
          },
          {
            step: 2,
            description: "Click 'Book New Class' button",
            descriptionTh: "คลิกปุ่ม 'จองชั้นเรียนใหม่'",
          },
          {
            step: 3,
            description: "Select school, student, location, and date",
            descriptionTh: "เลือกโรงเรียน นักเรียน สถานที่ และวันที่",
          },
          {
            step: 4,
            description: "Add optional details (subject, topic, duration)",
            descriptionTh: "เพิ่มรายละเอียดเสริม (วิชา หัวข้อ ระยะเวลา)",
            tip: "Adding detailed information helps moderators approve your request faster",
            tipTh: "การเพิ่มข้อมูลที่ละเอียดช่วยให้ผู้ดูแลอนุมัติคำขอของคุณได้เร็วขึ้น",
          },
          {
            step: 5,
            description: "Submit for moderator approval",
            descriptionTh: "ส่งเพื่อขออนุมัติจากผู้ดูแล",
          },
        ],
        roles: ["teacher"],
      },
      {
        id: "approve-class",
        icon: "CheckCircle",
        title: "Approve Class Bookings",
        titleTh: "อนุมัติการจองชั้นเรียน",
        shortDescription: "Review and approve teacher class requests",
        shortDescriptionTh: "ตรวจสอบและอนุมัติคำขอชั้นเรียนของครู",
        detailedDescription: "Moderators review incoming class booking requests from teachers. You can acknowledge receipt, then approve or reject bookings. Approved classes appear in the calendar. You can view all booking details including student info, location, and lesson plans.",
        detailedDescriptionTh: "ผู้ดูแลตรวจสอบคำขอจองชั้นเรียนที่เข้ามาจากครู คุณสามารถรับทราบการรับคำขอ จากนั้นอนุมัติหรือปฏิเสธการจอง ชั้นเรียนที่อนุมัติแล้วจะปรากฏในปฏิทิน คุณสามารถดูรายละเอียดการจองทั้งหมด รวมถึงข้อมูลนักเรียน สถานที่ และแผนบทเรียน",
        steps: [
          {
            step: 1,
            description: "Go to 'Class Bookings' tab",
            descriptionTh: "ไปที่แท็บ 'การจองชั้นเรียน'",
          },
          {
            step: 2,
            description: "View pending requests (yellow highlighted)",
            descriptionTh: "ดูคำขอที่รอดำเนินการ (ไฮไลท์สีเหลือง)",
          },
          {
            step: 3,
            description: "Click 'Acknowledge' to confirm receipt",
            descriptionTh: "คลิก 'รับทราบ' เพื่อยืนยันการรับคำขอ",
          },
          {
            step: 4,
            description: "Click 'Approve' or 'Reject' with optional reason",
            descriptionTh: "คลิก 'อนุมัติ' หรือ 'ปฏิเสธ' พร้อมเหตุผลเสริม",
          },
        ],
        roles: ["moderator"],
      },
      {
        id: "calendar-view",
        icon: "CalendarDays",
        title: "View Calendar",
        titleTh: "ดูปฏิทิน",
        shortDescription: "See all classes and events in calendar view",
        shortDescriptionTh: "ดูชั้นเรียนและกิจกรรมทั้งหมดในมุมมองปฏิทิน",
        detailedDescription: "The calendar displays all your classes, events, and reminders. Color-coded by status: green for approved, yellow for pending, red for rejected. Click any class to view details or make changes. The calendar supports weekly and monthly views.",
        detailedDescriptionTh: "ปฏิทินแสดงชั้นเรียน กิจกรรม และการแจ้งเตือนทั้งหมดของคุณ มีรหัสสีตามสถานะ: เขียวสำหรับอนุมัติแล้ว เหลืองสำหรับรอดำเนินการ แดงสำหรับปฏิเสธ คลิกที่ชั้นเรียนใดก็ได้เพื่อดูรายละเอียดหรือทำการเปลี่ยนแปลง ปฏิทินรองรับมุมมองรายสัปดาห์และรายเดือน",
        steps: [
          {
            step: 1,
            description: "Click 'Calendar' tab on main navigation",
            descriptionTh: "คลิกแท็บ 'ปฏิทิน' ในเมนูหลัก",
          },
          {
            step: 2,
            description: "View classes by week or navigate dates",
            descriptionTh: "ดูชั้นเรียนตามสัปดาห์หรือเลื่อนดูวันที่",
          },
          {
            step: 3,
            description: "Click any class to view full details",
            descriptionTh: "คลิกที่ชั้นเรียนใดก็ได้เพื่อดูรายละเอียดเต็ม",
          },
        ],
        roles: ["teacher", "moderator", "admin"],
      },
    ],
  },
  {
    id: "messaging",
    title: "Messages & Communication",
    titleTh: "ข้อความและการสื่อสาร",
    icon: "MessageSquare",
    features: [
      {
        id: "send-message",
        icon: "Send",
        title: "Send Messages",
        titleTh: "ส่งข้อความ",
        shortDescription: "Communicate with other users in the system",
        shortDescriptionTh: "สื่อสารกับผู้ใช้คนอื่นในระบบ",
        detailedDescription: "Send direct messages to teachers, moderators, or admins. Messages support text and file attachments. You'll receive notifications for new messages. The messaging system supports real-time delivery and read receipts.",
        detailedDescriptionTh: "ส่งข้อความโดยตรงถึงครู ผู้ดูแล หรือผู้จัดการระบบ ข้อความรองรับข้อความและไฟล์แนบ คุณจะได้รับการแจ้งเตือนสำหรับข้อความใหม่ ระบบข้อความรองรับการส่งแบบเรียลไทม์และการยืนยันการอ่าน",
        steps: [
          {
            step: 1,
            description: "Click 'Messages' tab",
            descriptionTh: "คลิกแท็บ 'ข้อความ'",
          },
          {
            step: 2,
            description: "Click 'New Message' button",
            descriptionTh: "คลิกปุ่ม 'ข้อความใหม่'",
          },
          {
            step: 3,
            description: "Select recipient and type your message",
            descriptionTh: "เลือกผู้รับและพิมพ์ข้อความของคุณ",
          },
          {
            step: 4,
            description: "Optionally attach files (documents, images)",
            descriptionTh: "เพิ่มไฟล์แนบตามต้องการ (เอกสาร รูปภาพ)",
          },
          {
            step: 5,
            description: "Click 'Send' to deliver the message",
            descriptionTh: "คลิก 'ส่ง' เพื่อส่งข้อความ",
          },
        ],
        roles: ["teacher", "moderator", "admin"],
      },
      {
        id: "notifications",
        icon: "Bell",
        title: "Notifications & Alerts",
        titleTh: "การแจ้งเตือนและข้อความเตือน",
        shortDescription: "Stay informed with real-time notifications",
        shortDescriptionTh: "อัปเดตข่าวสารด้วยการแจ้งเตือนแบบเรียลไทม์",
        detailedDescription: "Receive automatic notifications for important events: class bookings, approvals, rejections, messages, and system updates. Notifications appear as toast messages and are also listed in the notifications tab. Admins can send custom notifications to specific users or roles.",
        detailedDescriptionTh: "รับการแจ้งเตือนอัตโนมัติสำหรับเหตุการณ์สำคัญ: การจองชั้นเรียน การอนุมัติ การปฏิเสธ ข้อความ และการอัปเดตระบบ การแจ้งเตือนปรากฏเป็นข้อความแจ้งเตือนและยังแสดงในแท็บการแจ้งเตือน ผู้จัดการสามารถส่งการแจ้งเตือนแบบกำหนดเองไปยังผู้ใช้หรือบทบาทเฉพาะ",
        steps: [
          {
            step: 1,
            description: "Look for notification icon (bell) in navigation",
            descriptionTh: "มองหาไอคอนการแจ้งเตือน (กระดิ่ง) ในเมนู",
          },
          {
            step: 2,
            description: "Red badge indicates unread notifications",
            descriptionTh: "ป้ายสีแดงบ่งบอกการแจ้งเตือนที่ยังไม่ได้อ่าน",
          },
          {
            step: 3,
            description: "Click to view all notifications",
            descriptionTh: "คลิกเพื่อดูการแจ้งเตือนทั้งหมด",
          },
        ],
        roles: ["teacher", "moderator", "admin"],
      },
    ],
  },
  {
    id: "analytics",
    title: "Reports & Analytics",
    titleTh: "รายงานและการวิเคราะห์",
    icon: "BarChart3",
    features: [
      {
        id: "analytics-dashboard",
        icon: "PieChart",
        title: "Analytics Dashboard",
        titleTh: "แดชบอร์ดการวิเคราะห์",
        shortDescription: "View statistics and trends for your school",
        shortDescriptionTh: "ดูสถิติและแนวโน้มสำหรับโรงเรียนของคุณ",
        detailedDescription: "Moderators can view comprehensive analytics for their school: class counts by status, teacher performance metrics, booking trends over time, and student engagement statistics. Export data to CSV for detailed analysis.",
        detailedDescriptionTh: "ผู้ดูแลสามารถดูการวิเคราะห์ที่ครอบคลุมสำหรับโรงเรียนของพวกเขา: จำนวนชั้นเรียนตามสถานะ ตัวชี้วัดประสิทธิภาพของครู แนวโน้มการจองตามเวลา และสถิติการมีส่วนร่วมของนักเรียน ส่งออกข้อมูลเป็น CSV เพื่อการวิเคราะห์โดยละเอียด",
        steps: [
          {
            step: 1,
            description: "Click 'Analytics' tab (moderators only)",
            descriptionTh: "คลิกแท็บ 'การวิเคราะห์' (ผู้ดูแลเท่านั้น)",
          },
          {
            step: 2,
            description: "View charts and statistics",
            descriptionTh: "ดูกราฟและสถิติ",
          },
          {
            step: 3,
            description: "Filter by date range or teacher",
            descriptionTh: "กรองตามช่วงวันที่หรือครู",
          },
          {
            step: 4,
            description: "Export data using 'Export CSV' button",
            descriptionTh: "ส่งออกข้อมูลโดยใช้ปุ่ม 'ส่งออก CSV'",
          },
        ],
        roles: ["moderator", "admin"],
      },
      {
        id: "teacher-activity",
        icon: "Activity",
        title: "Teacher Activity Logs",
        titleTh: "บันทึกกิจกรรมของครู",
        shortDescription: "Monitor teacher actions and performance",
        shortDescriptionTh: "ตรวจสอบการดำเนินการและประสิทธิภาพของครู",
        detailedDescription: "Track all teacher activities including class bookings, cancellations, modifications, and messaging. View detailed logs with timestamps, reasons, and audit trails. This helps moderators understand teacher behavior patterns and workload distribution.",
        detailedDescriptionTh: "ติดตามกิจกรรมของครูทั้งหมด รวมถึงการจองชั้นเรียน การยกเลิก การแก้ไข และการส่งข้อความ ดูบันทึกโดยละเอียดพร้อมเวลา เหตุผล และการตรวจสอบ สิ่งนี้ช่วยให้ผู้ดูแลเข้าใจรูปแบบพฤติกรรมของครูและการกระจายภาระงาน",
        steps: [
          {
            step: 1,
            description: "Click 'Activity' tab (moderators only)",
            descriptionTh: "คลิกแท็บ 'กิจกรรม' (ผู้ดูแลเท่านั้น)",
          },
          {
            step: 2,
            description: "Select a teacher to view their activity",
            descriptionTh: "เลือกครูเพื่อดูกิจกรรมของพวกเขา",
          },
          {
            step: 3,
            description: "Review action history with timestamps",
            descriptionTh: "ตรวจสอบประวัติการดำเนินการพร้อมเวลา",
          },
        ],
        roles: ["moderator", "admin"],
      },
    ],
  },
  {
    id: "management",
    title: "Management & Administration",
    titleTh: "การจัดการและการบริหาร",
    icon: "Settings",
    features: [
      {
        id: "manage-students",
        icon: "Users",
        title: "Manage Students",
        titleTh: "จัดการนักเรียน",
        shortDescription: "Create and manage student profiles",
        shortDescriptionTh: "สร้างและจัดการโปรไฟล์นักเรียน",
        detailedDescription: "Add new students with bilingual names, assign them to schools or providers, and manage their information. Each student gets a unique auto-generated ID. Search and filter students by school, provider, name, or ID.",
        detailedDescriptionTh: "เพิ่มนักเรียนใหม่ด้วยชื่อสองภาษา กำหนดพวกเขาให้กับโรงเรียนหรือผู้ให้บริการ และจัดการข้อมูลของพวกเขา นักเรียนแต่ละคนจะได้รับ ID ที่สร้างอัตโนมัติที่ไม่ซ้ำ ค้นหาและกรองนักเรียนตามโรงเรียน ผู้ให้บริการ ชื่อ หรือ ID",
        steps: [
          {
            step: 1,
            description: "Click 'Students' tab",
            descriptionTh: "คลิกแท็บ 'นักเรียน'",
          },
          {
            step: 2,
            description: "Click 'Add New Student' button",
            descriptionTh: "คลิกปุ่ม 'เพิ่มนักเรียนใหม่'",
          },
          {
            step: 3,
            description: "Fill in student details (English & Thai names)",
            descriptionTh: "กรอกรายละเอียดนักเรียน (ชื่อภาษาอังกฤษและไทย)",
          },
          {
            step: 4,
            description: "Assign to a school",
            descriptionTh: "กำหนดให้กับโรงเรียน",
          },
          {
            step: 5,
            description: "Save - a unique ID will be generated automatically",
            descriptionTh: "บันทึก - ID ที่ไม่ซ้ำจะถูกสร้างอัตโนมัติ",
          },
        ],
        roles: ["moderator", "admin"],
      },
      {
        id: "manage-locations",
        icon: "MapPin",
        title: "Manage Locations",
        titleTh: "จัดการสถานที่",
        shortDescription: "Add and manage teaching locations",
        shortDescriptionTh: "เพิ่มและจัดการสถานที่สอน",
        detailedDescription: "Create location entries for where classes are held. Support both approved locations (moderator-managed) and teacher-proposed locations. Locations have bilingual names and can be assigned to specific schools or made available system-wide.",
        detailedDescriptionTh: "สร้างรายการสถานที่สำหรับที่จัดชั้นเรียน รองรับทั้งสถานที่ที่อนุมัติแล้ว (จัดการโดยผู้ดูแล) และสถานที่ที่ครูเสนอ สถานที่มีชื่อสองภาษาและสามารถกำหนดให้กับโรงเรียนเฉพาะหรือทำให้พร้อมใช้งานทั่วทั้งระบบ",
        steps: [
          {
            step: 1,
            description: "Click 'Locations' tab",
            descriptionTh: "คลิกแท็บ 'สถานที่'",
          },
          {
            step: 2,
            description: "Click 'Add Location' button",
            descriptionTh: "คลิกปุ่ม 'เพิ่มสถานที่'",
          },
          {
            step: 3,
            description: "Enter location name in both languages",
            descriptionTh: "ป้อนชื่อสถานที่ในทั้งสองภาษา",
          },
          {
            step: 4,
            description: "Assign to school or leave as system-wide",
            descriptionTh: "กำหนดให้กับโรงเรียนหรือปล่อยให้เป็นระบบทั่วไป",
          },
        ],
        roles: ["moderator", "admin"],
      },
      {
        id: "manage-users",
        icon: "UserCog",
        title: "Manage Users",
        titleTh: "จัดการผู้ใช้",
        shortDescription: "Create and manage user accounts",
        shortDescriptionTh: "สร้างและจัดการบัญชีผู้ใช้",
        detailedDescription: "Admins can create new user accounts for teachers, moderators, and other admins. Assign users to schools, set roles, and reset passwords when needed. The system generates default passwords that users must change on first login for security.",
        detailedDescriptionTh: "ผู้จัดการสามารถสร้างบัญชีผู้ใช้ใหม่สำหรับครู ผู้ดูแล และผู้จัดการคนอื่น กำหนดผู้ใช้ให้กับโรงเรียน ตั้งค่าบทบาท และรีเซ็ตรหัสผ่านเมื่อจำเป็น ระบบสร้างรหัสผ่านเริ่มต้นที่ผู้ใช้ต้องเปลี่ยนเมื่อเข้าสู่ระบบครั้งแรกเพื่อความปลอดภัย",
        steps: [
          {
            step: 1,
            description: "Click 'Users' tab (admin only)",
            descriptionTh: "คลิกแท็บ 'ผู้ใช้' (ผู้จัดการเท่านั้น)",
          },
          {
            step: 2,
            description: "Click 'Create User' button",
            descriptionTh: "คลิกปุ่ม 'สร้างผู้ใช้'",
          },
          {
            step: 3,
            description: "Enter username and select role",
            descriptionTh: "ป้อนชื่อผู้ใช้และเลือกบทบาท",
          },
          {
            step: 4,
            description: "Assign to school (if applicable)",
            descriptionTh: "กำหนดให้กับโรงเรียน (ถ้ามี)",
          },
          {
            step: 5,
            description: "Default password is 'Teacher{username}'",
            descriptionTh: "รหัสผ่านเริ่มต้นคือ 'Teacher{username}'",
            tip: "User must change password on first login",
            tipTh: "ผู้ใช้ต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก",
          },
        ],
        roles: ["admin"],
      },
      {
        id: "manage-schools",
        icon: "Building2",
        title: "Manage Schools",
        titleTh: "จัดการโรงเรียน",
        shortDescription: "Create and configure school profiles",
        shortDescriptionTh: "สร้างและกำหนดค่าโปรไฟล์โรงเรียน",
        detailedDescription: "Admins can create new schools with bilingual names and assign moderators to manage them. Each school can have its own students, locations, and class schedules. Schools serve as the organizational unit for the entire system.",
        detailedDescriptionTh: "ผู้จัดการสามารถสร้างโรงเรียนใหม่ด้วยชื่อสองภาษาและกำหนดผู้ดูแลเพื่อจัดการพวกเขา แต่ละโรงเรียนสามารถมีนักเรียน สถานที่ และตารางชั้นเรียนของตัวเองได้ โรงเรียนทำหน้าที่เป็นหน่วยองค์กรสำหรับทั้งระบบ",
        steps: [
          {
            step: 1,
            description: "Click 'Schools' tab (admin only)",
            descriptionTh: "คลิกแท็บ 'โรงเรียน' (ผู้จัดการเท่านั้น)",
          },
          {
            step: 2,
            description: "Click 'Add School' button",
            descriptionTh: "คลิกปุ่ม 'เพิ่มโรงเรียน'",
          },
          {
            step: 3,
            description: "Enter school name in both languages",
            descriptionTh: "ป้อนชื่อโรงเรียนในทั้งสองภาษา",
          },
          {
            step: 4,
            description: "Assign a moderator to manage the school",
            descriptionTh: "กำหนดผู้ดูแลเพื่อจัดการโรงเรียน",
          },
        ],
        roles: ["admin"],
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced Features",
    titleTh: "ฟีเจอร์ขั้นสูง",
    icon: "Sparkles",
    features: [
      {
        id: "teacher-helper",
        icon: "BookOpen",
        title: "Teacher's Helper",
        titleTh: "ผู้ช่วยครู",
        shortDescription: "Access teaching resources and tools",
        shortDescriptionTh: "เข้าถึงทรัพยากรการสอนและเครื่องมือ",
        detailedDescription: "Teachers can access shared teaching resources, lesson plans, worksheets, and educational materials. Admins can upload and manage resources. Resources are categorized and searchable in both languages.",
        detailedDescriptionTh: "ครูสามารถเข้าถึงทรัพยากรการสอนที่แชร์ แผนบทเรียน ใบงาน และสื่อการศึกษา ผู้จัดการสามารถอัปโหลดและจัดการทรัพยากร ทรัพยากรถูกจัดหมวดหมู่และค้นหาได้ในทั้งสองภาษา",
        steps: [
          {
            step: 1,
            description: "Click 'Teacher's Helper' tab",
            descriptionTh: "คลิกแท็บ 'ผู้ช่วยครู'",
          },
          {
            step: 2,
            description: "Browse categories or search for resources",
            descriptionTh: "เรียกดูหมวดหมู่หรือค้นหาทรัพยากร",
          },
          {
            step: 3,
            description: "Click to view or download resources",
            descriptionTh: "คลิกเพื่อดูหรือดาวน์โหลดทรัพยากร",
          },
        ],
        roles: ["teacher", "admin"],
      },
      {
        id: "events-reminders",
        icon: "Calendar",
        title: "Events & Reminders",
        titleTh: "กิจกรรมและการแจ้งเตือน",
        shortDescription: "Create events and set reminders",
        shortDescriptionTh: "สร้างกิจกรรมและตั้งการแจ้งเตือน",
        detailedDescription: "Create personal reminders or school-wide events. Set dates, times, and reminder notifications. Events can be visible to specific schools, all teachers, all moderators, or everyone. Perfect for holidays, meetings, deadlines, and important dates.",
        detailedDescriptionTh: "สร้างการแจ้งเตือนส่วนตัวหรือกิจกรรมทั่วทั้งโรงเรียน ตั้งวันที่ เวลา และการแจ้งเตือน กิจกรรมสามารถมองเห็นได้สำหรับโรงเรียนเฉพาะ ครูทั้งหมด ผู้ดูแลทั้งหมด หรือทุกคน เหมาะสำหรับวันหยุด การประชุม กำหนดเวลา และวันที่สำคัญ",
        steps: [
          {
            step: 1,
            description: "Click 'Events & Reminders' tab",
            descriptionTh: "คลิกแท็บ 'กิจกรรมและการแจ้งเตือน'",
          },
          {
            step: 2,
            description: "Click 'Create Event' or 'Create Reminder'",
            descriptionTh: "คลิก 'สร้างกิจกรรม' หรือ 'สร้างการแจ้งเตือน'",
          },
          {
            step: 3,
            description: "Fill in event details and visibility settings",
            descriptionTh: "กรอกรายละเอียดกิจกรรมและการตั้งค่าการมองเห็น",
          },
          {
            step: 4,
            description: "Set optional reminder time",
            descriptionTh: "ตั้งเวลาแจ้งเตือนเสริม",
          },
        ],
        roles: ["teacher", "moderator", "admin"],
      },
      {
        id: "post-class-notes",
        icon: "FileText",
        title: "Post-Class Notes",
        titleTh: "บันทึกหลังชั้นเรียน",
        shortDescription: "Document class outcomes and feedback",
        shortDescriptionTh: "บันทึกผลลัพธ์และความคิดเห็นของชั้นเรียน",
        detailedDescription: "After completing a class, teachers can add notes about what was covered, student progress, homework assigned, and any issues or highlights. These notes help track student development and maintain teaching quality.",
        detailedDescriptionTh: "หลังจากเสร็จสิ้นชั้นเรียน ครูสามารถเพิ่มบันทึกเกี่ยวกับสิ่งที่ครอบคลุม ความก้าวหน้าของนักเรียน การบ้านที่มอบหมาย และปัญหาหรือไฮไลท์ใด ๆ บันทึกเหล่านี้ช่วยติดตามการพัฒนานักเรียนและรักษาคุณภาพการสอน",
        steps: [
          {
            step: 1,
            description: "Complete a scheduled class",
            descriptionTh: "เสร็จสิ้นชั้นเรียนที่กำหนดไว้",
          },
          {
            step: 2,
            description: "A prompt will appear to add notes",
            descriptionTh: "จะมีการแจ้งให้เพิ่มบันทึก",
          },
          {
            step: 3,
            description: "Fill in class summary and feedback",
            descriptionTh: "กรอกสรุปชั้นเรียนและความคิดเห็น",
          },
          {
            step: 4,
            description: "Submit notes for record keeping",
            descriptionTh: "ส่งบันทึกเพื่อเก็บบันทึก",
          },
        ],
        roles: ["teacher"],
      },
      {
        id: "contact-admin",
        icon: "MessageCircle",
        title: "Contact Admin",
        titleTh: "ติดต่อผู้จัดการ",
        shortDescription: "Report issues or request help from administrators",
        shortDescriptionTh: "รายงานปัญหาหรือขอความช่วยเหลือจากผู้จัดการ",
        detailedDescription: "Have a problem or need help? Use the contact admin feature to send a direct request to system administrators. Attach files if needed. Admins receive notifications and can respond to your request. Track the status of your requests.",
        detailedDescriptionTh: "มีปัญหาหรือต้องการความช่วยเหลือ? ใช้ฟีเจอร์ติดต่อผู้จัดการเพื่อส่งคำขอโดยตรงไปยังผู้จัดการระบบ แนบไฟล์ได้หากจำเป็น ผู้จัดการได้รับการแจ้งเตือนและสามารถตอบกลับคำขอของคุณ ติดตามสถานะคำขอของคุณ",
        steps: [
          {
            step: 1,
            description: "Click the 'Contact Admin' button (top right)",
            descriptionTh: "คลิกปุ่ม 'ติดต่อผู้จัดการ' (มุมขวาบน)",
          },
          {
            step: 2,
            description: "Select issue type and write description",
            descriptionTh: "เลือกประเภทปัญหาและเขียนคำอธิบาย",
          },
          {
            step: 3,
            description: "Optionally attach screenshots or documents",
            descriptionTh: "เพิ่มภาพหน้าจอหรือเอกสารตามต้องการ",
          },
          {
            step: 4,
            description: "Submit request and wait for admin response",
            descriptionTh: "ส่งคำขอและรอการตอบกลับจากผู้จัดการ",
          },
        ],
        roles: ["teacher", "moderator"],
      },
    ],
  },
];

/**
 * Get features relevant to a specific user role
 */
export function getHelpForRole(role: "teacher" | "moderator" | "admin"): HelpCategory[] {
  return helpCategories.map(category => ({
    ...category,
    features: category.features.filter(feature => feature.roles.includes(role)),
  })).filter(category => category.features.length > 0);
}

/**
 * Get a specific feature by ID
 */
export function getHelpFeatureById(featureId: string): HelpFeature | undefined {
  for (const category of helpCategories) {
    const feature = category.features.find(f => f.id === featureId);
    if (feature) {
      return feature;
    }
  }
  return undefined;
}
