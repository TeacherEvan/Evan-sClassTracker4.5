"use client";

import RightPanel from "@/components/right-panel";
import SidebarNav from "@/components/sidebar-nav";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

export type ViewType =
    | "calendar"
    | "classes"
    | "students"
    | "messages"
    | "events"
    | "schools"
    | "moderators"
    | "locations"
    | "resources"
    | "analytics"
    | "providers";

interface WorkspaceLayoutProps {
    userId: Id<"users">;
    userRole: string;
    children?: React.ReactNode;
}

export default function WorkspaceLayout({ userId, userRole, children }: WorkspaceLayoutProps) {
    const [activeView, setActiveView] = useState<ViewType>("calendar");
    const [rightPanelVisible, setRightPanelVisible] = useState(true);
    // const [bottomPanelVisible, setBottomPanelVisible] = useState(false); // TODO: Restore when bottom-panel component exists

    return (
        <div className="grid h-screen overflow-hidden">
            {/* CSS Grid Layout - Desktop (>1024px) */}
            <div className="hidden lg:grid lg:grid-cols-[240px_1fr_320px] lg:grid-rows-[1fr_240px] h-full">
                {/* Left Sidebar - spans both rows */}
                <aside className="row-span-2 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <SidebarNav
                        activeView={activeView}
                        onViewChange={setActiveView}
                        userRole={userRole}
                    />
                </aside>

                {/* Main Content - top row only */}
                <main className="row-span-1 overflow-y-auto bg-white dark:bg-gray-800">
                    {children}
                </main>

                {/* Right Panel - spans both rows, conditionally rendered */}
                {rightPanelVisible && (
                    <aside className="row-span-2 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <RightPanel
                            userId={userId}
                            onClose={() => setRightPanelVisible(false)}
                        />
                    </aside>
                )}

                {/* Bottom Panel - spans left nav + main content, conditionally rendered */}
                {/* TODO: Restore when bottom-panel component exists
                {bottomPanelVisible && (
                    <footer className="col-span-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <BottomPanel
                            userId={userId}
                            userRole={userRole}
                            onClose={() => setBottomPanelVisible(false)}
                        />
                    </footer>
                )}
                */}
            </div>

            {/* Tablet Layout (768px - 1024px) */}
            <div className="hidden md:grid lg:hidden md:grid-cols-[60px_1fr] md:grid-rows-[1fr_40px] h-full">
                {/* Left Sidebar (icons only) */}
                <aside className="row-span-2 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <SidebarNav
                        activeView={activeView}
                        onViewChange={setActiveView}
                        userRole={userRole}
                        compact
                    />
                </aside>

                {/* Main Content */}
                <main className="row-span-1 overflow-y-auto bg-white dark:bg-gray-800">
                    {children}
                </main>

                {/* Bottom Panel (collapsed by default) */}
                {/* TODO: Restore when bottom-panel component exists
                <footer className="col-span-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <button
                        onClick={() => setBottomPanelVisible(!bottomPanelVisible)}
                        className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        {bottomPanelVisible ? "▼ Collapse" : "▲ Expand"}
                    </button>
                    {bottomPanelVisible && (
                        <BottomPanel
                            userId={userId}
                            userRole={userRole}
                            onClose={() => setBottomPanelVisible(false)}
                        />
                    )}
                </footer>
                */}
            </div>

            {/* Mobile Layout (<768px) */}
            <div className="md:hidden flex flex-col h-full">
                {/* Main Content (full width) */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
                    {children}
                </main>
            </div>

            {/* Toggle buttons for collapsed panels (desktop) */}
            {!rightPanelVisible && (
                <button
                    onClick={() => setRightPanelVisible(true)}
                    className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 bg-gray-200 dark:bg-gray-700 p-2 rounded-l-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label="Show right panel"
                >
                    ◀
                </button>
            )}

            {/* TODO: Restore when bottom-panel component exists
            {!bottomPanelVisible && (
                <button
                    onClick={() => setBottomPanelVisible(true)}
                    className="hidden lg:block fixed bottom-0 left-1/2 -translate-x-1/2 bg-gray-200 dark:bg-gray-700 px-4 py-1 rounded-t-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label="Show bottom panel"
                >
                    ▲
                </button>
            )}
            */}
        </div>
    );
}
