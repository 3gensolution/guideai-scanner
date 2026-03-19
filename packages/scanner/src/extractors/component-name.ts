import * as path from 'path';

/**
 * Infer a component name from a file path and its source code.
 *
 * Priority:
 * 1. Default export name from source code
 * 2. Named function/class export that matches the filename
 * 3. File name (PascalCased)
 */
export function inferComponentName(filePath: string, sourceCode: string): string {
  // Try to find a default export name from the source code
  const exportedName = extractDefaultExportName(sourceCode);
  if (exportedName) {
    return exportedName;
  }

  // Fall back to file name
  return fileNameToComponentName(filePath);
}

/**
 * Extract the name of the default export from source code.
 *
 * Handles patterns:
 * - export default function ComponentName() { ... }
 * - export default class ComponentName { ... }
 * - const ComponentName = ...; export default ComponentName;
 * - function ComponentName() { ... } export default ComponentName;
 */
function extractDefaultExportName(sourceCode: string): string | undefined {
  // export default function ComponentName
  const funcMatch = sourceCode.match(
    /export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)/,
  );
  if (funcMatch) {
    return funcMatch[1];
  }

  // export default class ComponentName
  const classMatch = sourceCode.match(
    /export\s+default\s+class\s+([A-Z][A-Za-z0-9_]*)/,
  );
  if (classMatch) {
    return classMatch[1];
  }

  // export default ComponentName (where ComponentName is defined above)
  const defaultRefMatch = sourceCode.match(
    /export\s+default\s+([A-Z][A-Za-z0-9_]*)\s*;/,
  );
  if (defaultRefMatch) {
    return defaultRefMatch[1];
  }

  return undefined;
}

/**
 * Convert a file path to a PascalCase component name.
 *
 * Examples:
 * - CheckoutForm.tsx => CheckoutForm
 * - checkout-form.tsx => CheckoutForm
 * - page.tsx => Page
 * - index.tsx => Index
 */
function fileNameToComponentName(filePath: string): string {
  const baseName = path.basename(filePath, path.extname(filePath));

  // If already PascalCase, return as-is
  if (/^[A-Z][A-Za-z0-9]*$/.test(baseName)) {
    return baseName;
  }

  // Convert kebab-case or snake_case to PascalCase
  return baseName
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}
