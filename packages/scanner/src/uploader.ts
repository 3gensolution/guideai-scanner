import type { ScanResult } from './types';

/** Error thrown when the upload fails due to authentication issues. */
export class UploadAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'UploadAuthError';
  }
}

/** Error thrown when the upload fails due to server or network issues. */
export class UploadError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

/**
 * Upload the scan result to the GuideAI backend as a knowledge base.
 *
 * Sends a POST request to {apiUrl}/api/v1/knowledge-base with the scan result
 * payload and the site API key in the X-API-Key header.
 *
 * Response codes:
 * - 202: Accepted — knowledge base is being processed
 * - 401: Unauthorized — invalid API key
 * - 403: Forbidden — key does not have permission
 * - 422: Validation error
 * - 5xx: Server error
 */
export async function uploadKnowledgeBase(
  apiUrl: string,
  apiKey: string,
  data: ScanResult,
): Promise<void> {
  const url = `${apiUrl.replace(/\/+$/, '')}/api/v1/knowledge-base`;

  const payload = {
    framework: data.framework,
    routes: data.routes,
    elements: data.elements,
    ui_map: data.ui_map,
    scanned_at: new Date().toISOString(),
    duration_ms: data.duration_ms,
  };

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'User-Agent': '@guideai/scanner',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown network error';
    throw new UploadError(
      `Failed to connect to GuideAI API at ${url}: ${message}`,
    );
  }

  if (response.status === 202) {
    // Success — knowledge base accepted for processing
    return;
  }

  if (response.status === 401 || response.status === 403) {
    const body = await safeReadBody(response);
    throw new UploadAuthError(
      `Authentication failed (${response.status}): ${body || 'Invalid or expired API key'}`,
      response.status,
    );
  }

  if (response.status === 422) {
    const body = await safeReadBody(response);
    throw new UploadError(
      `Validation error (422): ${body || 'Invalid scan data'}`,
      422,
    );
  }

  const body = await safeReadBody(response);
  throw new UploadError(
    `Upload failed with status ${response.status}: ${body || 'Unknown error'}`,
    response.status,
  );
}

/**
 * Safely read the response body as text, returning undefined on failure.
 */
async function safeReadBody(response: Response): Promise<string | undefined> {
  try {
    return await response.text();
  } catch {
    return undefined;
  }
}
