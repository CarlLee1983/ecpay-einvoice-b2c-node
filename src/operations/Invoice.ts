import { z } from 'zod'
import { EcPayOperation } from '../base/EcPayOperation'
import { InvoiceItem } from '../models/InvoiceItem'
import { CarrierType, ClearanceMark, Donation, InvType, PrintMark, TaxType, VatType } from '../enums'

/**
 * Represents a B2C Invoice Issuance operation.
 */
export class Invoice extends EcPayOperation {
    private items: InvoiceItem[] = []

    constructor() {
        super()
        this.data = {
            RelateNumber: '',
            CustomerID: '',
            CustomerIdentifier: '',
            CustomerName: '',
            CustomerAddr: '',
            CustomerPhone: '',
            CustomerEmail: '',
            ClearanceMark: '',
            Print: PrintMark.NO,
            Donation: Donation.NO,
            LoveCode: '',
            CarrierType: CarrierType.NONE,
            CarrierNum: '',
            TaxType: TaxType.DUTIABLE,
            SalesAmount: 0,
            InvoiceRemark: '',
            Items: [],
            InvType: InvType.GENERAL,
            vat: VatType.YES,
        }
    }

    getRequestPath(): string {
        return '/B2CInvoice/Issue'
    }

    /**
     * Sets the merchant's unique reference number for the invoice.
     * @param relateNumber Unique ID (max 30 chars).
     */
    setRelateNumber(relateNumber: string): this {
        if (relateNumber.length > 30) {
            throw new Error('RelateNumber too long (max 30)')
        }
        this.data.RelateNumber = relateNumber
        return this
    }

    /**
     * Sets the Customer Unified Business Number (Tax ID).
     * @param identifier UBN.
     */
    setCustomerIdentifier(identifier: string): this {
        this.data.CustomerIdentifier = identifier
        return this
    }

    setCustomerName(name: string): this {
        this.data.CustomerName = name
        return this
    }

    setCustomerAddr(addr: string): this {
        this.data.CustomerAddr = addr
        return this
    }

    setCustomerPhone(phone: string): this {
        this.data.CustomerPhone = phone
        return this
    }

    setCustomerEmail(email: string): this {
        this.data.CustomerEmail = email
        return this
    }

    setClearanceMark(mark: ClearanceMark): this {
        this.data.ClearanceMark = mark
        return this
    }

    /**
     * Sets whether to print the invoice.
     */
    setPrintMark(mark: PrintMark): this {
        this.data.Print = mark
        return this
    }

    setDonation(donation: Donation): this {
        this.data.Donation = donation
        return this
    }

    /**
     * Sets the Love Code for donation.
     * @param code Love code (3-7 digits).
     */
    setLoveCode(code: string): this {
        if (code.length < 3 || code.length > 7) {
            throw new Error('LoveCode length must be between 3 and 7')
        }
        this.data.LoveCode = code
        return this
    }

    setCarrierType(type: CarrierType): this {
        this.data.CarrierType = type
        return this
    }

    /**
     * Sets the Carrier Number (e.g., /AB1234 for cellphone, 16 chars for citizen).
     */
    setCarrierNum(num: string): this {
        this.data.CarrierNum = num
        return this
    }

    setTaxType(type: TaxType): this {
        this.data.TaxType = type
        return this
    }

    /**
     * Sets the total sales amount.
     * If not set, it will be calculated from items during validation.
     */
    setSalesAmount(amount: number): this {
        if (amount <= 0) throw new Error('SalesAmount must be > 0')
        this.data.SalesAmount = amount
        return this
    }

    /**
     * Sets the items for the invoice.
     */
    setItems(items: InvoiceItem[]): this {
        this.items = items
        return this
    }

    /**
     * Validates the invoice data against ECPay requirements.
     * Includes calculations (SalesAmount), defaults, and cross-field logic.
     */
    validate(): void {
        if (this.items.length === 0) {
            throw new Error('Items cannot be empty')
        }

        // Sync Items
        this.data.Items = this.items.map((item, index) => {
            const payload = item.toPayload()
            payload.ItemSeq = index + 1
            if (!payload.ItemTaxType) {
                payload.ItemTaxType = this.data.TaxType
            }
            return payload
        })

        // Sync SalesAmount if needed
        const totalAmount = this.items.reduce((sum, item) => sum + item.getAmount(), 0)
        const roundedAmount = Math.round(totalAmount)

        if (this.data.SalesAmount && this.data.SalesAmount !== roundedAmount) {
            throw new Error(`Calculated SalesAmount (${roundedAmount}) != Set SalesAmount (${this.data.SalesAmount})`)
        }
        this.data.SalesAmount = roundedAmount

        // Cross-field validation using Zod
        const schema = z
            .object({
                RelateNumber: z.string().min(1, 'RelateNumber is empty'),
                TaxType: z.nativeEnum(TaxType),
                ClearanceMark: z.nativeEnum(ClearanceMark).optional().or(z.literal('')),
                CustomerIdentifier: z.string().optional(),
                Print: z.nativeEnum(PrintMark),
                Donation: z.nativeEnum(Donation),
                LoveCode: z.string().optional(),
                CustomerName: z.string().optional(),
                CustomerAddr: z.string().optional(),
                CustomerPhone: z.string().optional(),
                CustomerEmail: z.string().optional(),
                CarrierType: z.nativeEnum(CarrierType),
                CarrierNum: z.string().optional(),
            })
            .superRefine((data, ctx) => {
                // Basic Params
                if (data.TaxType === TaxType.ZERO && !data.ClearanceMark) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Zero tax rate requires ClearanceMark' })
                }

                // Customer
                if (data.Print === PrintMark.YES) {
                    if (!data.CustomerName || !data.CustomerAddr) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: 'Print=Yes requires CustomerName and CustomerAddr',
                        })
                    }
                }

                if (!data.CustomerPhone && !data.CustomerEmail) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Must provide either CustomerPhone or CustomerEmail',
                    })
                }

                if (data.CustomerIdentifier) {
                    if (data.Print === PrintMark.NO) {
                        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CustomerIdentifier requires Print=Yes' })
                    }
                    if (data.Donation === Donation.YES) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: 'CustomerIdentifier present, Donation cannot be Yes',
                        })
                    }
                }

                // Donation
                if (data.Donation === Donation.YES) {
                    if (!data.LoveCode) {
                        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Donation=Yes requires LoveCode' })
                    }
                    if (data.Print === PrintMark.YES) {
                        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Donation=Yes, cannot Print' })
                    }
                }

                // Carrier
                if (data.CarrierType === CarrierType.NONE) {
                    if (data.CarrierNum) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: 'CarrierType=None, CarrierNum must be empty',
                        })
                    }
                } else {
                    if (data.Print === PrintMark.YES) {
                        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CarrierType set, cannot Print' })
                    }
                    if (data.CarrierType === CarrierType.MEMBER && data.CarrierNum) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: 'CarrierType=Member, CarrierNum must be empty',
                        })
                    }
                    if (data.CarrierType === CarrierType.CITIZEN && data.CarrierNum?.length !== 16) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: 'CarrierType=Citizen, CarrierNum must be 16 chars',
                        })
                    }
                    if (data.CarrierType === CarrierType.CELLPHONE && data.CarrierNum?.length !== 8) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: 'CarrierType=Cellphone, CarrierNum must be 8 chars',
                        })
                    }
                }
            })

        schema.parse(this.data)
    }
}
