# Code Review: Optimization & Security Suggestions

## Overview
This document outlines identified improvements organized by priority level:
- **MUST**: Critical issues requiring immediate attention
- **SHOULD**: Important improvements with clear benefits
- **COULD**: Nice-to-have optimizations
- **WON'T**: Intentional decisions to skip with explanations

---

## 🔴 MUST DO (Critical Security & Stability Issues)

### 1. **Input Validation on API Routes**
**Location:** `src/app/api/process-checkout/route.ts`, `src/app/api/validate-cart-total/route.ts`

**Issue:** No validation of request payload structure or types before use.

**Risk:** 
- Malformed requests could crash the server
- Missing fields could cause undefined behavior
- Type safety is only at TypeScript level, not runtime

**Recommendation:**
```typescript
// Use a validation library like zod for runtime validation
import { z } from 'zod';

const CheckoutRequestSchema = z.object({
  cart: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1)
  })),
  form: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1)
  }),
  payment_ref: z.string().min(1),
  total: z.number().positive()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = CheckoutRequestSchema.parse(body); // Will throw if invalid
    // ... rest of logic
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    // ... handle other errors
  }
}
```

**Priority:** CRITICAL - Deploy immediately

---

### 2. **Environment Variable Validation**
**Location:** All files using `process.env`

**Issue:** Missing env vars will only fail at runtime when accessed, not at startup.

**Risk:**
- Application may crash in production due to missing secrets
- Difficult to debug deployment issues

**Recommendation:**
Create a `src/lib/env.ts` file:
```typescript
// Validate all required env vars at startup
function getEnvVar(key: string, isRequired = true): string {
  const value = process.env[key];
  if (!value && isRequired) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const env = {
  SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  PAYSTACK_SECRET_KEY: getEnvVar('PAYSTACK_SECRET_KEY'),
  SITE_URL: getEnvVar('NEXT_PUBLIC_SITE_URL'),
} as const;

// Validate on module load
export function validateEnvironment() {
  Object.entries(env).forEach(([key, value]) => {
    if (!value) throw new Error(`Missing env var: ${key}`);
  });
}
```

Then in your app/layout.tsx: `validateEnvironment();`

**Priority:** CRITICAL - Deploy in next release

---

### 3. **SQL Injection via Email in User Lookup**
**Location:** `src/app/api/process-checkout/route.ts` line 33-34

**Issue:** While Supabase has built-in protections, listing ALL users and filtering client-side is inefficient and potentially problematic.

**Risk:**
- Performance issue with thousands of users (listUsers fetches all)
- Bad practice for large-scale applications

**Recommendation:**
```typescript
// Instead of: const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
// Use the direct lookup method:

// First, try to get user from auth
const { data: authData } = await supabaseAdmin.auth.admin.getUserByEmail(form.email);
let targetUser = authData?.user;

if (!targetUser) {
  // User doesn't exist, create new account
  // ... existing creation logic
}
```

**Priority:** CRITICAL - Performance issue that scales poorly

---

### 5. **Payment Amount Mismatch Attack**
**Location:** `src/app/api/process-checkout/route.ts`

**Issue:** User sends `total` value from frontend. No server-side validation that it matches cart items.

**Risk:**
- Customer could send intentionally low total amount
- Bypass the cart validation endpoint entirely

**Recommendation:**
```typescript
// After payment verification, ALWAYS recalculate total:
const validatedTotal = await validateCartTotal(cart); // Call your validation endpoint
if (Math.abs(validatedTotal - total) > 0.01) { // Allow tiny floating-point differences
  return NextResponse.json(
    { error: 'Cart total mismatch. Please refresh and try again.' },
    { status: 400 }
  );
}
```

**Priority:** CRITICAL - Direct revenue impact

---

## SHOULD DO (Important Improvements)

### 6. **Missing Error Handling in TopBar Profile Fetch**
**Location:** `src/components/TopBar.tsx` lines 50-58

**Issue:** Profile query errors are silently ignored - component stays in loading state indefinitely if fetch fails.

**Risk:**
- If profile fetch fails, user sees loading skeleton forever
- No error message or recovery option
- Poor user experience and difficult debugging

**Recommendation:**
```typescript
// In TopBar.tsx useEffect:
if (user) {
  supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
    .then(({ data, error }) => {
      // Handle error case instead of ignoring it
      if (error) {
        console.error('Failed to fetch profile:', error.message);
        setProfile(null); // Allow UI to work with minimal info
      } else {
        setProfile(data);
      }
      setLoading(false); // Always set loading to false
    });
}
```

**Priority:** HIGH - User experience blocker

---

### 7. **Rate Limiting on Checkout Endpoint**
**Location:** `src/app/api/process-checkout/route.ts`

**Issue:** No rate limiting on payment processing - vulnerable to abuse.

**Risk:**
- Attackers could spam payment requests
- DDoS vector for payment processor

**Recommendation:**
Use a rate limiting library like `upstash/ratelimit`:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requests per hour per IP
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please try again later.' },
      { status: 429 }
    );
  }
  // ... rest of logic
}
```

**Priority:** HIGH - Deploy before scaling to production

---

### 8. **Explicit Error Messages Leak Information**
**Location:** Multiple API routes

**Issue:** Returning database errors directly to client could leak schema/security info.

**Risk:**
- Attackers learn database structure from error messages
- Internal implementation details exposed

**Recommendation:**
```typescript
// Instead of:
return NextResponse.json({ error: orderError.message }, { status: 500 });

// Do:
console.error('Order insertion failed:', orderError.message);
return NextResponse.json(
  { error: 'Order creation failed. Please contact support.' },
  { status: 500 }
);
```

**Priority:** HIGH - Deploy immediately

---

### 9. **Cart Persistence Security**
**Location:** `src/hooks/useCart.ts`

**Issue:** Cart data stored unencrypted in localStorage is visible to any XSS attack.

**Risk:**
- Customer payment info accidentally stored
- Cart data could be modified by compromised scripts

**Recommendation:**
```typescript
// Add validation on initialization:
useEffect(() => {
  const storedCart = localStorage.getItem("jradiance-cart");
  if (storedCart) {
    try {
      const parsed = JSON.parse(storedCart);
      // Validate structure matches CartItem[]
      if (Array.isArray(parsed) && parsed.every(item => 
        typeof item.productId === 'string' && 
        typeof item.quantity === 'number'
      )) {
        setCart(parsed);
      } else {
        localStorage.removeItem("jradiance-cart"); // Clear corrupted data
      }
    } catch {
      localStorage.removeItem("jradiance-cart");
    }
  }
}, []);
```

**Priority:** MEDIUM - Deploy in security patch

---

### 10. **Missing CSRF Protection on POST Routes**
**Location:** All API routes in `src/app/api/`

**Issue:** No CSRF token validation on state-changing operations.

**Risk:**
- Attacker could trigger checkout from external site
- Orders placed without user consent

**Recommendation:**
Add CSRF middleware or use SameSite cookies (Next.js default):
```typescript
// In middleware.ts, ensure SameSite is set:
// Next.js sets SameSite=Lax by default, but verify in production

// For POST endpoints, also consider adding:
const origin = req.headers.get('origin');
const host = req.headers.get('host');
if (origin && !origin.includes(host!)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

**Priority:** MEDIUM - Deploy in next security update

---

### 11. **Unhandled Promise Rejections**
**Location:** `src/app/api/process-checkout/route.ts` line 60

**Issue:** `resetPasswordForEmail` is awaited but errors are not caught.

**Risk:**
- If email sending fails, checkout completes anyway but user has no password reset link
- Silent failures in logs

**Recommendation:**
```typescript
// Send Welcome/Password set email
try {
  await supabaseAdmin.auth.resetPasswordForEmail(form.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/account`,
  });
} catch (emailError) {
  console.error('Failed to send welcome email:', emailError);
  // Decide: fail checkout or proceed? 
  // For now, log but don't fail checkout - customer will use password reset
}
```

**Priority:** MEDIUM - Better error handling

---

### 12. **Stale Cart Badge in BottomNavBar**
**Location:** `src/components/BottomNavBar.tsx` lines 41-48

**Issue:** Cart badge shows correct count, but if user navigates away and returns, badge may not update immediately if cart state changes.

**Risk:**
- Badge could be out-of-sync with actual cart contents for a brief moment
- Users might see incorrect item count

**Recommendation:**
Consider adding a visual pulse animation when cart updates or consider using optimistic updates:
```typescript
// Option 1: Add animation class when cart changes
const [showPulse, setShowPulse] = useState(false);

useEffect(() => {
  setShowPulse(true);
  const timer = setTimeout(() => setShowPulse(false), 600);
  return () => clearTimeout(timer);
}, [cart.length]);

// In JSX:
{item.badge !== undefined && item.badge > 0 && (
  <span className={`
    absolute -top-1 -right-1 
    bg-radiance-goldColor text-white text-xs font-bold 
    rounded-full w-5 h-5 flex items-center justify-center
    ${showPulse ? 'animate-pulse' : ''}
  `}>
    {item.badge}
  </span>
)}
```

**Priority:** COULD - Nice-to-have UX enhancement

---

## 🟢 COULD DO (Nice-to-Have Improvements)

### 13. **Optimistic Cart Updates**
**Location:** `src/hooks/useCart.ts` and `src/components/ProductCard.tsx`

**Suggestion:** Add visual feedback when adding items (toast notification).

**Example:**
```typescript
import { useToast } from '@/hooks/useToast'; // Create this hook

const { addToCart } = useCart();
const { toast } = useToast();

const handleAddToCart = (product: ProductRow) => {
  addToCart(product);
  toast({
    title: 'Added to cart',
    description: `${product.name} added successfully`,
    duration: 2000
  });
};
```

---

### 14. **Memoize ProductCard Component**
**Location:** `src/components/ProductCard.tsx`

**Suggestion:** Prevent re-renders when parent list updates:
```typescript
export const ProductCard = React.memo(function ProductCard({ product }: ProductCardProps) {
  // ... component body
}, (prev, next) => prev.product.id === next.product.id);
```

---

### 15. **Add Loading States on Checkout**
**Location:** Checkout page component

**Suggestion:** Show loading indicator while processing payment and creating order. Prevent double-submission.

---

### 16. **Type Safety for localStorage**
**Location:** `src/hooks/useCart.ts`

**Suggestion:** Create a type-safe storage utility:
```typescript
const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) as T : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(value) : value;
      setValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Failed to set localStorage:', error);
    }
  };

  return [value, setStoredValue] as const;
};
```

---

## WON'T DO (Intentional Decisions)

### 17. **Don't Store Sensitive Data in localStorage**
**Decision:** Correct - The app doesn't store passwords or payment details in localStorage.

---

### 17. **Don't Use JWT from Cookies Without Validation**
**Decision:** Correct - Supabase handles this automatically. ✅

---

### 19. **Reconsider: Single-Page File for All Supabase Clients**
**Decision:** Current approach of separate files (client.ts, server.ts, admin.ts) is GOOD. 

**Reasoning:** Separation of concerns makes it clear which client to use and prevents accidental exposure of service role keys. Keep as is. ✅

---

### 20. **Don't Remove TypeScript Strict Mode**
**Decision:** Recommended to KEEP strict mode enabled.

**tsconfig.json should have:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

**Reasoning:** Catches bugs at compile time, not runtime. ✅

---

## Summary Table

| Issue | Priority | Type | Impact | Est. Time |
|-------|----------|------|--------|-----------|
| Input validation | MUST | Security | High | 2 hours |
| Env validation | MUST | Stability | High | 1 hour |
| Email lookup optimization | MUST | Performance | Medium | 30 min |
| Payment mismatch check | MUST | Security | Critical | 1 hour |
| TopBar profile error handling | MUST | UX/Stability | Medium | 1 hour |
| Rate limiting | SHOULD | Security | High | 2 hours |
| BottomNavBar badge sync | SHOULD | UX | Low | 1 hour |
| Error message leaking | SHOULD | Security | Medium | 1 hour |
| Cart validation | SHOULD | Security | Medium | 1 hour |
| CSRF protection | SHOULD | Security | Medium | 1 hour |
| Promise handling | SHOULD | Stability | Low | 30 min |
| UX improvements | COULD | UX | Low | 3 hours |

---

## Deployment Checklist

- [ ] Implement input validation (zod schemas)
- [ ] Add environment variable validation on startup
- [ ] Fix email lookup to use getUserByEmail
- [ ] Add server-side total validation in checkout
- [ ] Deploy rate limiting (staging first)
- [ ] Sanitize error messages
- [ ] Add cart data validation
- [ ] Test CSRF protections
- [ ] Add email error handling
- [ ] Load test with production-like data

