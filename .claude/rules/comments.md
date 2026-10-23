# Comments

## General principles

- **The default is no comment.** Only comment code that is genuinely hard to follow, and only say **why** — the code says **what**.
- Reach for a clear name or a smaller function first. A comment is the last resort, not a patch over unreadable code.
- Write comments in **English**, everywhere.
- **No JSDoc** (`/** */`, `@param`, `@returns`, `@example`). TypeScript already describes the signature; the function and parameter names must carry the rest.
- Structure a file with `#region`, not with descriptive comments.
- Update or delete a comment when the code changes. A wrong comment is worse than none.

## 1. Regions in a component (#region)

This is the **main** kind of comment in the project. Use `// #region` / `// #endregion` to group logic inside a component (VS Code can fold them):

```tsx
const Checkout = () => {
  // #region State
  const [step, setStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  // #endregion

  // #region Handlers
  const handleNext = () => {
    setStep((step) => step + 1);
  };
  // #endregion

  // #region Effects
  useEffect(() => {
    // ...
  }, []);
  // #endregion

  return <div>{step}</div>;
};

export default Checkout;
```

Rules:

- Region names are fixed and come in this order: `State` → `Queries` → `Derived` → `Handlers` → `Effects`.
- Always close with `#endregion`, and leave a blank line between regions.
- Never wrap the `return` JSX in a region.
- Add regions as soon as a component has at least two non-empty groups. A component with nothing but a `return` does not need them.
- Needing too many regions (around 5-6 groups) means it should become a custom hook or a child component.

## 2. Sections in TSX

For a page with several sections, prefer splitting into components (`HeroSection`, `PricingSection`, ...). If a section is short and stays in the same file, put a comment above it with the name only:

```tsx
return (
  <main>
    {/* Hero */}
    <section className="py-24">...</section>

    {/* Features */}
    <section className="py-24">...</section>
  </main>
);
```

```tsx
{/* Hero */} ✅✅✅

{/* This is the hero section of the page */} ❌❌❌
```

## 3. Explaining why

Only for a workaround, surprising behaviour or a non-obvious technical decision:

```ts
// Safari has no lookbehind support, match forward instead
const pattern = /(\d+)(?=px)/;

// Wait for the dialog close animation before resetting, otherwise
// the user sees the fields blank out mid-transition
setTimeout(reset, 300);
```

```ts
// Increase count by 1 ❌❌❌
setCount((count) => count + 1);
```

## 4. Note tags (TODO, FIXME, NOTE, HACK)

One shared set of tags, so they can be searched project-wide:

```ts
// TODO: Add pagination once the API supports it
// FIXME: Off-by-one timezone bug for users at UTC-12
// NOTE: Middleware order changes the result
// HACK: Cast until the library exports this type
```

| Tag     | Meaning                                     |
| ------- | ------------------------------------------- |
| `TODO`  | Work for later, an unfinished feature       |
| `FIXME` | A known bug that needs fixing               |
| `NOTE`  | Something to know before reading or editing |
| `HACK`  | A temporary solution, not the right one yet |

- Attach a ticket when there is one: `// TODO(#123): ...`.
- `TODO` and `FIXME` are not permanent. If one has to stay, open a ticket.

## 5. Comments on directives (eslint, TypeScript)

When disabling a rule or suppressing an error, always give the reason and use the narrowest scope:

```ts
// eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
useEffect(() => {
  init();
}, []);

// @ts-expect-error: library has no type for this prop yet
<Chart legendPosition="top" />
```

- Use `@ts-expect-error` over `@ts-ignore` — it errors once the suppression is no longer needed.
- No file-wide `/* eslint-disable */`, except in generated files.

## 6. Comments on opaque values (magic numbers, regexes, formulas)

```ts
// Matches the server-side cache TTL
const STALE_TIME = 5 * 60 * 1000;

// Vietnamese phone numbers: 10 digits starting with 0
const PHONE_REGEX = /^0\d{9}$/;
```

If the value is used in several places, give it a well-named constant rather than a comment.

## 7. Server/Client boundary (Next.js)

Say why a file is `'use client'` or `'use server'`, so nobody removes it by mistake:

```tsx
"use client"; // useState and onClick

import { useState } from "react";
```

```ts
import "server-only"; // keep this out of Client Components
```

## 8. Comments in tests

Mark **Arrange / Act / Assert** in longer tests:

```ts
it("shows an error for an invalid email", async () => {
  // Arrange
  render(<LoginForm />);

  // Act
  await user.type(screen.getByLabelText("Email"), "abc");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  // Assert
  expect(screen.getByText("Invalid email")).toBeInTheDocument();
});
```

## 9. What not to do

```ts
// JSDoc ❌❌❌
/**
 * Formats an amount as VND.
 * @param amount The amount
 */
export const formatCurrency = (amount: number) => {};

// Comments in any language other than English ❌❌❌
const users = await getUsers();

// Restating the code ❌❌❌
// Call the API to get users
const users = await getUsers();

// Commented-out code left behind ❌❌❌
// const oldValue = calculate(a, b);

// Long decorative banners ❌❌❌
// ================ HEADER ================

// A comment that no longer matches the code ❌❌❌
// Returns true if admin
const canEdit = user.role === "editor";
```

- No JSDoc, not even on shared exports.
- No per-field comments on an `interface` or `type` — name the field well instead.
- No commented-out code in the repo; git already keeps it.
- No long decorative banners. Use `#region` or split the file.
- No comment written just to have one when the name already says it.
