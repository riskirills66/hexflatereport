// ./src/config/api.ts

// API endpoints (split if multiple provided)
const API_ENDPOINTS = (import.meta.env.VITE_API_ENDPOINTS || "")
  .split(",")
  .map((url) => url.trim());

// Token value
export const X_TOKEN_VALUE = import.meta.env.VITE_X_TOKEN_VALUE || "";

// Cache for the working endpoint
let cachedEndpoint: string | null = null;

/**
 * Get the best available API endpoint by testing connectivity
 * Falls back to the next endpoint if one fails
 */
export async function getApiEndpoint(): Promise<string> {
  // Return cached endpoint if available
  if (cachedEndpoint) {
    return cachedEndpoint;
  }

  // Production build - skip localhost detection

  // Test each endpoint
  for (const endpoint of API_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Short timeout to avoid long waits
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        cachedEndpoint = endpoint;
        return endpoint;
      }
    } catch (error) {
      console.warn(`Endpoint ${endpoint} is not available:`, error);
      continue;
    }
  }

  // If all endpoints fail, use the first one as fallback
  console.warn("All API endpoints failed, using fallback");
  return API_ENDPOINTS[0];
}

/**
 * Clear the cached endpoint (useful for testing or when endpoints change)
 */
export function clearApiEndpointCache(): void {
  cachedEndpoint = null;
}

// Clear cache on module load to ensure fresh endpoint selection
clearApiEndpointCache();

/**
 * Get the base API URL for making requests
 */
export async function getApiUrl(path: string): Promise<string> {
  const endpoint = await getApiEndpoint();
  return `${endpoint}${path}`;
}

/**
 * Make an API request with automatic endpoint selection
 */
export async function apiRequest(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const apiUrl = await getApiUrl(path);
  return fetch(apiUrl, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
}

// Export the endpoints for reference
export { API_ENDPOINTS };
