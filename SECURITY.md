# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Email the maintainer directly: [carllee0520@gmail.com](mailto:carllee0520@gmail.com)
3. Or use GitHub's private vulnerability reporting:
   - Go to the Security tab → "Report a vulnerability"

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity (Critical: ASAP, High: 14 days, Medium: 30 days)

## Credential Security

### ⚠️ Important

**Never commit real credentials to version control!**

The HashKey, HashIV, and MerchantID values shown in README and examples are **ECPay staging/test credentials** for demonstration purposes only.

### Best Practices

1. **Use Environment Variables**
   ```typescript
   const client = new EcPayClient(
       process.env.ECPAY_SERVER_URL!,
       process.env.ECPAY_HASH_KEY!,
       process.env.ECPAY_HASH_IV!,
       process.env.ECPAY_MERCHANT_ID!
   )
   ```

2. **Use dotenv for Local Development**
   ```bash
   npm install dotenv
   ```
   
   Create `.env` file (add to `.gitignore`):
   ```
   ECPAY_SERVER_URL=https://einvoice-stage.ecpay.com.tw
   ECPAY_HASH_KEY=your_hash_key
   ECPAY_HASH_IV=your_hash_iv
   ECPAY_MERCHANT_ID=your_merchant_id
   ```

3. **Use Secret Management in Production**
   - AWS Secrets Manager
   - HashiCorp Vault
   - GitHub Secrets (for CI/CD)
   - Kubernetes Secrets

## Dependency Security

This project uses:

- **Dependabot**: Automatically scans for vulnerable dependencies
- **npm audit**: Run `npm audit` to check for known vulnerabilities
- **Minimal dependencies**: Only `axios` and `zod` as production dependencies

### Running Security Audit

```bash
npm audit
# or
pnpm audit
```

## Encryption

This SDK uses AES-128-CBC encryption (as required by ECPay API):

- Encryption key: 16 bytes (128 bits)
- IV: 16 bytes
- Padding: PKCS7

All payloads are encrypted before transmission and decrypted upon response.
