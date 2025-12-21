import type { Id } from "@/convex/_generated/dataModel";
import type { User } from "@/lib/types";

export type Student = {
  _id: Id<"students">;
  firstName: string;
  lastName: string;
  studentId: string;
  schoolId?: Id<"schools">;
  providerId?: Id<"providers">;
  guardianId?: Id<"users">;
  guardianTitle?: string;
  grade: string;
  class?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  acknowledged: boolean;
  createdBy: Id<"users">;
  createdAt: number;
  // Optional fields
  nickname?: string;
  dateOfBirth?: string;
  provinceCode?: string;
  districtName?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  secondaryParentName?: string;
  secondaryParentPhone?: string;
  allergies?: string;
  specialNeeds?: string;
  medicalNotes?: string;
  notes?: string;
};

export interface StudentManagementProps {
  currentUser: User;
}

export interface StudentFormData {
  nickname: string;
  grade: string;
  studentClass: string;
  schoolId: Id<"schools"> | "";
  providerId: Id<"providers"> | "";
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  dateOfBirth: string;
  provinceCode: string;
  districtName: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  secondaryParentName: string;
  secondaryParentPhone: string;
  allergies: string;
  specialNeeds: string;
  medicalNotes: string;
  notes: string;
}

export const INITIAL_FORM_DATA: StudentFormData = {
  nickname: "",
  grade: "",
  studentClass: "",
  schoolId: "",
  providerId: "",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  dateOfBirth: "",
  provinceCode: "",
  districtName: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  secondaryParentName: "",
  secondaryParentPhone: "",
  allergies: "",
  specialNeeds: "",
  medicalNotes: "",
  notes: "",
};
