/**
 * Base error class for ECPay SDK errors.
 */
export class EcPayError extends Error {
    public readonly code: string
    public readonly isRetryable: boolean

    constructor(message: string, code: string = 'ECPAY_ERROR', isRetryable: boolean = false) {
        super(message)
        this.name = 'EcPayError'
        this.code = code
        this.isRetryable = isRetryable
        Object.setPrototypeOf(this, EcPayError.prototype)
    }
}

/**
 * Error thrown when API request fails.
 */
export class EcPayApiError extends EcPayError {
    public readonly rtnCode: number
    public readonly rtnMsg: string
    public readonly transCode?: number
    public readonly transMsg?: string
    public readonly rawResponse?: any

    constructor(
        message: string,
        rtnCode: number,
        rtnMsg: string,
        options?: {
            transCode?: number
            transMsg?: string
            rawResponse?: any
        },
    ) {
        super(message, 'ECPAY_API_ERROR', false)
        this.name = 'EcPayApiError'
        this.rtnCode = rtnCode
        this.rtnMsg = rtnMsg
        this.transCode = options?.transCode
        this.transMsg = options?.transMsg
        this.rawResponse = options?.rawResponse
        Object.setPrototypeOf(this, EcPayApiError.prototype)
    }
}

/**
 * Error thrown when validation fails.
 */
export class EcPayValidationError extends EcPayError {
    public readonly field?: string
    public readonly details?: any

    constructor(message: string, field?: string, details?: any) {
        super(message, 'ECPAY_VALIDATION_ERROR', false)
        this.name = 'EcPayValidationError'
        this.field = field
        this.details = details
        Object.setPrototypeOf(this, EcPayValidationError.prototype)
    }
}

/**
 * Error thrown when network/HTTP request fails.
 */
export class EcPayNetworkError extends EcPayError {
    public readonly statusCode?: number
    public readonly originalError?: Error

    constructor(message: string, statusCode?: number, originalError?: Error) {
        super(message, 'ECPAY_NETWORK_ERROR', true)
        this.name = 'EcPayNetworkError'
        this.statusCode = statusCode
        this.originalError = originalError
        Object.setPrototypeOf(this, EcPayNetworkError.prototype)
    }
}

/**
 * Error thrown when encryption/decryption fails.
 */
export class EcPayEncryptionError extends EcPayError {
    constructor(message: string) {
        super(message, 'ECPAY_ENCRYPTION_ERROR', false)
        this.name = 'EcPayEncryptionError'
        Object.setPrototypeOf(this, EcPayEncryptionError.prototype)
    }
}

/**
 * Error thrown when request times out.
 */
export class EcPayTimeoutError extends EcPayError {
    public readonly timeoutMs: number

    constructor(message: string, timeoutMs: number) {
        super(message, 'ECPAY_TIMEOUT_ERROR', true)
        this.name = 'EcPayTimeoutError'
        this.timeoutMs = timeoutMs
        Object.setPrototypeOf(this, EcPayTimeoutError.prototype)
    }
}
