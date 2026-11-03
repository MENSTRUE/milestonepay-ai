
/**
 * MilestonePay AI
 * Frontend API Client — v0.1
 *
 * React / TypeScript -> FastAPI -> SQLite
 *
 * IMPORTANT:
 * X-Demo-Actor is for local demo simulation only.
 * It is NOT real authentication.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const API_PREFIX = `${API_BASE_URL}/api/v1`;

// ============================================================
// TYPES
// ============================================================

export type DemoActor = "jordan" | "alex";

export type RequestStatus =
  | "Draft"
  | "Sent"
  | "Under Review"
  | "Proposal Received"
  | "Accepted"
  | "Rejected";

export interface HealthResponse {
  status: string;
  mode: string;
  paypal_connected: boolean;
  ai_connected: boolean;
}

export interface ProjectRequestCreate {
  title: string;
  description: string;
  budget_cents: number;
  currency: "USD";
  freelancer_id: "alex";
}

export interface ProjectRequestResponse
  extends ProjectRequestCreate {
  id: string;
  client_id: string;
  status: RequestStatus;
}

interface ApiErrorBody {
  detail?: unknown;
  message?: string;
}

// ============================================================
// ERROR HANDLING
// ============================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function extractErrorMessage(
  body: ApiErrorBody | null,
  status: number
): string {
  if (typeof body?.detail === "string") {
    return body.detail;
  }

  if (typeof body?.message === "string") {
    return body.message;
  }

  if (Array.isArray(body?.detail)) {
    return body.detail
      .map((item: unknown) => {
        if (
          typeof item === "object" &&
          item !== null &&
          "msg" in item
        ) {
          return String(item.msg);
        }

        return "Validation error";
      })
      .join("; ");
  }

  return `API request failed with status ${status}`;
}

// ============================================================
// HTTP CLIENT
// ============================================================

interface RequestOptions {
  method?: "GET" | "POST";
  actor?: DemoActor;
  body?: unknown;
  signal?: AbortSignal;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    actor,
    body,
    signal,
  } = options;

  const headers = new Headers({
    Accept: "application/json",
  });

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (actor) {
    headers.set("X-Demo-Actor", actor);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  const abort = () => controller.abort();

  signal?.addEventListener("abort", abort, { once: true });

  try {
    if (signal?.aborted) {
      controller.abort();
    }

    const response = await fetch(`${API_PREFIX}${endpoint}`, {
      method,
      headers,
      body: body === undefined
        ? undefined
        : JSON.stringify(body),
      signal: controller.signal,
    });

    const raw = await response.text();

    let data: unknown = null;

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        if (response.ok) {
          throw new ApiError(
            "Backend returned invalid JSON.",
            response.status
          );
        }
      }
    }

    if (!response.ok) {
      const errorBody =
        data && typeof data === "object"
          ? (data as ApiErrorBody)
          : null;

      throw new ApiError(
        extractErrorMessage(errorBody, response.status),
        response.status,
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (signal?.aborted) {
      throw new ApiError("Request cancelled.", 0);
    }

    if (controller.signal.aborted) {
      throw new ApiError(
        "Request timed out. Please try again.",
        408
      );
    }

    if (error instanceof TypeError) {
      throw new ApiError(
        "Cannot connect to MilestonePay API. Check that FastAPI is running on port 8000.",
        0
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

// ============================================================
// VALIDATION
// ============================================================

export function dollarsToCents(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const cents = Math.round(amount * 100);

  if (
    !Number.isSafeInteger(cents) ||
    cents > 100_000_000 ||
    Math.abs(amount * 100 - cents) > 0.00001
  ) {
    throw new Error(
      "Invalid amount. Use up to two decimal places and a maximum of $1,000,000."
    );
  }

  return cents;
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

function validateProjectRequest(
  request: ProjectRequestCreate
): void {
  if (request.title.trim().length < 3) {
    throw new Error(
      "Project title must contain at least 3 characters."
    );
  }

  if (request.description.trim().length < 10) {
    throw new Error(
      "Project description must contain at least 10 characters."
    );
  }

  if (
    !Number.isSafeInteger(request.budget_cents) ||
    request.budget_cents < 1 ||
    request.budget_cents > 100_000_000
  ) {
    throw new Error("Project budget is invalid.");
  }

  if (request.currency !== "USD") {
    throw new Error("Only USD is supported in this demo.");
  }

  if (request.freelancer_id !== "alex") {
    throw new Error("Invalid demo freelancer.");
  }
}

// ============================================================
// HEALTH API
// ============================================================

export async function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/health");
}

// ============================================================
// PROJECT REQUEST API
// ============================================================

export async function createProjectRequest(
  request: ProjectRequestCreate,
  actor: DemoActor = "jordan"
): Promise<ProjectRequestResponse> {
  validateProjectRequest(request);

  return apiRequest<ProjectRequestResponse>("/requests", {
    method: "POST",
    actor,
    body: request,
  });
}

export async function getProjectRequests(
  actor: DemoActor
): Promise<ProjectRequestResponse[]> {
  return apiRequest<ProjectRequestResponse[]>("/requests", {
    actor,
  });
}

export async function sendProjectRequest(
  requestId: string,
  actor: DemoActor = "jordan"
): Promise<ProjectRequestResponse> {
  if (!requestId.trim()) {
    throw new Error("Request ID is required.");
  }

  return apiRequest<ProjectRequestResponse>(
    `/requests/${encodeURIComponent(requestId)}/send`,
    {
      method: "POST",
      actor,
    }
  );
}

// ============================================================
// CONVENIENCE SERVICE
// ============================================================

export const milestonePayAPI = {
  health: getHealth,
  requests: {
    create: createProjectRequest,
    list: getProjectRequests,
    send: sendProjectRequest,
  },
};

export default milestonePayAPI;
