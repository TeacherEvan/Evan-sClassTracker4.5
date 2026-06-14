"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import type { UserRole } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import {
  Bell,
  Calendar,
  Clock,
  Globe,
  Lock,
  MapPin,
  Plus,
  School,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

interface EventFormData {
  title: string;
  titleTh: string;
  description: string;
  descriptionTh: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // HH:MM
  endDate: string;
  endTime: string;
  allDay: boolean;
  eventType: "reminder" | "event" | "holiday" | "meeting" | "deadline";
  visibility:
    | "personal"
    | "school"
    | "all_teachers"
    | "all_moderators"
    | "everyone";
  reminderMinutes: number;
  location: string;
  locationTh: string;
}

interface EventManagementProps {
  userId: Id<"users">;
  userRole: UserRole;
  schoolId?: Id<"schools">;
}

type EventData = {
  _id: Id<"events">;
  title: string;
  titleTh: string;
  description?: string;
  descriptionTh?: string;
  eventDate: number;
  endDate?: number;
  allDay: boolean;
  eventType: "reminder" | "event" | "holiday" | "meeting" | "deadline";
  visibility:
    | "personal"
    | "school"
    | "all_teachers"
    | "all_moderators"
    | "everyone";
  location?: string;
  locationTh?: string;
  reminderMinutes?: number;
  createdBy: Id<"users">;
  schoolId?: Id<"schools">;
  createdAt: number;
  isActive: boolean;
};

export function EventManagement({
  userId,
  userRole,
  schoolId,
}: EventManagementProps) {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);

  const createEvent = useMutation(api.events.create);
  const updateEvent = useMutation(api.events.update);
  const removeEvent = useMutation(api.events.remove);
  const userEvents = useQuery(api.events.listByUser, { userId });

  const canCreateUniversal = userRole === "moderator" || userRole === "admin";

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    titleTh: "",
    description: "",
    descriptionTh: "",
    eventDate: new Date().toISOString().split("T")[0],
    eventTime: "09:00",
    endDate: "",
    endTime: "",
    allDay: false,
    eventType: userRole === "teacher" ? "reminder" : "event",
    visibility: userRole === "teacher" ? "personal" : "school",
    reminderMinutes: 30,
    location: "",
    locationTh: "",
  });

  const [loading, setLoading] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Id<"events"> | null>(null);

  const resetForm = () => {
    setFormData({
      title: "",
      titleTh: "",
      description: "",
      descriptionTh: "",
      eventDate: new Date().toISOString().split("T")[0],
      eventTime: "09:00",
      endDate: "",
      endTime: "",
      allDay: false,
      eventType: userRole === "teacher" ? "reminder" : "event",
      visibility: userRole === "teacher" ? "personal" : "school",
      reminderMinutes: 30,
      location: "",
      locationTh: "",
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim() || !formData.titleTh.trim()) {
        toast.error(
          "Title is required in both languages",
          "ต้องระบุชื่อทั้งสองภาษา",
        );
        setLoading(false);
        return;
      }

      // Parse date and time
      const [year, month, day] = formData.eventDate.split("-").map(Number);
      const [hour, minute] = formData.eventTime.split(":").map(Number);
      const eventDate = new Date(year, month - 1, day, hour, minute).getTime();

      let endDate: number | undefined;
      if (formData.endDate && formData.endTime) {
        const [eYear, eMonth, eDay] = formData.endDate.split("-").map(Number);
        const [eHour, eMinute] = formData.endTime.split(":").map(Number);
        endDate = new Date(eYear, eMonth - 1, eDay, eHour, eMinute).getTime();
      }

      if (editingEvent) {
        // Update existing event
        await updateEvent({
          userId,
          eventId: editingEvent._id,
          title: formData.title,
          titleTh: formData.titleTh,
          description: formData.description || undefined,
          descriptionTh: formData.descriptionTh || undefined,
          eventDate,
          endDate,
          allDay: formData.allDay,
          eventType: formData.eventType,
          reminderMinutes: formData.reminderMinutes || undefined,
          location: formData.location || undefined,
          locationTh: formData.locationTh || undefined,
        });

        toast.success("Event updated successfully", "อัปเดตกิจกรรมสำเร็จ");
      } else {
        // Create new event
        await createEvent({
          userId,
          title: formData.title,
          titleTh: formData.titleTh,
          description: formData.description || undefined,
          descriptionTh: formData.descriptionTh || undefined,
          eventDate,
          endDate,
          allDay: formData.allDay,
          eventType: formData.eventType,
          visibility: formData.visibility,
          schoolId:
            formData.visibility === "school" ||
            formData.visibility === "personal"
              ? schoolId
              : undefined,
          reminderMinutes: formData.reminderMinutes || undefined,
          location: formData.location || undefined,
          locationTh: formData.locationTh || undefined,
        });

        toast.success("Event created successfully", "สร้างกิจกรรมสำเร็จ");
      }

      resetForm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save event",
        err instanceof Error ? err.message : "บันทึกกิจกรรมไม่สำเร็จ",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (eventId: Id<"events">) => {
    setEventToDelete(eventId);
  };

  const executeDelete = async () => {
    if (!eventToDelete) return;

    try {
      await removeEvent({ userId, eventId: eventToDelete });
      toast.success("Event deleted", "ลบกิจกรรมแล้ว");
      setEventToDelete(null);
    } catch {
      toast.error("Failed to delete event", "ลบกิจกรรมไม่สำเร็จ");
    }
  };

  const handleEdit = (event: EventData) => {
    const eventDateObj = new Date(event.eventDate);
    const endDateObj = event.endDate ? new Date(event.endDate) : null;

    setFormData({
      title: event.title,
      titleTh: event.titleTh,
      description: event.description || "",
      descriptionTh: event.descriptionTh || "",
      eventDate: eventDateObj.toISOString().split("T")[0],
      eventTime: `${eventDateObj.getHours().toString().padStart(2, "0")}:${eventDateObj.getMinutes().toString().padStart(2, "0")}`,
      endDate: endDateObj ? endDateObj.toISOString().split("T")[0] : "",
      endTime: endDateObj
        ? `${endDateObj.getHours().toString().padStart(2, "0")}:${endDateObj.getMinutes().toString().padStart(2, "0")}`
        : "",
      allDay: event.allDay,
      eventType: event.eventType,
      visibility: event.visibility,
      reminderMinutes: event.reminderMinutes || 30,
      location: event.location || "",
      locationTh: event.locationTh || "",
    });
    setEditingEvent(event);
    setShowForm(true);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Bell className="w-4 h-4" />;
      case "event":
        return <Calendar className="w-4 h-4" />;
      case "holiday":
        return <Globe className="w-4 h-4" />;
      case "meeting":
        return <Users className="w-4 h-4" />;
      case "deadline":
        return <Clock className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "personal":
        return <Lock className="w-4 h-4" />;
      case "school":
        return <School className="w-4 h-4" />;
      case "all_teachers":
        return <Users className="w-4 h-4" />;
      case "all_moderators":
        return <Users className="w-4 h-4" />;
      case "everyone":
        return <Globe className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t("Events & Reminders", "กิจกรรมและการแจ้งเตือน")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {canCreateUniversal
              ? t(
                  "Create events visible to all users or personal reminders",
                  "สร้างกิจกรรมที่ทุกคนเห็นได้หรือการแจ้งเตือนส่วนตัว",
                )
              : t(
                  "Create personal reminders for your schedule",
                  "สร้างการแจ้งเตือนส่วนตัวสำหรับตารางของคุณ",
                )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {t(
            showForm ? "Cancel" : "New Event",
            showForm ? "ยกเลิก" : "สร้างกิจกรรมใหม่",
          )}
        </button>
      </div>

      {/* Event Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editingEvent
              ? t("Edit Event", "แก้ไขกิจกรรม")
              : t("Create New Event", "สร้างกิจกรรมใหม่")}
          </h3>

          {/* Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Title (English)", "ชื่อ (อังกฤษ)")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Title (Thai)", "ชื่อ (ไทย)")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.titleTh}
                onChange={(e) =>
                  setFormData({ ...formData, titleTh: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Description (English)", "คำอธิบาย (อังกฤษ)")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Description (Thai)", "คำอธิบาย (ไทย)")}
              </label>
              <textarea
                value={formData.descriptionTh}
                onChange={(e) =>
                  setFormData({ ...formData, descriptionTh: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                rows={3}
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Start Date", "วันที่เริ่ม")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) =>
                  setFormData({ ...formData, eventDate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Start Time", "เวลาเริ่ม")}
              </label>
              <input
                type="time"
                value={formData.eventTime}
                onChange={(e) =>
                  setFormData({ ...formData, eventTime: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                disabled={formData.allDay}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("End Date", "วันที่สิ้นสุด")}
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("End Time", "เวลาสิ้นสุด")}
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                disabled={formData.allDay || !formData.endDate}
              />
            </div>
          </div>

          {/* All Day Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) =>
                setFormData({ ...formData, allDay: e.target.checked })
              }
              className="w-4 h-4 rounded"
            />
            <label htmlFor="allDay" className="text-sm font-medium">
              {t("All-day event", "กิจกรรมทั้งวัน")}
            </label>
          </div>

          {/* Event Type and Visibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Event Type", "ประเภทกิจกรรม")}
              </label>
              <select
                value={formData.eventType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    eventType: e.target.value as EventFormData["eventType"],
                  })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="reminder">
                  {t("Reminder", "การแจ้งเตือน")}
                </option>
                {canCreateUniversal && (
                  <>
                    <option value="event">{t("Event", "กิจกรรม")}</option>
                    <option value="holiday">{t("Holiday", "วันหยุด")}</option>
                    <option value="meeting">{t("Meeting", "ประชุม")}</option>
                    <option value="deadline">
                      {t("Deadline", "กำหนดส่ง")}
                    </option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Visibility", "การมองเห็น")}
              </label>
              <select
                value={formData.visibility}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    visibility: e.target.value as EventFormData["visibility"],
                  })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                disabled={!editingEvent && userRole === "teacher"}
              >
                <option value="personal">
                  {t("Personal (Only Me)", "ส่วนตัว (เฉพาะฉัน)")}
                </option>
                {canCreateUniversal && (
                  <>
                    <option value="school">
                      {t(
                        "School (All in School)",
                        "โรงเรียน (ทุกคนในโรงเรียน)",
                      )}
                    </option>
                    <option value="all_teachers">
                      {t("All Teachers", "ครูทุกคน")}
                    </option>
                    <option value="all_moderators">
                      {t("All Moderators", "ผู้ดูแลทุกคน")}
                    </option>
                    {userRole === "admin" && (
                      <option value="everyone">{t("Everyone", "ทุกคน")}</option>
                    )}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Location (English)", "สถานที่ (อังกฤษ)")}
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder={t("Optional", "ไม่บังคับ")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("Location (Thai)", "สถานที่ (ไทย)")}
              </label>
              <input
                type="text"
                value={formData.locationTh}
                onChange={(e) =>
                  setFormData({ ...formData, locationTh: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder={t("Optional", "ไม่บังคับ")}
              />
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("Remind me before", "แจ้งเตือนก่อน")}
            </label>
            <select
              value={formData.reminderMinutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reminderMinutes: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value={0}>{t("No reminder", "ไม่แจ้งเตือน")}</option>
              <option value={15}>{t("15 minutes", "15 นาที")}</option>
              <option value={30}>{t("30 minutes", "30 นาที")}</option>
              <option value={60}>{t("1 hour", "1 ชั่วโมง")}</option>
              <option value={1440}>{t("1 day", "1 วัน")}</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading
                ? t("Saving...", "กำลังบันทึก...")
                : editingEvent
                  ? t("Update Event", "อัปเดตกิจกรรม")
                  : t("Create Event", "สร้างกิจกรรม")}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              {t("Cancel", "ยกเลิก")}
            </button>
          </div>
        </form>
      )}

      {/* Event List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {t("My Events & Reminders", "กิจกรรมและการแจ้งเตือนของฉัน")}
        </h3>
        {!userEvents || userEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t(
              "No events yet. Create your first one!",
              "ยังไม่มีกิจกรรม สร้างกิจกรรมแรกของคุณ!",
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {userEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-start justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getEventTypeIcon(event.eventType)}
                    <h4 className="font-semibold">{event.title}</h4>
                    {getVisibilityIcon(event.visibility)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {event.titleTh}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.eventDate).toLocaleDateString()}
                    </span>
                    {!event.allDay && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(event.eventDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded transition-colors"
                  >
                    {t("Edit", "แก้ไข")}
                  </button>
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              {t("Delete Event?", "ลบกิจกรรม?")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t(
                "Are you sure you want to delete this event? This action cannot be undone.",
                "คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                {t("Delete", "ลบ")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
