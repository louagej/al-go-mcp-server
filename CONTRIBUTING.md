# Contributing to AL-Go MCP Server

Thank you for your interest in contributing to AL-Go MCP Server! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Security Guidelines](#security-guidelines)
- [Review Process](#review-process)

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment
- Report any unacceptable behavior

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git
- GitHub account

### Setting up your development environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/louagej/al-go-mcp-server.git
   cd al-go-mcp-server
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/louagej/al-go-mcp-server.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Build the project**:
   ```bash
   npm run build
   ```
6. **Run tests** (if available):
   ```bash
   npm test
   ```

### Project Structure

```
├── src/                    # Source TypeScript files
│   ├── index.ts           # Main MCP server entry point
│   └── services/          # Core service implementations
│       ├── AlGoService.ts # AL-Go repository integration
│       └── DocumentIndex.ts # Document indexing and search
├── build/                 # Compiled JavaScript output
├── .github/              # GitHub workflows and templates
├── package.json          # Project configuration
└── README.md            # Project documentation
```

## Development Process

### Branch Strategy

- **main**: Production-ready code, protected branch
- **feature/***: New features (e.g., `feature/add-search-filters`)
- **fix/***: Bug fixes (e.g., `fix/memory-leak`)
- **docs/***: Documentation updates (e.g., `docs/update-api-guide`)

### Making Changes

1. **Create a feature branch** from main:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards:
   - Write clear, self-documenting code
   - Add comments for complex logic
   - Follow existing code style and patterns
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm run build
   npm test
   ```

4. **Commit your changes** with clear messages:
   ```bash
   git add .
   git commit -m "feat: add search filtering functionality"
   ```

### Commit Message Format

Use conventional commit format:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Pull Request Guidelines

### Before Creating a PR

- Ensure your code builds successfully: `npm run build`
- Run any available tests: `npm test`
- Update documentation if needed
- Check that your changes don't break existing functionality

### Creating the Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub with:
   - **Clear title** describing the change
   - **Detailed description** explaining:
     - What changes were made
     - Why they were necessary
     - How to test the changes
     - Any potential breaking changes
   - **Link to related issues** (if applicable)

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Built successfully (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated (if applicable)
- [ ] No sensitive information committed
```

## Security Guidelines

**CRITICAL**: Never commit sensitive information:

- ❌ API keys, tokens, or passwords
- ❌ Personal information or credentials
- ❌ Private configuration files
- ❌ Debug logs with sensitive data

### Security Best Practices

- Use environment variables for configuration
- Validate all user inputs
- Follow secure coding practices
- Keep dependencies up to date
- Report security issues privately (see SECURITY.md)

## Review Process

### What to Expect

1. **Automated Checks**: GitHub Actions will run builds and tests
2. **Maintainer Review**: Core maintainers will review your PR
3. **Feedback**: You may receive requests for changes
4. **Approval**: PRs require at least one approving review
5. **Merge**: Maintainers will merge approved PRs

### Review Criteria

- **Functionality**: Does the code work as intended?
- **Code Quality**: Is the code readable and maintainable?
- **Security**: Are there any security concerns?
- **Documentation**: Is documentation updated appropriately?
- **Testing**: Are changes adequately tested?
- **Compatibility**: Does this maintain backward compatibility?

### Response Times

- **Initial Response**: Probably within 3-5 business days
- **Review Completion**: Depends on PR complexity
- **Follow-up Reviews**: Probably within 1-2 business days

## Getting Help

If you need help or have questions:

1. **Check existing issues** for similar problems
2. **Search documentation** for guidance
3. **Create a new issue** with the question label
4. **Join discussions** in existing issues

## Recognition

Contributors will be:

- Listed in the project's contributors section
- Credited in release notes for significant contributions
- Invited to participate in project discussions

## Development Tips

### Useful Commands

```bash
# Development build with watch mode
npm run watch

# Build for production
npm run build

# Run the server locally
npm run dev

# Check for TypeScript errors
npx tsc --noEmit
```

### IDE Setup

Recommended extensions for VS Code:
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- GitLens

---

Thank you for contributing to AL-Go MCP Server! Your contributions help make this project better for everyone.