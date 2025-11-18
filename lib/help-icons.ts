/**
 * Centralized icon imports for Help system
 * 
 * PERFORMANCE OPTIMIZATION:
 * Instead of importing ALL lucide-react icons (* as LucideIcons),
 * we import only the icons actually used in help-content.ts.
 * This reduces bundle size by ~40KB.
 * 
 * Pattern: Tree-shakeable named imports
 * Before: import * as LucideIcons from "lucide-react" (~100KB)
 * After: import { Calendar, CheckCircle, ... } from "lucide-react" (~60KB)
 */

import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  CalendarPlus,
  CheckCircle,
  FileText,
  MapPin,
  MessageCircle,
  MessageSquare,
  PieChart,
  Send,
  Settings,
  Sparkles,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon registry mapping icon names to components
 * Used by help-window.tsx and help-detail-modal.tsx
 */
export const HELP_ICONS: Record<string, LucideIcon> = {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  CalendarPlus,
  CheckCircle,
  FileText,
  MapPin,
  MessageCircle,
  MessageSquare,
  PieChart,
  Send,
  Settings,
  Sparkles,
  UserCog,
  Users,
};

/**
 * Get icon component by name with fallback
 * @param iconName - Name of the Lucide icon
 * @returns Icon component (defaults to Sparkles if not found)
 */
export function getHelpIcon(iconName: string): LucideIcon {
  return HELP_ICONS[iconName] || Sparkles;
}
