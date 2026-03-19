/**
 * Extract data-guideai attribute values from JSX/TSX/HTML source code.
 *
 * These are the highest-priority fingerprint signals (40 points) since
 * they are explicitly set by developers for GuideAI element targeting.
 */
export function extractDataGuideai(sourceCode: string): string[] {
  const values: string[] = [];

  // JSX pattern: data-guideai="value" or data-guideai={'value'}
  const jsxPattern = /data-guideai\s*=\s*(?:"([^"]+)"|'([^']+)'|\{['"]([^'"]+)['"]\})/g;
  let match: RegExpExecArray | null;

  while ((match = jsxPattern.exec(sourceCode)) !== null) {
    const value = match[1] || match[2] || match[3];
    if (value) {
      values.push(value);
    }
  }

  return [...new Set(values)];
}
