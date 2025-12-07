import { EcPayOperation } from '../base/EcPayOperation'

/**
 * Represents a B2C Invoice Invalidation (Void) operation.
 */
export class InvalidInvoice extends EcPayOperation {
    constructor() {
        super()
        this.data = {
            RelateNumber: '',
            InvoiceNo: '',
            InvoiceDate: '',
            Reason: '',
        }
    }

    getRequestPath(): string {
        return '/B2CInvoice/Invalid'
    }

    setInvoiceNo(invoiceNo: string): this {
        if (invoiceNo.length !== 10) {
            throw new Error('The invoice no length should be 10.')
        }
        this.data.InvoiceNo = invoiceNo
        return this
    }

    setInvoiceDate(invoiceDate: string): this {
        this.data.InvoiceDate = invoiceDate
        return this
    }

    setReason(reason: string): this {
        this.data.Reason = reason
        return this
    }

    // Not in PHP specifically for this class but inferred from base
    setRelateNumber(relateNumber: string): this {
        this.data.RelateNumber = relateNumber
        return this
    }

    validate(): void {
        if (!this.data.InvoiceNo) throw new Error('The invoice no is empty.')
        if (!this.data.InvoiceDate) throw new Error('The invoice date is empty.')
        if (!this.data.Reason) throw new Error('The invoice invalid reason is empty.')
    }
}
