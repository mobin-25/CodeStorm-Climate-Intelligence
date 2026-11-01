/**
 * Base API client configuration ready for future backend connection.
 * Defaults to using mock data when backend URL is not configured.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      return {
        data: null,
        error: `HTTP error ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    const data = (await response.json()) as T;
    return { data, error: null, status: response.status };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown network error occurred";
    return { data: null, error: errorMessage, status: 500 };
  }
}
