# API Reference

Complete API documentation for ECPay e-Invoice B2C Node.js SDK.

## Table of Contents

- [EcPayClient](#ecpayclient)
- [Methods](#methods)
- [Types & Interfaces](#types--interfaces)
- [Enums](#enums)
- [Error Types](#error-types)

---

## EcPayClient

Main client class for interacting with ECPay e-Invoice API.

### Constructor

```typescript
new EcPayClient(
    serverUrl: string,
    hashKey: string,
    hashIV: string,
    merchantId: string,
    options?: EcPayClientOptions
)
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serverUrl` | `string` | ✅ | ECPay API URL. Staging: `https://einvoice-stage.ecpay.com.tw`, Production: `https://einvoice.ecpay.com.tw` |
| `hashKey` | `string` | ✅ | Merchant HashKey (16 characters) |
| `hashIV` | `string` | ✅ | Merchant HashIV (16 characters) |
| `merchantId` | `string` | ✅ | Merchant ID |
| `options` | `EcPayClientOptions` | ❌ | Optional configuration |

### EcPayClientOptions

```typescript
interface EcPayClientOptions {
    timeout?: number              // Request timeout in ms (default: 30000)
    retry?: RetryConfig           // Retry configuration
    axiosInstance?: AxiosInstance // Custom axios instance
    logger?: EcPayLogger          // Custom logger
    headers?: Record<string, string> // Additional headers
}

interface RetryConfig {
    maxRetries?: number           // Max retry attempts (default: 3)
    retryDelay?: number           // Base delay in ms (default: 1000)
    backoffMultiplier?: number    // Exponential backoff multiplier (default: 2)
    retryableStatusCodes?: number[] // Status codes to retry (default: [408, 429, 500, 502, 503, 504])
}

interface EcPayLogger {
    debug?(message: string, ...args: any[]): void
    info?(message: string, ...args: any[]): void
    warn?(message: string, ...args: any[]): void
    error?(message: string, ...args: any[]): void
}
```

---

## Methods

### issueInvoice

Issues a new B2C Invoice.

```typescript
async issueInvoice(data: IssueInvoiceData): Promise<EcPayResponse>
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `RelateNumber` | `string` | ✅ | Unique order number (max 30 chars) |
| `CustomerIdentifier` | `string` | ❌ | Company Tax ID (8 digits) |
| `CustomerName` | `string` | ❌ | Customer name |
| `CustomerAddr` | `string` | ❌ | Customer address |
| `CustomerPhone` | `string` | ❌ | Customer phone |
| `CustomerEmail` | `string` | ✅* | Customer email (*required if no phone) |
| `ClearanceMark` | `string` | ❌ | Clearance mark for zero-tax |
| `Print` | `PrintMark` | ❌ | Print invoice (YES/NO) |
| `Donation` | `Donation` | ❌ | Donate invoice (YES/NO) |
| `LoveCode` | `string` | ❌ | Love code (3-7 digits) |
| `CarrierType` | `CarrierType` | ❌ | Carrier type |
| `CarrierNum` | `string` | ❌ | Carrier number |
| `TaxType` | `TaxType` | ❌ | Tax type |
| `SalesAmount` | `number` | ✅ | Total sales amount |
| `Items` | `InvoiceItemData[]` | ✅ | Invoice items |

#### InvoiceItemData

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ItemName` | `string` | ✅ | Item name |
| `ItemCount` | `number` | ✅ | Item quantity |
| `ItemWord` | `string` | ✅ | Unit (e.g., "pc", "unit") |
| `ItemPrice` | `number` | ✅ | Unit price |
| `ItemTaxType` | `TaxType` | ❌ | Item tax type (for mixed tax) |

#### Example Request

```typescript
const response = await client.issueInvoice({
    RelateNumber: 'ORD20231201001',
    CustomerEmail: 'customer@example.com',
    Print: PrintMark.NO,
    Donation: Donation.NO,
    TaxType: TaxType.DUTIABLE,
    SalesAmount: 1000,
    Items: [
        { ItemName: 'Product A', ItemCount: 2, ItemWord: 'pc', ItemPrice: 500 }
    ]
})
```

#### Example Response

```json
{
    "RtnCode": 1,
    "RtnMsg": "Success",
    "Data": {
        "RtnCode": 1,
        "RtnMsg": "開立發票成功",
        "InvoiceNo": "AB12345678",
        "InvoiceDate": "2023-12-01",
        "RandomNumber": "1234"
    }
}
```

---

### issueAllowance

Issues an allowance (partial refund) for an existing invoice.

```typescript
async issueAllowance(data: IssueAllowanceData): Promise<EcPayResponse>
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `InvoiceNo` | `string` | ✅ | Original invoice number (10 chars) |
| `InvoiceDate` | `string` | ✅ | Original invoice date (YYYY-MM-DD) |
| `AllowanceNotify` | `AllowanceNotifyType` | ❌ | Notification type |
| `CustomerName` | `string` | ❌ | Customer name |
| `NotifyMail` | `string` | ❌ | Notification email |
| `NotifyPhone` | `string` | ❌ | Notification phone |
| `AllowanceAmount` | `number` | ❌ | Total allowance amount |
| `Items` | `AllowanceItemData[]` | ✅ | Allowance items |

#### Example

```typescript
const response = await client.issueAllowance({
    InvoiceNo: 'AB12345678',
    InvoiceDate: '2023-12-01',
    AllowanceNotify: AllowanceNotifyType.EMAIL,
    NotifyMail: 'customer@example.com',
    Items: [
        { ItemName: 'Product A', ItemCount: 1, ItemWord: 'pc', ItemPrice: 500 }
    ]
})
```

---

### invalidInvoice

Voids an existing invoice.

```typescript
async invalidInvoice(data: InvalidInvoiceData): Promise<EcPayResponse>
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `InvoiceNo` | `string` | ✅ | Invoice number to void |
| `InvoiceDate` | `string` | ✅ | Invoice date (YYYY-MM-DD) |
| `Reason` | `string` | ✅ | Void reason |

#### Example

```typescript
await client.invalidInvoice({
    InvoiceNo: 'AB12345678',
    InvoiceDate: '2023-12-01',
    Reason: 'Customer returned product'
})
```

---

### getInvoice

Queries invoice details.

```typescript
async getInvoice(data: GetInvoiceData): Promise<EcPayResponse>
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `RelateNumber` | `string` | ❌ | Order number |
| `InvoiceNo` | `string` | ❌ | Invoice number |
| `InvoiceDate` | `string` | ❌ | Invoice date |

> Note: Either `RelateNumber` OR (`InvoiceNo` + `InvoiceDate`) is required.

---

### checkLoveCode

Validates a Love Code (donation code).

```typescript
async checkLoveCode(data: { LoveCode: string }): Promise<EcPayResponse>
```

#### Example

```typescript
const response = await client.checkLoveCode({ LoveCode: '168001' })
const isValid = response.Data?.IsExist === 'Y'
```

---

### checkBarcode

Validates a Mobile Barcode (carrier).

```typescript
async checkBarcode(data: { BarCode: string }): Promise<EcPayResponse>
```

#### Example

```typescript
const response = await client.checkBarcode({ BarCode: '/AB12345' })
const isValid = response.Data?.IsExist === 'Y'
```

---

## Types & Interfaces

### EcPayResponse

```typescript
interface EcPayResponse<T = any> {
    RtnCode: number    // 0 = error, 1 = success
    RtnMsg: string     // Response message
    Data?: T           // Decrypted response data
    TransCode?: number // Transaction code
    TransMsg?: string  // Transaction message
}
```

---

## Enums

### TaxType

| Value | Description |
|-------|-------------|
| `TaxType.DUTIABLE` (`'1'`) | 應稅 (Taxable) |
| `TaxType.ZERO` (`'2'`) | 零稅率 (Zero-rated) |
| `TaxType.FREE` (`'3'`) | 免稅 (Tax-free) |
| `TaxType.MIXED` (`'9'`) | 混合稅 (Mixed tax) |

### PrintMark

| Value | Description |
|-------|-------------|
| `PrintMark.YES` (`'1'`) | Print invoice |
| `PrintMark.NO` (`'0'`) | Don't print |

### Donation

| Value | Description |
|-------|-------------|
| `Donation.YES` (`'1'`) | Donate invoice |
| `Donation.NO` (`'0'`) | Don't donate |

### CarrierType

| Value | Description |
|-------|-------------|
| `CarrierType.NONE` (`''`) | No carrier |
| `CarrierType.MEMBER` (`'1'`) | ECPay member |
| `CarrierType.CITIZEN` (`'2'`) | Citizen certificate |
| `CarrierType.CELLPHONE` (`'3'`) | Mobile barcode |

### AllowanceNotifyType

| Value | Description |
|-------|-------------|
| `AllowanceNotifyType.NONE` (`'N'`) | No notification |
| `AllowanceNotifyType.SMS` (`'S'`) | SMS notification |
| `AllowanceNotifyType.EMAIL` (`'E'`) | Email notification |

---

## Error Types

All errors extend the base `EcPayError` class.

### EcPayError

Base error class.

```typescript
class EcPayError extends Error {
    code: string        // Error code
    isRetryable: boolean // Whether error is retryable
}
```

### EcPayApiError

API response error with details.

```typescript
class EcPayApiError extends EcPayError {
    rtnCode: number     // ECPay return code
    rtnMsg: string      // ECPay return message
    transCode?: number  // Transaction code
    transMsg?: string   // Transaction message
    rawResponse?: any   // Raw response object
}
```

### EcPayNetworkError

Network/HTTP error.

```typescript
class EcPayNetworkError extends EcPayError {
    statusCode?: number  // HTTP status code
    originalError?: Error // Original error
}
```

### EcPayEncryptionError

Encryption/decryption error.

### EcPayTimeoutError

Request timeout error.

```typescript
class EcPayTimeoutError extends EcPayError {
    timeoutMs: number // Configured timeout in ms
}
```

### EcPayValidationError

Validation error.

```typescript
class EcPayValidationError extends EcPayError {
    field?: string  // Field that failed validation
    details?: any   // Validation details
}
```

### Error Handling Example

```typescript
import {
    EcPayApiError,
    EcPayNetworkError,
    EcPayTimeoutError,
} from 'ecpay-einvoice-b2c-node'

try {
    await client.issueInvoice(data)
} catch (error) {
    if (error instanceof EcPayApiError) {
        console.error(`API Error [${error.rtnCode}]: ${error.rtnMsg}`)
    } else if (error instanceof EcPayNetworkError) {
        console.error(`Network Error: ${error.statusCode}`)
        if (error.isRetryable) {
            // Retry logic
        }
    } else if (error instanceof EcPayTimeoutError) {
        console.error(`Timeout after ${error.timeoutMs}ms`)
    } else {
        throw error
    }
}
```
