"use client";

import type { ViewType } from "@/app/workspace-layout";
import { useLanguage } from "@/lib/language-context";
import {
    BarChart3,
    BookOpen,
    Calendar,
    CalendarDays,
    FolderOpen,
    MapPin,
    MessageSquare,
    School,
    Shield,
    UserCog,
    Users,
} from "lucide-react";

interface SidebarNavProps {
    activeView: ViewType;
    onViewChange: (view: ViewType) => void;
    userRole: string;
    compact?: boolean;
}

interface NavItem {
    id: ViewType;
    icon: React.ElementType;
    labelEn: string;
    labelTh: string;
    roles: string[];
}

const navItems: NavItem[] = [
    {
        id: "calendar",
        icon: Calendar,
        labelEn: "Calendar",
        labelTh: "ปฏิทิน",
        roles: ["admin", "moderator", "teacher", "guardian"],
    },
    {
        id: "classes",
        icon: BookOpen,
        labelEn: "Classes",
        labelTh: "คลาส",
        roles: ["admin", "moderator", "teacher", "guardian"],
    },
    {
        id: "students",
        icon: Users,
        labelEn: "Students",
        labelTh: "นักเรียน",
        roles: ["admin", "moderator", "teacher", "guardian"],
    },
    {
        id: "messages",
        icon: MessageSquare,
        labelEn: "Messages",
        labelTh: "ข้อความ",
        roles: ["admin", "moderator", "teacher", "guardian"],
    },
    {
        id: "events",
        icon: CalendarDays,
        labelEn: "Events",
        labelTh: "กิจกรรม",
        roles: ["admin", "moderator", "teacher"],
    },
    {
        id: "schools",
        icon: School,
        labelEn: "Schools",
        labelTh: "โรงเรียน",
        roles: ["admin"],
    },
    {
        id: "moderators",
        icon: UserCog,
        labelEn: "Moderators",
        labelTh: "ผู้ดูแล",
        roles: ["admin"],
    },
    {
        id: "locations",
        icon: MapPin,
        labelEn: "Locations",
        labelTh: "สถานที่",
        roles: ["admin", "moderator"],
    },
    {
        id: "resources",
        icon: FolderOpen,
        labelEn: "Resources",
        labelTh: "ทรัพยากร",
        roles: ["admin", "moderator", "teacher"],
    },
    {
        id: "analytics",
        icon: BarChart3,
        labelEn: "Analytics",
        labelTh: "การวิเคราะห์",
        roles: ["admin", "moderator", "teacher"],
    },
    {
        id: "providers",
        icon: Shield,
        labelEn: "Providers",
        labelTh: "ผู้ให้บริการ",
        roles: ["admin"],
    },
];

export default function SidebarNav({
    activeView,
    onViewChange,
    userRole,
    compact = false,
}: SidebarNavProps) {
    const { t, language } = useLanguage();

    // Filter nav items by user role
    const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

    return (
        <nav className="h-full flex flex-col">
            {/* Header */}
            {!compact && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {t("Navigation", "นำทาง")}
                    </h2>
                </div>
            )}

            {/* Nav Items */}
            <ul className="flex-1 overflow-y-auto py-2">
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    const label = language === "en" ? item.labelEn : item.labelTh;

                    return (
                        <li key={item.id}>
                            <button
                                onClick={() => onViewChange(item.id)}
                                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${isActive
                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    }
                  ${compact ? "justify-center" : ""}
                `}
                                title={compact ? label : undefined}
                            >
                                <Icon className={`${compact ? "w-6 h-6" : "w-5 h-5"} flex-shrink-0`} />
                                {!compact && (
                                    <span className="text-sm font-medium">{label}</span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>

            {/* Footer (optional) */}
            {!compact && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("Workspace", "พื้นที่ทำงาน")}
                    </p>
                </div>
            )}
        </nav>
    );
}
