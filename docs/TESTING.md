# Testing Guide

This document describes the testing strategy and how to write tests for the ECPay e-Invoice B2C SDK.

## Test Structure

```
test/
├── client.test.ts       # EcPayClient unit tests
├── operations.test.ts   # Operation classes unit tests
├── queries.test.ts      # Query classes unit tests
├── models.test.ts       # Model classes unit tests
├── security.test.ts     # Encryption/decryption tests
├── errors.test.ts       # Error types tests
└── integration.test.ts  # Integration tests with nock
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm vitest run test/client.test.ts

# Run tests matching a pattern
pnpm vitest run -t "issueInvoice"
```

## Test Types

### Unit Tests

Unit tests test individual components in isolation. We mock external dependencies like axios.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EcPayClient } from '../src'

// Mock axios
vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({
            post: vi.fn(),
        })),
        isAxiosError: vi.fn(),
    },
}))

describe('EcPayClient', () => {
    it('should do something', () => {
        // Your test
    })
})
```

### Integration Tests

Integration tests use [nock](https://github.com/nock/nock) to mock HTTP responses and test the full request/response cycle.

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import nock from 'nock'
import { EcPayClient } from '../src'

describe('Integration Tests', () => {
    beforeAll(() => {
        nock.disableNetConnect()
    })

    afterAll(() => {
        nock.enableNetConnect()
    })

    afterEach(() => {
        nock.cleanAll()
    })

    it('should issue invoice successfully', async () => {
        nock('https://einvoice-stage.ecpay.com.tw')
            .post('/B2CInvoice/Issue')
            .reply(200, {
                RtnCode: 1,
                RtnMsg: 'Success',
                Data: '...encrypted...',
            })

        const client = new EcPayClient(...)
        const response = await client.issueInvoice(...)
        
        expect(response.RtnCode).toBe(1)
    })
})
```

## Coverage Thresholds

The following coverage thresholds are enforced in CI:

| Metric | Threshold |
|--------|-----------|
| Statements | 90% |
| Branches | 80% |
| Functions | 90% |
| Lines | 90% |

If coverage drops below these thresholds, the CI build will fail.

## Mocking ECPay Responses

ECPay responses are encrypted. To create mock responses for integration tests:

```typescript
import { CipherService } from '../src/security/CipherService'
import { PayloadEncoder } from '../src/security/PayloadEncoder'

const encoder = new PayloadEncoder(new CipherService(hashKey, hashIV))

function createEncryptedResponse(data: any): string {
    const payload = { Data: data }
    return encoder.encodePayload(payload).Data as string
}

// Use in nock mock
nock(serverUrl)
    .post('/B2CInvoice/Issue')
    .reply(200, {
        RtnCode: 1,
        RtnMsg: 'Success',
        Data: createEncryptedResponse({
            RtnCode: 1,
            RtnMsg: '開立發票成功',
            InvoiceNo: 'AB12345678',
        }),
    })
```

## Testing Error Scenarios

### API Errors

```typescript
it('should handle API error', async () => {
    nock(serverUrl)
        .post('/B2CInvoice/Issue')
        .reply(200, {
            RtnCode: 0,
            RtnMsg: 'Error occurred',
        })

    const response = await client.issueInvoice(...)
    expect(response.RtnCode).toBe(0)
})
```

### Network Errors

```typescript
it('should handle network timeout', async () => {
    nock(serverUrl)
        .post('/B2CInvoice/Issue')
        .delay(5000)
        .reply(200, {})

    const client = new EcPayClient(..., { timeout: 100 })
    
    await expect(client.issueInvoice(...)).rejects.toThrow()
})
```

### HTTP Errors

```typescript
it('should handle 500 error', async () => {
    nock(serverUrl)
        .post('/B2CInvoice/Issue')
        .reply(500, 'Internal Server Error')

    await expect(client.issueInvoice(...)).rejects.toThrow('API Error: 500')
})
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it.

2. **Use descriptive test names** - Test names should describe the expected behavior.

3. **Follow AAA pattern** - Arrange, Act, Assert.

4. **Mock at the right level** - Mock external dependencies, not internal methods.

5. **Test edge cases** - Include tests for empty inputs, invalid data, and error conditions.

6. **Keep tests independent** - Each test should be able to run in isolation.

7. **Use test fixtures** - Create reusable test data to avoid duplication.

## Codecov Integration

Coverage reports are automatically uploaded to Codecov in CI. Codecov provides:

- Coverage diff on PRs
- Coverage trends over time
- Line-by-line coverage annotations

To view coverage locally:

```bash
pnpm test:coverage

# Open coverage report in browser
open coverage/index.html
```
