"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle, Clock, MapPin, Pencil, Plus, ToggleLeft, ToggleRight, Trash2, XCircle } from "lucide-react";
import { useState } from "react";

interface LocationManagementProps {
    userId: Id<"users">;
    schoolId?: Id<"schools">;
}

export function LocationManagement({ userId, schoolId }: LocationManagementProps) {
    const { t } = useLanguage();
    const schools = useQuery(api.schools.list);
    const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | "">(
        schoolId || ""
    );

    const locations = useQuery(
        api.locations.list,
        selectedSchoolId ? { schoolId: selectedSchoolId as Id<"schools"> } : "skip"
    );

    const createLocation = useMutation(api.locations.create);
    const updateLocation = useMutation(api.locations.update);
    const toggleActive = useMutation(api.locations.toggleActive);
    const removeLocation = useMutation(api.locations.remove);
    const approveProposal = useMutation(api.locationProposals.approveProposal);
    const rejectProposal = useMutation(api.locationProposals.rejectProposal);

    // Query pending proposals
    const pendingProposals = useQuery(
        api.locationProposals.listPendingProposals,
        { userId }
    );

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<Id<"locations"> | null>(null);
    const [name, setName] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (!selectedSchoolId) {
                throw new Error("Please select a school");
            }

            if (editingId) {
                await updateLocation({
                    id: editingId,
                    name,
                    nameTh,
                    updatedBy: userId,
                });
            } else {
                await createLocation({
                    name,
                    nameTh,
                    schoolId: selectedSchoolId as Id<"schools">,
                    createdBy: userId,
                });
            }

            // Reset form
            setName("");
            setNameTh("");
            setEditingId(null);
            setShowForm(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save location");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (location: {
        _id: Id<"locations">;
        name: string;
        nameTh: string;
    }) => {
        setEditingId(location._id);
        setName(location.name);
        setNameTh(location.nameTh);
        setShowForm(true);
    };

    const handleToggleActive = async (id: Id<"locations">) => {
        try {
            await toggleActive({ id, toggledBy: userId });
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to toggle location",
                err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสถานะสถานที่ได้"
            );
        }
    };

    const handleDelete = async (id: Id<"locations">) => {
        if (!confirm(t("Are you sure you want to delete this location?", "คุณแน่ใจหรือไม่ว่าต้องการลบสถานที่นี้?"))) {
            return;
        }

        try {
            await removeLocation({ id });
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to delete location",
                err instanceof Error ? err.message : "ไม่สามารถลบสถานที่ได้"
            );
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName("");
        setNameTh("");
        setShowForm(false);
        setError("");
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <MapPin className="w-6 h-6" />
                    {t("Location Management", "จัดการสถานที่")}
                </h2>
                {selectedSchoolId && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        {t("Add Location", "เพิ่มสถานที่")}
                    </button>
                )}
            </div>

            {/* School Selector */}
            {!schoolId && (
                <div className="mb-6">
                    <label htmlFor="school" className="block text-sm font-medium mb-2">
                        {t("Select School", "เลือกโรงเรียน")}
                    </label>
                    <select
                        id="school"
                        value={selectedSchoolId}
                        onChange={(e) => setSelectedSchoolId(e.target.value as Id<"schools"> | "")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
                    >
                        <option value="">{t("Select a school", "เลือกโรงเรียน")}</option>
                        {schools?.map((school) => (
                            <option key={school._id} value={school._id}>
                                {school.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Pending Proposals Section */}
            {pendingProposals && pendingProposals.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        {t("Pending Location Proposals", "สถานที่ที่รออนุมัติ")} ({pendingProposals.length})
                    </h3>
                    <div className="space-y-3">
                        {pendingProposals.map((proposal) => (
                            <div
                                key={proposal._id}
                                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="font-medium text-lg">
                                            {proposal.name} / {proposal.nameTh}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {t("School", "โรงเรียน")}: {proposal.schoolName} / {proposal.schoolNameTh}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t("Type", "ประเภท")}: {proposal.type === "guardian" ? t("Guardian", "ผู้ปกครอง") : t("School", "โรงเรียน")}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {t("Proposed by", "เสนอโดย")}: {proposal.proposerUsername}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {t("Date", "วันที่")}: {new Date(proposal.proposalDate || 0).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                if (confirm(t("Approve this location proposal?", "อนุมัติสถานที่นี้?"))) {
                                                    await approveProposal({ userId, locationId: proposal._id });
                                                }
                                            }}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {t("Approve", "อนุมัติ")}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const reason = prompt(t("Rejection reason (English):", "เหตุผลการปฏิเสธ (อังกฤษ):"));
                                                const reasonTh = prompt(t("Rejection reason (Thai):", "เหตุผลการปฏิเสธ (ไทย):"));
                                                if (reason && reasonTh) {
                                                    rejectProposal({
                                                        userId,
                                                        locationId: proposal._id,
                                                        reason,
                                                        reasonTh
                                                    });
                                                }
                                            }}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            {t("Reject", "ปฏิเสธ")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Location Form */}
            {showForm && selectedSchoolId && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4">
                        {editingId
                            ? t("Edit Location", "แก้ไขสถานที่")
                            : t("Add New Location", "เพิ่มสถานที่ใหม่")}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-2">
                                    {t("Location Name (English)", "ชื่อสถานที่ (อังกฤษ)")}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="e.g., Main Building Room 101"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="nameTh" className="block text-sm font-medium mb-2">
                                    {t("Location Name (Thai)", "ชื่อสถานที่ (ไทย)")}
                                </label>
                                <input
                                    type="text"
                                    id="nameTh"
                                    value={nameTh}
                                    onChange={(e) => setNameTh(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="เช่น อาคารหลัก ห้อง 101"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
                            >
                                {loading
                                    ? t("Saving...", "กำลังบันทึก...")
                                    : editingId
                                        ? t("Update Location", "อัปเดตสถานที่")
                                        : t("Add Location", "เพิ่มสถานที่")}
                            </button>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Locations List */}
            {selectedSchoolId && (
                <div className="space-y-3">
                    {locations?.map((location) => (
                        <div
                            key={location._id}
                            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between ${!location.isActive ? "opacity-60" : ""
                                }`}
                        >
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">{location.name}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {location.nameTh}
                                </p>
                                {!location.isActive && (
                                    <span className="text-xs text-red-600 dark:text-red-400">
                                        {t("(Inactive)", "(ไม่ใช้งาน)")}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleToggleActive(location._id)}
                                    className={`p-2 rounded-lg transition-colors ${location.isActive
                                        ? "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                                        }`}
                                    title={t(
                                        location.isActive ? "Deactivate" : "Activate",
                                        location.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"
                                    )}
                                >
                                    {location.isActive ? (
                                        <ToggleRight className="w-5 h-5" />
                                    ) : (
                                        <ToggleLeft className="w-5 h-5" />
                                    )}
                                </button>

                                <button
                                    onClick={() => handleEdit(location)}
                                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors dark:bg-blue-900/20 dark:text-blue-400"
                                    title={t("Edit", "แก้ไข")}
                                >
                                    <Pencil className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => handleDelete(location._id)}
                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors dark:bg-red-900/20 dark:text-red-400"
                                    title={t("Delete", "ลบ")}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {locations && locations.length === 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                            {t("No locations found. Add your first location above.", "ไม่พบสถานที่ เพิ่มสถานที่แรกของคุณด้านบน")}
                        </div>
                    )}
                </div>
            )}

            {!selectedSchoolId && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                    {t("Please select a school to manage locations", "กรุณาเลือกโรงเรียนเพื่อจัดการสถานที่")}
                </div>
            )}
        </div>
    );
}
