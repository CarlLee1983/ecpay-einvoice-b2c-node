/**
 * Custom Configuration Example
 *
 * Demonstrates how to configure the SDK with custom options:
 * - Custom axios instance
 * - Custom logger
 * - Retry configuration
 * - Timeout settings
 */
import 'dotenv/config'
import axios from 'axios'
import { EcPayClient, PrintMark, Donation, TaxType } from '../src'

// Custom logger that integrates with your application's logging
const customLogger = {
    debug: (message: string, ...args: any[]) => {
        console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args)
    },
    info: (message: string, ...args: any[]) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args)
    },
    warn: (message: string, ...args: any[]) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args)
    },
    error: (message: string, ...args: any[]) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args)
    },
}

// Custom axios instance (useful for Cloud Functions, proxies, etc.)
const customAxios = axios.create({
    baseURL: process.env.ECPAY_SERVER_URL || 'https://einvoice-stage.ecpay.com.tw',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MyApp/1.0',
    },
    // Add interceptors for logging, authentication, etc.
})

customAxios.interceptors.request.use((config) => {
    console.log(`[HTTP] → ${config.method?.toUpperCase()} ${config.url}`)
    return config
})

customAxios.interceptors.response.use(
    (response) => {
        console.log(`[HTTP] ← ${response.status} ${response.config.url}`)
        return response
    },
    (error) => {
        console.error(`[HTTP] ✗ ${error.response?.status || 'NETWORK'} ${error.config?.url}`)
        return Promise.reject(error)
    },
)

async function main() {
    // Create client with all custom options
    const client = new EcPayClient(
        process.env.ECPAY_SERVER_URL || 'https://einvoice-stage.ecpay.com.tw',
        process.env.ECPAY_HASH_KEY || 'ejCk326UnaZWKisg',
        process.env.ECPAY_HASH_IV || 'q9jcZX8Ib9LM8wYk',
        process.env.ECPAY_MERCHANT_ID || '2000132',
        {
            // Use custom axios instance
            axiosInstance: customAxios,

            // Use custom logger
            logger: customLogger,

            // Request timeout (overridden by axiosInstance if provided)
            timeout: 30000,

            // Retry configuration
            retry: {
                maxRetries: 3,
                retryDelay: 1000, // Start with 1 second
                backoffMultiplier: 2, // 1s, 2s, 4s
                retryableStatusCodes: [408, 429, 500, 502, 503, 504],
            },

            // Additional headers
            headers: {
                'X-Application-Name': 'MyApp',
                'X-Request-ID': `req-${Date.now()}`,
            },
        },
    )

    try {
        console.log('\n=== Issuing Invoice with Custom Configuration ===\n')

        const response = await client.issueInvoice({
            RelateNumber: 'CUSTOM' + Date.now(),
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

        console.log('\n=== Response ===')
        console.log(JSON.stringify(response, null, 2))
    } catch (error) {
        console.error('\n=== Error ===')
        console.error(error)
    }
}

main()
