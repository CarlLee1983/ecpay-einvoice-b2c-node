import { z } from 'zod'

export const InvoiceItemSchema = z.object({
    name: z.string().min(1, 'Item name cannot be empty'),
    quantity: z.number().gt(0, 'Item quantity must be greater than 0'),
    unit: z.string().min(1, 'Item unit cannot be empty'),
    price: z.number().gt(0, 'Item price must be greater than 0'),
    taxType: z.string().optional(),
})

export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>

/**
 * Represents a single line item in an invoice.
 */
export class InvoiceItem {
    constructor(
        public name: string,
        public quantity: number,
        public unit: string,
        public price: number,
        public taxType?: string,
    ) {
        InvoiceItemSchema.parse({ name, quantity, unit, price, taxType })
    }

    /**
     * Create an InvoiceItem from an object (similar to PHP fromArray).
     */
    static fromArray(item: InvoiceItemInput): InvoiceItem {
        return new InvoiceItem(item.name, item.quantity, item.unit, item.price, item.taxType)
    }

    /**
     * Calculates the total amount for this item (Qty * Price).
     */
    getAmount(): number {
        return this.quantity * this.price
    }

    /**
     * Converts to ECPay API payload format.
     */
    toPayload(): Record<string, any> {
        const payload: Record<string, any> = {
            ItemName: this.name,
            ItemCount: this.quantity,
            ItemWord: this.unit,
            ItemPrice: this.price,
            ItemAmount: this.getAmount(),
        }

        if (this.taxType) {
            payload['ItemTaxType'] = this.taxType
        }

        return payload
    }
}
