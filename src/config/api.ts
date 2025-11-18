// ./src/config/api.ts

// API endpoints (split if multiple provided)
const API_ENDPOINTS = (import.meta.env.VITE_API_ENDPOINTS || "")
  .split(",")
  .map((url) => url.trim());

// Token value
export const X_TOKEN_VALUE = import.meta.env.VITE_X_TOKEN_VALUE || "";

// Cache for the working endpoint
let cachedEndpoint: string | null = null;
let endpointTestPromise: Promise<string> | null = null;
let hasLoggedEndpointFailure = false;

/**
 * Get the best available API endpoint by testing connectivity
 * Falls back to the next endpoint if one fails
 */
export async function getApiEndpoint(): Promise<string> {
  // Return cached endpoint if available
  if (cachedEndpoint) {
    return cachedEndpoint;
  }

  // If we're already testing endpoints, wait for that test to complete
  if (endpointTestPromise) {
    return endpointTestPromise;
  }

  // Start endpoint testing
  endpointTestPromise = (async () => {
    // Test each endpoint
    for (const endpoint of API_ENDPOINTS) {
      try {
        const response = await fetch(`${endpoint}/health`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Short timeout to avoid long waits
          signal: AbortSignal.timeout(2000),
        });

        if (response.ok) {
          cachedEndpoint = endpoint;
          hasLoggedEndpointFailure = false;
          endpointTestPromise = null;
          return endpoint;
        }
      } catch (error) {
        // Silently continue to next endpoint
        continue;
      }
    }

    // If all endpoints fail, use the first one as fallback and cache it
    const fallbackEndpoint = API_ENDPOINTS[0] || "";
    cachedEndpoint = fallbackEndpoint;
    
    // Only log once to avoid console spam
    if (!hasLoggedEndpointFailure) {
      console.warn("All API endpoints failed, using fallback:", fallbackEndpoint);
      hasLoggedEndpointFailure = true;
    }
    
    endpointTestPromise = null;
    return fallbackEndpoint;
  })();

  return endpointTestPromise;
}

/**
 * Clear the cached endpoint (useful for testing or when endpoints change)
 */
export function clearApiEndpointCache(): void {
  cachedEndpoint = null;
  endpointTestPromise = null;
  hasLoggedEndpointFailure = false;
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
  
  // Create abort controller for timeout if no signal is provided
  const userSignal = options.signal;
  const controller = userSignal ? null : new AbortController();
  const timeoutId = controller ? setTimeout(() => controller.abort(), 10000) : null; // 10 second timeout
  
  // Extract headers and body from options to merge properly
  const { headers: optionsHeaders, body, ...restOptions } = options;
  
  // Merge headers - ensure Content-Type is set for JSON requests
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  
  // Add any custom headers from options
  if (optionsHeaders) {
    if (optionsHeaders instanceof Headers) {
      optionsHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    } else if (Array.isArray(optionsHeaders)) {
      optionsHeaders.forEach(([key, value]) => {
        headers.set(key, value);
      });
    } else {
      Object.entries(optionsHeaders).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          headers.set(key, String(value));
        }
      });
    }
  }
  
  try {
    const response = await fetch(apiUrl, {
      ...restOptions,
      method: options.method || "GET",
      headers,
      body,
      signal: userSignal || controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

// Export the endpoints for reference
export { API_ENDPOINTS };
