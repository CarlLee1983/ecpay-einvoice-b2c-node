import { z } from 'zod'

export const AllowanceItemSchema = z.object({
    name: z.string().min(1, 'Allowance item name cannot be empty'),
    quantity: z.number().int().gt(0, 'Allowance item quantity must be > 0 and integer'),
    unit: z.string().min(1, 'Allowance item unit cannot be empty'),
    price: z.number().gt(0, 'Allowance item price must be > 0'),
})

export type AllowanceItemInput = z.infer<typeof AllowanceItemSchema>

/**
 * Represents a line item in an allowance (refund).
 */
export class AllowanceItem {
    constructor(
        public name: string,
        public quantity: number,
        public unit: string,
        public price: number,
    ) {
        AllowanceItemSchema.parse({ name, quantity, unit, price })
    }

    /**
     * Creates an AllowanceItem from an object.
     */
    static fromArray(item: AllowanceItemInput): AllowanceItem {
        return new AllowanceItem(item.name, item.quantity, item.unit, item.price)
    }

    /**
     * Calculates item total amount.
     */
    getAmount(): number {
        return this.quantity * this.price
    }

    /**
     * Converts to ECPay API payload format.
     */
    toPayload(): Record<string, any> {
        return {
            ItemName: this.name,
            ItemCount: this.quantity,
            ItemWord: this.unit,
            ItemPrice: this.price,
            ItemAmount: this.getAmount(),
        }
    }
}
