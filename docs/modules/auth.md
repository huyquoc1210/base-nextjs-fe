# Module: auth

Quản lý phiên đăng nhập: đăng nhập, giữ phiên sống, đăng xuất, và quyết định ai
vào được route nào.

Code nằm rải nhiều thư mục vì luồng này đi qua ranh giới client/server vài lần.
Tài liệu này là chỗ duy nhất mô tả nó như một khối thống nhất.

| Phần việc | Nằm ở |
| --- | --- |
| Lưu token phía client | `src/lib/local-storage.ts` |
| Lưu token phía server | `src/lib/auth-cookie.ts` |
| Logic refresh | `src/lib/auth-refresh.ts` |
| Retry khi gặp 401 | `src/lib/http-client.ts` |
| Timer refresh chủ động | `src/components/refresh-token.tsx` |
| Route handler ghi cookie | `src/app/api/auth/*/route.ts` |
| Gọi backend | `src/apis/auth.ts` |
| Chặn route | `src/proxy.ts`, `src/constants/access.ts` |
| Trang | `src/app/[locale]/(auth)/*` |

## Vì sao có hai nơi lưu token

Phiên đăng nhập tồn tại ở **hai** chỗ cùng lúc, và chúng không thay thế nhau được:

- **Cookie httpOnly** — thứ duy nhất `proxy.ts` đọc được. Proxy chạy trên server
  trước khi bất kỳ trang nào render, và không thấy được `localStorage`.
- **localStorage** — thứ duy nhất `HttpClient` phía browser đọc được, để gắn
  `Authorization` vào request đi ra. Nó không đọc được cookie httpOnly.

Mọi quy tắc bên dưới về việc giữ hai nơi này đồng bộ đều ra đời vì chúng **đã
từng lệch nhau** và làm hỏng app. Xem mục **Ca biên**.

Browser không ghi được cookie httpOnly, nên **mọi** lần ghi token phía server
đều phải qua một Next.js route handler dưới `/api/auth/`. Route handler là nơi
duy nhất ghi cookie.

## Quy tắc nghiệp vụ

### AUTH-1 — Đăng nhập đi qua route handler, không gọi thẳng backend

`authApi.login()` post tới `/api/auth/login` với `baseUrl: ""`. Handler đó gọi
backend, ghi cả hai cookie, rồi trả envelope về. Hàm gọi sau đó ghi cả hai token
vào localStorage.

Gọi thẳng backend từ browser sẽ không set được cookie, và proxy sẽ coi người
dùng là chưa đăng nhập.

### AUTH-2 — Hạn cookie lấy từ token, không phải hằng số

`setAuthCookies` đọc `exp` trong từng token và dùng làm `expires` của cookie.
`exp` tính bằng **giây**, còn cookie API cần **mili giây**.

Hệ quả cần nhớ: cookie access token tự biến mất khi token hết hạn. Quy tắc
AUTH-7 dựa vào đúng điều này.

### AUTH-3 — Refresh token quyết định phiên có tồn tại hay không

`proxy.ts` coi một request là đã đăng nhập khi có **cookie refresh token**.
Access token được phép vắng mặt — nó hết hạn sớm hơn, và AUTH-7 lo ca đó.

### AUTH-4 — Refresh là single-flight

`refreshTokens()` giữ một promise đang bay ở cấp module. Nhiều nơi gọi cùng lúc
đều nhận chung promise đó, nên N nơi gọi chỉ sinh đúng **một**
`POST /api/auth/refresh-token`.

Có hai thứ độc lập gọi nó: interval 1 giây (AUTH-5) và đường retry 401 (AUTH-6).
Thiếu single-flight thì một loạt 401 song song sẽ mỗi cái bắn một refresh, và
tất cả trừ một cái đang xoay vòng một token vừa bị xoay rồi.

### AUTH-5 — Refresh chủ động, trước khi token hết hạn

`RefreshToken` chạy `checkAndRefreshToken()` một lần lúc mount, rồi lặp mỗi
`CHECK_INTERVAL_MS` (1000 ms).

Nó chỉ refresh khi access token **còn dưới một phần ba vòng đời**
(`REFRESH_AT_REMAINING_RATIO`). Tick mỗi giây **không** có nghĩa là refresh mỗi
giây.

Nó không làm gì ở `/login`, `/logout`, `/refresh-token`
(`UNAUTHENTICATED_PATHS`) — những trang đó không có phiên để giữ, và refresh ở
đó sẽ đá người dùng đi.

Khi thất bại, nó dừng interval ngay lập tức, xoá role, và chuyển về login. Một
refresh hỏng không được thử lại ở tick kế tiếp.

### AUTH-6 — Refresh bị động, làm lưới an toàn

Gặp 401, `HttpClient` refresh một lần rồi retry request gốc đúng **một** lần.
Có ba điều kiện chặn: chỉ chạy phía client, không phải đang là retry, và không
phải chính route refresh. Ba điều kiện này ngăn đệ quy vô hạn.

Nó phủ khoảng trống mà AUTH-5 bỏ lỡ — ví dụ token hết hạn trong lúc tab bị đẩy
xuống nền.

### AUTH-7 — Mất cookie access token thì đi qua trang refresh

Khi proxy thấy có cookie refresh token nhưng **không** có cookie access token
trên một route private, nó chuyển hướng tới
`/{locale}/refresh-token?refreshToken=…&redirect=<đường dẫn gốc>`.

Trang đó refresh phía client rồi đưa người dùng về `redirect`. Đây là ca "lâu
ngày quay lại": cookie tự hết hạn trong lúc không có gì chạy.

### AUTH-8 — Trang nhận token qua URL chỉ chấp nhận token của chính browser này

`/refresh-token` và `/logout` đều nhận token trong query string. Mỗi trang đối
chiếu với giá trị trong localStorage và từ chối khi khác nhau.

Không có bước này, một link giả có thể điều khiển refresh hoặc đăng xuất người
khác.

### AUTH-9 — Kết thúc phiên thì xoá cả hai nơi lưu

Bất cứ khi nào phiên kết thúc — đăng xuất chủ động, refresh thất bại, guard từ
chối — **cả** cookie **lẫn** localStorage đều bị xoá.

Vì vậy `/api/auth/refresh-token` gọi `clearAuthCookies()` trong `catch` trước
khi trả 401, và trang `/refresh-token` gọi `authApi.logout()` chứ không chỉ
chuyển hướng đi.

### AUTH-10 — Đăng xuất luôn thành công ở phía client

`/api/auth/logout` xoá cookie **trước**, rồi mới báo cho backend. Lỗi từ backend
bị nuốt: người dùng vẫn được đăng xuất.

Việc gọi backend chỉ cần **có refresh token**. Access token hết hạn không được
phép ngăn việc thu hồi phiên ở phía server.

### AUTH-11 — Route handler refresh trả 401 cho mọi loại lỗi

`/api/auth/refresh-token` trả 401 dù là thiếu refresh token, backend từ chối,
hay backend không gọi được. Client chỉ phải xử lý một trường hợp.

### AUTH-12 — Quyền truy cập được khai báo, không rải rác

`src/constants/access.ts` giữ ba danh sách: `PUBLIC_PATHS` (vào được khi chưa
đăng nhập), `AUTH_FLOW_PATHS` (miễn guard hoàn toàn, vì tự quản token của mình),
và `ROUTE_ROLES` (đường dẫn → role được phép, khớp đầu tiên thắng).

Đường dẫn không có trong `ROUTE_ROLES` thì mở cho mọi role đã đăng nhập. Proxy
decode refresh token để đọc role.

### AUTH-13 — Proxy decode nhưng không verify

`decodeToken` đọc payload mà không kiểm chữ ký. Proxy dùng nó chỉ để định tuyến.
**Tuyệt đối không** coi một claim đã decode là bằng chứng — backend kiểm lại mọi
request.

## Public API

```ts
// src/apis/auth.ts — thứ duy nhất code tính năng nên đụng tới
authApi.login(body: LoginBody): Promise<HttpResponse<AuthTokens>>
authApi.logout(): Promise<void>
authApi.syncTokens(tokens: AuthTokens): Promise<HttpResponse<AuthTokens>>

// chỉ dùng phía server, gọi từ route handler
authApi.serverLogin / serverLogout / serverRefresh

// src/queries/useAuth.ts — bọc React Query cho component
useLoginMutation()
useLogoutMutation()

// src/lib/auth-refresh.ts
refreshTokens(): Promise<AuthTokens | null>
checkAndRefreshToken(options?: { onSuccess?; onError?; force? }): Promise<void>

// src/lib/auth-cookie.ts — chỉ server
setAuthCookies(tokens: AuthTokens): Promise<void>
clearAuthCookies(): Promise<void>

// src/schemas/auth.ts
loginBodySchema, authTokensSchema, LoginBody, AuthTokens

// src/constants/auth.ts
TokenType, Role, RoleValues, AuthCookie
```

Thông báo lỗi trong `loginBodySchema` là **key của catalog**, không phải câu
(`"invalidEmail"` chứ không phải `"Email không hợp lệ"`). Component dịch chúng
qua namespace `ErrorMessage`. Lỗi 422 từ backend lại mang câu thật, nên
`translateError` trong login form chỉ dịch thứ nào catalog có.

## Ca biên

Mỗi ca dưới đây là một lỗi **đã thực sự xảy ra** trong module này, và được phát
hiện bằng cách chạy app chứ không phải đọc code.

### Hai nơi lưu lệch nhau

Xoá localStorage mà không xoá cookie khiến proxy tin là đã đăng nhập trong khi
client biết là chưa. Triệu chứng là vòng lặp chuyển hướng: login → index →
refresh-token → login.

AUTH-9 phủ ca này. Cách sửa luôn là xoá cả hai.

### Refresh thất bại nhưng cookie còn nguyên

`/api/auth/refresh-token` từng trả 401 mà không xoá cookie. Client xoá
localStorage rồi về login; proxy thấy cookie và đá ngược lại ngay. Người dùng
không vào nổi trang login.

### Đăng xuất bị bỏ qua khi access token đã hết hạn

Điều kiện cũ là `if (accessToken && refreshToken)`. Cookie access token hết hạn
thì bước gọi backend bị bỏ, nên refresh token không bao giờ bị thu hồi phía
server — nó còn hiệu lực cho tới khi tự hết hạn.

AUTH-10 phủ ca này.

### Token hỏng trong localStorage

`decodeToken` ném lỗi với bất cứ thứ gì không phải JWT. `checkAndRefreshToken`
bọc cả hai lần decode trong try/catch và coi lỗi là "không có phiên": xoá rồi
báo. Thiếu nó, một giá trị hỏng trong storage làm sập effect của interval.

### 204 và body rỗng

`HttpClient` trả `data: null` cho 204 thay vì ném lỗi. Gọi `res.json()` trần
trên body rỗng sẽ ném, và nó sẽ hiện ra như một lỗi mạng.

### Ghi storage không qua service

`LocalStorage.set` chạy `JSON.stringify`, còn `get` chạy `JSON.parse`. Giá trị
ghi bằng `localStorage.setItem` trần làm `get` ném lỗi và rơi về giá trị mặc
định. Mọi lần ghi phải đi qua service.

## Kiểm tra khi sửa module này

```
pnpm test                  # 60 test, phần lớn là logic auth
npx tsc --noEmit
npx eslint src
pnpm build                 # bắt lỗi prerender / cacheComponents
```

Unit test phủ trực tiếp các quy tắc trên:
`src/lib/auth-refresh.test.ts` (AUTH-4, AUTH-5),
`src/lib/http-client.test.ts` (AUTH-6),
`src/app/[locale]/(auth)/logout/logout.test.tsx` (AUTH-8, AUTH-10),
`src/components/refresh-token.test.tsx` (AUTH-5).

Chỉ test thôi là **không đủ** cho module này. Cả ba lỗi liệt kê ở mục **Ca
biên** đều từng qua được type checker và bộ test có mặt lúc đó. Phải chạy luồng
thật trên trình duyệt với backend giả: đăng nhập, để tab nằm im quá vòng đời
access token, quay lại, rồi đăng xuất.
