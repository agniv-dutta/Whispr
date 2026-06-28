# Contributing to Whispr

First off, thank you for considering contributing! This is a Scaler SDE assignment project, but feedback and improvements are always welcome.

## Code of Conduct

By participating, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

1. Check existing [issues](https://github.com/your-org/whispr/issues) to avoid duplicates.
2. Use the **Bug Report** template — include steps to reproduce, expected behavior, screenshots, and environment details.

### Suggesting Features

1. Open a **Feature Request** issue describing the use case and proposed solution.
2. Tag it with `enhancement`.

### Pull Requests

1. Fork the repository.
2. Create a branch:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
# or
git checkout -b docs/what-you-changed
```

3. Make your changes.
4. Ensure the code builds:

```bash
cd frontend && npm run build
cd backend && pip install -r requirements.txt && pytest
```

5. Commit with a descriptive message:

```bash
git commit -m "feat: add message search functionality"
```

6. Push and open a pull request against `main`.

### Branch Naming Convention

| Prefix | Purpose |
|--------|---------|
| `feature/` | New features |
| `bugfix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring |
| `chore/` | Build/config changes |

### Commit Style

We use conventional commits:

```
feat: add message reactions
fix: resolve WebSocket reconnection loop
docs: update API reference
refactor: extract MessageBubble into sub-components
chore: upgrade Next.js to 16.2.9
```

## Development Setup

Follow the [Quick Start](README.md#-quick-start) guide in the README.

## Code Style

- **Frontend**: TypeScript strict mode, ESLint config
- **Backend**: PEP 8, type hints on all public functions
- **Components**: One component per file, named exports for types, default exports for components

## PR Checklist

Before submitting your PR, verify:

- [ ] Code builds without errors (`npm run build`)
- [ ] No new TypeScript or Python warnings
- [ ] Tests pass (if applicable)
- [ ] New components follow existing patterns
- [ ] No hardcoded secrets or API keys
- [ ] PR description clearly explains the change

## Questions?

Open a [Discussion](https://github.com/your-org/whispr/discussions) or tag the maintainer in an issue.

---

*This is a student assignment project. Contributions are reviewed on a best-effort basis.*
