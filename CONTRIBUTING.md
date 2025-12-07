# Contributing

Thank you for your interest in contributing to the ECPay e-Invoice B2C SDK!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/CarlLee1983/ecpay-einvoice-b2c-node.git
cd ecpay-einvoice-b2c-node

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Format code
pnpm format
```

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat:` | New feature | Minor |
| `fix:` | Bug fix | Patch |
| `feat!:` | Breaking change | Major |
| `docs:` | Documentation | None |
| `chore:` | Maintenance | None |
| `refactor:` | Code refactoring | None |
| `test:` | Tests | None |
| `ci:` | CI/CD changes | None |

### Examples

```bash
# New feature
git commit -m "feat: add batch invoice support"

# Bug fix
git commit -m "fix: handle empty response correctly"

# Breaking change
git commit -m "feat!: change response format

BREAKING CHANGE: Response now returns typed objects."
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Run format check (`pnpm format:check`)
6. Commit with conventional commit message
7. Push to your fork
8. Open a Pull Request

### PR Requirements

- [ ] All tests pass
- [ ] Code is formatted (`pnpm format`)
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow conventional commits

## Code Style

- Use TypeScript
- No semicolons (Prettier handles this)
- Use JSDoc comments for public APIs
- Write tests for new features

## Release Process

Releases are automated via Release Please:

1. Merge PRs to `main` branch
2. Release Please creates a Release PR
3. Merge the Release PR
4. Package is automatically published to npm

## Questions?

Feel free to open an issue for any questions or discussions.
