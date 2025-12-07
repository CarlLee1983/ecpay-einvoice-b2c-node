# ECPay 電子發票 B2C SDK for Node.js

現代化、TypeScript 原生的綠界科技 B2C 電子發票 API SDK。

[English Documentation](./README.md)

---

## 特色功能

- 🚀 **完整 TypeScript 支援**：所有參數皆有型別定義與列舉。
- 🛡️ **Zod 驗證**：執行時期驗證，在傳送至綠界前攔截錯誤。
- 🔒 **安全性**：自動處理 AES-128-CBC 加解密。
- 📦 **現代化技術棧**：基於 `axios`、`zod` 和 `typescript` 建構。
- ✅ **高測試覆蓋率**：100% 行覆蓋率，90%+ 分支覆蓋率。

## 安裝

```bash
npm install ecpay-einvoice-b2c-node
# 或
pnpm add ecpay-einvoice-b2c-node
# 或
yarn add ecpay-einvoice-b2c-node
```

## 快速開始

### 1. 初始化客戶端

> ⚠️ **安全警告**：以下顯示的憑證是 **ECPay 測試環境憑證**，僅供示範使用。**請勿將真實憑證提交到版本控制！** 正式環境請使用環境變數。

```typescript
import { EcPayClient } from 'ecpay-einvoice-b2c-node'

// 使用環境變數（建議做法）
const client = new EcPayClient(
    process.env.ECPAY_SERVER_URL || 'https://einvoice-stage.ecpay.com.tw',
    process.env.ECPAY_HASH_KEY || 'ejCk326UnaZWKisg',   // 測試金鑰
    process.env.ECPAY_HASH_IV || 'q9jcZX8Ib9LM8wYk',    // 測試 IV
    process.env.ECPAY_MERCHANT_ID || '2000132'          // 測試特店編號
)
```

**本地開發使用 dotenv：**

```bash
npm install dotenv
```

建立 `.env` 檔案（請加入 `.gitignore`）：
```
ECPAY_SERVER_URL=https://einvoice-stage.ecpay.com.tw
ECPAY_HASH_KEY=your_hash_key
ECPAY_HASH_IV=your_hash_iv
ECPAY_MERCHANT_ID=your_merchant_id
```

> **注意**：正式環境請使用 `https://einvoice.ecpay.com.tw`

### 2. 開立發票

```typescript
import { EcPayClient, TaxType, PrintMark, Donation, CarrierType } from 'ecpay-einvoice-b2c-node'

const response = await client.issueInvoice({
    RelateNumber: 'INV' + Date.now(),  // 特店自訂編號
    CustomerEmail: 'customer@example.com',
    SalesAmount: 100,
    Print: PrintMark.NO,               // 不列印
    Donation: Donation.NO,             // 不捐贈
    CarrierType: CarrierType.NONE,     // 無載具
    TaxType: TaxType.DUTIABLE,         // 應稅
    Items: [
        {
            ItemName: '測試商品',
            ItemCount: 1,
            ItemWord: '個',
            ItemPrice: 100,
        }
    ]
})

console.log('發票號碼:', response.Data?.InvoiceNo)
```

### 3. 開立折讓

當發生退貨或折讓時使用：

```typescript
import { AllowanceNotifyType } from 'ecpay-einvoice-b2c-node'

const response = await client.issueAllowance({
    InvoiceNo: 'AB12345678',            // 原發票號碼
    InvoiceDate: '2023-10-01',          // 原發票日期
    AllowanceNotify: AllowanceNotifyType.EMAIL,
    CustomerName: '王先生',
    NotifyMail: 'test@example.com',
    AllowanceAmount: 50,
    Items: [
        {
            ItemName: '測試商品',
            ItemCount: 1,
            ItemWord: '個',
            ItemPrice: 50
        }
    ]
})
```

### 4. 發票作廢

```typescript
await client.invalidInvoice({
    InvoiceNo: 'AB12345678',
    InvoiceDate: '2023-10-01',
    Reason: '商品瑕疵退貨'
})
```

### 5. 查詢發票

```typescript
const response = await client.getInvoice({
    InvoiceNo: 'AB12345678',
    InvoiceDate: '2023-10-01'
})
console.log('發票詳細資料:', response.Data)
```

### 6. 驗證愛心碼

```typescript
const response = await client.checkLoveCode({
    LoveCode: '168001'
})
console.log('是否有效:', response.Data?.IsExist === 'Y')
```

### 7. 驗證手機條碼

```typescript
const response = await client.checkBarcode({
    BarCode: '/AB12345'
})
console.log('是否有效:', response.Data?.IsExist === 'Y')
```

## 支援的操作

| 方法 | 說明 | 狀態 |
|------|------|------|
| `issueInvoice` | 開立 B2C 發票 | ✅ |
| `issueAllowance` | 開立折讓 | ✅ |
| `invalidInvoice` | 發票作廢 | ✅ |
| `getInvoice` | 查詢發票明細 | ✅ |
| `checkLoveCode` | 驗證愛心碼 | ✅ |
| `checkBarcode` | 驗證手機條碼 | ✅ |

## 列舉值

SDK 提供所有 ECPay 參數的型別列舉：

```typescript
import {
    TaxType,        // 應稅類別: DUTIABLE(應稅), ZERO(零稅率), FREE(免稅), MIXED(混合)
    PrintMark,      // 是否列印: YES(是), NO(否)
    Donation,       // 是否捐贈: YES(是), NO(否)
    CarrierType,    // 載具類別: NONE(無), MEMBER(會員), CITIZEN(自然人憑證), CELLPHONE(手機條碼)
    ClearanceMark,  // 通關方式: YES(非經海關), NO(經海關)
    InvType,        // 發票類別: GENERAL(一般), SPECIAL(特種), ALLOWANCE(折讓)
    AllowanceNotifyType // 折讓通知: NONE(不通知), SMS(簡訊), EMAIL(電子郵件)
} from 'ecpay-einvoice-b2c-node'
```

## 錯誤處理

SDK 會拋出包含描述性訊息的錯誤：

```typescript
try {
    await client.issueInvoice({ /* 無效資料 */ })
} catch (error) {
    if (error instanceof Error) {
        console.error('驗證錯誤:', error.message)
    }
}
```

## API 回應格式

所有方法皆回傳 `EcPayResponse` 物件：

```typescript
interface EcPayResponse<T = any> {
    RtnCode: number      // 0 = 錯誤, 1 = 成功
    RtnMsg: string       // 回應訊息
    Data?: T             // 解密後的回應資料
    TransCode?: number   // 交易代碼
    TransMsg?: string    // 交易訊息
}
```

## 開發

```bash
# 安裝依賴
pnpm install

# 建置
pnpm build

# 執行測試
pnpm test

# 執行測試並產生覆蓋率報告
pnpm test:coverage

# 格式化程式碼
pnpm format
```

## 範例

完整範例程式碼請參考 `examples/` 目錄：

- `issue_invoice_example.ts` - 開立發票範例
- `issue_allowance_example.ts` - 開立折讓範例  
- `invalid_invoice_example.ts` - 發票作廢範例
- `get_invoice_example.ts` - 查詢發票範例
- `check_love_code_example.ts` - 驗證愛心碼範例
- `check_barcode_example.ts` - 驗證手機條碼範例

## 授權條款

MIT

## 貢獻

歡迎提交 Pull Request！
