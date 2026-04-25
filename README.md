# NestJS Auth + Google + JWT + Multi-Tenant + Admin Backend

Bu proje, **NestJS + PostgreSQL + TypeORM** tabanlı, mobil (Expo) ve web admin paneli ile birlikte çalışacak şekilde kurgulanmış bir backend API'dir.

> Not: Expo/React Native istemci kodu bu repoda **yoktur**. Bu repo yalnızca backend API'yi içerir.

---

## 1) Ana Özellikler

- Email/şifre ile kayıt, giriş, şifre sıfırlama, şifre değiştirme
- Google OAuth2 ile giriş/kayıt
- JWT access token + device-bound refresh token rotation
- Role/permission tabanlı yetkilendirme (RBAC)
- Admin kullanıcı/rol/yetki yönetimi
- Audit log interceptor
- Captcha + failed login lockout
- TipBox oturum/katılımcı/dağıtım akışları
- Multi-tenant foundation:
  - `Company -> Branch -> Team -> Membership`
  - branch context (`x-branch-id`) ve tenant guard
- Billing ve plan bazlı feature gating:
  - `FREE / STARTER / PRO / ENTERPRISE`
  - quota ve feature kontrolü
- Workforce foundation:
  - shift template
  - weekly schedule
  - shift assignment
- Admin panel için dashboard özet endpoint'i

---

## 2) Teknoloji Yığını

- NestJS 11
- TypeORM 0.3.x
- PostgreSQL
- Passport (local/jwt/google)
- Swagger/OpenAPI
- Jest + ts-jest
- ESLint + Prettier

---

## 3) Ortam Değişkenleri (.env)

```env
DB_HOST=your-database-host
DB_PORT=5432
DB_USERNAME=your-database-username
DB_PASSWORD=your-database-password
DB_DATABASE=your-database-name
DB_DROP_SCHEMA=false

JWT_SECRET=your-jwt-secret-key

EMAIL_HOST=your-email-smtp-host
EMAIL_PORT=your-email-smtp-port
EMAIL_USER=your-email-username
EMAIL_PASS=your-email-password
APP_URL=your-application-url

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=your-google-callback-url

SECRET_KEY=your-session-secret
```

### Header Gereksinimleri

- `Authorization: Bearer <access_token>`
- `x-device-id` → login/refresh akışında zorunlu
- `x-branch-id` → tenant-scope endpoint'lerde zorunlu

---

## 4) Kurulum ve Çalıştırma

```bash
npm install
npm run start:dev
```

Swagger dokümantasyonu uygulama açıldıktan sonra `/api` altında erişilebilir.

Global API prefix: `/v1`

---

## 5) Modül Özeti

### Auth Modülü
- Register/login
- Google auth redirect akışı
- Password reset / change password
- Refresh token rotation (tek kullanımlık)
- `POST /v1/auth/logout-all` ile tüm cihazlardan oturum sonlandırma

### Users Modülü
- Kullanıcı temel CRUD/okuma işlemleri

### Admin Modülleri
- `admin/users` → kullanıcı yönetimi
- `admin/roles` → rol yönetimi
- `permissions` → yetki yönetimi
- `admin/dashboard/summary` → admin panel metrik özeti

### Tenancy Modülü
- Company, Branch, Team, Membership domain altyapısı
- Aktif branch context çözümleme

### Billing Modülü
- Plan kodları ve plan-feature matrisi
- Subscription yönetimi
- Quota enforcement
- `@RequiresFeature(...)` + `RequiresFeatureGuard`

### Workforce Modülü
- Vardiya şablonları
- Haftalık plan
- Atama modeli

### TipBox Modülleri
- Tip session/entry/distribution akışları
- Branch/team bağlamı zorunluluğu

---

## 6) Admin Panel Backend Sözleşmesi

Admin web paneli için hazır endpoint grupları:

- `GET /v1/admin/dashboard/summary`
  - kullanıcı/rol/yetki/tenant/abonelik sayaçları
- `GET /v1/admin/users/active|inactive|getAll`
- `GET /v1/admin/users/getById/:id`
- `POST /v1/admin/users/add`
- `PUT /v1/admin/users/update/:id`
- `DELETE /v1/admin/users/soft/:id`
- `PUT /v1/admin/users/restore/:id`
- `DELETE /v1/admin/users/hard/:id`
- Benzer yapı `admin/roles` ve `permissions` tarafında da mevcut

Tüm admin endpoint'leri JWT + permission guard ile korunur.

---

## 7) Test ve Kalite Komutları

```bash
npm run build
npm run lint
npm run test -- --runInBand
```

Bu repoda temel unit test yapısı mevcuttur ve yeni testler eklenmiştir:
- `RequiresFeatureGuard` unit testleri
- `AdminDashboardService` unit testleri

---

## 8) Proje Yapısı (Özet)

- `src/auth` → auth, token, google, email
- `src/admin` → admin users/roles/permissions/dashboard
- `src/tenancy` → tenant context + domain logic
- `src/billing` → plan/subscription/quota/feature guard
- `src/workforce` → schedule domain
- `src/tip-sessions`, `src/tip-entries`, `src/distributions`
- `src/entities` → tüm TypeORM entity’leri
- `src/core` → global exception filter vb.

---

## 9) Güvenlik Notları

- Access token kısa ömürlü (mobil için uygun)
- Refresh token hashli saklanır
- Refresh reuse tespiti ve token family revoke uygulanır
- Permission guard + feature guard birlikte çalışır
- Branch context zorunluluğu tenant izolasyonunu güçlendirir

---

## 10) Not

Bu backend, Expo uygulamasından bağımsız geliştirmeye uygundur; Expo istemcisi farklı repoda geliştirilip sadece bu API sözleşmelerine bağlanabilir.
