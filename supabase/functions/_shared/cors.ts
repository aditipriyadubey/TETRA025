// supabase/functions/_shared/cors.ts
//
// EduBridge AI — Shared CORS & Response Helpers for Edge Functions
//
// This module eliminates CORS/response duplication across all 9
// Edge Functions.  Import from "../_shared/cors.ts" in each function.
//
// DENO RUNTIME NOTE:
//   This file runs in Supabase's Deno Edge Function runtime.
//   It must NOT import from src/ai/* or any Vite-bundled module.

// ─── CORS Headers ────────────────────────────────────────────────

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

// ─── Response Helpers ────────────────────────────────────────────

/** Return a JSON response with CORS headers. */
export function jsonResponse(
  status: number,
  body: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** Return a CORS preflight response (204 No Content). */
export function corsPreflightResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** Return a streamed text response with CORS headers (for /ask). */
export function streamResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}

// ─── Validation Helpers ──────────────────────────────────────────

/** Validate that the request method is POST, return error response if not. */
export function validateMethod(req: Request): Response | null {
  if (req.method !== "POST") {
    return jsonResponse(405, {
      error: "Method not allowed. Use POST.",
      code: "METHOD_NOT_ALLOWED",
    });
  }
  return null;
}

/** Validate Content-Type is application/json, return error response if not. */
export function validateJsonContentType(req: Request): Response | null {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonResponse(400, {
      error: "Content-Type must be application/json.",
      code: "INVALID_CONTENT_TYPE",
    });
  }
  return null;
}

/** Safely parse JSON body, return error response on failure. */
export async function safeParseJson(
  req: Request,
): Promise<{ data: Record<string, unknown> } | { error: Response }> {
  try {
    const body = await req.json();
    return { data: body as Record<string, unknown> };
  } catch (_err) {
    return {
      error: jsonResponse(400, {
        error: "Failed to parse JSON request body.",
        code: "JSON_PARSE_ERROR",
      }),
    };
  }
}

/** Validate a required non-empty string field. Returns error response or null. */
export function requireString(
  value: unknown,
  fieldName: string,
): Response | null {
  if (typeof value !== "string" || value.trim() === "") {
    return jsonResponse(400, {
      error: `Missing or invalid required field: "${fieldName}".`,
      code: `INVALID_${fieldName.toUpperCase()}`,
    });
  }
  return null;
}

// ─── API Key Helper ──────────────────────────────────────────────

/**
 * Read a server-side secret from Deno.env.
 * Returns the key value or an error response if missing.
 *
 * SECURITY: This value must NEVER be returned to the client,
 * logged, or included in error responses.
 */
export function requireEnvSecret(
  name: string,
): { key: string } | { error: Response } {
  const key = Deno.env.get(name);
  if (!key) {
    return {
      error: jsonResponse(500, {
        error: `${name} is not configured. Contact the deployment administrator.`,
        code: "MISSING_API_KEY",
      }),
    };
  }
  return { key };
}
