import { CipherService } from './CipherService'

export class PayloadException extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'PayloadException'
    }
}

export class PayloadEncoder {
    private cipherService: CipherService

    constructor(cipherService?: CipherService, hashKey?: string, hashIV?: string) {
        if (cipherService) {
            this.cipherService = cipherService
        } else if (hashKey && hashIV) {
            this.cipherService = new CipherService(hashKey, hashIV)
        } else {
            throw new PayloadException('Must provide CipherService or HashKey/HashIV')
        }
    }

    public encodePayload(payload: Record<string, any>): Record<string, any> {
        if (!payload['Data']) {
            throw new PayloadException('Payload missing Data field')
        }

        // 1. JSON Encode
        const jsonData = JSON.stringify(payload['Data'])

        // 2. URL Encode (Custom to match .NET/PHP behavior)
        // - Space becomes + (instead of %20)
        // - ~ becomes %7E
        // - ' becomes %27
        // - ! * ( ) - _ . are kept as is (standard encodeURIComponent behavior matches expectation for !*()-. but we verify)
        let encodedData = encodeURIComponent(jsonData)
            .replace(/%20/g, '+')
            .replace(/[~']/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())

        // 3. Encrypt
        const encryptedData = this.cipherService.encrypt(encodedData)

        return {
            ...payload,
            Data: encryptedData,
        }
    }

    public decodeData(encryptedData: string): any {
        try {
            // 1. Decrypt
            const decrypted = this.cipherService.decrypt(encryptedData)

            // 2. URL Decode
            // decodeURIComponent handles '+' as ' ' ONLY if we preprocess?
            // standard decodeURIComponent does NOT treat + as space.
            // PHP urldecode DOES treat + as space.
            // So we must replace + with %20 before decoding, or use a custom decoder.
            const urlEncoded = decrypted.replace(/\+/g, '%20')
            const jsonString = decodeURIComponent(urlEncoded)

            // 3. JSON Decode
            return JSON.parse(jsonString)
        } catch (error) {
            throw new PayloadException(
                `Failed to decode data: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }
}
