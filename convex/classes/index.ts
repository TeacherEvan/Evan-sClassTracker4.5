// Re-export all queries
export {
  list,
  getById,
  getByDateRange,
  listWithDetails,
  checkTimeConflicts,
  getEditAnalytics,
  getUpcomingForNotification,
  findRecurringSeries,
  findUnpopulatedClasses,
} from "./queries";

// Re-export all mutations
export {
  bookWithConflictCheck,
  book,
  acknowledge,
  approve,
  reject,
  updateClass,
  deleteClass,
  editClass,
  addDatesToClass,
  addStudentToClass,
  removeStudentFromClass,
  mergeClasses,
  bulkDeleteClasses,
  bulkApprove,
  deleteRecurringSeries,
  cleanUpUnpopulatedClasses,
} from "./mutations";

// Re-export helpers (in case they're needed externally)
export { verifyClassAccess } from "./helpers";
