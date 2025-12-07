import { describe, it, expect } from 'vitest'
import { CipherService } from '../src/security/CipherService'
import { PayloadEncoder } from '../src/security/PayloadEncoder'

describe('CipherService', () => {
    // ECPay Stage Credentials
    const hashKey = 'ejCk326UnaZWKisg'
    const hashIV = 'q9jcZX8Ib9LM8wYk'
    const service = new CipherService(hashKey, hashIV)

    it('should encrypt and decrypt correctly', () => {
        const plainText = 'Hello World 123 !@#$%^&*()_+'
        const encrypted = service.encrypt(plainText)
        const decrypted = service.decrypt(encrypted)
        expect(decrypted).toBe(plainText)
    })

    it('should throw error with empty hashKey', () => {
        expect(() => new CipherService('', hashIV)).toThrow('HashKey cannot be empty')
    })

    it('should throw error with empty hashIV', () => {
        expect(() => new CipherService(hashKey, '')).toThrow('HashIV cannot be empty')
    })

    it('should throw error when decrypting empty data', () => {
        expect(() => service.decrypt('')).toThrow('Data cannot be empty')
    })

    it('should throw EncryptionException on invalid decrypt data', () => {
        // Invalid base64 or corrupted data
        expect(() => service.decrypt('NOT_VALID_BASE64_DATA!!!')).toThrow('Decryption failed')
    })

    it('should throw EncryptionException on encryption error with bad key length', () => {
        // AES-128 requires exactly 16 bytes key. Using wrong length should fail
        const badService = new CipherService('short', 'alsoshort1234567') // key too short
        // This might throw on encrypt
        expect(() => badService.encrypt('test')).toThrow()
    })
})

describe('PayloadEncoder', () => {
    const hashKey = 'ejCk326UnaZWKisg'
    const hashIV = 'q9jcZX8Ib9LM8wYk'
    const encoder = new PayloadEncoder(undefined, hashKey, hashIV)

    it('should encode payload correctly with special characters', () => {
        const payload = {
            Data: {
                MerchantID: '2000132',
                ItemName: 'Test Item (1)',
                ItemCount: 1,
                Note: 'Special Chars: !*()-_.',
            },
        }

        const encoded = encoder.encodePayload(payload)
        expect(encoded.Data).toBeDefined()
        expect(typeof encoded.Data).toBe('string')

        // Check if we can decode it back
        // Need to simulate response format (just encrypted string)
        const reDecoded = encoder.decodeData(encoded.Data)
        expect(reDecoded).toEqual(payload.Data)
    })

    it('should match known PHP urlencode behavior for spaces', () => {
        // Test internal logic via a exposed method or derived class?
        // Or just trust the round trip.
        // Let's rely on round trip for now.
        const payload = { Data: { Name: 'Foo Bar' } }
        const encoded = encoder.encodePayload(payload)

        // Decrypt manually to check the raw string has + instead of %20
        const cipherListener = new CipherService(hashKey, hashIV)
        const rawEncrypted = encoded.Data
        const decryptedUrlEncoded = cipherListener.decrypt(rawEncrypted)

        // Expect "Foo+Bar" (plus quotes and json structure)
        expect(decryptedUrlEncoded).toContain('Foo+Bar')
        expect(decryptedUrlEncoded).not.toContain('Foo%20Bar')
    })

    it("should handle special characters ~ and '", () => {
        const payload = { Data: { Name: "~Test'Valid" } }
        const encoded = encoder.encodePayload(payload)

        const cipherListener = new CipherService(hashKey, hashIV)
        const decryptedUrlEncoded = cipherListener.decrypt(encoded.Data)

        // PHP urlencode: ~ -> %7E, ' -> %27
        expect(decryptedUrlEncoded).toContain('%7E') // ~
        expect(decryptedUrlEncoded).toContain('%27') // '
    })

    it('should throw if constructed without cipherService or keys', () => {
        expect(() => new PayloadEncoder()).toThrow('Must provide CipherService or HashKey/HashIV')
    })

    it('should throw if payload is missing Data field', () => {
        expect(() => encoder.encodePayload({ NotData: 'test' })).toThrow('Payload missing Data field')
    })

    it('should throw on decode failure', () => {
        // Invalid encrypted data will fail decryption or parsing
        expect(() => encoder.decodeData('NOT_VALID_ENCRYPTED')).toThrow('Failed to decode data')
    })
})
