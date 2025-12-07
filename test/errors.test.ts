import { describe, it, expect } from 'vitest'
import {
    EcPayError,
    EcPayApiError,
    EcPayValidationError,
    EcPayNetworkError,
    EcPayEncryptionError,
    EcPayTimeoutError,
} from '../src/errors'

describe('EcPayError', () => {
    it('should create base error', () => {
        const error = new EcPayError('Test error')
        expect(error).toBeInstanceOf(Error)
        expect(error).toBeInstanceOf(EcPayError)
        expect(error.message).toBe('Test error')
        expect(error.name).toBe('EcPayError')
        expect(error.code).toBe('ECPAY_ERROR')
        expect(error.isRetryable).toBe(false)
    })

    it('should create with custom code', () => {
        const error = new EcPayError('Test', 'CUSTOM_CODE', true)
        expect(error.code).toBe('CUSTOM_CODE')
        expect(error.isRetryable).toBe(true)
    })
})

describe('EcPayApiError', () => {
    it('should create API error with details', () => {
        const error = new EcPayApiError('API failed', 1001, 'Failed', {
            transCode: 10,
            transMsg: 'Trans failed',
            rawResponse: { data: 'raw' },
        })
        expect(error).toBeInstanceOf(EcPayError)
        expect(error).toBeInstanceOf(EcPayApiError)
        expect(error.name).toBe('EcPayApiError')
        expect(error.code).toBe('ECPAY_API_ERROR')
        expect(error.rtnCode).toBe(1001)
        expect(error.rtnMsg).toBe('Failed')
        expect(error.transCode).toBe(10)
        expect(error.transMsg).toBe('Trans failed')
        expect(error.rawResponse).toEqual({ data: 'raw' })
    })

    it('should create API error without optional fields', () => {
        const error = new EcPayApiError('Error', 0, 'Fail')
        expect(error.transCode).toBeUndefined()
        expect(error.transMsg).toBeUndefined()
        expect(error.rawResponse).toBeUndefined()
    })
})

describe('EcPayValidationError', () => {
    it('should create validation error', () => {
        const error = new EcPayValidationError('Field invalid', 'email', { min: 1 })
        expect(error).toBeInstanceOf(EcPayError)
        expect(error).toBeInstanceOf(EcPayValidationError)
        expect(error.name).toBe('EcPayValidationError')
        expect(error.code).toBe('ECPAY_VALIDATION_ERROR')
        expect(error.field).toBe('email')
        expect(error.details).toEqual({ min: 1 })
        expect(error.isRetryable).toBe(false)
    })
})

describe('EcPayNetworkError', () => {
    it('should create network error with status code', () => {
        const originalError = new Error('Connection failed')
        const error = new EcPayNetworkError('Network error', 503, originalError)
        expect(error).toBeInstanceOf(EcPayError)
        expect(error).toBeInstanceOf(EcPayNetworkError)
        expect(error.name).toBe('EcPayNetworkError')
        expect(error.code).toBe('ECPAY_NETWORK_ERROR')
        expect(error.statusCode).toBe(503)
        expect(error.originalError).toBe(originalError)
        expect(error.isRetryable).toBe(true)
    })
})

describe('EcPayEncryptionError', () => {
    it('should create encryption error', () => {
        const error = new EcPayEncryptionError('Decrypt failed')
        expect(error).toBeInstanceOf(EcPayError)
        expect(error).toBeInstanceOf(EcPayEncryptionError)
        expect(error.name).toBe('EcPayEncryptionError')
        expect(error.code).toBe('ECPAY_ENCRYPTION_ERROR')
        expect(error.isRetryable).toBe(false)
    })
})

describe('EcPayTimeoutError', () => {
    it('should create timeout error', () => {
        const error = new EcPayTimeoutError('Request timed out', 30000)
        expect(error).toBeInstanceOf(EcPayError)
        expect(error).toBeInstanceOf(EcPayTimeoutError)
        expect(error.name).toBe('EcPayTimeoutError')
        expect(error.code).toBe('ECPAY_TIMEOUT_ERROR')
        expect(error.timeoutMs).toBe(30000)
        expect(error.isRetryable).toBe(true)
    })
})
