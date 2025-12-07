# ECPay e-Invoice B2C SDK for Node.js

A modern, TypeScript-based SDK for ECPay (綠界科技) B2C e-Invoice API.

[繁體中文說明](./README_TW.md)

---

## Features

- 🚀 **Full TypeScript Support**: Typed interfaces and Enums for all parameters.
- 🛡️ **Zod Validation**: Runtime validation to catch errors before sending to ECPay.
- 🔒 **Security**: Automatic AES-128-CBC encryption and decryption of payloads.
- 📦 **Modern Stack**: Built with `axios`, `zod`, and `typescript`.
- ✅ **High Test Coverage**: 100% line coverage, 90%+ branch coverage.

## Installation

```bash
npm install ecpay-einvoice-b2c-node
# or
pnpm add ecpay-einvoice-b2c-node
# or
yarn add ecpay-einvoice-b2c-node
```

## Quick Start

### 1. Initialize Client

> ⚠️ **Security Warning**: The credentials shown below are **ECPay staging/test credentials** for demonstration only. **Never commit real credentials to version control!** Use environment variables in production.

```typescript
import { EcPayClient } from 'ecpay-einvoice-b2c-node'

// Using environment variables (recommended)
const client = new EcPayClient(
    process.env.ECPAY_SERVER_URL || 'https://einvoice-stage.ecpay.com.tw',
    process.env.ECPAY_HASH_KEY || 'ejCk326UnaZWKisg',   // Test key
    process.env.ECPAY_HASH_IV || 'q9jcZX8Ib9LM8wYk',    // Test IV
    process.env.ECPAY_MERCHANT_ID || '2000132'          // Test MerchantID
)
```

**Using dotenv for local development:**

```bash
npm install dotenv
```

Create `.env` file (add to `.gitignore`):
```
ECPAY_SERVER_URL=https://einvoice-stage.ecpay.com.tw
ECPAY_HASH_KEY=your_hash_key
ECPAY_HASH_IV=your_hash_iv
ECPAY_MERCHANT_ID=your_merchant_id
```

> **Note**: Use `https://einvoice.ecpay.com.tw` for production.

### 2. Issue an Invoice (開立發票)

```typescript
import { EcPayClient, TaxType, PrintMark, Donation, CarrierType } from 'ecpay-einvoice-b2c-node'

const response = await client.issueInvoice({
    RelateNumber: 'INV' + Date.now(),
    CustomerEmail: 'customer@example.com',
    SalesAmount: 100,
    Print: PrintMark.NO,
    Donation: Donation.NO,
    CarrierType: CarrierType.NONE,
    TaxType: TaxType.DUTIABLE,
    Items: [
        {
            ItemName: 'Test Product',
            ItemCount: 1,
            ItemWord: 'pc',
            ItemPrice: 100,
        }
    ]
})

console.log('Invoice Number:', response.Data?.InvoiceNo)
```

### 3. Issue Allowance (開立折讓)

```typescript
import { AllowanceNotifyType } from 'ecpay-einvoice-b2c-node'

const response = await client.issueAllowance({
    InvoiceNo: 'AB12345678',
    InvoiceDate: '2023-10-01',
    AllowanceNotify: AllowanceNotifyType.EMAIL,
    CustomerName: 'Mr. Wang',
    NotifyMail: 'test@example.com',
    AllowanceAmount: 50,
    Items: [
        {
            ItemName: 'Test Product',
            ItemCount: 1,
            ItemWord: 'pc',
            ItemPrice: 50
        }
    ]
})
```

### 4. Invalidate Invoice (發票作廢)

```typescript
await client.invalidInvoice({
    InvoiceNo: 'AB12345678',
    InvoiceDate: '2023-10-01',
    Reason: 'Defective product'
})
```

### 5. Query Invoice (查詢發票)

```typescript
const response = await client.getInvoice({
    InvoiceNo: 'AB12345678',
    InvoiceDate: '2023-10-01'
})
console.log('Invoice Details:', response.Data)
```

### 6. Check Love Code (驗證愛心碼)

```typescript
const response = await client.checkLoveCode({
    LoveCode: '168001'
})
console.log('Is Valid:', response.Data?.IsExist === 'Y')
```

### 7. Check Mobile Barcode (驗證手機條碼)

```typescript
const response = await client.checkBarcode({
    BarCode: '/AB12345'
})
console.log('Is Valid:', response.Data?.IsExist === 'Y')
```

## Supported Operations

| Method | Description | Status |
|--------|-------------|--------|
| `issueInvoice` | Issue a new B2C invoice | ✅ |
| `issueAllowance` | Issue an allowance (refund) | ✅ |
| `invalidInvoice` | Void an invoice | ✅ |
| `getInvoice` | Query invoice details | ✅ |
| `checkLoveCode` | Validate love code | ✅ |
| `checkBarcode` | Validate mobile barcode | ✅ |

## Enums

The SDK provides typed enums for all ECPay parameters:

```typescript
import {
    TaxType,        // 應稅類別: DUTIABLE, ZERO, FREE, MIXED
    PrintMark,      // 是否列印: YES, NO
    Donation,       // 是否捐贈: YES, NO
    CarrierType,    // 載具類別: NONE, MEMBER, CITIZEN, CELLPHONE
    ClearanceMark,  // 通關方式: YES, NO
    InvType,        // 發票類別: GENERAL, SPECIAL, ALLOWANCE
    AllowanceNotifyType // 折讓通知: NONE, SMS, EMAIL
} from 'ecpay-einvoice-b2c-node'
```

## Error Handling

The SDK throws errors with descriptive messages for validation failures:

```typescript
try {
    await client.issueInvoice({ /* invalid data */ })
} catch (error) {
    if (error instanceof Error) {
        console.error('Validation Error:', error.message)
    }
}
```

## API Response

All methods return an `EcPayResponse` object:

```typescript
interface EcPayResponse<T = any> {
    RtnCode: number      // 0 = error, 1 = success
    RtnMsg: string       // Response message
    Data?: T             // Decrypted response data
    TransCode?: number   // Transaction code
    TransMsg?: string    // Transaction message
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Format code
pnpm format
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
