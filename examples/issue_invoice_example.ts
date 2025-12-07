import { EcPayClient, InvType, TaxType, PrintMark, Donation, CarrierType } from '../src'

async function main() {
    const client = new EcPayClient(
        'https://einvoice-stage.ecpay.com.tw',
        'ejCk326UnaZWKisg',
        'q9jcZX8Ib9LM8wYk',
        '2000132',
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
