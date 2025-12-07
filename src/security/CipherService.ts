import * as crypto from 'crypto'

export class EncryptionException extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'EncryptionException'
    }
}

export class CipherService {
    private readonly algorithm = 'aes-128-cbc'
    private readonly hashKey: string
    private readonly hashIV: string

    constructor(hashKey: string, hashIV: string) {
        if (!hashKey) {
            throw new EncryptionException('HashKey cannot be empty')
        }
        if (!hashIV) {
            throw new EncryptionException('HashIV cannot be empty')
        }
        this.hashKey = hashKey
        this.hashIV = hashIV
    }

    /**
     * AES/CBC/PKCS7 Encrypt
     * @param data Raw string data
     * @returns Base64 encoded encrypted string
     */
    public encrypt(data: string): string {
        try {
            const cipher = crypto.createCipheriv(this.algorithm, this.hashKey, this.hashIV)
            // setAutoPadding(true) is default for PKCS7
            let encrypted = cipher.update(data, 'utf8', 'base64')
            encrypted += cipher.final('base64')
            return encrypted
        } catch (error) {
            throw new EncryptionException(
                `Encryption failed: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    /**
     * AES/CBC/PKCS7 Decrypt
     * @param data Base64 encoded encrypted string
     * @returns Raw string
     */
    public decrypt(data: string): string {
        if (!data) {
            throw new EncryptionException('Data cannot be empty')
        }

        try {
            const decipher = crypto.createDecipheriv(this.algorithm, this.hashKey, this.hashIV)
            let decrypted = decipher.update(data, 'base64', 'utf8')
            decrypted += decipher.final('utf8')
            return decrypted
        } catch (error) {
            throw new EncryptionException(
                `Decryption failed: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }
}
