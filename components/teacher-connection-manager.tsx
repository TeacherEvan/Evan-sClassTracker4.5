/* eslint-disable */
// @ts-nocheck
// TODO: This component is under development - api.teacherSchools is not yet exported from Convex
"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import type { User } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { Link2, Unlink, Users } from "lucide-react";
import { useMemo, useState } from "react";

interface TeacherConnectionManagerProps {
    currentUser: User;
}

export function TeacherConnectionManager({ currentUser }: TeacherConnectionManagerProps) {
    const { t } = useLanguage();
    
    // Get school ID (for moderators, use their assigned school)
    const schoolId = currentUser.role === "moderator" ? currentUser.schoolId : null;

    // For admins, allow school selection
    const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | "">(
        schoolId || ""
    );

    const schools = useQuery(api.schools.list, {});
    const allTeachers = useQuery(api.users.list, {});
    
    // TODO: Uncomment when api.teacherSchools is added to Convex exports
    // const connectedTeachers = useQuery(
    //     selectedSchoolId
    //         ? api.teacherSchools.getTeachersForSchool
    //         : "skip",
    //     selectedSchoolId
    //         ? { schoolId: selectedSchoolId as Id<"schools">, userId: currentUser._id }
    //         : "skip"
    // );
    const connectedTeachers: Array<{
        connectionId: string;
        username: string;
        teacherId: string;
        connectedAt: number;
    }> | undefined = undefined;

    // const connectTeacher = useMutation(api.teacherSchools.connect);
    // const disconnectTeacher = useMutation(api.teacherSchools.disconnect);
    const connectTeacher = async (_args: any) => {
        throw new Error("Feature not yet implemented - api.teacherSchools not exported from Convex");
    };
    const disconnectTeacher = async (_args: any) => {
        throw new Error("Feature not yet implemented - api.teacherSchools not exported from Convex");
    };

    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState<Id<"users"> | "">("");

    // Filter teachers who have teacher role
    const teacherUsers = useMemo(() => {
        return allTeachers?.filter((u) => u.role === "teacher") || [];
    }, [allTeachers]);

    // Get connected teacher IDs for quick lookup
    const connectedTeacherIds = useMemo(() => {
        return new Set((connectedTeachers || []).map((ct: { teacherId: string }) => ct.teacherId));
    }, [connectedTeachers]);

    // Available teachers (not yet connected)
    const availableTeachers = useMemo(() => {
        return teacherUsers.filter((t) => !connectedTeacherIds.has(t._id));
    }, [teacherUsers, connectedTeacherIds]);
    
    // Only moderators and admins can use this component
    if (currentUser.role !== "moderator" && currentUser.role !== "admin") {
        return null;
    }

    // Moderators must have a schoolId
    if (currentUser.role === "moderator" && !currentUser.schoolId) {
        return (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                    {t(
                        "You must be assigned to a school to manage teacher connections.",
                        "คุณต้องได้รับมอบหมายให้เป็นของโรงเรียนเพื่อจัดการการเชื่อมต่อครู"
                    )}
                </p>
            </div>
        );
    }

    // TODO: Feature not yet implemented
    if (true) {  // Always return early until teacherSchools API is exported
        return (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                    {t(
                        "⚠️ This feature is under development. The teacherSchools API is not yet exported from Convex.",
                        "⚠️ ฟีเจอร์นี้อยู่ระหว่างการพัฒนา teacherSchools API ยังไม่ได้ถูก export จาก Convex"
                    )}
                </p>
            </div>
        );
    }

    const handleConnect = async () => {
        if (!selectedTeacherId || !selectedSchoolId) {
            toast.error(
                "Please select a teacher",
                "กรุณาเลือกครู"
            );
            return;
        }

        setIsConnecting(true);
        try {
            await connectTeacher({
                teacherId: selectedTeacherId,
                schoolId: selectedSchoolId as Id<"schools">,
                userId: currentUser._id,
            });

            toast.success(
                "Teacher connected successfully",
                "เชื่อมต่อครูสำเร็จ"
            );
            setSelectedTeacherId("");
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to connect teacher",
                err instanceof Error ? err.message : "เชื่อมต่อครูล้มเหลว"
            );
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async (teacherId: Id<"users">) => {
        if (!selectedSchoolId) return;

        const confirmed = window.confirm(
            t(
                "Are you sure you want to disconnect this teacher from the school?",
                "คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการเชื่อมต่อครูคนนี้จากโรงเรียน?"
            )
        );

        if (!confirmed) return;

        try {
            await disconnectTeacher({
                teacherId,
                schoolId: selectedSchoolId as Id<"schools">,
                userId: currentUser._id,
            });

            toast.success(
                "Teacher disconnected successfully",
                "ยกเลิกการเชื่อมต่อครูสำเร็จ"
            );
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to disconnect teacher",
                err instanceof Error ? err.message : "ยกเลิกการเชื่อมต่อครูล้มเหลว"
            );
        }
    };

    // Get school name for display
    const selectedSchool = schools?.find((s) => s._id === selectedSchoolId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t("Teacher Connection Management", "การจัดการการเชื่อมต่อครู")}
                    </h2>
                    <p className="text-sm text-gray-600">
                        {t(
                            "Connect teachers to your school to enable class bookings",
                            "เชื่อมต่อครูกับโรงเรียนของคุณเพื่อเปิดใช้งานการจองคลาส"
                        )}
                    </p>
                </div>
            </div>

            {/* School selector (admins only) */}
            {currentUser.role === "admin" && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        {t("Select School", "เลือกโรงเรียน")}
                    </label>
                    <select
                        value={selectedSchoolId}
                        onChange={(e) => setSelectedSchoolId(e.target.value as Id<"schools"> | "")}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="">
                            {t("-- Select a school --", "-- เลือกโรงเรียน --")}
                        </option>
                        {schools?.map((school) => (
                            <option key={school._id} value={school._id}>
                                {school.name} / {school.nameTh}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Show content only if school is selected */}
            {selectedSchoolId ? (
                <>
                    {/* Connect new teacher */}
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <h3 className="mb-3 text-sm font-medium text-green-900">
                            {t("Connect New Teacher", "เชื่อมต่อครูใหม่")}
                        </h3>
                        <div className="flex gap-2">
                            <select
                                value={selectedTeacherId}
                                onChange={(e) => setSelectedTeacherId(e.target.value as Id<"users"> | "")}
                                disabled={isConnecting}
                                className="flex-1 rounded-md border border-green-300 bg-white px-3 py-2 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                            >
                                <option value="">
                                    {t("-- Select a teacher --", "-- เลือกครู --")}
                                </option>
                                {availableTeachers.map((teacher) => (
                                    <option key={teacher._id} value={teacher._id}>
                                        {teacher.username}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleConnect}
                                disabled={!selectedTeacherId || isConnecting}
                                className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-300"
                            >
                                <Link2 className="h-4 w-4" />
                                {t("Connect", "เชื่อมต่อ")}
                            </button>
                        </div>
                        {availableTeachers.length === 0 && (
                            <p className="mt-2 text-sm text-green-700">
                                {t(
                                    "All teachers are already connected to this school",
                                    "ครูทุกคนได้เชื่อมต่อกับโรงเรียนนี้แล้ว"
                                )}
                            </p>
                        )}
                    </div>

                    {/* Connected teachers list */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <h3 className="mb-3 text-sm font-medium text-gray-900">
                            {t(
                                `Connected Teachers (${connectedTeachers?.length || 0})`,
                                `ครูที่เชื่อมต่อแล้ว (${connectedTeachers?.length || 0})`
                            )}
                        </h3>
                        <p className="mb-4 text-xs text-gray-600">
                            {selectedSchool?.name} / {selectedSchool?.nameTh}
                        </p>

                        {connectedTeachers && connectedTeachers.length > 0 ? (
                            <div className="space-y-2">
                                {connectedTeachers.map((ct: { connectionId: string; username: string; teacherId: string; connectedAt: number }) => (
                                    <div
                                        key={ct.connectionId}
                                        className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {ct.username}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {t("Connected:", "เชื่อมต่อเมื่อ:")}{" "}
                                                {new Date(ct.connectedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDisconnect(ct.teacherId as Id<"users">)}
                                            className="flex items-center gap-2 rounded-md bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
                                        >
                                            <Unlink className="h-4 w-4" />
                                            {t("Disconnect", "ยกเลิกการเชื่อมต่อ")}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">
                                {t(
                                    "No teachers connected to this school yet",
                                    "ยังไม่มีครูที่เชื่อมต่อกับโรงเรียนนี้"
                                )}
                            </p>
                        )}
                    </div>
                </>
            ) : currentUser.role === "admin" ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                    <p className="text-gray-600">
                        {t("Please select a school to view and manage teacher connections", "กรุณาเลือกโรงเรียนเพื่อดูและจัดการการเชื่อมต่อครู")}
                    </p>
                </div>
            ) : null}
        </div>
    );
}
