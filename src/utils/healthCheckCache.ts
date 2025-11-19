interface HealthCheckCache {
  apiResponseTime: string;
  timestamp: number;
}

const CACHE_KEY = 'healthCheckCache';
const CACHE_EXPIRY = 2 * 60 * 1000; // 2 minutes

export function getCachedHealthCheck(): HealthCheckCache | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: HealthCheckCache = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return entry;
  } catch (error) {
    console.error('Error reading health check cache:', error);
    return null;
  }
}

export function setCachedHealthCheck(apiResponseTime: string): void {
  try {
    const entry: HealthCheckCache = {
      apiResponseTime,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing health check cache:', error);
  }
}

export function clearHealthCheckCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing health check cache:', error);
  }
}

export async function measureHealthCheckResponseTime(): Promise<string> {
  try {
    const { getApiUrl } = await import('../config/api');
    const startTime = performance.now();
    const healthUrl = await getApiUrl("/health");
    
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    if (response.ok) {
      const result = `${responseTime}ms`;
      setCachedHealthCheck(result);
      return result;
    } else {
      return "N/A";
    }
  } catch (error) {
    return "N/A";
  }
}

