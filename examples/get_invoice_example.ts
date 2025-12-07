import { EcPayClient } from '../src'

async function main() {
    const client = new EcPayClient(
        'https://einvoice-stage.ecpay.com.tw',
        'ejCk326UnaZWKisg',
        'q9jcZX8Ib9LM8wYk',
        '2000132',
    )

    try {
        console.log('Querying Invoice...')
        const response = await client.getInvoice({
            RelateNumber: 'NODE' + Date.now(), // Usually you query by RelateNumber or InvoiceNo
            InvoiceNo: 'EXISTING_INVOICE_NO',
            InvoiceDate: '2023-12-07',
        })
        console.log('Response:', JSON.stringify(response, null, 2))
    } catch (error) {
        console.error('Error:', error)
    }
}
main()
