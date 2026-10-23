# TypeScript

## Any

Declare types explicitly from the start. Avoid **any** wherever possible.

## Event

**Never write an event handler inline in JSX.** Declare the function above and reference it below.

Types for common events live in `@/types/react`:

```tsx
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { ChangeEvent } from "@/types/react"; // ✅✅✅

const Field = () => {
  const [value, setValue] = useState<string>("");

  const handleChange: ChangeEvent = (event) => {
    setValue(event.target.value);
  };

  return <Input value={value} onChange={handleChange} name="name" />;
};

export default Field;
```

Give handlers an explicit body. Avoid implicit returns unless the return value is the point:

```tsx
// Use ✅✅✅
const handleChange: ChangeEvent = (event) => {
  setValue(event.target.value);
};

// Instead of
const handleChange: ChangeEvent = (event) =>
  setValue(event.target.value); ❌❌❌
```

> This applies to every other arrow function too.
