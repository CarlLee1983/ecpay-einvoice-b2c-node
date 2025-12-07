import { EcPayClient } from '../src'

async function main() {
    const client = new EcPayClient(
        'https://einvoice-stage.ecpay.com.tw',
        'ejCk326UnaZWKisg',
        'q9jcZX8Ib9LM8wYk',
        '2000132',
    )

    try {
        console.log('Checking Barcode...')
        // /+7 digits is a valid mobile barcode format, e.g. /AB1234
        const response = await client.checkBarcode({
            BarCode: '/AB1234',
        })
        console.log('Response:', JSON.stringify(response, null, 2))
    } catch (error) {
        console.error('Error:', error)
    }
}
main()
