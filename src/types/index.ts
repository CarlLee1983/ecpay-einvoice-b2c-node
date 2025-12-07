import { AxiosInstance } from 'axios'

/**
 * Logger interface for SDK logging.
 * Compatible with console, winston, pino, etc.
 */
export interface EcPayLogger {
    debug?(message: string, ...args: any[]): void
    info?(message: string, ...args: any[]): void
    warn?(message: string, ...args: any[]): void
    error?(message: string, ...args: any[]): void
}

/**
 * Retry configuration options.
 */
export interface RetryConfig {
    /** Maximum number of retry attempts. Default: 3 */
    maxRetries?: number
    /** Base delay in milliseconds between retries. Default: 1000 */
    retryDelay?: number
    /** Multiplier for exponential backoff. Default: 2 */
    backoffMultiplier?: number
    /** HTTP status codes that should trigger a retry. Default: [408, 429, 500, 502, 503, 504] */
    retryableStatusCodes?: number[]
}

/**
 * Configuration options for EcPayClient.
 */
export interface EcPayClientOptions {
    /** Request timeout in milliseconds. Default: 30000 (30s) */
    timeout?: number

    /** Retry configuration */
    retry?: RetryConfig

    /** Custom axios instance to use instead of creating new one */
    axiosInstance?: AxiosInstance

    /** Logger for SDK operations */
    logger?: EcPayLogger

    /** Additional headers to include in requests */
    headers?: Record<string, string>
}

/**
 * Default client options.
 */
export const DEFAULT_CLIENT_OPTIONS: Required<Omit<EcPayClientOptions, 'axiosInstance' | 'logger' | 'headers'>> & {
    retry: Required<RetryConfig>
} = {
    timeout: 30000,
    retry: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
}
