import { EcPayClient } from '../src'

async function main() {
    const client = new EcPayClient(
        'https://einvoice-stage.ecpay.com.tw',
        'ejCk326UnaZWKisg',
        'q9jcZX8Ib9LM8wYk',
        '2000132',
    )

    try {
        console.log('Checking Love Code...')
        // 51040 is a valid Love Code example
        const response = await client.checkLoveCode({
            LoveCode: '51040',
        })
        console.log('Response:', JSON.stringify(response, null, 2))
    } catch (error) {
        console.error('Error:', error)
    }
}
main()
