# Contributing Guidelines

## Overview

Welcome to the EmotionalChain project! We appreciate your interest in contributing to the world's first blockchain network implementing Proof of Emotion consensus. This guide will help you understand our development process, coding standards, and how to make meaningful contributions.

## Code of Conduct

### Our Values

- **Human-Centric**: Prioritize human wellness and authentic participation
- **Transparency**: Open, honest communication and development practices  
- **Innovation**: Push boundaries while maintaining security and stability
- **Inclusivity**: Welcome contributors from all backgrounds and skill levels
- **Quality**: Maintain high standards for code, documentation, and testing

### Expected Behavior

- Use welcoming and inclusive language
- Respect different viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community and project
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Development Environment**
   ```bash
   # Node.js 18+ with npm
   node --version  # Should be 18.0.0 or higher
   npm --version   # Should be 8.0.0 or higher
   
   # PostgreSQL 13+
   psql --version  # Should be 13.0 or higher
   
   # Git
   git --version   # Any recent version
   ```

2. **Understanding of Core Technologies**
   - TypeScript/JavaScript (Node.js and React)
   - PostgreSQL and Drizzle ORM
   - Blockchain fundamentals
   - Basic cryptography concepts
   - Biometric device integration (optional but helpful)

### Setting Up Development Environment

1. **Fork and Clone Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/yourusername/emotionalchain.git
   cd emotionalchain
   
   # Add upstream remote
   git remote add upstream https://github.com/emotionalchain/emotionalchain.git
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Database**
   ```bash
   # Create PostgreSQL database
   createdb emotionalchain_dev
   
   # Set environment variables
   export DATABASE_URL="postgresql://user:password@localhost/emotionalchain_dev"
   
   # Push schema to database
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Verify Setup**
   - Visit http://localhost:5000
   - Check that the blockchain network is running
   - Verify API endpoints are responding
   - Confirm WebSocket connections work

## Development Workflow

### Branch Strategy

We use a simplified Git Flow with the following branches:

```
main (production-ready)
  ↑
develop (integration branch)
  ↑
feature/your-feature-name
hotfix/critical-fix-name
```

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/proof-of-emotion-optimization
```

### Making Changes

1. **Follow Coding Standards** (see below)
2. **Write Tests** for new functionality
3. **Update Documentation** as needed
4. **Test Thoroughly** before submitting

### Submitting Changes

1. **Commit Changes**
   ```bash
   # Stage changes
   git add .
   
   # Commit with descriptive message
   git commit -m "feat: optimize emotional score calculation for edge cases
   
   - Add boundary validation for heart rate readings
   - Improve stress level normalization algorithm
   - Add comprehensive test coverage for edge cases
   - Update documentation with new parameters"
   ```

2. **Push to Your Fork**
   ```bash
   git push origin feature/proof-of-emotion-optimization
   ```

3. **Create Pull Request**
   - Go to GitHub and create a PR from your feature branch to `develop`
   - Use the PR template (see below)
   - Request review from maintainers

## Coding Standards

### TypeScript/JavaScript

#### Code Style

```typescript
// Use descriptive names
const calculateEmotionalScore = (biometrics: BiometricReading): number => {
  // Implementation
};

// Prefer const over let, let over var
const validatorThreshold = 75;
let currentScore = 0;

// Use proper type annotations
interface ValidatorMetrics {
  emotionalScore: number;
  uptime: number;
  reputation: number;
}

// Use async/await over Promises
async function processValidatorData(validatorId: string): Promise<ValidatorMetrics> {
  const data = await fetchValidatorData(validatorId);
  return processData(data);
}
```

#### File Organization

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── terminal/       # Terminal-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Page components
└── types/              # TypeScript type definitions

server/
├── routes/             # API route handlers
├── services/           # Business logic services
├── middleware/         # Express middleware
├── blockchain/         # Blockchain-specific logic
└── biometric/          # Biometric processing
```

#### Naming Conventions

```typescript
// Files: kebab-case
emotional-consensus.ts
biometric-device-manager.ts

// Classes: PascalCase
class EmotionalValidator {
  // Methods: camelCase
  calculateScore(): number {}
  
  // Private methods: camelCase with underscore
  private _validateBiometrics(): boolean {}
}

// Variables and functions: camelCase
const emotionalThreshold = 75;
function processHeartRateData() {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_EMOTIONAL_SCORE = 100;
const DEFAULT_CONSENSUS_TIMEOUT = 30000;

// Types and Interfaces: PascalCase
interface BiometricReading {
  heartRate: number;
  stressLevel: number;
}

type ValidatorStatus = 'active' | 'inactive' | 'suspended';
```

### Database and Schema

#### Drizzle ORM Patterns

```typescript
// Table definitions: camelCase with descriptive names
export const validatorStates = pgTable("validator_states", {
  validatorId: text("validator_id").primaryKey(),
  balance: decimal("balance", { precision: 18, scale: 8 }).notNull(),
  emotionalScore: decimal("emotional_score", { precision: 5, scale: 2 }).notNull(),
  // ... other fields
});

// Always create insert schemas
export const insertValidatorStateSchema = createInsertSchema(validatorStates).omit({
  updatedAt: true,
});

// Export proper types
export type ValidatorState = typeof validatorStates.$inferSelect;
export type InsertValidatorState = z.infer<typeof insertValidatorStateSchema>;
```

#### Database Best Practices

```typescript
// Use transactions for multi-table operations
async function createValidator(data: InsertValidatorState): Promise<ValidatorState> {
  return await db.transaction(async (tx) => {
    const [validator] = await tx.insert(validatorStates).values(data).returning();
    await tx.insert(validatorMetrics).values({
      validatorId: validator.validatorId,
      totalRewards: 0,
      blocksProduced: 0,
    });
    return validator;
  });
}

// Use proper error handling
try {
  const result = await db.select().from(validatorStates).where(eq(validatorStates.validatorId, id));
  return result[0] || null;
} catch (error) {
  console.error('Database query failed:', error);
  throw new Error('Failed to fetch validator state');
}
```

### Blockchain and Consensus

#### Consensus Implementation

```typescript
// Clear separation of concerns
class ProofOfEmotionEngine {
  private validators: ValidatorManager;
  private biometricVerifier: BiometricVerifier;
  private rewardCalculator: RewardCalculator;

  async selectValidators(): Promise<Validator[]> {
    // 1. Get eligible validators
    const eligible = await this.validators.getEligible();
    
    // 2. Calculate weights based on emotional scores
    const weighted = this.calculateWeights(eligible);
    
    // 3. Select using VRF for fairness
    return this.selectUsingVRF(weighted);
  }

  private calculateWeights(validators: Validator[]): WeightedValidator[] {
    return validators.map(validator => ({
      ...validator,
      weight: this.calculateValidatorWeight(validator)
    }));
  }
}
```

#### Cryptographic Operations

```typescript
// Use production-grade cryptography
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';

class BlockSigner {
  static sign(blockHash: Uint8Array, privateKey: Uint8Array): Signature {
    return secp256k1.sign(blockHash, privateKey);
  }

  static verify(signature: Signature, blockHash: Uint8Array, publicKey: Uint8Array): boolean {
    return secp256k1.verify(signature, blockHash, publicKey);
  }
}
```

### Testing Standards

#### Unit Tests

```typescript
// Use descriptive test names
describe('EmotionalScoreCalculator', () => {
  describe('calculateScore', () => {
    it('should return maximum score for optimal biometrics', () => {
      const biometrics = {
        heartRate: 75,
        stressLevel: 10,
        focusLevel: 90,
        authenticity: 95
      };
      
      const score = calculateEmotionalScore(biometrics);
      expect(score).toBeCloseTo(92.5, 1);
    });

    it('should handle edge cases gracefully', () => {
      const extremeBiometrics = {
        heartRate: 200,
        stressLevel: 100,
        focusLevel: 0,
        authenticity: 0
      };
      
      const score = calculateEmotionalScore(extremeBiometrics);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
```

#### Integration Tests

```typescript
// Test API endpoints
describe('Validator API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await seedTestValidators();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should return validator list with proper emotional scores', async () => {
    const response = await request(app)
      .get('/api/validators')
      .expect(200);

    expect(response.body).toHaveLength(21);
    expect(response.body[0]).toHaveProperty('emotionalScore');
    expect(response.body[0].emotionalScore).toBeGreaterThanOrEqual(0);
  });
});
```

## Documentation Standards

### Code Documentation

```typescript
/**
 * Calculates the emotional score for a validator based on biometric readings.
 * 
 * The emotional score is a weighted composite of:
 * - Heart rate optimization (30%): Optimal range 60-100 BPM
 * - Stress level (25%): Lower stress increases score
 * - Focus level (20%): Higher focus increases score  
 * - Authenticity (25%): Anti-spoofing verification score
 * 
 * @param biometrics - Real-time biometric readings from validator
 * @returns Emotional score between 0-100
 * 
 * @example
 * ```typescript
 * const score = calculateEmotionalScore({
 *   heartRate: 75,
 *   stressLevel: 15,
 *   focusLevel: 85,
 *   authenticity: 95
 * });
 * console.log(score); // ~89.25
 * ```
 */
function calculateEmotionalScore(biometrics: BiometricReading): number {
  // Implementation
}
```

### API Documentation

```typescript
/**
 * @api {get} /api/validators Get Active Validators
 * @apiName GetValidators
 * @apiGroup Validators
 * 
 * @apiDescription Retrieves a list of all active validators on the EmotionalChain network
 * with their current emotional scores and performance metrics.
 * 
 * @apiSuccess {Object[]} validators List of validator objects
 * @apiSuccess {String} validators.id Unique validator identifier
 * @apiSuccess {Number} validators.emotionalScore Current emotional score (0-100)
 * @apiSuccess {String} validators.balance Current EMO token balance
 * @apiSuccess {Boolean} validators.isActive Whether validator is actively participating
 * 
 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "id": "GravityCore",
 *         "emotionalScore": "89.45",
 *         "balance": "51234.56",
 *         "isActive": true
 *       }
 *     ]
 */
app.get('/api/validators', validatorController.getValidators);
```

## Pull Request Guidelines

### PR Template

```markdown
## Description
Brief description of the changes and their purpose.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that breaks existing functionality)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Related Issues
Closes #123
Relates to #456

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated  
- [ ] Manual testing completed
- [ ] Performance impact assessed

## Consensus Impact
- [ ] No impact on consensus mechanism
- [ ] Minor consensus parameter adjustment
- [ ] Major consensus algorithm change (requires network upgrade)

## Biometric Impact
- [ ] No impact on biometric processing
- [ ] New device support added
- [ ] Biometric algorithm improvement
- [ ] Breaking change to biometric API

## Security Considerations
- [ ] No security implications
- [ ] Security review completed
- [ ] Cryptographic changes verified
- [ ] Anti-spoofing measures tested

## Documentation
- [ ] Code comments updated
- [ ] API documentation updated
- [ ] User guides updated
- [ ] Architecture documentation updated

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] No new TypeScript errors
- [ ] Database migrations tested (if applicable)
- [ ] Blockchain compatibility verified (if applicable)
```

### Review Process

1. **Automated Checks**
   - TypeScript compilation
   - Unit test execution
   - Code quality metrics
   - Security vulnerability scanning

2. **Human Review**
   - Code quality and style
   - Architecture consistency
   - Security implications
   - Performance impact

3. **Consensus Review** (for consensus-related changes)
   - Algorithm correctness
   - Byzantine fault tolerance
   - Economic incentive alignment
   - Network upgrade compatibility

## Issue Reporting

### Bug Reports

```markdown
## Bug Description
Clear description of the issue.

## Environment
- OS: [e.g., Ubuntu 20.04]
- Node.js Version: [e.g., 18.12.0]
- Browser: [e.g., Chrome 108] (if frontend issue)
- EmotionalChain Version: [e.g., v1.0.0]

## Steps to Reproduce
1. Start the application
2. Navigate to validators page
3. Click on validator "GravityCore"
4. Observe error in console

## Expected Behavior
Should display validator details without errors.

## Actual Behavior
Console shows: "TypeError: Cannot read property 'emotionalScore' of undefined"

## Additional Context
- Happens only with certain validators
- Started after recent update
- Screenshots attached
```

### Feature Requests

```markdown
## Feature Description
Brief description of the proposed feature.

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
Detailed description of how the feature should work.

## Alternatives Considered
Other approaches that were considered and why they were rejected.

## Implementation Notes
Technical considerations, potential challenges, or suggestions.

## Impact Assessment
- Performance impact: [Low/Medium/High]
- Consensus impact: [None/Minor/Major]
- Breaking changes: [Yes/No]
- Security implications: [None/Minor/Major]
```

## Contribution Areas

### High Priority Areas

1. **Biometric Device Support**
   - Add support for new device types
   - Improve signal processing algorithms
   - Enhance anti-spoofing measures

2. **Consensus Optimization**
   - Performance improvements
   - Economic model refinements
   - Byzantine fault tolerance enhancements

3. **Security Hardening**
   - Cryptographic protocol improvements
   - Attack vector mitigation
   - Privacy protection enhancements

4. **Developer Experience**
   - Better documentation
   - Improved tooling
   - SDK development

### Good First Issues

- Documentation improvements
- Test coverage expansion
- UI/UX enhancements
- Bug fixes in non-critical components
- Code quality improvements

## Community and Communication

### Communication Channels

- **GitHub Discussions**: Technical discussions and questions
- **Discord**: Real-time development chat
- **Monthly Community Calls**: Project updates and roadmap discussions
- **Email**: security@emotionalchain.org for security-related issues

### Getting Help

1. **Check Documentation**: Start with the docs in this repository
2. **Search Issues**: Look for similar issues or questions
3. **Ask Questions**: Use GitHub Discussions for technical questions
4. **Join Community**: Connect with other developers on Discord

### Recognition

Contributors are recognized through:

- **Contributor List**: Featured in repository README
- **Release Notes**: Major contributions highlighted
- **Community Spotlights**: Regular feature of outstanding contributors
- **Governance Participation**: Path to technical committee membership

## License and Legal

By contributing to EmotionalChain, you agree that your contributions will be licensed under the same license as the project (MIT License). Ensure that:

- You have the right to contribute the code
- Your contributions don't violate any third-party licenses
- You follow all applicable laws and regulations
- You respect intellectual property rights

Thank you for contributing to EmotionalChain! Together, we're building the future of human-centric blockchain technology.