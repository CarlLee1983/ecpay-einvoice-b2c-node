import { describe, it, expect } from 'vitest'
import { Invoice } from '../src/operations/Invoice'
import { AllowanceInvoice } from '../src/operations/AllowanceInvoice'
import { InvalidInvoice } from '../src/operations/InvalidInvoice'
import { InvoiceItem } from '../src/models/InvoiceItem'
import { AllowanceItem } from '../src/models/AllowanceItem'
import { CarrierType, Donation, PrintMark, TaxType, AllowanceNotifyType, ClearanceMark } from '../src/enums'

describe('Invoice Operation', () => {
    it('should validate valid invoice', () => {
        const invoice = new Invoice()
        invoice
            .setRelateNumber('TEST001')
            .setCustomerEmail('test@example.com')
            .setPrintMark(PrintMark.NO)
            .setDonation(Donation.NO)
            .setCarrierType(CarrierType.NONE)
            .setTaxType(TaxType.DUTIABLE)
            .setSalesAmount(100)
            .setItems([new InvoiceItem('Item 1', 1, 'pc', 100)])

        expect(() => invoice.validate()).not.toThrow()
    })

    it('should throw if items empty', () => {
        const invoice = new Invoice()
        invoice.setRelateNumber('TEST001').setSalesAmount(100)

        expect(() => invoice.validate()).toThrow('Items cannot be empty')
    })

    it('should throw if amount mismatch', () => {
        const invoice = new Invoice()
        invoice
            .setRelateNumber('TEST001')
            .setItems([new InvoiceItem('Item 1', 1, 'pc', 50)])
            .setSalesAmount(100) // Mismatch

        expect(() => invoice.validate()).toThrow(/Calculated SalesAmount/)
    })

    it('should allow setting all optional fields', () => {
        const i = new Invoice()
        i.setCustomerName('Name')
            .setCustomerAddr('Addr')
            .setCustomerPhone('0912345678')
            .setCustomerEmail('a@b.com')
            .setClearanceMark(ClearanceMark.YES)
            .setCarrierNum('12345678') // valid for none? no.
            // Just testing setters execution, validation is separate
            .setLoveCode('1234')

        expect(i.getPayloadData()['CustomerName']).toBe('Name')
        expect(i.getPayloadData()['CustomerAddr']).toBe('Addr')
    })

    it('should throw on specific validation rules', () => {
        const createInvoice = () => {
            const i = new Invoice()
            i.setRelateNumber('T')
                .setSalesAmount(100)
                .setItems([new InvoiceItem('I', 1, 'u', 100)])
            return i
        }

        // Print=Yes requires Name/Addr
        const i1 = createInvoice()
        i1.setPrintMark(PrintMark.YES)
        expect(() => i1.validate()).toThrow(/Print=Yes requires CustomerName and CustomerAddr/)

        // Zero Tax requires ClearanceMark
        const i2 = createInvoice()
        i2.setTaxType(TaxType.ZERO)
        expect(() => i2.validate()).toThrow(/Zero tax rate requires ClearanceMark/)

        // No Phone and No Email
        const i3 = createInvoice()
        // Default is empty
        expect(() => i3.validate()).toThrow(/Must provide either CustomerPhone or CustomerEmail/)

        // CustomerIdentifier requires Print=Yes
        const i4 = createInvoice()
        i4.setCustomerIdentifier('12345678') // Print is NO by default
        expect(() => i4.validate()).toThrow(/CustomerIdentifier requires Print=Yes/)

        // CustomerIdentifier conflict with Donation
        const i5 = createInvoice()
        i5.setCustomerIdentifier('12345678').setPrintMark(PrintMark.YES).setDonation(Donation.YES)
        expect(() => i5.validate()).toThrow(/CustomerIdentifier present, Donation cannot be Yes/)

        // Donation=Yes requires LoveCode
        const i6 = createInvoice()
        i6.setDonation(Donation.YES)
        expect(() => i6.validate()).toThrow(/Donation=Yes requires LoveCode/)

        // Donation=Yes conflict with Print
        const i7 = createInvoice()
        i7.setDonation(Donation.YES).setLoveCode('123445').setPrintMark(PrintMark.YES)
        expect(() => i7.validate()).toThrow(/Donation=Yes, cannot Print/)

        // CarrierType=None, CarrierNum present
        const i8 = createInvoice()
        i8.setCarrierType(CarrierType.NONE).setCarrierNum('123')
        expect(() => i8.validate()).toThrow(/CarrierType=None, CarrierNum must be empty/)

        // CarrierType set, Print=Yes
        const i9 = createInvoice()
        i9.setCarrierType(CarrierType.MEMBER).setPrintMark(PrintMark.YES)
        expect(() => i9.validate()).toThrow(/CarrierType set, cannot Print/)

        // CarrierType=Member, CarrierNum present
        const i10 = createInvoice()
        i10.setCarrierType(CarrierType.MEMBER).setCarrierNum('123')
        expect(() => i10.validate()).toThrow(/CarrierType=Member, CarrierNum must be empty/)

        // CarrierType=Citizen, incorrect length
        const i11 = createInvoice()
        i11.setCarrierType(CarrierType.CITIZEN).setCarrierNum('123')
        expect(() => i11.validate()).toThrow(/CarrierType=Citizen, CarrierNum must be 16 chars/)

        // CarrierType=Cellphone, incorrect length
        const i12 = createInvoice()
        i12.setCarrierType(CarrierType.CELLPHONE).setCarrierNum('123')
        expect(() => i12.validate()).toThrow(/CarrierType=Cellphone, CarrierNum must be 8 chars/)
    })

    it('should throw on invalid setter input', () => {
        const invoice = new Invoice()
        expect(() => invoice.setRelateNumber('A'.repeat(31))).toThrow(/max 30/)
        expect(() => invoice.setLoveCode('12')).toThrow(/between 3 and 7/)
        expect(() => invoice.setLoveCode('12345678')).toThrow(/between 3 and 7/)
        expect(() => invoice.setSalesAmount(0)).toThrow(/must be > 0/)
    })
})

describe('Allowance Operation', () => {
    it('should validate valid allowance', () => {
        const allowance = new AllowanceInvoice()
        allowance
            .setInvoiceNo('AB12345678')
            .setInvoiceDate('2023-01-01')
            .setAllowanceNotify(AllowanceNotifyType.EMAIL)
            .setNotifyMail('test@example.com')
            .setAllowanceAmount(50)
            .setItems([new AllowanceItem('Item', 1, 'pc', 50)])

        expect(() => allowance.validate()).not.toThrow()
    })

    it('should validate contact info requirements', () => {
        const a = new AllowanceInvoice()
        a.setInvoiceNo('1234567890')
            .setInvoiceDate('D')
            .setAllowanceAmount(10)
            .setItems([new AllowanceItem('N', 1, 'u', 10)])

        // Email requirements
        a.setAllowanceNotify(AllowanceNotifyType.EMAIL)
        expect(() => a.validate()).toThrow(/Email notify requires NotifyMail/)

        a.setNotifyMail('a@b.com')
        expect(() => a.validate()).not.toThrow()

        // SMS requirements
        a.setAllowanceNotify(AllowanceNotifyType.SMS) // Replaces EMAIL
        expect(() => a.validate()).toThrow(/SMS notify requires NotifyPhone/)

        a.setNotifyPhone('0912345678')
        expect(() => a.validate()).not.toThrow()
    })

    it('should allow setting customer name', () => {
        const a = new AllowanceInvoice()
        a.setCustomerName('Name')
        // No public getter to verify, but we can verify it doesn't throw and potentially check internal state if we exposed it or via getPayloadData
        expect(a.getPayloadData()['CustomerName']).toBe('Name')
    })
})

describe('Invalid Invoice Operation', () => {
    it('should validate valid invalidation', () => {
        const inv = new InvalidInvoice()
        inv.setInvoiceNo('AB12345678').setInvoiceDate('2023-01-01').setReason('Error')

        expect(() => inv.validate()).not.toThrow()
    })

    it('should throw if missing reason', () => {
        const inv = new InvalidInvoice()
        inv.setInvoiceNo('AB12345678').setInvoiceDate('2023-01-01')
        // Reason missing

        expect(() => inv.validate()).toThrow(/reason is empty/)
    })

    it('should throw on invalid invoice no', () => {
        expect(() => new InvalidInvoice().setInvoiceNo('SHORT')).toThrow(/length should be 10/)
    })

    it('should allow setting relate number', () => {
        const inv = new InvalidInvoice()
        inv.setRelateNumber('REL123')
        expect(inv.getPayloadData()['RelateNumber']).toBe('REL123')
    })
})
