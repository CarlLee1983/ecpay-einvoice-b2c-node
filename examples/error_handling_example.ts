/**
 * Complete Error Handling Example
 *
 * Demonstrates proper error handling with the ECPay SDK.
 */
import 'dotenv/config'
import {
    EcPayClient,
    EcPayError,
    EcPayApiError,
    EcPayNetworkError,
    EcPayTimeoutError,
    EcPayEncryptionError,
    PrintMark,
    Donation,
    TaxType,
} from '../src'

async function main() {
    const client = new EcPayClient(
        process.env.ECPAY_SERVER_URL || 'https://einvoice-stage.ecpay.com.tw',
        process.env.ECPAY_HASH_KEY || 'ejCk326UnaZWKisg',
        process.env.ECPAY_HASH_IV || 'q9jcZX8Ib9LM8wYk',
        process.env.ECPAY_MERCHANT_ID || '2000132',
        {
            timeout: 10000, // 10 seconds
            retry: {
                maxRetries: 2,
                retryDelay: 1000,
            },
        },
    )

    try {
        console.log('Issuing invoice...')

        const response = await client.issueInvoice({
            RelateNumber: 'ERR' + Date.now(),
            CustomerEmail: 'test@example.com',
            Print: PrintMark.NO,
            Donation: Donation.NO,
            TaxType: TaxType.DUTIABLE,
            SalesAmount: 100,
            Items: [
                {
                    ItemName: 'Test Product',
                    ItemCount: 1,
                    ItemWord: 'pc',
                    ItemPrice: 100,
                },
            ],
        })

        // Check API-level success
        if (response.RtnCode !== 1) {
            console.error('API returned error:', response.RtnMsg)
            return
        }

        console.log('Invoice issued successfully!')
        console.log('Invoice No:', response.Data?.InvoiceNo)
        console.log('Invoice Date:', response.Data?.InvoiceDate)
    } catch (error) {
        // Handle different error types
        if (error instanceof EcPayApiError) {
            // API returned an error response
            console.error('=== API Error ===')
            console.error('Code:', error.rtnCode)
            console.error('Message:', error.rtnMsg)
            if (error.transCode) {
                console.error('Transaction Code:', error.transCode)
                console.error('Transaction Message:', error.transMsg)
            }
        } else if (error instanceof EcPayNetworkError) {
            // Network/HTTP error
            console.error('=== Network Error ===')
            console.error('Status:', error.statusCode)
            console.error('Message:', error.message)
            console.error('Retryable:', error.isRetryable)

            if (error.isRetryable) {
                console.log('Consider retrying the request...')
            }
        } else if (error instanceof EcPayTimeoutError) {
            // Request timed out
            console.error('=== Timeout Error ===')
            console.error('Request timed out after', error.timeoutMs, 'ms')
            console.error('Consider increasing timeout or check network')
        } else if (error instanceof EcPayEncryptionError) {
            // Encryption/decryption failed
            console.error('=== Encryption Error ===')
            console.error('Message:', error.message)
            console.error('Check HashKey and HashIV configuration')
        } else if (error instanceof EcPayError) {
            // Other SDK errors
            console.error('=== SDK Error ===')
            console.error('Code:', error.code)
            console.error('Message:', error.message)
        } else {
            // Unknown error
            console.error('=== Unknown Error ===')
            console.error(error)
        }
    }
}

main()
