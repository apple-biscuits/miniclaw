# Coding Standards Reference

## Naming Conventions

### Variables and Functions
- Use `camelCase` for variables and functions
- Use descriptive names that indicate purpose
- Avoid abbreviations unless widely understood

**Good:**
```typescript
const userName = "John";
function calculateTotalPrice() { ... }
```

**Bad:**
```typescript
const un = "John";
function calc() { ... }
```

### Classes and Interfaces
- Use `PascalCase` for classes and interfaces
- Prefix interfaces with `I` (optional, team preference)

**Good:**
```typescript
class UserService { ... }
interface IUserRepository { ... }
```

### Constants
- Use `UPPER_SNAKE_CASE` for constants
- Group related constants in objects/enums

**Good:**
```typescript
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = "https://api.example.com";
```

## Code Structure

### File Organization
1. Imports
2. Type definitions
3. Constants
4. Main class/function
5. Helper functions

### Function Size
- Keep functions under 50 lines when possible
- Single responsibility principle
- Extract complex logic into helper functions

### Comments
- Use JSDoc for public APIs
- Explain "why" not "what"
- Update comments when code changes

## Complexity Guidelines

### Cyclomatic Complexity
- Target: < 10 per function
- Warning: 10-15
- Refactor: > 15

### Nesting Depth
- Maximum: 3 levels
- Consider early returns to reduce nesting

### Parameter Count
- Ideal: 1-3 parameters
- Warning: 4-5 parameters
- Refactor: > 5 parameters (use options object)
