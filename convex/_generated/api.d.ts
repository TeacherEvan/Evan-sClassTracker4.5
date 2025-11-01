/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminContactRequests from "../adminContactRequests.js";
import type * as analytics from "../analytics.js";
import type * as appUpdates from "../appUpdates.js";
import type * as auditHelpers from "../auditHelpers.js";
import type * as auditLogs from "../auditLogs.js";
import type * as bulkOperations from "../bulkOperations.js";
import type * as cancellationRequests from "../cancellationRequests.js";
import type * as classes from "../classes.js";
import type * as crons from "../crons.js";
import type * as deleteSangsomData from "../deleteSangsomData.js";
import type * as errorReports from "../errorReports.js";
import type * as events from "../events.js";
import type * as exports from "../exports.js";
import type * as groups from "../groups.js";
import type * as importSangsomStudents from "../importSangsomStudents.js";
import type * as importSangsomStudentsExtra from "../importSangsomStudentsExtra.js";
import type * as init from "../init.js";
import type * as locationProposals from "../locationProposals.js";
import type * as locations from "../locations.js";
import type * as messages from "../messages.js";
import type * as migrateSangsomStudentsToEvents from "../migrateSangsomStudentsToEvents.js";
import type * as notificationWindows from "../notificationWindows.js";
import type * as notifications from "../notifications.js";
import type * as pagination from "../pagination.js";
import type * as performanceMonitoring from "../performanceMonitoring.js";
import type * as postClassNotes from "../postClassNotes.js";
import type * as providers from "../providers.js";
import type * as rateLimit from "../rateLimit.js";
import type * as schools from "../schools.js";
import type * as search from "../search.js";
import type * as seedAppUpdate from "../seedAppUpdate.js";
import type * as seedPrivateClasses from "../seedPrivateClasses.js";
import type * as seedSangsomProject from "../seedSangsomProject.js";
import type * as simpleAnalytics from "../simpleAnalytics.js";
import type * as students from "../students.js";
import type * as teacherClassCount from "../teacherClassCount.js";
import type * as teacherLogs from "../teacherLogs.js";
import type * as teacherResources from "../teacherResources.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminContactRequests: typeof adminContactRequests;
  analytics: typeof analytics;
  appUpdates: typeof appUpdates;
  auditHelpers: typeof auditHelpers;
  auditLogs: typeof auditLogs;
  bulkOperations: typeof bulkOperations;
  cancellationRequests: typeof cancellationRequests;
  classes: typeof classes;
  crons: typeof crons;
  deleteSangsomData: typeof deleteSangsomData;
  errorReports: typeof errorReports;
  events: typeof events;
  exports: typeof exports;
  groups: typeof groups;
  importSangsomStudents: typeof importSangsomStudents;
  importSangsomStudentsExtra: typeof importSangsomStudentsExtra;
  init: typeof init;
  locationProposals: typeof locationProposals;
  locations: typeof locations;
  messages: typeof messages;
  migrateSangsomStudentsToEvents: typeof migrateSangsomStudentsToEvents;
  notificationWindows: typeof notificationWindows;
  notifications: typeof notifications;
  pagination: typeof pagination;
  performanceMonitoring: typeof performanceMonitoring;
  postClassNotes: typeof postClassNotes;
  providers: typeof providers;
  rateLimit: typeof rateLimit;
  schools: typeof schools;
  search: typeof search;
  seedAppUpdate: typeof seedAppUpdate;
  seedPrivateClasses: typeof seedPrivateClasses;
  seedSangsomProject: typeof seedSangsomProject;
  simpleAnalytics: typeof simpleAnalytics;
  students: typeof students;
  teacherClassCount: typeof teacherClassCount;
  teacherLogs: typeof teacherLogs;
  teacherResources: typeof teacherResources;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
