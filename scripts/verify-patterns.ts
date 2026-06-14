import fs from "fs";
import path from "path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let errorCount = 0;
const _warningCount = 0; // Reserved for future use

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);

  // Check 1: No alert() or confirm()
  // We look for "alert(" or "confirm(" but try to avoid comments
  // This is a simple check, not a full AST parser
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;

    if (line.match(/\balert\s*\(/)) {
      console.log(
        `${RED}ERROR: Found 'alert()' in ${relativePath}:${index + 1}${RESET}`,
      );
      console.log(
        `  ${YELLOW}Rule: Use toast.success/error instead of alert()${RESET}`,
      );
      errorCount++;
    }

    if (line.match(/\bconfirm\s*\(/)) {
      console.log(
        `${RED}ERROR: Found 'confirm()' in ${relativePath}:${index + 1}${RESET}`,
      );
      console.log(
        `  ${YELLOW}Rule: Use custom modals or toast instead of confirm()${RESET}`,
      );
      errorCount++;
    }
  });

  // Check 2: Components should have "use client"
  // Only applies to files in components/ directory that are .tsx
  if (relativePath.startsWith("components") && fileName.endsWith(".tsx")) {
    if (
      !content.includes('"use client"') &&
      !content.includes("'use client'")
    ) {
      console.log(
        `${RED}ERROR: Missing "use client" directive in ${relativePath}${RESET}`,
      );
      console.log(
        `  ${YELLOW}Rule: All UI components must be client-side${RESET}`,
      );
      errorCount++;
    }
  }
}

function walkDir(dir: string) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        walkDir(filePath);
      }
    } else {
      if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        checkFile(filePath);
      }
    }
  }
}

console.log(`${GREEN}Starting Pattern Verification...${RESET}\n`);

walkDir("app");
walkDir("components");
walkDir("convex");
walkDir("lib");

console.log("\n-----------------------------------");
if (errorCount > 0) {
  console.log(`${RED}FAILED: Found ${errorCount} violations.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}SUCCESS: No pattern violations found!${RESET}`);
  process.exit(0);
}
