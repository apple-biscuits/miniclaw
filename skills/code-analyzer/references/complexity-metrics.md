# Complexity Metrics Reference

## Cyclomatic Complexity

Cyclomatic complexity measures the number of linearly independent paths through a program's source code.

### Calculation
- Start with 1 (base complexity)
- Add 1 for each: `if`, `else if`, `for`, `while`, `case`, `catch`, `&&`, `||`, `?`

### Interpretation

| Score | Rating | Action |
|-------|--------|--------|
| 1-5 | Low | Good - Easy to test and maintain |
| 6-10 | Moderate | Acceptable - Monitor for growth |
| 11-15 | High | Consider refactoring |
| 16+ | Very High | Refactor immediately |

### Example

```typescript
// Complexity: 1
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Complexity: 4
function getGrade(score: number): string {
  if (score >= 90) return 'A';      // +1
  else if (score >= 80) return 'B'; // +1
  else if (score >= 70) return 'C'; // +1
  else return 'F';
}

// Complexity: 8 (too high!)
function processOrder(order: Order): Result {
  if (order.isValid) {              // +1
    if (order.isPremium) {          // +1
      if (order.items.length > 10) {// +1
        return applyBulkDiscount();
      } else if (order.hasCoupon) { // +1
        return applyCoupon();
      }
    } else if (order.items.length > 5) { // +1
      return applySmallDiscount();
    }
  } else if (order.canRetry) {      // +1
    return retryOrder();
  }
  return rejectOrder();
}
```

## Nesting Depth

Measures how deeply code is nested within control structures.

### Guidelines
- **Max depth: 3 levels**
- Use early returns to reduce nesting
- Extract nested logic into separate functions

### Refactoring Example

**Before (Depth: 4):**
```typescript
function processUser(user: User) {
  if (user.isActive) {
    if (user.hasPermission) {
      if (user.profile.isComplete) {
        if (user.email.isVerified) {
          return sendNotification(user);
        }
      }
    }
  }
  return false;
}
```

**After (Depth: 1):**
```typescript
function processUser(user: User) {
  if (!user.isActive) return false;
  if (!user.hasPermission) return false;
  if (!user.profile.isComplete) return false;
  if (!user.email.isVerified) return false;
  
  return sendNotification(user);
}
```

## Function Length

### Guidelines
- **Ideal:** < 30 lines
- **Acceptable:** 30-50 lines
- **Refactor:** > 50 lines

### Signs a Function is Too Long
- Multiple responsibilities
- Hard to name appropriately
- Difficult to test
- Contains multiple abstraction levels

## Parameter Count

### Guidelines
- **Ideal:** 1-3 parameters
- **Warning:** 4-5 parameters
- **Refactor:** > 5 parameters

### Using Options Object

**Before:**
```typescript
function createUser(
  name: string,
  email: string,
  age: number,
  role: string,
  department: string,
  isActive: boolean
) { ... }
```

**After:**
```typescript
interface CreateUserOptions {
  name: string;
  email: string;
  age: number;
  role?: string;
  department?: string;
  isActive?: boolean;
}

function createUser(options: CreateUserOptions) { ... }
```
