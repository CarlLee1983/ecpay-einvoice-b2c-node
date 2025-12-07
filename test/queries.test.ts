import { describe, it, expect } from 'vitest'
import { GetInvoice } from '../src/queries/GetInvoice'
import { CheckLoveCode } from '../src/queries/CheckLoveCode'
import { CheckBarcode } from '../src/queries/CheckBarcode'

describe('GetInvoice Query', () => {
    it('should set properties correctly', () => {
        const q = new GetInvoice()
        q.setRelateNumber('REL123')
        q.setInvoiceNo('1234567890')
        q.setInvoiceDate('2023-01-01')

        const data = q.getPayloadData()
        expect(data['RelateNumber']).toBe('REL123')
        expect(data['InvoiceNo']).toBe('1234567890')
        expect(data['InvoiceDate']).toBe('2023-01-01')
    })

    it('should throw on invalid invoice no length', () => {
        expect(() => new GetInvoice().setInvoiceNo('123')).toThrow(/length should be 10/)
    })

    it('should validate required fields', () => {
        const q = new GetInvoice()
        // Missing everything
        expect(() => q.validate()).toThrow(/invoice no is empty/)

        q.setInvoiceNo('1234567890')
        // Missing date
        expect(() => q.validate()).toThrow(/invoice date is empty/)

        q.setInvoiceDate('2023-01-01')
        expect(() => q.validate()).not.toThrow()
    })

    it('should have correct path', () => {
        expect(new GetInvoice().getRequestPath()).toBe('/B2CInvoice/GetIssue')
    })
})

describe('CheckLoveCode Query', () => {
    it('should validate love code length', () => {
        const q = new CheckLoveCode()
        expect(() => q.setLoveCode('12')).toThrow(/length must be 3-7/)
        expect(() => q.setLoveCode('12345678')).toThrow(/length must be 3-7/)

        q.setLoveCode('123456')
        expect(q.getPayloadData()['LoveCode']).toBe('123456')
    })

    it('should validate empty code', () => {
        const q = new CheckLoveCode()
        expect(() => q.validate()).toThrow(/LoveCode is empty/)
    })

    it('should have correct path', () => {
        expect(new CheckLoveCode().getRequestPath()).toBe('/B2CInvoice/CheckLoveCode')
    })
})

describe('CheckBarcode Query', () => {
    it('should validate barcode format', () => {
        const q = new CheckBarcode()
        // Valid format: / + 7 chars (uppercase alphanumeric + . -)
        expect(() => q.setBarcode('123')).toThrow(/format invalid/)
        expect(() => q.setBarcode('/123456')).toThrow(/format invalid/) // Too short

        // Correct
        q.setBarcode('/AB1234.')
        expect(q.getPayloadData()['BarCode']).toBe('/AB1234.')
    })

    it('should normalize validation', () => {
        const q = new CheckBarcode()
        expect(() => q.validate()).toThrow(/barcode is empty/)

        // Direct data manipulation validtion (though setters prevent invalid format usually)
        // We rely on setter for format check, but validte checks existence.
        // Let's verify validate re-checks format
        // @ts-ignore
        q.data.BarCode = 'BAD'
        expect(() => q.validate()).toThrow(/format invalid/)
    })

    it('should auto uppercase', () => {
        const q = new CheckBarcode()
        q.setBarcode('/ab1234.')
        expect(q.getPayloadData()['BarCode']).toBe('/AB1234.')
    })

    it('should have correct path', () => {
        expect(new CheckBarcode().getRequestPath()).toBe('/B2CInvoice/CheckBarcode')
    })
})
