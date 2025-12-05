import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { verifyClassAccess } from "./helpers";
import { logAudit } from "../auditHelpers";
import { checkRateLimit } from "../rateLimit";

// TODO: Extract bulk operations (lines 1538-2089)
export const mergeClasses = mutation({ args: {}, handler: async () => { throw new Error("Not implemented"); }});
export const bulkDeleteClasses = mutation({ args: {}, handler: async () => { throw new Error("Not implemented"); }});
export const bulkApprove = mutation({ args: {}, handler: async () => { throw new Error("Not implemented"); }});
export const deleteRecurringSeries = mutation({ args: {}, handler: async () => { throw new Error("Not implemented"); }});
export const cleanUpUnpopulatedClasses = mutation({ args: {}, handler: async () => { throw new Error("Not implemented"); }});
