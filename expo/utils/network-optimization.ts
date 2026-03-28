import { Platform } from 'react-native';

// Network layer enhancements for better performance and reliability

export interface NetworkConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  maxRetryDelay: number;
  retryMultiplier: number;
  enableDeduplication: boolean;
  enableOfflineQueue: boolean;
}

export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryAttempts?: number;
  priority?: 'high' | 'normal' | 'low';
  cacheKey?: string;
  skipDeduplication?: boolean;
}

export interface NetworkResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached: boolean;
  fromOfflineQueue: boolean;
}

export interface NetworkError extends Error {
  status?: number;
  code?: string;
  retryable: boolean;
  originalError?: Error;
}

const DEFAULT_CONFIG: NetworkConfig = {
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  maxRetryDelay: 10000, // 10 seconds
  retryMultiplier: 2,
  enableDeduplication: true,
  enableOfflineQueue: true,
};

/**
 * Enhanced network client with retry, deduplication, and offline support
 */
export class NetworkClient {
  private static instance: NetworkClient;
  private config: NetworkConfig;
  private pendingRequests: Map<string, Promise<NetworkResponse>> = new Map();
  private offlineQueue: RequestOptions[] = [];
  private isOnline: boolean = true;
  private requestCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  constructor(config: Partial<NetworkConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupNetworkListener();
  }

  static getInstance(config?: Partial<NetworkConfig>): NetworkClient {
    if (!NetworkClient.instance) {
      NetworkClient.instance = new NetworkClient(config);
    }
    return NetworkClient.instance;
  }

  private setupNetworkListener(): void {
    if (Platform.OS === 'web') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processOfflineQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
      this.isOnline = navigator.onLine;
    } else {
      // For React Native, you would use @react-native-community/netinfo
      // This is a simplified version
      this.isOnline = true;
    }
  }

  /**
   * Makes an HTTP request with retry logic and deduplication
   */
  async request<T = any>(options: RequestOptions): Promise<NetworkResponse<T>> {
    const {
      url,
      method = 'GET',
      headers = {},
      body,
      timeout = this.config.timeout,
      retryAttempts = this.config.retryAttempts,
      priority = 'normal',
      cacheKey,
      skipDeduplication = false,
    } = options;

    // Check cache first for GET requests
    if (method === 'GET' && cacheKey) {
      const cached = this.getCachedResponse<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Generate request key for deduplication
    const requestKey = this.generateRequestKey(options);

    // Check for existing pending request
    if (this.config.enableDeduplication && !skipDeduplication && this.pendingRequests.has(requestKey)) {
      console.log('Deduplicating request:', requestKey);
      return this.pendingRequests.get(requestKey) as Promise<NetworkResponse<T>>;
    }

    // If offline, add to queue
    if (!this.isOnline && this.config.enableOfflineQueue) {
      this.offlineQueue.push(options);
      throw this.createNetworkError('Network unavailable - request queued', 0, 'OFFLINE', true);
    }

    // Create and execute request
    const requestPromise = this.executeRequest<T>(options, retryAttempts);

    // Store pending request for deduplication
    if (this.config.enableDeduplication && !skipDeduplication) {
      this.pendingRequests.set(requestKey, requestPromise);
    }

    try {
      const response = await requestPromise;

      // Cache successful GET responses
      if (method === 'GET' && cacheKey && response.status >= 200 && response.status < 300) {
        this.setCachedResponse(cacheKey, response, 5 * 60 * 1000); // 5 minutes TTL
      }

      return response;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(requestKey);
    }
  }

  private async executeRequest<T>(options: RequestOptions, attemptsLeft: number): Promise<NetworkResponse<T>> {
    const { url, method = 'GET', headers = {}, body, timeout = this.config.timeout } = options;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      };

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.createNetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          'HTTP_ERROR',
          this.isRetryableStatus(response.status)
        );
      }

      const data = await response.json();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        data,
        status: response.status,
        headers: responseHeaders,
        cached: false,
        fromOfflineQueue: false,
      };
    } catch (error) {
      if (attemptsLeft > 0 && this.isRetryableError(error)) {
        const delay = this.calculateRetryDelay(this.config.retryAttempts - attemptsLeft);
        console.log(`Retrying request in ${delay}ms. Attempts left: ${attemptsLeft - 1}`);
        
        await this.sleep(delay);
        return this.executeRequest<T>(options, attemptsLeft - 1);
      }

      throw this.normalizeError(error);
    }
  }

  private generateRequestKey(options: RequestOptions): string {
    const { url, method = 'GET', body } = options;
    const bodyHash = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyHash}`;
  }

  private getCachedResponse<T>(key: string): NetworkResponse<T> | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.timestamp + cached.ttl) {
      this.requestCache.delete(key);
      return null;
    }

    return {
      data: cached.data,
      status: 200,
      headers: {},
      cached: true,
      fromOfflineQueue: false,
    };
  }

  private setCachedResponse(key: string, response: NetworkResponse, ttl: number): void {
    this.requestCache.set(key, {
      data: response.data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} queued requests`);
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const options of queue) {
      try {
        await this.request({ ...options, skipDeduplication: true });
      } catch (error) {
        console.warn('Failed to process queued request:', error);
        // Re-queue if still retryable
        if (this.isRetryableError(error)) {
          this.offlineQueue.push(options);
        }
      }
    }
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = this.config.retryDelay * Math.pow(this.config.retryMultiplier, attempt);
    return Math.min(delay, this.config.maxRetryDelay);
  }

  private isRetryableStatus(status: number): boolean {
    return status >= 500 || status === 408 || status === 429;
  }

  private isRetryableError(error: any): boolean {
    if (error.name === 'AbortError') return false;
    if (error.code === 'OFFLINE') return true;
    if (error.status && !this.isRetryableStatus(error.status)) return false;
    return true;
  }

  private createNetworkError(message: string, status?: number, code?: string, retryable: boolean = false): NetworkError {
    const error = new Error(message) as NetworkError;
    error.status = status;
    error.code = code;
    error.retryable = retryable;
    return error;
  }

  private normalizeError(error: any): NetworkError {
    if (error.name === 'AbortError') {
      return this.createNetworkError('Request timeout', 408, 'TIMEOUT', true);
    }
    
    if (error.status) {
      return error as NetworkError;
    }

    return this.createNetworkError(error.message || 'Network error', undefined, 'NETWORK_ERROR', true);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clears all caches and queues
   */
  clearCache(): void {
    this.requestCache.clear();
    this.pendingRequests.clear();
    this.offlineQueue = [];
  }

  /**
   * Gets network statistics
   */
  getStats(): {
    cachedResponses: number;
    pendingRequests: number;
    queuedRequests: number;
    isOnline: boolean;
  } {
    return {
      cachedResponses: this.requestCache.size,
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.offlineQueue.length,
      isOnline: this.isOnline,
    };
  }
}

/**
 * Hook for using the enhanced network client
 */
export function useNetworkClient(config?: Partial<NetworkConfig>) {
  const client = NetworkClient.getInstance(config);

  return {
    request: <T = any>(options: RequestOptions) => client.request<T>(options),
    clearCache: () => client.clearCache(),
    getStats: () => client.getStats(),
  };
}

/**
 * Request deduplication utility
 */
export class RequestDeduplicator {
  private static instance: RequestDeduplicator;
  private pendingRequests: Map<string, Promise<any>> = new Map();

  static getInstance(): RequestDeduplicator {
    if (!RequestDeduplicator.instance) {
      RequestDeduplicator.instance = new RequestDeduplicator();
    }
    return RequestDeduplicator.instance;
  }

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      console.log('Deduplicating request:', key);
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = requestFn();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}

export default {
  NetworkClient,
  useNetworkClient,
  RequestDeduplicator,
};