import React from "react";
import { vi } from "vitest";
import "@testing-library/jest-dom";

// Make React available globally for JSX in tests
(global as unknown as { React: typeof React }).React = React;

// Make vi available globally
(global as unknown as { vi: typeof vi }).vi = vi;
