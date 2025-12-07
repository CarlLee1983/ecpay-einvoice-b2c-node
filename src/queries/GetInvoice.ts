import { EcPayOperation } from '../base/EcPayOperation'

/**
 * Query to retrieve invoice issuance details.
 */
export class GetInvoice extends EcPayOperation {
    constructor() {
        super()
        this.data = {
            RelateNumber: '',
            InvoiceNo: '',
            InvoiceDate: '',
        }
    }

    getRequestPath(): string {
        return '/B2CInvoice/GetIssue'
    }

    /**
     * Sets the merchant's RelateNumber to query by.
     */
    setRelateNumber(no: string): this {
        this.data.RelateNumber = no
        return this
    }

    /**
     * Sets the ECPay Invoice No to query by (requires InvoiceDate).
     */
    setInvoiceNo(no: string): this {
        if (no.length !== 10) {
            throw new Error('The invoice no length should be 10.')
        }
        this.data.InvoiceNo = no
        return this
    }

    setInvoiceDate(date: string): this {
        this.data.InvoiceDate = date
        return this
    }

    validate(): void {
        if (!this.data.InvoiceNo) {
            throw new Error('The invoice no is empty.')
        }

        if (!this.data.InvoiceDate) {
            throw new Error('The invoice date is empty.')
        }
    }
}
