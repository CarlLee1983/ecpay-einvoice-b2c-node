import { EcPayOperation } from '../base/EcPayOperation'

/**
 * Query to check if a Love Code is valid.
 */
export class CheckLoveCode extends EcPayOperation {
    constructor() {
        super()
        this.data = {
            LoveCode: '',
        }
    }

    getRequestPath(): string {
        return '/B2CInvoice/CheckLoveCode'
    }

    /**
     * Sets the Love Code to check (3-7 digits).
     */
    setLoveCode(code: string): this {
        if (code.length < 3 || code.length > 7) {
            throw new Error('LoveCode length must be 3-7')
        }
        this.data.LoveCode = code
        return this
    }

    validate(): void {
        if (!this.data.LoveCode) throw new Error('LoveCode is empty')
    }
}
