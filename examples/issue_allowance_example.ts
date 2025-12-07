import { EcPayClient, AllowanceNotifyType } from '../src'

async function main() {
    const client = new EcPayClient(
        'https://einvoice-stage.ecpay.com.tw',
        'ejCk326UnaZWKisg',
        'q9jcZX8Ib9LM8wYk',
        '2000132',
    )

    try {
        // Note: You need a real InvoiceNo and InvoiceDate from a previously issued invoice to test this successfully
        console.log('Issuing Allowance...')

        const response = await client.issueAllowance({
            InvoiceNo: 'EXISTING_INVOICE_NO', // Replace with real invoice number
            InvoiceDate: '2023-12-07', // Replace with real invoice date
            AllowanceNotify: AllowanceNotifyType.EMAIL,
            CustomerName: 'Test Customer',
            NotifyMail: 'test@example.com',
            AllowanceAmount: 50,
            Items: [
                {
                    ItemName: 'NodeJS SDK Item',
                    ItemCount: 1,
                    ItemWord: 'unit',
                    ItemPrice: 50,
                    ItemAmount: 50,
                },
            ],
        })

        console.log('Response:', JSON.stringify(response, null, 2))
    } catch (error) {
        console.error('Error:', error)
    }
}

main()
