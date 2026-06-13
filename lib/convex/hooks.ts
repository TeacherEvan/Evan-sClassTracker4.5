// Generated Convex Hooks with TanStack Query integration
// Auto-generated - do not edit manually
// Run `npm run generate:hooks` to regenerate

import { useQuery, useMutation } from "@tanstack/react-query";

// Type definitions for Convex API (used at compile time)
type Id<TableName> = string;
type FunctionReference<Type, Visibility, Args, ReturnType> = (args: Args) => Promise<ReturnType>;
type Api = Record<string, unknown>;

// Mock API for type safety - actual implementation uses Convex's generated api
const api: Api = {
  students: {
    list: { query: "students:list" },
    get: { query: "students:get" },
    create: { mutation: "students:create" },
    update: { mutation: "students:update" },
    delete: { mutation: "students:delete" },
  },
  classes: {
    list: { query: "classes:list" },
    get: { query: "classes:get" },
    create: { mutation: "classes:create" },
    update: { mutation: "classes:update" },
    delete: { mutation: "classes:delete" },
    approve: { mutation: "classes:approve" },
    reject: { mutation: "classes:reject" },
  },
  providers: {
    list: { query: "providers:list" },
    get: { query: "providers:get" },
    create: { mutation: "providers:create" },
    update: { mutation: "providers:update" },
    delete: { mutation: "providers:delete" },
  },
  schools: {
    list: { query: "schools:list" },
    get: { query: "schools:get" },
    create: { mutation: "schools:create" },
    update: { mutation: "schools:update" },
  },
  locations: {
    list: { query: "locations:list" },
    get: { query: "locations:get" },
    create: { mutation: "locations:create" },
    update: { mutation: "locations:update" },
  },
  users: {
    getCurrentUser: { query: "users:getCurrentUser" },
    get: { query: "users:get" },
    list: { query: "users:list" },
    updateProfile: { mutation: "users:updateProfile" },
  },
  analytics: {
    classStats: { query: "analytics:classStats" },
    providerStats: { query: "analytics:providerStats" },
    teacherStats: { query: "analytics:teacherStats" },
  },
  notifications: {
    list: { query: "notifications:list" },
    getUnreadCount: { query: "notifications:getUnreadCount" },
    markAsRead: { mutation: "notifications:markAsRead" },
    markAllAsRead: { mutation: "notifications:markAllAsRead" },
  },
};

// Convex React hooks (re-exported for convenience)
export { useQuery, useMutation } from "convex/react";

// ============================================
// Students Hooks
// ============================================

export function useStudents(filters?: {
  providerId?: Id<"providers">;
  schoolId?: Id<"schools">;
  grade?: string;
  includeDeleted?: boolean;
}) {
  return useQuery({
    queryKey: ["students", filters],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.students.list, filters);
      return [];
    },
    enabled: true,
  });
}

export function useStudent(id: Id<"students">) {
  return useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.students.get, { id });
      return null;
    },
    enabled: !!id,
  });
}

export function useCreateStudent() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.students.create);
      return args;
    },
  });
}

export function useUpdateStudent() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.students.update);
      return args;
    },
  });
}

export function useDeleteStudent() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.students.delete);
      return args;
    },
  });
}

// ============================================
// Classes Hooks
// ============================================

export function useClasses(filters?: {
  providerId?: Id<"providers">;
  schoolId?: Id<"schools">;
  teacherId?: Id<"users">;
  status?: "pending" | "approved" | "rejected" | "completed";
  startDate?: number;
  endDate?: number;
}) {
  return useQuery({
    queryKey: ["classes", filters],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.classes.list, filters);
      return [];
    },
    enabled: true,
  });
}

export function useClass(id: Id<"classes">) {
  return useQuery({
    queryKey: ["class", id],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.classes.get, { id });
      return null;
    },
    enabled: !!id,
  });
}

export function useCreateClass() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.classes.create);
      return args;
    },
  });
}

export function useUpdateClass() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.classes.update);
      return args;
    },
  });
}

export function useDeleteClass() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.classes.delete);
      return args;
    },
  });
}

export function useApproveClass() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.classes.approve);
      return args;
    },
  });
}

export function useRejectClass() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.classes.reject);
      return args;
    },
  });
}

// ============================================
// Providers Hooks
// ============================================

export function useProviders(filters?: {
  category?: "personal" | "private" | "language_school" | "educational_camp";
  isActive?: boolean;
  createdBy?: Id<"users">;
}) {
  return useQuery({
    queryKey: ["providers", filters],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.providers.list, filters);
      return [];
    },
    enabled: true,
  });
}

export function useProvider(id: Id<"providers">) {
  return useQuery({
    queryKey: ["provider", id],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.providers.get, { id });
      return null;
    },
    enabled: !!id,
  });
}

export function useCreateProvider() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.providers.create);
      return args;
    },
  });
}

export function useUpdateProvider() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.providers.update);
      return args;
    },
  });
}

export function useDeleteProvider() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.providers.delete);
      return args;
    },
  });
}

// ============================================
// Schools Hooks
// ============================================

export function useSchools(filters?: {
  moderatorId?: Id<"users">;
  province?: string;
}) {
  return useQuery({
    queryKey: ["schools", filters],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.schools.list, filters);
      return [];
    },
    enabled: true,
  });
}

export function useSchool(id: Id<"schools">) {
  return useQuery({
    queryKey: ["school", id],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.schools.get, { id });
      return null;
    },
    enabled: !!id,
  });
}

export function useCreateSchool() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.schools.create);
      return args;
    },
  });
}

export function useUpdateSchool() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.schools.update);
      return args;
    },
  });
}

// ============================================
// Locations Hooks
// ============================================

export function useLocations(filters?: {
  type?: "school" | "private";
  providerId?: Id<"providers">;
}) {
  return useQuery({
    queryKey: ["locations", filters],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.locations.list, filters);
      return [];
    },
    enabled: true,
  });
}

export function useLocation(id: Id<"locations">) {
  return useQuery({
    queryKey: ["location", id],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.locations.get, { id });
      return null;
    },
    enabled: !!id,
  });
}

export function useCreateLocation() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.locations.create);
      return args;
    },
  });
}

export function useUpdateLocation() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.locations.update);
      return args;
    },
  });
}

// ============================================
// Users Hooks
// ============================================

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.users.getCurrentUser);
      return null;
    },
  });
}

export function useUser(id: Id<"users">) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.users.get, { id });
      return null;
    },
    enabled: !!id,
  });
}

export function useUsers(filters?: {
  role?: "teacher" | "moderator" | "admin";
  schoolId?: Id<"schools">;
}) {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.users.list, filters);
      return [];
    },
    enabled: true,
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.users.updateProfile);
      return args;
    },
  });
}

// ============================================
// Analytics Hooks
// ============================================

export function useClassStats(filters?: {
  providerId?: Id<"providers">;
  schoolId?: Id<"schools">;
  teacherId?: Id<"users">;
  startDate?: number;
  endDate?: number;
}) {
  return useQuery({
    queryKey: ["classStats", filters],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.analytics.classStats, filters);
      return null;
    },
    enabled: true,
  });
}

export function useProviderStats(providerId: Id<"providers">) {
  return useQuery({
    queryKey: ["providerStats", providerId],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.analytics.providerStats, { providerId });
      return null;
    },
    enabled: !!providerId,
  });
}

export function useTeacherStats(teacherId: Id<"users">) {
  return useQuery({
    queryKey: ["teacherStats", teacherId],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.analytics.teacherStats, { teacherId });
      return null;
    },
    enabled: !!teacherId,
  });
}

// ============================================
// Notifications Hooks
// ============================================

export function useNotifications(filters?: {
  userId?: Id<"users">;
  isRead?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["notifications", filters],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.notifications.list, filters);
      return [];
    },
    enabled: true,
  });
}

export function useUnreadNotificationCount(userId: Id<"users">) {
  return useQuery({
    queryKey: ["unreadNotifications", userId],
    queryFn: async () => {
      // In actual implementation: return useConvexQuery(api.notifications.getUnreadCount, { userId });
      return 0;
    },
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.notifications.markAsRead);
      return args;
    },
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      // In actual implementation: return useConvexMutation(api.notifications.markAllAsRead);
      return args;
    },
  });
}