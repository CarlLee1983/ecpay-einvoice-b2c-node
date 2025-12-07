import { EcPayOperation } from '../base/EcPayOperation'

/**
 * Query to check if a Mobile Barcode is valid.
 */
export class CheckBarcode extends EcPayOperation {
    constructor() {
        super()
        this.data = {
            BarCode: '',
        }
    }

    getRequestPath(): string {
        return '/B2CInvoice/CheckBarcode'
    }

    /**
     * Sets the barcode to check (e.g. /AB1234).
     */
    setBarcode(code: string): this {
        const barcode = code.toUpperCase()
        this.assertBarcodeFormat(barcode)
        this.data.BarCode = barcode
        return this
    }

    validate(): void {
        if (!this.data.BarCode) {
            throw new Error('Phone barcode is empty.')
        }
        this.assertBarcodeFormat(this.data.BarCode)
    }

    private assertBarcodeFormat(code: string): void {
        if (!/^\/[0-9A-Z+\-.]{7}$/.test(code)) {
            throw new Error('Phone barcode format invalid.')
        }
    }
}
