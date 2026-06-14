/**
 * ConvexTest type for testing
 * Actual usage in test files:
 * import { convexTest } from "convex-test";
 * import { modules } from "./test.setup";
 * const t = convexTest(schema, modules);
 */
export interface TestCtx {
  query: (api: unknown) => Promise<unknown>;
  mutation: (api: unknown, args: unknown) => Promise<unknown>;
  action: (api: unknown, args: unknown) => Promise<unknown>;
  runQuery: (handler: unknown, args: unknown) => Promise<unknown>;
  runMutation: (handler: unknown, args: unknown) => Promise<unknown>;
  runAction: (handler: unknown, args: unknown) => Promise<unknown>;
  withIdentity: (identity: unknown) => TestCtx;
  finishInProgressScheduledFunctions: () => Promise<void>;
  finishAllScheduledFunctions: (
    advanceTimers: () => void,
    maxIterations?: number,
  ) => Promise<void>;
}
