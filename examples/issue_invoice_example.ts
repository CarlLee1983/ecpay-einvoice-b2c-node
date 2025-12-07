/**
 * Issue Invoice Example
 *
 * Before running:
 * 1. Copy .env.example to .env
 * 2. Fill in your ECPay credentials
 * 3. Run: npx ts-node examples/issue_invoice_example.ts
 */
import 'dotenv/config'
import { EcPayClient, InvType, TaxType, PrintMark, Donation, CarrierType } from '../src'

async function main() {
    // Use environment variables for credentials (recommended)
    const client = new EcPayClient(
        process.env.ECPAY_SERVER_URL || 'https://einvoice-stage.ecpay.com.tw',
        process.env.ECPAY_HASH_KEY || 'ejCk326UnaZWKisg',
        process.env.ECPAY_HASH_IV || 'q9jcZX8Ib9LM8wYk',
        process.env.ECPAY_MERCHANT_ID || '2000132',
    )

    try {
        console.log('Issuing Invoice...')

        const response = await client.issueInvoice({
            RelateNumber: 'NODE' + Date.now(),
            CustomerEmail: 'test@example.com',
            SalesAmount: 100,
            Print: PrintMark.NO,
            Donation: Donation.NO,
            CarrierType: CarrierType.NONE,
            TaxType: TaxType.DUTIABLE,
            InvType: InvType.GENERAL,
            Items: [
                {
                    ItemName: 'NodeJS SDK Item',
                    ItemCount: 1,
                    ItemWord: 'unit',
                    ItemPrice: 100,
                    ItemAmount: 100,
                },
            ],
        })

        console.log('Response:', JSON.stringify(response, null, 2))
    } catch (error) {
        console.error('Error:', error)
    }
}

main()
