/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as classes from "../classes.js";
import type * as crons from "../crons.js";
import type * as groups from "../groups.js";
import type * as init from "../init.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as schools from "../schools.js";
import type * as students from "../students.js";
import type * as teacherResources from "../teacherResources.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  classes: typeof classes;
  crons: typeof crons;
  groups: typeof groups;
  init: typeof init;
  messages: typeof messages;
  notifications: typeof notifications;
  schools: typeof schools;
  students: typeof students;
  teacherResources: typeof teacherResources;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
