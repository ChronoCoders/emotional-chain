# Security Policy

## Supported Versions

The following versions of EmotionalChain are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in EmotionalChain, please report it to us as soon as possible. We appreciate your efforts to responsibly disclose your findings.

### How to Report

- **GitHub Security Advisories**: [Report a vulnerability](https://github.com/ChronoCoders/emotional-chain/security/advisories/new) (preferred method)
- **Email**: Create an issue with the `security` label for non-critical issues
- **Response Time**: We aim to acknowledge reports within 48 hours
- **Updates**: You can expect updates every 5-7 days on the status of your report

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Affected components (consensus, biometric, network, smart contracts, etc.)
- Potential impact on the blockchain or user data
- Any suggested fixes (optional)

### Our Commitment

- We will investigate all legitimate reports and do our best to quickly fix the problem
- We will keep you informed about our progress
- We will credit you in our release notes (if desired)
- We will not take legal action against good-faith security researchers

### Please Do Not

- Publicly disclose the vulnerability before we've had a chance to address it
- Test the vulnerability on production systems or mainnet
- Access, modify, or delete data belonging to other users
- Disrupt the network or consensus mechanism during testing

## Security Update Policy

When we identify or are notified of a security vulnerability:

1. We will confirm the issue and determine affected versions
2. We will audit related code to find similar problems
3. We will prepare fixes for all supported versions
4. We will release patches and publish security advisories
5. Critical vulnerabilities affecting consensus or funds will be prioritized

## Scope

The following components are in scope for security reports:

- **Consensus Engine**: Proof of Emotion (PoE) mechanism
- **Biometric Processing**: Device validation and data handling
- **Cryptography**: Key generation, signing, verification
- **Network Layer**: P2P communication, WebSocket connections
- **Smart Contracts**: EVM-compatible emotion-aware contracts
- **API Endpoints**: REST API and authentication
- **Zero-Knowledge Proofs**: Privacy-preserving validation

## Known Security Measures

EmotionalChain implements the following security measures:

- **Helmet.js**: HTTP security headers including CSP
- **Rate Limiting**: Protection against DoS attacks
- **Input Validation**: Sanitized inputs using Zod schemas
- **Cryptographic Standards**: @noble/curves and @noble/hashes
- **Byzantine Fault Tolerance**: Consensus resilience
- **Three-Tier Attestation**: Device registration security

## Security Best Practices

When deploying or contributing to EmotionalChain:

- Always use the latest stable version
- Enable HTTPS/TLS for all communications
- Use environment variables for sensitive configuration
- Never commit API keys or secrets to the repository
- Follow the principle of least privilege for validator nodes
- Regularly update dependencies (Dependabot is enabled)
- Run DeepSource analysis before submitting PRs

## Acknowledgments

We thank all security researchers who help keep EmotionalChain safe. Contributors who report valid security issues will be acknowledged here (with permission).
