import { describe, it, expect } from 'vitest'
import { InvoiceItem, InvoiceItemInput } from '../src/models/InvoiceItem'
import { AllowanceItem, AllowanceItemInput } from '../src/models/AllowanceItem'

describe('InvoiceItem', () => {
    it('should create valid item', () => {
        const item = new InvoiceItem('Name', 2, 'unit', 100)
        expect(item.getAmount()).toBe(200)
    })

    it('should throw on invalid quantity', () => {
        expect(() => new InvoiceItem('Name', 0, 'unit', 100)).toThrow()
        expect(() => new InvoiceItem('Name', -1, 'unit', 100)).toThrow()
    })

    it('should throw on invalid price', () => {
        expect(() => new InvoiceItem('Name', 1, 'unit', -100)).toThrow()
    })

    it('should create from array', () => {
        const input: InvoiceItemInput = { name: 'N', quantity: 1, unit: 'u', price: 10 }
        const item = InvoiceItem.fromArray(input)
        expect(item).toBeInstanceOf(InvoiceItem)
        expect(item.getAmount()).toBe(10)
    })

    it('should include tax type in payload', () => {
        const item = new InvoiceItem('N', 1, 'u', 100, '1')
        const payload = item.toPayload()
        expect(payload).toHaveProperty('ItemTaxType', '1')
    })
})

describe('AllowanceItem', () => {
    it('should create valid item', () => {
        const item = new AllowanceItem('Name', 2, 'unit', 50)
        expect(item.getAmount()).toBe(100)
    })

    it('should throw on invalid inputs', () => {
        expect(() => new AllowanceItem('', 1, 'u', 10)).toThrow() // Empty name
        expect(() => new AllowanceItem('N', 0, 'u', 10)).toThrow() // Zero qty
    })

    it('should create from array', () => {
        const input: AllowanceItemInput = { name: 'N', quantity: 1, unit: 'u', price: 10 }
        const item = AllowanceItem.fromArray(input)
        expect(item).toBeInstanceOf(AllowanceItem)
    })
})
