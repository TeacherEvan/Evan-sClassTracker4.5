"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle, Clock, MapPin, Pencil, Plus, ToggleLeft, ToggleRight, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { PaginatedList } from "./paginated-list";

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

    // Confirmation states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState<Id<"locations"> | null>(null);
    const [proposalToApprove, setProposalToApprove] = useState<Id<"locations"> | null>(null);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);

    // Rejection Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectReasonTh, setRejectReasonTh] = useState("");
    const [selectedProposalId, setSelectedProposalId] = useState<Id<"locations"> | null>(null);

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

    const handleDelete = (id: Id<"locations">) => {
        setLocationToDelete(id);
        setShowDeleteConfirm(true);
    };

    const executeDelete = async () => {
        if (!locationToDelete) return;

        try {
            await removeLocation({ id: locationToDelete });
            setShowDeleteConfirm(false);
            setLocationToDelete(null);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to delete location",
                err instanceof Error ? err.message : "ไม่สามารถลบสถานที่ได้"
            );
        }
    };

    const handleApprove = (id: Id<"locations">) => {
        setProposalToApprove(id);
        setShowApproveConfirm(true);
    };

    const executeApprove = async () => {
        if (!proposalToApprove) return;

        try {
            await approveProposal({ userId, locationId: proposalToApprove });
            setShowApproveConfirm(false);
            setProposalToApprove(null);
        } catch (err) {
            toast.error("Failed to approve proposal", "อนุมัติไม่สำเร็จ");
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName("");
        setNameTh("");
        setShowForm(false);
        setError("");
    };

    const handleRejectClick = (proposalId: Id<"locations">) => {
        setSelectedProposalId(proposalId);
        setShowRejectModal(true);
    };

    const executeReject = async () => {
        if (!selectedProposalId) return;
        if (!rejectReason.trim() && !rejectReasonTh.trim()) {
            toast.error("Please provide a reason", "กรุณาระบุเหตุผล");
            return;
        }

        try {
            await rejectProposal({
                userId,
                locationId: selectedProposalId,
                reason: rejectReason,
                reasonTh: rejectReasonTh
            });
            toast.success("Proposal rejected", "ปฏิเสธข้อเสนอแล้ว");
            setShowRejectModal(false);
            setRejectReason("");
            setRejectReasonTh("");
            setSelectedProposalId(null);
        } catch (err) {
            toast.error("Failed to reject", "ไม่สามารถปฏิเสธได้");
        }
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
                                            onClick={() => handleApprove(proposal._id)}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {t("Approve", "อนุมัติ")}
                                        </button>
                                        <button
                                            onClick={() => handleRejectClick(proposal._id)}
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
                    {locations && locations.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                            {t("No locations found. Add your first location above.", "ไม่พบสถานที่ เพิ่มสถานที่แรกของคุณด้านบน")}
                        </div>
                    ) : locations ? (
                        <PaginatedList
                            items={locations}
                            itemsPerPage={15}
                            renderItem={(location) => (
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
                                            onClick={() => {
                                                setShowDeleteConfirm(true);
                                                setLocationToDelete(location._id);
                                            }}
                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors dark:bg-red-900/20 dark:text-red-400"
                                            title={t("Delete", "ลบ")}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            className="space-y-3"
                        />
                    ) : null}
                </div>
            )}

            {!selectedSchoolId && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                    {t("Please select a school to manage locations", "กรุณาเลือกโรงเรียนเพื่อจัดการสถานที่")}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                            {t("Confirm Deletion", "ยืนยันการลบ")}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            {t(
                                "Are you sure you want to delete this location? This action cannot be undone.",
                                "คุณแน่ใจหรือไม่ว่าต้องการลบสถานที่นี้? การดำเนินการนี้ไม่สามารถยกเลิกได้"
                            )}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                            <button
                                onClick={executeDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                {t("Delete", "ลบ")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Confirmation Modal */}
            {showApproveConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                            {t("Confirm Approval", "ยืนยันการอนุมัติ")}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            {t(
                                "Are you sure you want to approve this location proposal?",
                                "คุณแน่ใจหรือไม่ว่าต้องการอนุมัติข้อเสนอสถานที่นี้?"
                            )}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowApproveConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                            <button
                                onClick={executeApprove}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                {t("Approve", "อนุมัติ")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Proposal Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                            {t("Reject Proposal", "ปฏิเสธข้อเสนอ")}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            {t(
                                "Please provide a reason for rejecting this proposal.",
                                "กรุณาระบุเหตุผลในการปฏิเสธข้อเสนอนี้"
                            )}
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label htmlFor="rejectReason" className="block text-sm font-medium mb-2">
                                    {t("Rejection Reason (English)", "เหตุผลการปฏิเสธ (อังกฤษ)")}
                                </label>
                                <input
                                    type="text"
                                    id="rejectReason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600"
                                    placeholder={t("Enter reason in English", "กรุณาระบุเหตุผลเป็นภาษาอังกฤษ")}
                                />
                            </div>

                            <div>
                                <label htmlFor="rejectReasonTh" className="block text-sm font-medium mb-2">
                                    {t("Rejection Reason (Thai)", "เหตุผลการปฏิเสธ (ไทย)")}
                                </label>
                                <input
                                    type="text"
                                    id="rejectReasonTh"
                                    value={rejectReasonTh}
                                    onChange={(e) => setRejectReasonTh(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600"
                                    placeholder={t("กรุณาระบุเหตุผลเป็นภาษาไทย", "Enter reason in Thai")}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                            <button
                                onClick={executeReject}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                {t("Reject", "ปฏิเสธ")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
