# AMS Client

Base codebase cho frontend: **Next.js 16** (App Router, Turbopack) · **React 19** ·
**TypeScript** · **Tailwind 4** + **shadcn/ui** · **next-intl** · **TanStack Query** ·
**Zustand** · **Vitest**.

Tài liệu này giải thích **mỗi thư mục dùng để làm gì** và **muốn sửa một thứ thì
vào đâu**. Dành cho người mới vào dự án.

## Bắt đầu

Cần **Node 22+** và **pnpm 11+**.

```bash
pnpm install
cp .env.example .env     # nếu chưa có .env
pnpm dev                 # http://localhost:3000
```

`.env` bắt buộc có hai biến dưới. Thiếu là app **throw ngay lúc khởi động** —
`src/config.ts` validate bằng Zod, cố tình fail sớm thay vì để lỗi rải rác lúc
gọi API:

```
NEXT_PUBLIC_URL = http://localhost:3000
NEXT_PUBLIC_API_ENDPOINT = http://localhost:4000
```

Mở `/` sẽ bị chuyển về `/vi/login` — mọi route đều cần đăng nhập trừ trang auth.

## Lệnh

| Lệnh               | Việc                                                       |
| ------------------ | ---------------------------------------------------------- |
| `pnpm dev`         | Chạy dev server                                            |
| `pnpm build`       | Build production. Bắt cả lỗi prerender mà `tsc` không thấy |
| `pnpm test`        | Chạy unit test (vitest, jsdom)                             |
| `pnpm test:watch`  | Test ở chế độ watch                                        |
| `pnpm lint`        | ESLint                                                     |
| `pnpm format`      | Prettier toàn repo                                         |
| `pnpm storybook`   | Storybook ở cổng 6006                                      |
| `npx tsc --noEmit` | Typecheck. Dự án không có script riêng cho việc này        |

## Muốn sửa gì thì vào đâu

| Muốn…                                               | Vào                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| Thêm một trang mới                                  | `src/app/[locale]/`                                                  |
| Thêm một API nội bộ (ghi cookie, proxy tới backend) | `src/app/api/`                                                       |
| Gọi API backend                                     | `src/apis/`                                                          |
| Thêm đường dẫn mới                                  | `src/constants/paths.ts` — **không** viết chuỗi đường dẫn trong code |
| Đổi endpoint backend                                | `src/constants/endpoints.ts`                                         |
| Thêm/sửa chữ hiển thị                               | `messages/en.json` **và** `messages/vi.json`                         |
| Thêm component dùng chung                           | `src/components/`                                                    |
| Thêm component shadcn                               | `npx shadcn@latest add <tên>` → tự vào `src/components/ui/`          |
| Thêm hook gọi API                                   | `src/queries/`                                                       |
| Thêm validate form                                  | `src/schemas/`                                                       |
| Đổi quyền truy cập route                            | `src/constants/access.ts`                                            |
| Viết test                                           | file `*.test.ts(x)` đặt **cạnh** file được test                      |

## Cấu trúc `src/`

### `app/` — route

Chia hai nhánh tách biệt:

```
app/
  [locale]/          trang người dùng thấy, URL có tiền tố /vi hoặc /en
    (auth)/          login, logout, refresh-token
    manage/          khu vực sau đăng nhập
  api/               route handler của Next.js, KHÔNG có tiền tố locale
```

`(auth)` là **route group** — dấu ngoặc nghĩa là nó **không xuất hiện trong
URL**. File ở `(auth)/login/page.tsx` cho ra `/vi/login`, không phải
`/vi/auth/login`. Nhóm này tồn tại để ba trang auth dùng chung một `layout.tsx`.

`api/` là nơi **duy nhất** được ghi cookie httpOnly. Browser không ghi được
cookie loại này, nên mọi thao tác lưu token phía server đều đi qua đây.

### `apis/` — tầng gọi backend

Mỗi file một domain. Component **không** gọi `HttpClient` trực tiếp mà gọi qua
đây, để chỗ nào gọi API đều tra được ở một nơi.

### `lib/` — hạ tầng

Phần lõi, hiếm khi sửa nhưng nên biết có gì:

| File               | Việc                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `http-client.ts`   | Gọi HTTP. Tự gắn token, tự refresh khi gặp 401, bọc lỗi mạng               |
| `http-error.ts`    | `HttpError`, `EntityError` — bắt lỗi 422 theo từng field                   |
| `auth-refresh.ts`  | Logic refresh token, chống gọi trùng                                       |
| `auth-cookie.ts`   | Ghi/xoá cookie httpOnly (chỉ chạy phía server)                             |
| `local-storage.ts` | Đọc/ghi localStorage. **Luôn** dùng file này, đừng gọi `localStorage` trần |
| `jwt.ts`           | Decode token. Decode thôi, **không** verify chữ ký                         |
| `form.ts`          | Map lỗi API vào form                                                       |

### `components/`

`components/ui/` do **shadcn CLI sinh ra**. Thêm bằng lệnh, đừng copy tay. Cần
đổi style dùng chung cho cả app thì sửa thẳng trong đó; cần đổi cho **một** chỗ
thì bọc lại thành component mới hoặc truyền `className`.

Component còn lại nằm thẳng trong `components/`.

### `constants/`

`paths.ts` (đường dẫn), `endpoints.ts` (endpoint backend), `auth.ts` (role, tên
cookie), `access.ts` (route nào cần quyền gì), `http.ts` (status, timeout).

Gom vào đây để đổi một chỗ là xong. Khi một route đổi đường dẫn, chỉ cần sửa
`paths.ts` — proxy, sitemap và các link tự khớp theo.

### `i18n/` và `messages/`

`i18n/routing.ts` khai các locale, `request.ts` nạp catalog, `navigation.ts`
export `Link` và `useRouter` có kèm locale.

Chữ hiển thị nằm ở `messages/en.json` và `messages/vi.json`. **Hai file phải có
cùng bộ key** — có test tự kiểm điều này.

Dùng `useTranslations("Namespace")` trong client component,
`getTranslations({ locale, namespace })` trong server component.

> Server component phải truyền `locale` tường minh. Dự án bật `cacheComponents`,
> nên đọc locale từ request state sẽ chặn prerender và làm **fail build**.

### `queries/`, `schemas/`, `types/`, `test/`

- `queries/` — hook TanStack Query. File đặt theo tên hook: `useAuth.ts`.
- `schemas/` — Zod schema. Thông báo lỗi là **key** của i18n, không phải câu.
- `types/` — type dùng chung.
- `test/` — helper. `render.tsx` bọc sẵn i18n provider cho component test.

### `proxy.ts`

Chạy **trước mọi request**. Lo định tuyến locale, chặn route chưa đăng nhập, và
kiểm quyền theo role.

Từ Next.js 16 middleware đổi tên thành **proxy** — file là `proxy.ts`, không
phải `middleware.ts`.

## Ngoài `src/`

| Thư mục         | Nội dung                                                 |
| --------------- | -------------------------------------------------------- |
| `docs/modules/` | SPEC từng module: quy tắc nghiệp vụ, public API, ca biên |
| `.claude/`      | Hạ tầng cho AI agent (xem dưới)                          |
| `ralph/`        | Vòng lặp chạy tự động theo `prd.json`                    |
| `messages/`     | Catalog i18n                                             |
| `public/`       | File tĩnh                                                |

## `.claude/` — hạ tầng agent

Phần làm cho base codebase này chạy tốt với AI agent:

| Thư mục         | Nội dung                                                              |
| --------------- | --------------------------------------------------------------------- |
| `rules/`        | Quy ước code: naming, comment, React, TypeScript, shadcn              |
| `skills/`       | Kho skill agent gọi được                                              |
| `agents/`       | Agent chuyên trách: `lead`, `research`, `coder`, `tester`, `reviewer` |
| `hooks/`        | Script chạy tự động khi agent sửa file                                |
| `commands/`     | Slash command                                                         |
| `settings.json` | Quyền và cấu hình hook                                                |

Ba hook đáng biết vì chúng ảnh hưởng tới cả người lẫn agent:

- **trước khi ghi file** — chặn `.env`, `pnpm-lock.yaml`, `.next/`, `node_modules/`
- **sau khi ghi file** — tự chạy Prettier cho đúng file đó
- **cuối mỗi lượt** — chạy `tsc` → `eslint` → `build`, đỏ thì chặn

## Quy ước code

Chi tiết trong `.claude/rules/`. Những điểm hay vấp:

- Component là **arrow function**, `export default` ở **cuối file**.
- **Không** destructure props trong tham số — nhận `props` rồi destructure ở đầu hàm.
- Handler trong component đặt tên `handleX`; truyền qua props thì `onX`.
- Dùng `#region` chia nhóm trong component, thứ tự `State → Queries → Derived → Handlers → Effects`.
- Comment viết **tiếng Anh**, tối thiểu, **không JSDoc**.
- File đặt `kebab-case`, trừ file export chính là hook thì lấy tên hook (`useAuth.ts`).

## Trước khi tạo PR

```bash
npx tsc --noEmit && npx eslint src && pnpm test && pnpm build
```

Riêng phần auth, test không đủ. Ba lỗi thật từng lọt qua cả typecheck lẫn test —
xem mục "Ca biên" trong `docs/modules/auth.md`. Đụng vào auth thì phải chạy thử
luồng đăng nhập trên trình duyệt.

# base-nextjs-fe
