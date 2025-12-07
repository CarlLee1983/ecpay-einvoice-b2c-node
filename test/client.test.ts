import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EcPayClient } from '../src/EcPayClient'
import axios from 'axios'

vi.mock('axios')

describe('EcPayClient', () => {
    const mockPost = vi.fn()
    const serverUrl = 'https://einvoice-stage.ecpay.com.tw'
    const hashKey = 'ejCk326UnaZWKisg'
    const hashIV = 'q9jcZX8Ib9LM8wYk'
    const merchantId = '2000132'

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-ignore
        axios.create = vi.fn(() => ({
            post: mockPost,
        }))
        // @ts-ignore
        axios.isAxiosError = vi.fn((payload) => payload?.isAxiosError === true)

        // Prepare encrypted payload for successful response
        const { CipherService } = await import('../src/security/CipherService')
        const cipher = new CipherService(hashKey, hashIV)
        // URL Encoded JSON
        const rawJson = JSON.stringify({ RtnCode: 1, Msg: 'Decrypted' })
        const urlEncoded = encodeURIComponent(rawJson)
        const encrypted = cipher.encrypt(urlEncoded)

        // Mock successful response
        mockPost.mockResolvedValue({
            data: {
                RtnCode: 1,
                RtnMsg: 'Success',
                Data: encrypted,
            },
        })
    })

    it('should construct correct payload for issueInvoice', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)

        const invoice = {
            RelateNumber: 'TEST123456',
            CustomerEmail: 'test@example.com',
            SalesAmount: 100,
            Items: [
                {
                    ItemName: 'Product A',
                    ItemCount: 1,
                    ItemWord: 'pc',
                    ItemPrice: 100,
                    ItemAmount: 100,
                },
            ],
        }

        await client.issueInvoice(invoice)

        // Check the argument passed to axios.post
        expect(mockPost).toHaveBeenCalledTimes(1)
        const [path, payload] = mockPost.mock.calls[0]

        expect(path).toBe('/B2CInvoice/Issue')
        expect(payload).toHaveProperty('MerchantID', merchantId)
        expect(payload).toHaveProperty('RqHeader')
        expect(payload).toHaveProperty('Data')

        // Data should be encrypted string
        expect(typeof payload.Data).toBe('string')

        // We can try to decrypt payload.Data to verify contents
        // This requires accessing the internal CipherService or just creating a new one
        // Import dynamically or duplication
        const { CipherService } = await import('../src/security/CipherService')
        const cipher = new CipherService(hashKey, hashIV)
        const decrypted = cipher.decrypt(payload.Data)
        // It's URL encoded + JSON
        const urlDecoded = decrypted.replace(/\+/g, '%20')
        const jsonData = JSON.parse(decodeURIComponent(urlDecoded))

        expect(jsonData.MerchantID).toBe(merchantId)
        expect(jsonData.RelateNumber).toBe('TEST123456')
        expect(jsonData.Items[0].ItemName).toBe('Product A')
    })

    it('should construct correct payload for issueAllowance', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await client.issueAllowance({
            InvoiceNo: 'INV1234567',
            InvoiceDate: '2023-01-01',
            AllowanceAmount: 50,
            Items: [{ ItemName: 'P1', ItemCount: 1, ItemWord: 'u', ItemPrice: 50 }],
        })

        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/Allowance', expect.anything())
    })

    it('should construct correct payload for invalidInvoice', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await client.invalidInvoice({
            InvoiceNo: 'INV1234567',
            InvoiceDate: '2023-01-01',
            Reason: 'R',
        })

        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/Invalid', expect.anything())
    })

    it('should allow sending raw request via path', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await client.send('/Custom/Path', { MyData: 1 })
        expect(mockPost).toHaveBeenCalledWith('/Custom/Path', expect.anything())
    })

    it('should throw on invalid arguments to send', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        // @ts-ignore
        await expect(client.send(123)).rejects.toThrow('Invalid arguments')
    })

    it('should handle API errors', async () => {
        mockPost.mockRejectedValue({
            isAxiosError: true,
            response: {
                status: 400, // 400 is not retryable by default
                data: 'Bad Request',
            },
        })

        // Disable retry for faster test
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId, {
            retry: { maxRetries: 0 },
        })
        // Provide valid minimal payload to pass validation, then fail at axios level
        await expect(
            client.issueInvoice({
                RelateNumber: 'T',
                CustomerEmail: 't@example.com',
                SalesAmount: 1,
                Items: [{ ItemName: 'N', ItemCount: 1, ItemWord: 'u', ItemPrice: 1 }],
            }),
        ).rejects.toThrow('API Error: 400')
    })

    it('should handle non-axios errors', async () => {
        mockPost.mockRejectedValue(new Error('Network Error'))
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await expect(
            client.issueInvoice({
                RelateNumber: 'T',
                CustomerEmail: 't@example.com',
                SalesAmount: 1,
                Items: [{ ItemName: 'N', ItemCount: 1, ItemWord: 'u', ItemPrice: 1 }],
            }),
        ).rejects.toThrow('Network Error')
    })

    it('should query invoice', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await client.getInvoice({
            RelateNumber: 'REL123',
            InvoiceNo: '1234567890',
            InvoiceDate: '2023-01-01',
        })
        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/GetIssue', expect.anything())
    })

    it('should check love code', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await client.checkLoveCode({ LoveCode: '168001' })
        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/CheckLoveCode', expect.anything())
    })

    it('should check barcode', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await client.checkBarcode({ BarCode: '/AB1+-.3' })
        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/CheckBarcode', expect.anything())
    })

    it('should handle response without Data field', async () => {
        mockPost.mockResolvedValue({
            data: {
                RtnCode: 1,
                RtnMsg: 'Success',
                // No Data field
            },
        })
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        const response = await client.send('/Custom/Path', {})
        expect(response.RtnCode).toBe(1)
        expect(response.Data).toBeUndefined()
    })

    it('should issue invoice with all optional fields', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        // Valid combination: CustomerIdentifier with Print=Yes, no Donation, no Carrier
        await client.issueInvoice({
            RelateNumber: 'REL123',
            CustomerIdentifier: '12345678',
            CustomerName: 'Test Customer',
            CustomerAddr: '123 Test St',
            CustomerPhone: '0912345678',
            CustomerEmail: 'test@test.com',
            ClearanceMark: '1',
            Print: '1',
            Donation: '0',
            TaxType: '1',
            SalesAmount: 100,
            Items: [{ ItemName: 'Item', ItemCount: 1, ItemWord: 'pc', ItemPrice: 100 }],
        })
        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/Issue', expect.anything())
    })

    it('should issue invoice with donation and love code', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        // Valid combination: Donation with LoveCode, no Print, no CustomerIdentifier
        await client.issueInvoice({
            RelateNumber: 'REL456',
            CustomerEmail: 'donor@test.com',
            Print: '0',
            Donation: '1',
            LoveCode: '168168',
            TaxType: '1',
            SalesAmount: 50,
            Items: [{ ItemName: 'Donate', ItemCount: 1, ItemWord: 'pc', ItemPrice: 50 }],
        })
        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/Issue', expect.anything())
    })

    it('should issue invoice with carrier', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        // Valid combination: CarrierType with CarrierNum, no Print
        await client.issueInvoice({
            RelateNumber: 'REL789',
            CustomerEmail: 'carrier@test.com',
            Print: '0',
            Donation: '0',
            CarrierType: '3',
            CarrierNum: '/AB12345',
            TaxType: '1',
            SalesAmount: 75,
            Items: [{ ItemName: 'Carrier', ItemCount: 1, ItemWord: 'pc', ItemPrice: 75 }],
        })
        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/Issue', expect.anything())
    })

    it('should issue allowance with all optional fields', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await client.issueAllowance({
            InvoiceNo: '1234567890',
            InvoiceDate: '2023-01-01',
            AllowanceNotify: 'E',
            CustomerName: 'John',
            NotifyMail: 'john@test.com',
            NotifyPhone: '0912345678',
            AllowanceAmount: 50,
            Items: [{ ItemName: 'Refund', ItemCount: 1, ItemWord: 'pc', ItemPrice: 50 }],
        })
        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/Allowance', expect.anything())
    })

    it('should throw on decryption error', async () => {
        mockPost.mockResolvedValue({
            data: {
                RtnCode: 1,
                RtnMsg: 'Success',
                Data: 'INVALID_ENCRYPTED_DATA', // This will fail decryption
            },
        })
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await expect(client.send('/Custom/Path', {})).rejects.toThrow()
    })

    it('should issue invoice with minimal fields', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await client.issueInvoice({
            RelateNumber: 'REL999',
            CustomerEmail: 'min@example.com',
            SalesAmount: 10,
            Items: [{ ItemName: 'Min', ItemCount: 1, ItemWord: 'u', ItemPrice: 10 }],
            // No other optional fields provided
        })
        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/Issue', expect.anything())
    })

    it('should issue allowance with minimal fields', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await client.issueAllowance({
            InvoiceNo: '1234567890',
            InvoiceDate: '2023-01-01',
            // No optional fields
            Items: [{ ItemName: 'Min', ItemCount: 1, ItemWord: 'u', ItemPrice: 10 }],
        })
        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/Allowance', expect.anything())
    })

    it('should invalid invoice with minimal fields', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        await client.invalidInvoice({
            InvoiceNo: '1234567890',
            InvoiceDate: '2023-01-01',
            Reason: 'Test',
            // No RelateNumber
        })
        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/Invalid', expect.anything())
    })

    it('should getInvoice with minimal data', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        // Only required fields, testing false branches
        await client.getInvoice({
            InvoiceNo: '1234567890',
            InvoiceDate: '2023-01-01',
            // No RelateNumber
        })
        expect(mockPost).toHaveBeenCalledWith('/B2CInvoice/GetIssue', expect.anything())
    })

    it('should checkLoveCode with empty object', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        // This will hit the false branch of if (data.LoveCode)
        // but validate() will throw. Let's test that the method handles empty gracefully up to validation.
        await expect(client.checkLoveCode({})).rejects.toThrow()
    })

    it('should checkBarcode with empty object', async () => {
        const client = new EcPayClient(serverUrl, hashKey, hashIV, merchantId)
        // This will hit the false branch of if (data.BarCode)
        // validate() will throw
        await expect(client.checkBarcode({})).rejects.toThrow()
    })
})
