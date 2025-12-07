import { z } from 'zod'
import { EcPayOperation } from '../base/EcPayOperation'
import { AllowanceItem } from '../models/AllowanceItem'
import { AllowanceNotifyType } from '../enums'

/**
 * Represents a B2C Invoice Allowance (refund/return) operation.
 */
export class AllowanceInvoice extends EcPayOperation {
    private items: AllowanceItem[] = []

    constructor() {
        super()
        this.data = {
            InvoiceNo: '',
            InvoiceDate: '',
            AllowanceNotify: AllowanceNotifyType.NONE,
            CustomerName: '',
            NotifyMail: '',
            NotifyPhone: '',
            AllowanceAmount: 0,
            Items: [],
        }
    }

    getRequestPath(): string {
        return '/B2CInvoice/Allowance'
    }

    /**
     * Sets the original invoice number (10 chars).
     */
    setInvoiceNo(no: string): this {
        if (no.length !== 10) throw new Error('InvoiceNo must be 10 chars')
        this.data.InvoiceNo = no
        return this
    }

    setInvoiceDate(date: string): this {
        this.data.InvoiceDate = date
        return this
    }

    /**
     * Sets the notification type for the allowance.
     */
    setAllowanceNotify(type: AllowanceNotifyType): this {
        this.data.AllowanceNotify = type
        return this
    }

    setCustomerName(name: string): this {
        this.data.CustomerName = name
        return this
    }

    setNotifyMail(email: string): this {
        this.data.NotifyMail = email
        return this
    }

    setNotifyPhone(phone: string): this {
        this.data.NotifyPhone = phone
        return this
    }

    /**
     * Sets the total allowance amount.
     * Can be auto-calculated from items.
     */
    setAllowanceAmount(amount: number): this {
        this.data.AllowanceAmount = amount
        return this
    }

    setItems(items: AllowanceItem[]): this {
        this.items = items
        return this
    }

    validate(): void {
        // Sync Items
        this.data.Items = this.items.map((item, index) => {
            const payload = item.toPayload()
            payload.ItemSeq = index + 1
            return payload
        })

        const totalAmount = this.items.reduce((sum, item) => sum + item.getAmount(), 0)
        const roundedAmount = Math.round(totalAmount)
        this.data.AllowanceAmount = roundedAmount

        // Validation
        if (!this.data.InvoiceNo) throw new Error('InvoiceNo empty')
        if (!this.data.InvoiceDate) throw new Error('InvoiceDate empty')
        if (this.data.AllowanceAmount <= 0) throw new Error('AllowanceAmount must be > 0')
        if (this.items.length === 0) throw new Error('Items empty')

        if (this.data.AllowanceNotify === AllowanceNotifyType.EMAIL && !this.data.NotifyMail) {
            throw new Error('Email notify requires NotifyMail')
        }
        if (this.data.AllowanceNotify === AllowanceNotifyType.SMS && !this.data.NotifyPhone) {
            throw new Error('SMS notify requires NotifyPhone')
        }
    }
}
