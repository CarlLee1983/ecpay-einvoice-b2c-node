/**
 * Integration Test Example
 *
 * This file demonstrates how to write integration tests using nock
 * to mock ECPay API responses. This allows testing the full request/response
 * cycle without hitting the actual API.
 *
 * To run these tests:
 * 1. Install nock: pnpm add -D nock
 * 2. Run: pnpm vitest run test/integration.test.ts
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import nock from 'nock'
import { EcPayClient, PrintMark, Donation, TaxType } from '../src'
import { CipherService } from '../src/security/CipherService'
import { PayloadEncoder } from '../src/security/PayloadEncoder'

describe('Integration Tests', () => {
    const serverUrl = 'https://einvoice-stage.ecpay.com.tw'
    const hashKey = 'ejCk326UnaZWKisg'
    const hashIV = 'q9jcZX8Ib9LM8wYk'
    const merchantId = '2000132'

    // Helper to create encrypted response
    const encoder = new PayloadEncoder(new CipherService(hashKey, hashIV))

    function createEncryptedResponse(data: any): string {
        const payload = { Data: data }
        return encoder.encodePayload(payload).Data as string
    }

    beforeAll(() => {
        // Disable real HTTP requests
        nock.disableNetConnect()
    })

    afterAll(() => {
        // Re-enable real HTTP requests
        nock.enableNetConnect()
    })

    afterEach(() => {
        // Clean up all nock interceptors
        nock.cleanAll()
    })

    describe('issueInvoice', () => {
        it('should successfully issue an invoice', async () => {
            // Mock successful response
            const mockResponseData = {
                RtnCode: 1,
                RtnMsg: '開立發票成功',
                InvoiceNo: 'AB12345678',
                InvoiceDate: '2023-12-01',
                RandomNumber: '1234',
            }

            nock(serverUrl)
                .post('/B2CInvoice/Issue')
                .reply(200, {
                    RtnCode: 1,
                    RtnMsg: 'Success',
                    Data: createEncryptedResponse(mockResponseData),
                })

            const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId, {
                retry: { maxRetries: 0 },
            })

            const response = await client.issueInvoice({
                RelateNumber: 'TEST' + Date.now(),
                CustomerEmail: 'test@example.com',
                Print: PrintMark.NO,
                Donation: Donation.NO,
                TaxType: TaxType.DUTIABLE,
                SalesAmount: 100,
                Items: [{ ItemName: 'Test', ItemCount: 1, ItemWord: 'pc', ItemPrice: 100 }],
            })

            expect(response.RtnCode).toBe(1)
            expect(response.Data.InvoiceNo).toBe('AB12345678')
            expect(response.Data.InvoiceDate).toBe('2023-12-01')
        })

        it('should handle API error response', async () => {
            const mockErrorData = {
                RtnCode: 10000001,
                RtnMsg: 'RelateNumber 重複',
            }

            nock(serverUrl)
                .post('/B2CInvoice/Issue')
                .reply(200, {
                    RtnCode: 1,
                    RtnMsg: 'Success',
                    Data: createEncryptedResponse(mockErrorData),
                })

            const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId, {
                retry: { maxRetries: 0 },
            })

            const response = await client.issueInvoice({
                RelateNumber: 'DUPLICATE123',
                CustomerEmail: 'test@example.com',
                SalesAmount: 100,
                Items: [{ ItemName: 'Test', ItemCount: 1, ItemWord: 'pc', ItemPrice: 100 }],
            })

            // API-level error (returned in Data)
            expect(response.Data.RtnCode).toBe(10000001)
            expect(response.Data.RtnMsg).toBe('RelateNumber 重複')
        })
    })

    describe('checkLoveCode', () => {
        it('should validate existing love code', async () => {
            nock(serverUrl)
                .post('/B2CInvoice/CheckLoveCode')
                .reply(200, {
                    RtnCode: 1,
                    RtnMsg: 'Success',
                    Data: createEncryptedResponse({
                        RtnCode: 1,
                        RtnMsg: '查詢成功',
                        IsExist: 'Y',
                    }),
                })

            const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId, {
                retry: { maxRetries: 0 },
            })

            const response = await client.checkLoveCode({ LoveCode: '168001' })

            expect(response.RtnCode).toBe(1)
            expect(response.Data.IsExist).toBe('Y')
        })

        it('should validate non-existing love code', async () => {
            nock(serverUrl)
                .post('/B2CInvoice/CheckLoveCode')
                .reply(200, {
                    RtnCode: 1,
                    RtnMsg: 'Success',
                    Data: createEncryptedResponse({
                        RtnCode: 1,
                        RtnMsg: '查詢成功',
                        IsExist: 'N',
                    }),
                })

            const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId, {
                retry: { maxRetries: 0 },
            })

            const response = await client.checkLoveCode({ LoveCode: '999999' })

            expect(response.Data.IsExist).toBe('N')
        })
    })

    describe('Network Error Handling', () => {
        it('should handle network timeout', async () => {
            nock(serverUrl)
                .post('/B2CInvoice/Issue')
                .delay(5000) // Delay longer than timeout
                .reply(200, {})

            const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId, {
                timeout: 100, // Very short timeout
                retry: { maxRetries: 0 },
            })

            await expect(
                client.issueInvoice({
                    RelateNumber: 'TIMEOUT' + Date.now(),
                    CustomerEmail: 'test@example.com',
                    SalesAmount: 100,
                    Items: [{ ItemName: 'Test', ItemCount: 1, ItemWord: 'pc', ItemPrice: 100 }],
                }),
            ).rejects.toThrow()
        })

        it('should handle server error with retry disabled', async () => {
            nock(serverUrl).post('/B2CInvoice/Issue').reply(500, 'Internal Server Error')

            const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId, {
                retry: { maxRetries: 0 },
            })

            await expect(
                client.issueInvoice({
                    RelateNumber: 'ERROR' + Date.now(),
                    CustomerEmail: 'test@example.com',
                    SalesAmount: 100,
                    Items: [{ ItemName: 'Test', ItemCount: 1, ItemWord: 'pc', ItemPrice: 100 }],
                }),
            ).rejects.toThrow('API Error: 500')
        })
    })
})
