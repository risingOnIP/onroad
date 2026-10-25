import { getAuthToken } from "@/app/actions/general";

interface ApiClientOptions extends RequestInit {
  requireAuth?: boolean;
  baseUrl?: string;
}

/**
 * Centralized API client for making authenticated requests to the Express backend
 * This eliminates the need to repeat the same fetch pattern across multiple files
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const {
    requireAuth = true,
    baseUrl = process.env.NEXT_PUBLIC_EXPRESS_API_URL,
    headers = {},
    ...fetchOptions
  } = options;

  // Ensure Content-Type is always set correctly
  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };
  
  // Check if body is FormData
  const isFormData = fetchOptions.body instanceof FormData;
  
  // Only set Content-Type for non-FormData requests
  // For FormData, let the browser set the boundary automatically
  if (!isFormData && (fetchOptions.method !== 'DELETE' || fetchOptions.body)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  // Add auth token if required
  if (requireAuth) {
    try {
      const token = await getAuthToken();
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Failed to get auth token:", error);
      throw new Error("Authentication failed");
    }
  }

  const url = `${baseUrl}${endpoint}`;

  // Debug logging

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorText: errorText.substring(0, 500), // First 500 chars
      });
      throw new Error(errorText || `API request failed: ${response.status}`);
    }

    // Return response as JSON if content-type is application/json
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    // Otherwise return the response object for further processing
    return response as any;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<ApiClientOptions, "method">) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiClientOptions, "method" | "body">
  ) => {
    // Ensure we're not accidentally sending FormData
    if (body && body instanceof FormData) {
      console.error("WARNING: FormData detected in POST request. This should be JSON.");
      throw new Error("FormData not supported. Please send JSON data.");
    }
    
    return apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put: <T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiClientOptions, "method" | "body">
  ) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiClientOptions, "method" | "body">
  ) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: Omit<ApiClientOptions, "method">) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};