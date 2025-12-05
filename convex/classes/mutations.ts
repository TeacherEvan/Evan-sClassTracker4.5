import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";

// Re-export all mutations from feature files
export { bookWithConflictCheck, book, acknowledge } from "./booking-mutations";
export { approve, reject } from "./approval-mutations";
export { updateClass, deleteClass, editClass } from "./crud-mutations";
export { addDatesToClass, addStudentToClass, removeStudentFromClass } from "./student-operations";
export { mergeClasses, bulkDeleteClasses, bulkApprove, deleteRecurringSeries, cleanUpUnpopulatedClasses } from "./bulk-operations";
