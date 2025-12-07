import axios, { AxiosInstance } from 'axios'
import { PayloadEncoder } from './security/PayloadEncoder'
import { CipherService } from './security/CipherService'
import { ICommand } from './interfaces/ICommand'
import { Invoice } from './operations/Invoice'
import { InvoiceItem } from './models/InvoiceItem'
import { AllowanceInvoice } from './operations/AllowanceInvoice'
import { AllowanceItem } from './models/AllowanceItem'
import { InvalidInvoice } from './operations/InvalidInvoice'
import { GetInvoice } from './queries/GetInvoice'
import { CheckLoveCode } from './queries/CheckLoveCode'
import { CheckBarcode } from './queries/CheckBarcode'
import { EcPayClientOptions, EcPayLogger, RetryConfig, DEFAULT_CLIENT_OPTIONS } from './types'
import { EcPayError, EcPayApiError, EcPayNetworkError, EcPayEncryptionError, EcPayTimeoutError } from './errors'

export interface EcPayResponse<T = any> {
    RtnCode: number
    RtnMsg: string
    Data?: T
    TransCode?: number
    TransMsg?: string
    [key: string]: any
}

/**
 * Client for interacting with ECPay e-Invoice B2C API.
 * Handles encryption, decryption, and payload construction.
 *
 * @example
 * ```typescript
 * const client = new EcPayClient(
 *     'https://einvoice-stage.ecpay.com.tw',
 *     'hashKey',
 *     'hashIV',
 *     'merchantId',
 *     { timeout: 30000, retry: { maxRetries: 3 } }
 * )
 * ```
 */
export class EcPayClient {
    private axios: AxiosInstance
    private payloadEncoder: PayloadEncoder
    private merchantId: string
    private options: Required<Omit<EcPayClientOptions, 'axiosInstance' | 'logger' | 'headers'>> & {
        retry: Required<RetryConfig>
    }
    private logger?: EcPayLogger

    /**
     * Creates an instance of EcPayClient.
     * @param serverUrl ECPay API server URL (e.g., https://einvoice-stage.ecpay.com.tw)
     * @param hashKey Merchant HashKey (16 characters)
     * @param hashIV Merchant HashIV (16 characters)
     * @param merchantId Merchant ID
     * @param options Optional client configuration (timeout, retry, axios instance, logger)
     */
    constructor(
        private serverUrl: string,
        private hashKey: string,
        private hashIV: string,
        merchantId: string,
        options?: EcPayClientOptions,
    ) {
        this.options = {
            timeout: options?.timeout ?? DEFAULT_CLIENT_OPTIONS.timeout,
            retry: {
                maxRetries: options?.retry?.maxRetries ?? DEFAULT_CLIENT_OPTIONS.retry.maxRetries,
                retryDelay: options?.retry?.retryDelay ?? DEFAULT_CLIENT_OPTIONS.retry.retryDelay,
                backoffMultiplier: options?.retry?.backoffMultiplier ?? DEFAULT_CLIENT_OPTIONS.retry.backoffMultiplier,
                retryableStatusCodes:
                    options?.retry?.retryableStatusCodes ?? DEFAULT_CLIENT_OPTIONS.retry.retryableStatusCodes,
            },
        }
        this.logger = options?.logger

        // Use provided axios instance or create new one
        this.axios =
            options?.axiosInstance ??
            axios.create({
                baseURL: serverUrl,
                timeout: this.options.timeout,
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            })

        this.merchantId = merchantId
        this.payloadEncoder = new PayloadEncoder(new CipherService(hashKey, hashIV))

        this.log('debug', `EcPayClient initialized for ${serverUrl}`)
    }

    /**
     * Send a command or generic request to ECPay.
     * @param pathOrCommand ICommand instance or API endpoint path
     * @param data Request payload (if first arg is path)
     * @returns Decrypted response
     */
    public async send<T = any>(
        pathOrCommand: string | ICommand,
        data?: Record<string, any>,
    ): Promise<EcPayResponse<T>> {
        if (
            typeof pathOrCommand !== 'string' &&
            typeof pathOrCommand === 'object' &&
            'getRequestPath' in pathOrCommand
        ) {
            const command = pathOrCommand as ICommand
            command.validate()
            return this.sendRequest(command.getRequestPath(), command.getPayloadData())
        }

        if (typeof pathOrCommand === 'string') {
            return this.sendRequest(pathOrCommand, data || {})
        }

        throw new EcPayError('Invalid arguments to send()', 'INVALID_ARGUMENTS')
    }

    /**
     * Issues a new B2C Invoice.
     * @param data Invoice data (customer info, items, etc.)
     * @returns ECPay response
     */
    public async issueInvoice(data: Record<string, any>): Promise<EcPayResponse> {
        const invoice = new Invoice()

        if (data.RelateNumber) invoice.setRelateNumber(data.RelateNumber)
        if (data.CustomerIdentifier) invoice.setCustomerIdentifier(data.CustomerIdentifier)
        if (data.CustomerName) invoice.setCustomerName(data.CustomerName)
        if (data.CustomerAddr) invoice.setCustomerAddr(data.CustomerAddr)
        if (data.CustomerPhone) invoice.setCustomerPhone(data.CustomerPhone)
        if (data.CustomerEmail) invoice.setCustomerEmail(data.CustomerEmail)
        if (data.ClearanceMark) invoice.setClearanceMark(data.ClearanceMark)
        if (data.Print) invoice.setPrintMark(data.Print)
        if (data.Donation) invoice.setDonation(data.Donation)
        if (data.LoveCode) invoice.setLoveCode(data.LoveCode)
        if (data.CarrierType) invoice.setCarrierType(data.CarrierType)
        if (data.CarrierNum) invoice.setCarrierNum(data.CarrierNum)
        if (data.TaxType) invoice.setTaxType(data.TaxType)
        if (data.SalesAmount) invoice.setSalesAmount(data.SalesAmount)

        if (data.Items && Array.isArray(data.Items)) {
            const items = data.Items.map(
                (item: any) =>
                    new InvoiceItem(item.ItemName, item.ItemCount, item.ItemWord, item.ItemPrice, item.ItemTaxType),
            )
            invoice.setItems(items)
        }

        return this.send(invoice)
    }

    /**
     * Issues an allowance (refund/return) for an existing invoice.
     * @param data Allowance data (InvoiceNo, items, amount, notify info)
     * @returns ECPay response
     */
    public async issueAllowance(data: Record<string, any>): Promise<EcPayResponse> {
        const allowance = new AllowanceInvoice()

        if (data.InvoiceNo) allowance.setInvoiceNo(data.InvoiceNo)
        if (data.InvoiceDate) allowance.setInvoiceDate(data.InvoiceDate)
        if (data.AllowanceNotify) allowance.setAllowanceNotify(data.AllowanceNotify)
        if (data.CustomerName) allowance.setCustomerName(data.CustomerName)
        if (data.NotifyMail) allowance.setNotifyMail(data.NotifyMail)
        if (data.NotifyPhone) allowance.setNotifyPhone(data.NotifyPhone)
        if (data.AllowanceAmount) allowance.setAllowanceAmount(data.AllowanceAmount)

        if (data.Items && Array.isArray(data.Items)) {
            const items = data.Items.map(
                (item: any) => new AllowanceItem(item.ItemName, item.ItemCount, item.ItemWord, item.ItemPrice),
            )
            allowance.setItems(items)
        }

        return this.send(allowance)
    }

    /**
     * Invalidates an existing invoice (voids it).
     * @param data Invalidation data (InvoiceNo, InvoiceDate, Reason)
     * @returns ECPay response
     */
    public async invalidInvoice(data: Record<string, any>): Promise<EcPayResponse> {
        const invalid = new InvalidInvoice()

        if (data.InvoiceNo) invalid.setInvoiceNo(data.InvoiceNo)
        if (data.InvoiceDate) invalid.setInvoiceDate(data.InvoiceDate)
        if (data.Reason) invalid.setReason(data.Reason)

        return this.send(invalid)
    }

    /**
     * Queries invoice details.
     * @param data Query criteria (RelateNumber or InvoiceNo+Date)
     * @returns ECPay response with invoice details
     */
    public async getInvoice(data: Record<string, any>): Promise<EcPayResponse> {
        const query = new GetInvoice()
        if (data.RelateNumber) query.setRelateNumber(data.RelateNumber)
        if (data.InvoiceNo) query.setInvoiceNo(data.InvoiceNo)
        if (data.InvoiceDate) query.setInvoiceDate(data.InvoiceDate)
        return this.send(query)
    }

    /**
     * Checks if a Love Code is valid.
     * @param data Object containing LoveCode
     * @returns ECPay response
     */
    public async checkLoveCode(data: Record<string, any>): Promise<EcPayResponse> {
        const query = new CheckLoveCode()
        if (data.LoveCode) query.setLoveCode(data.LoveCode)
        return this.send(query)
    }

    /**
     * Checks if a Mobile Barcode is valid.
     * @param data Object containing BarCode
     * @returns ECPay response
     */
    public async checkBarcode(data: Record<string, any>): Promise<EcPayResponse> {
        const query = new CheckBarcode()
        if (data.BarCode) query.setBarcode(data.BarCode)
        return this.send(query)
    }

    /**
     * Get current client options.
     */
    public getOptions(): typeof this.options {
        return { ...this.options }
    }

    private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
        if (this.logger && this.logger[level]) {
            this.logger[level]!(message, ...args)
        }
    }

    private async sendRequest<T = any>(path: string, data: Record<string, any>): Promise<EcPayResponse<T>> {
        // 1. Prepare Payload
        const requestData = {
            MerchantID: this.merchantId,
            ...data,
        }

        const payload = {
            MerchantID: this.merchantId,
            RqHeader: {
                Timestamp: Math.floor(Date.now() / 1000),
            },
            Data: requestData,
        }

        // 2. Encode
        const encodedPayload = this.payloadEncoder.encodePayload(payload)

        this.log('debug', `Sending request to ${path}`)

        // 3. Send with retry logic
        let lastError: Error | null = null
        const maxRetries = this.options.retry.maxRetries

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.axios.post(path, encodedPayload)
                const responseBody = response.data

                this.log('debug', `Received response from ${path}`, { RtnCode: responseBody.RtnCode })

                // 4. Decode Response
                if (responseBody.Data) {
                    try {
                        const decodedData = this.payloadEncoder.decodeData(responseBody.Data)
                        return {
                            ...responseBody,
                            Data: decodedData,
                        }
                    } catch (e) {
                        throw new EcPayEncryptionError(
                            `Failed to decrypt response: ${e instanceof Error ? e.message : String(e)}`,
                        )
                    }
                }

                return responseBody
            } catch (error) {
                lastError = error as Error

                // Check if error is retryable
                if (axios.isAxiosError(error)) {
                    const statusCode = error.response?.status
                    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
                    const isRetryable =
                        isTimeout || (statusCode && this.options.retry.retryableStatusCodes.includes(statusCode))

                    if (isRetryable && attempt < maxRetries) {
                        const delay =
                            this.options.retry.retryDelay * Math.pow(this.options.retry.backoffMultiplier, attempt)
                        this.log(
                            'warn',
                            `Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
                        )
                        await this.sleep(delay)
                        continue
                    }

                    if (isTimeout) {
                        throw new EcPayTimeoutError(
                            `Request timed out after ${this.options.timeout}ms`,
                            this.options.timeout,
                        )
                    }

                    if (error.response) {
                        throw new EcPayNetworkError(
                            `API Error: ${error.response.status} ${JSON.stringify(error.response.data)}`,
                            error.response.status,
                            error,
                        )
                    }

                    throw new EcPayNetworkError(error.message, undefined, error)
                }

                // Non-axios error (encryption error, etc.)
                if (error instanceof EcPayError) {
                    throw error
                }

                throw lastError
            }
        }

        throw lastError
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}
