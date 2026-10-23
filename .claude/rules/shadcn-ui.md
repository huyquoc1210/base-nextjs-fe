# shadcn/ui

## Import

Always import from `components/ui` through the `@/` alias, never a relative path:

```tsx
// Use
import { Button } from "@/components/ui/button"; ✅✅✅

// Instead of
import { Button } from "../../components/ui/button"; ❌❌❌
```

Use the `type` modifier when importing **types** and **interfaces**:

```tsx
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react"; ✅✅✅

interface Props extends ComponentProps<typeof Button> {
  // ...
}

const EnhancedButton = (props: Props) => {
  const { children, ...rest } = props;

  const handleClick = () => {
    // ...
  };

  return (
    <Button onClick={handleClick} {...rest}>
      {children}
    </Button>
  );
};

export default EnhancedButton;
```

## Adding and editing components

- Add components with the CLI, never by copy-pasting: `npx shadcn@latest add button`.
- shadcn/ui code lives in the project source. Edit `components/ui/*` directly when changing a **variant** or a style that applies app-wide.
- Do not edit `components/ui/*` for a single use case. Wrap it in a new component instead (like `EnhancedButton` above), or pass `className`.

## HTML elements

Use semantic HTML elements directly (`div`, `section`, `span`, `h1`...) with `className`. No wrapper component such as `Box`:

```tsx
const Component = () => {
  return <span className="text-sm">This is a span</span>;
};

export default Component;
```

Pick the element that matches the meaning (`header`, `main`, `nav`, `section`, `button`, `ul`...) rather than reaching for `div` every time.

## Container

Build containers with `mx-auto`, a `max-w-*` and horizontal padding, where `max-w-[1200px]` means **1200px**:

```tsx
import type { FCC } from "@/types/react";

const Layout: FCC = (props) => {
  const { children } = props;

  return <div className="mx-auto w-full max-w-[1200px] px-4">{children}</div>;
};

export default Layout;
```

If the project standardises on Tailwind's `container` class, configure `center`, `padding` and `screens` in the theme once and then only use `className="container"`.

See also:

- [Container](https://tailwindcss.com/docs/container)
- [Breakpoints](https://tailwindcss.com/docs/responsive-design)

## Typography

shadcn/ui has no Typography component. Use semantic elements with Tailwind's **built-in type scale** (`text-sm`, `text-base`, `text-lg`, `text-xl`...), never arbitrary values like `text-[17px]`:

```tsx
<h6 className="text-base font-semibold">Heading 6</h6>
```

Use `mb-*` when a heading needs space below it.

Extract repeated heading/paragraph styles into their own component (for example `components/ui/typography.tsx`) so they stay consistent across the project.

See also:

- [Typography (shadcn/ui)](https://ui.shadcn.com/docs/components/typography)
- [Font size](https://tailwindcss.com/docs/font-size)
- [Font weight](https://tailwindcss.com/docs/font-weight)

## Styles

Prefer **className** (Tailwind). Use **cn()** from `@/lib/utils` when combining conditional classes or allowing overrides from outside. Use **cva** when a component has several variants (variant, size...). Avoid `style={{}}` unless the value is dynamic and cannot be expressed as a class.

```tsx
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

// Plain className ⚡
const Component = () => {
  return <div className="h-full w-full bg-background text-foreground" />;
};

// Conditional: use cn()
const Component = ({ active }: { active: boolean }) => {
  return (
    <div
      className={cn(
        "h-full w-full text-muted-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    />
  );
};

// Allow overriding className from the outside
interface Props {
  className?: string;
}

const Component = (props: Props) => {
  const { className } = props;

  return <div className={cn("h-full w-full", className)} />;
};

// Multiple variants: use cva
const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string;
}
```

**Colors**: always use the theme's **semantic tokens** (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, `text-destructive`...). Never hardcode colors like `bg-blue-500` or `text-[#333]`. This keeps dark mode and theme changes to CSS variables in `globals.css`.

**Class order**: let `prettier-plugin-tailwindcss` sort classes. Do not order them by hand.

**cn()**: put default classes first and the `className` coming from props last, so it can override.

For **padding**, **margin** and **gap**, use Tailwind's spacing scale (1 unit = 4px), not arbitrary values:

```tsx
// Use ✅✅✅
const Component = () => {
  return <div className="h-full w-full p-6" />; // 24px
};

// Instead of
const Component = () => {
  return <div className="h-full w-full p-[24px]" />; ❌❌❌
};
```

See also:

- [Tailwind CSS](https://tailwindcss.com/docs)
- [cva](https://cva.style/docs)
- [Theming (shadcn/ui)](https://ui.shadcn.com/docs/theming)
- [Spacing](https://tailwindcss.com/docs/padding)

## Styling by state

`components/ui` is built on **Base UI**, which exposes each state as its own
boolean `data-*` attribute — `data-checked`, `data-unchecked`, `data-open`,
`data-closed`, `data-disabled`. It does **not** use Radix's
`data-state="checked"` form. Writing `data-[state=checked]:` produces a class
that silently never matches.

```tsx
import { Checkbox } from "@/components/ui/checkbox";

const Component = () => {
  return (
    <Checkbox className="data-checked:border-primary data-checked:bg-primary" />
  );
};

export default Component;
```

The authoritative list for the installed version is the `*DataAttributes.d.ts`
files inside `@base-ui/react` — for example
`node_modules/@base-ui/react/checkbox/root/CheckboxRootDataAttributes.d.ts`.
Check there rather than writing from memory.

Variants you will reach for:

- Base UI state: `data-checked:`, `data-unchecked:`, `data-open:`, `data-closed:`, `data-disabled:`.
- ARIA, which `button.tsx` actually uses: `aria-expanded:`, `aria-invalid:`.
- Standard state: `hover:`, `focus-visible:`, `disabled:`.
- Child elements: `[&_svg]:size-4`, `[&>span]:text-sm`.
- Parent/sibling: `group` + `group-hover:`, `peer` + `peer-disabled:`.

**When to use this, and what to watch for:**

- `className` normally lands on the component's **root**. Only reach for `[&_...]` variants when styling something inside (an icon, a nested label) — or better, pass `className` to the matching child component (`DialogContent`, `SelectItem`).
- Prefer passing `className` to the right child over deeply nested selectors.
- Avoid `!important` (`!p-0`). If a style is overridden in the wrong order, check that `cn()` is being used — it has `tailwind-merge` built in.

See also:

- [Variants (Tailwind)](https://tailwindcss.com/docs/hover-focus-and-other-states)

## Composition

To change the element a component renders (turning a `Button` into an `a`/`Link`, say), pass the element through **render** instead of nesting. `components/ui` is built on Base UI, which has no `asChild` — writing it does not compile:

```tsx
import Paths from "@/constants/paths";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const Component = () => {
  return <Button render={<Link href={Paths.index} />}>Back to home</Button>;
};

export default Component;
```

The children stay on the outer component; the element in `render` only supplies the tag and its props.
