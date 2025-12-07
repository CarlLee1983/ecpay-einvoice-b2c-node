import { EcPayClient } from '../src'

async function main() {
    const client = new EcPayClient(
        'https://einvoice-stage.ecpay.com.tw',
        'ejCk326UnaZWKisg',
        'q9jcZX8Ib9LM8wYk',
        '2000132',
    )

    try {
        // Note: You need a real InvoiceNo and InvoiceDate to invalid it
        console.log('Invalidating Invoice...')

        const response = await client.invalidInvoice({
            InvoiceNo: 'EXISTING_INVOICE_NO', // Replace with real invoice number
            InvoiceDate: '2023-12-07', // Replace with real invoice date
            Reason: 'Item defective',
        })

        console.log('Response:', JSON.stringify(response, null, 2))
    } catch (error) {
        console.error('Error:', error)
    }
}

main()
