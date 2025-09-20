# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them responsibly:

1. **Email**: Send details to @louagej with subject "Security Issue: al-go-mcp-server"
2. **GitHub Security Advisories**: Use the private vulnerability reporting feature in the repository's Security tab

### What to include in your report

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (if you have them)

### Response Timeline

- **Initial Response**: Probably within 24-48 hours
- **Status Update**: Probably within 7 days
- **Fix Timeline**: Critical issues orobably within 30 days, others probably within 90 days

## Security Best Practices for Contributors

### Code Security

- Never commit secrets, API keys, or sensitive data
- Use secure coding practices and validate all inputs
- Follow the principle of least privilege
- Regularly update dependencies

### npm Package Security

This package is published to npm and should be treated as a supply chain component:

- All releases are built from tagged versions in this repository
- Published packages include cryptographic signatures and provenance
- Dependencies are regularly audited and updated

### GitHub Workflow Security

- All workflows use pinned action versions
- Secrets are properly scoped and protected
- Pull requests from forks have limited permissions
- No secrets are accessible in PR workflows from external contributors

## Dependency Security

We use several tools to maintain dependency security:

- **Dependabot**: Automatically creates PRs for dependency updates
- **npm audit**: Regular security audits of npm dependencies
- **GitHub Security Advisories**: Monitors for known vulnerabilities

## Incident Response

In case of a confirmed security incident:

1. The issue will probably be acknowledged within 24 hours
2. A private patch will be developed
3. Affected users will be notified through appropriate channels
4. A public disclosure will be made after the patch is available

## Contact

For any security-related questions or concerns, please contact:
- Repository maintainer: @louagej

---

Thank you for helping keep AL-Go MCP Server and its users safe!