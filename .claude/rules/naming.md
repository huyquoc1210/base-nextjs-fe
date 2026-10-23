# Naming

## General principles

- A name states the **meaning and purpose** of a value, not its data type or how it is stored.
- Reading the name is enough. The reader should not need the surrounding code.
- Name after the **domain**, not the mechanics.
- Write names in **English**. No unaccented Vietnamese (`danhSach`, `tongTien`).
- No cryptic abbreviations. Stick to the common ones listed below.
- A slightly longer name that is clear beats a short one the reader has to guess at.

```ts
// Use ✅✅✅
const activeUsers = users.filter((user) => user.isActive);
const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

// Instead of
const list2 = arr.filter((x) => x.a); ❌❌❌
const t = items.reduce((s, i) => s + i.p, 0); ❌❌❌
```

## Casing

| Thing                              | Casing             | Example                             |
| ---------------------------------- | ------------------ | ----------------------------------- |
| Variables, functions, parameters   | `camelCase`        | `userName`, `getUser`               |
| Components, types, interfaces      | `PascalCase`       | `UserCard`, `UserResponse`          |
| Fixed constants (never reassigned) | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE`, `API_URL`          |
| Custom hooks                       | `useCamelCase`     | `useDebounce`, `useAuth`            |
| Files and folders                  | `kebab-case`       | `user-card.tsx`, `local-storage.ts` |
| Custom hook files                  | `useCamelCase`     | `useAuth.ts`, `useDebounce.ts`      |

> `UPPER_SNAKE_CASE` is for fixed module-level values only. An ordinary `const` inside a function stays `camelCase`.

## Booleans

Prefix with `is`, `has`, `can` or `should` so the name reads as a yes/no question:

```ts
const isLoading = true;
const hasPermission = false;
const canEdit = user.role === "admin";
const shouldRefetch = isStale && isOnline;
```

- Name them **positively**. A negated name reads backwards at the call site:

```ts
// Use ✅✅✅
const isValid = true;
if (!isValid) {
  // ...
}

// Instead of
const isNotValid = false; ❌❌❌
if (!isNotValid) {
  // ...
}
```

- Do not use vague names like `flag`, `status` or `check` for a boolean.

## Functions

Use **verb + noun**, so the name says both the action and what it acts on:

```ts
const getUserById = (id: string) => {};
const calculateTotalPrice = (items: Item[]) => {};
const validateEmail = (email: string) => {};
const formatCurrency = (amount: number) => {};
```

Verbs worth standardising on:

| Verb                         | Meaning                                   |
| ---------------------------- | ----------------------------------------- |
| `get`                        | Return something already available, cheap |
| `fetch`                      | Call an API, get data from outside        |
| `create`, `update`, `delete` | Mutate data                               |
| `format`, `parse`            | Convert to/from a string                  |
| `to` (e.g. `toSlug`)         | Convert between types                     |
| `validate`                   | Check validity                            |
| `handle`, `on`               | Event handlers (see the React rules)      |

- A function returning a boolean is named like a boolean: `isEmail()`, `hasAccess()`.
- Avoid vague names like `doSomething`, `process`, `handleData`, `run`.

## Arrays, objects and maps

- Collections take a **plural noun**; a single element is singular:

```ts
const users: User[] = [];
const selectedUser = users[0];
```

- Name a Map or Record `xByY` so the lookup key is obvious:

```ts
const userById: Record<string, User> = {};
const orderCountByStatus: Record<OrderStatus, number> = {};
```

- Name the loop variable after the element. Avoid `item`, `x`, `e` when something clearer fits:

```ts
// Use ✅✅✅
users.map((user) => user.name);
orders.filter((order) => order.isPaid);

// Instead of
users.map((x) => x.name); ❌❌❌
```

- `i` and `j` are only for very short `for` loops. An index used anywhere else gets a real name: `rowIndex`, `columnIndex`.

## Quantities and units

When a value is a measurement, put the **unit** in the name:

```ts
const timeoutMs = 3000;
const widthPx = 240;
const priceVnd = 150000;
const maxFileSizeMb = 5;
```

For quantities, use `count`, `total`, `index`, `limit` and `offset` with their real meaning:

```ts
const unreadCount = notifications.filter((n) => !n.isRead).length;
const totalPages = Math.ceil(totalItems / pageSize);
```

## State and setters

Name the pair `[value, setValue]`:

```tsx
const [isOpen, setIsOpen] = useState<boolean>(false);
const [selectedUser, setSelectedUser] = useState<User | null>(null);
const [searchKeyword, setSearchKeyword] = useState<string>("");
```

State names describe **the data they hold**, not how they are used (`isOpen` not `toggle`, `searchKeyword` not `inputValue2`).

## Types, interfaces, props

- No `I` or `T` prefix on interfaces and types (`User`, not `IUser`).
- A component's props are named `Props` (or `[Component]Props` when exported):

```tsx
interface Props {
  title: string;
  onClose: () => void;
}
```

- Name a type after its role, showing where it comes from or what it is for:

```ts
type UserResponse = {}; // what the API returns
type CreateUserPayload = {}; // what gets sent when creating a user
type UserFormValues = {}; // the form's values
```

- Generic parameters are a short capital when generic (`T`), or descriptive when there are several (`TData`, `TError`).
- Prefer a **union type** over `enum` (as in `StorageKey`):

```ts
type OrderStatus = "pending" | "paid" | "cancelled";
```

## Components and files

- Components get a **noun describing their role**: `UserCard`, `PricingSection`, `LoginForm`.
- Files are `kebab-case` after the component: `UserCard` → `user-card.tsx`.
- A file whose main export is a **custom hook** is named after the hook instead, so the import path reads like the hook: `useAuth` → `queries/useAuth.ts`, not `queries/use-auth.ts`.
- Context comes as a trio: `ThemeContext`, `ThemeProvider`, `useTheme`.
- Avoid vague names like `Wrapper`, `Container2`, `Common`, `Helper` when they say nothing about the role.

## Abbreviations

Only use abbreviations everyone already knows:

`id`, `url`, `api`, `ui`, `db`, `min`, `max`, `ref`, `props`, `params`, `req`, `res`, `env`, `ctx`

Spell out everything else:

```ts
// Use ✅✅✅
const userManager = ...;
const configuration = ...;

// Instead of
const usrMgr = ...; ❌❌❌
const cfg = ...; ❌❌❌
```

Inside camelCase, treat an abbreviation as one word and capitalise only its first letter: `userId`, `apiUrl`, `parseHtml` (not `userID`, `parseHTML`).

## Consistent vocabulary

Each concept gets **one word** across the whole project:

- Reading data: pick `get` (or `fetch` for API calls). Do not mix in `retrieve`, `load`, `obtain`.
- Removing data: pick `delete` or `remove`, not both.
- If it is a `user`, it stays a `user` — not `member`, `account` or `customer` elsewhere for the same thing.

## Names to avoid

Do not use these unless the context makes them unambiguous:

- Vague: `data`, `info`, `item`, `list`, `value`, `result`, `temp`, `obj`, `arr`, `res` (for anything that is not an HTTP response).
- Numbered: `user1`, `user2`, `data2`, `newData`, `finalResult`.
- Type-named: `userArray`, `nameString`, `isLoadingBoolean`.

```ts
// Use ✅✅✅
const unpaidOrders = orders.filter((order) => !order.isPaid);
const { data: userProfile } = useQuery(...);

// Instead of
const data = orders.filter((x) => !x.isPaid); ❌❌❌
const { data } = useQuery(...); // fine when the context is clear and there is only one query
```

## Length follows scope

- Small scope (a few lines in a short callback) can take a short name if it stays clear: `users.map((user) => user.id)`.
- Large scope (exported, used across files, module-level) needs the full, explicit name.
