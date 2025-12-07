import { describe, it, expect, vi, afterEach } from 'vitest'
import { EcPayClient } from '../src/EcPayClient'
import { CipherService } from '../src/security/CipherService'
import { AllowanceInvoice } from '../src/operations/AllowanceInvoice'
import { InvalidInvoice } from '../src/operations/InvalidInvoice'
import * as crypto from 'crypto'
import nock from 'nock'

// Mock crypto module
vi.mock('crypto', async (importOriginal) => {
    const actual = await importOriginal<typeof import('crypto')>()
    return {
        ...actual,
        createCipheriv: vi.fn(actual.createCipheriv),
        createDecipheriv: vi.fn(actual.createDecipheriv),
    }
})

describe('Coverage Improvements', () => {
    afterEach(() => {
        vi.clearAllMocks()
        // Ensure defaults are restored if we changed them permanently (but we will use mockImplementationOnce)
    })

    describe('EcPayClient', () => {
        it('should return current options', () => {
            const client = new EcPayClient(
                'https://test.com',
                '1234567890123456',
                '1234567890123456',
                '1234'
            )
            const options = client.getOptions()
            expect(options).toBeDefined()
            expect(options.timeout).toBeDefined()
        })

        it('should use provided logger', async () => {
            const logger = {
                debug: vi.fn(),
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn()
            }

            const client = new EcPayClient(
                'https://test.com',
                '1234567890123456',
                '1234567890123456',
                '1234',
                { logger }
            )

            expect(logger.debug).toHaveBeenCalled()
        })

        it('should handle network error without response', async () => {
            const client = new EcPayClient(
                'https://test.com',
                '1234567890123456',
                '1234567890123456',
                '1234',
                {
                    retry: { maxRetries: 0 }
                }
            )

            nock('https://test.com')
                .post('/B2CInvoice/CheckBarcode')
                .replyWithError('Network Error')

            await expect(client.checkBarcode({ BarCode: '/ABC1234' }))
                .rejects
                .toThrow('Network Error')
        })
    })

    describe('AllowanceInvoice', () => {
        it('should throw if invoice no is empty in validate', () => {
            const op = new AllowanceInvoice()
            expect(() => op.validate()).toThrow('InvoiceNo empty')
        })

        it('should throw if invoice date is empty in validate', () => {
            const op = new AllowanceInvoice()
            op.setInvoiceNo('1234567890')
            expect(() => op.validate()).toThrow('InvoiceDate empty')
        })

        it('should throw if items empty in validate', () => {
            const op = new AllowanceInvoice()
            op.setInvoiceNo('1234567890')
            op.setInvoiceDate('2023-01-01')
            expect(() => op.validate()).toThrow('Items empty')
        })

        it('should throw if invoice no length is invalid', () => {
            const op = new AllowanceInvoice()
            expect(() => op.setInvoiceNo('123')).toThrow('InvoiceNo must be 10 chars')
        })
    })

    describe('InvalidInvoice', () => {
        it('should throw if invoice no is empty in validate', () => {
            const op = new InvalidInvoice()
            // Missing No
            expect(() => op.validate()).toThrow('The invoice no is empty.')
        })

        it('should throw if invoice date is empty in validate', () => {
            const op = new InvalidInvoice()
            op.setInvoiceNo('1234567890')
            // Missing Date
            expect(() => op.validate()).toThrow('The invoice date is empty.')
        })
    })

    describe('CipherService Exceptions', () => {
        const hashKey = '1234567890123456'
        const hashIV = '1234567890123456'

        it('should throw EncryptionException when crypto.createCipheriv fails', () => {
            vi.mocked(crypto.createCipheriv).mockImplementationOnce(() => {
                throw new Error('Mock Crypto Error')
            })

            const service = new CipherService(hashKey, hashIV)
            expect(() => service.encrypt('test')).toThrow('Encryption failed: Mock Crypto Error')
        })

        it('should throw EncryptionException when crypto.createDecipheriv fails', () => {
            vi.mocked(crypto.createDecipheriv).mockImplementationOnce(() => {
                throw new Error('Mock Decrypt Error')
            })

            const service = new CipherService(hashKey, hashIV)
            expect(() => service.decrypt('test')).toThrow('Decryption failed: Mock Decrypt Error')
        })
    })
})
