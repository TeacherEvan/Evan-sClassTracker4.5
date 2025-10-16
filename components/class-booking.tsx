"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { UserRole } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { Calendar, Check, X } from "lucide-react";
import { useState } from "react";

interface ClassBookingProps {
  userId: Id<"users">;
  userRole: UserRole;
}

export function ClassBooking({ userId, userRole }: ClassBookingProps) {
  const { t } = useLanguage();
  const schools = useQuery(api.schools.list);
  const classes = useQuery(
    api.classes.list,
    userRole === "teacher" ? { teacherId: userId } : {}
  );
  const bookClass = useMutation(api.classes.book);
  const acknowledgeClass = useMutation(api.classes.acknowledge);
  const approveClass = useMutation(api.classes.approve);
  const rejectClass = useMutation(api.classes.reject);
  const addLocationToSchool = useMutation(api.schools.addLocation);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [schoolId, setSchoolId] = useState<Id<"schools"> | "">("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get locations for selected school
  const selectedSchool = schools?.find(s => s._id === schoolId);
  const availableLocations = selectedSchool?.locations || [];

  const handleBookClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!schoolId) {
        throw new Error("Please select a school");
      }
      if (!location) {
        throw new Error("Please select a location");
      }

      await bookClass({
        teacherId: userId,
        schoolId,
        name,
        location,
        scheduledDate: new Date(scheduledDate).getTime(),
      });

      // Reset form
      setName("");
      setLocation("");
      setNewLocation("");
      setSchoolId("");
      setScheduledDate("");
      setShowForm(false);
      setShowAddLocation(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book class");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!schoolId) {
      setError("Please select a school first");
      return;
    }
    if (!newLocation.trim()) {
      setError("Please enter a location name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addLocationToSchool({
        schoolId,
        location: newLocation.trim(),
      });

      // Set the newly added location as selected
      setLocation(newLocation.trim());
      setNewLocation("");
      setShowAddLocation(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add location");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (classId: Id<"classes">) => {
    try {
      await acknowledgeClass({ classId });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to acknowledge class");
    }
  };

  const handleApprove = async (classId: Id<"classes">) => {
    try {
      await approveClass({ classId });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve class");
    }
  };

  const handleReject = async (classId: Id<"classes">) => {
    const reason = prompt(t("Reason for rejection:", "เหตุผลในการปฏิเสธ:"));
    if (!reason) return;

    try {
      await rejectClass({ classId, reason, reasonTh: reason });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject class");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      acknowledged: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      approved: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: t("Pending", "รอดำเนินการ"),
      acknowledged: t("Acknowledged", "รับทราบแล้ว"),
      approved: t("Approved", "อนุมัติแล้ว"),
      rejected: t("Rejected", "ปฏิเสธแล้ว"),
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          {t("Class Bookings", "การจองชั้นเรียน")}
        </h2>
        {userRole === "teacher" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            {t("Book Class", "จองชั้นเรียน")}
          </button>
        )}
      </div>

      {/* Booking Form */}
      {showForm && userRole === "teacher" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {t("Book a New Class", "จองชั้นเรียนใหม่")}
          </h3>

          <form onSubmit={handleBookClass} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                {t("Name", "ชื่อ")}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="school" className="block text-sm font-medium mb-2">
                  {t("School", "โรงเรียน")}
                </label>
                <select
                  id="school"
                  value={schoolId}
                  onChange={(e) => {
                    setSchoolId(e.target.value as Id<"schools"> | "");
                    setLocation(""); // Reset location when school changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
                  required
                  disabled={loading}
                >
                  <option value="">{t("Select a school", "เลือกโรงเรียน")}</option>
                  {schools?.map((school) => (
                    <option key={school._id} value={school._id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-2">
                  {t("Scheduled Date", "วันที่กำหนด")}
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">
                {t("Location", "สถานที่")}
              </label>
              <div className="space-y-2">
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
                  required
                  disabled={loading || !schoolId}
                >
                  <option value="">
                    {schoolId
                      ? t("Select a location", "เลือกสถานที่")
                      : t("Select a school first", "เลือกโรงเรียนก่อน")
                    }
                  </option>
                  {availableLocations.map((loc, index) => (
                    <option key={index} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>

                {schoolId && !showAddLocation && (
                  <button
                    type="button"
                    onClick={() => setShowAddLocation(true)}
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    disabled={loading}
                  >
                    + {t("Add new location", "เพิ่มสถานที่ใหม่")}
                  </button>
                )}

                {showAddLocation && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder={t("Enter new location", "ป้อนสถานที่ใหม่")}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={handleAddLocation}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                      disabled={loading}
                    >
                      {t("Add", "เพิ่ม")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddLocation(false);
                        setNewLocation("");
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      disabled={loading}
                    >
                      {t("Cancel", "ยกเลิก")}
                    </button>
                  </div>
                )}
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
                  ? t("Booking...", "กำลังจอง...")
                  : t("Book Class", "จองชั้นเรียน")}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classes List */}
      <div className="space-y-4">
        {classes?.map((classItem) => (
          <div
            key={classItem._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{classItem.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t("Location:", "สถานที่:")} {classItem.location}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  {t("Scheduled:", "กำหนดการ:")} {new Date(classItem.scheduledDate).toLocaleString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(classItem.status)}`}>
                {getStatusText(classItem.status)}
              </span>
            </div>

            {userRole === "moderator" && classItem.status === "pending" && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleAcknowledge(classItem._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {t("Acknowledge", "รับทราบ")}
                </button>
                <button
                  onClick={() => handleApprove(classItem._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {t("Approve", "อนุมัติ")}
                </button>
                <button
                  onClick={() => handleReject(classItem._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t("Reject", "ปฏิเสธ")}
                </button>
              </div>
            )}

            {userRole === "moderator" && classItem.status === "acknowledged" && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleApprove(classItem._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {t("Approve", "อนุมัติ")}
                </button>
                <button
                  onClick={() => handleReject(classItem._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t("Reject", "ปฏิเสธ")}
                </button>
              </div>
            )}
          </div>
        ))}

        {classes && classes.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
            {t("No classes found", "ไม่พบชั้นเรียน")}
          </div>
        )}
      </div>
    </div>
  );
}
