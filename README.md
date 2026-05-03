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
- Bildirim altyapısı (in-app/push/email, okunma, mute, maliyet takibi)
- Multi-tenant foundation:
  - `Company -> Branch -> Team -> Membership`
  - branch context (`x-branch-id`) ve tenant guard
- Billing ve plan bazlı feature gating:
  - `FREE / STARTER / PRO / ENTERPRISE`
  - quota ve feature kontrolü
  - tenant capability matrisi (branch/team/move/read-only)
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

NOTIFICATION_COST_CURRENCY=USD
NOTIFICATION_COST_IN_APP_MINOR_UNIT=0
NOTIFICATION_COST_PUSH_MINOR_UNIT=1
NOTIFICATION_COST_EMAIL_MINOR_UNIT=2

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=your-google-callback-url

SECRET_KEY=your-session-secret

BILLING_DEMO_MODE=true
BILLING_GOOGLE_PLAY_PACKAGE_NAME=com.example.app
BILLING_APP_STORE_BUNDLE_ID=com.example.app
BILLING_APP_STORE_SHARED_SECRET=your-app-store-shared-secret
BILLING_GOOGLE_PLAY_WEBHOOK_SECRET=your-google-play-webhook-secret
BILLING_APP_STORE_WEBHOOK_SECRET=your-app-store-webhook-secret

BILLING_GOOGLE_PLAY_PRODUCT_ID_FREE=demo.google.free
BILLING_GOOGLE_PLAY_PRODUCT_ID_STARTER=demo.google.starter
BILLING_GOOGLE_PLAY_PRODUCT_ID_PRO=demo.google.pro
BILLING_GOOGLE_PLAY_PRODUCT_ID_ENTERPRISE=demo.google.enterprise
BILLING_APP_STORE_PRODUCT_ID_FREE=demo.apple.free
BILLING_APP_STORE_PRODUCT_ID_STARTER=demo.apple.starter
BILLING_APP_STORE_PRODUCT_ID_PRO=demo.apple.pro
BILLING_APP_STORE_PRODUCT_ID_ENTERPRISE=demo.apple.enterprise
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
- Tenant yönetim politikası:
  - `FREE` plan: read-only (yazma/taşıma/değiştirme kapalı)
  - `STARTER/PRO`: takım oluşturma ve üyelik yönetimi
  - `ENTERPRISE`: şube oluşturma + takım oluşturma + takım taşıma

### Rol Modeli ve Yönetim Yüzeyleri
- **Super Admin (platform owner)**:
  - `admin/*` ve `admin/billing/*` endpointleri
  - plan/abonelik/tenant lifecycle yönetimi
- **Tenant Admin / Mobile User**:
  - `tenancy/*` ve tenant-scope endpointleri
  - yalnızca kendi tenant verilerini yönetme/görüntüleme

### Billing Modülü
- Plan kodları ve plan-feature matrisi
- Subscription yönetimi
- Quota enforcement
- `@RequiresFeature(...)` + `RequiresFeatureGuard`
- Deterministic downgrade:
  - `ACTIVE / GRACE_PERIOD` + geçerli dönem => ücretli davranış
  - dönem bitmiş veya abonelik yok => `FREE` + read-only

### Workforce Modülü
- Vardiya şablonları
- Haftalık plan
- Atama modeli

### TipBox Modülleri
- Tip session/entry/distribution akışları
- Branch/team bağlamı zorunluluğu

### Notifications Modülü
- In-app, push ve email bildirim kanalları
- Okundu/okunmadı işaretleme ve sayfalı listeleme
- Kanal bazlı sessize alma (mute) ve maliyet hesaplama

---

## 6) API Endpointleri (Detaylı)

> Tüm endpointler global prefix ile çalışır: `/v1`

### App
- `GET /v1/` → Sağlık kontrolü/örnek cevap (`Hello World!`)

### Auth (`/v1/auth`)
- `POST /v1/auth/login` → E-posta/şifre ile giriş (`x-device-id` zorunlu)
- `POST /v1/auth/register` → Yeni kullanıcı kaydı (KVKK onayı + versiyon zorunlu)
- `POST /v1/auth/refresh` → Refresh token ile access token yenileme (`x-device-id`, `user_refresh_token` yetkisi)
- `POST /v1/auth/logout-all` → Tüm cihaz oturumlarını kapatır (JWT)
- `POST /v1/auth/delete-account` → KVKK uyumlu hesap silme/anonimleştirme (JWT)
- `GET /v1/auth/confirm/:token` → E-posta doğrulama
- `POST /v1/auth/change-password` → Şifre değiştir (JWT + `user_change_password`)
- `POST /v1/auth/forgot-password` → Şifre sıfırlama linki gönderir
- `POST /v1/auth/reset-password/:token` → Şifre sıfırla

### Google Auth (`/v1/auth/google`)
- `GET /v1/auth/google` → Google OAuth başlatır
- `GET /v1/auth/google/redirect` → Google dönüş callback’i

### Users (`/v1/users`)
- `PUT /v1/users/:id` → Profil güncelle (`user_edit_profile`)
- `DELETE /v1/users/soft/:id` → Soft delete (`user_delete_profile`)
- `GET /v1/users/email/:email` → E-posta ile kullanıcı getir (`user_read_profile`)

### Admin Users (`/v1/admin/users`)
- `GET /v1/admin/users/active` → Aktif kullanıcılar (`admin_read_users`)
- `GET /v1/admin/users/inactive` → Pasif kullanıcılar (`admin_read_users`)
- `GET /v1/admin/users/getAll` → Tüm kullanıcılar (`admin_read_users`)
- `GET /v1/admin/users/getById/:id` → Kullanıcı detayı (`admin_read_users`)
- `POST /v1/admin/users/add` → Yeni kullanıcı oluştur (`admin_create_user`)
- `PUT /v1/admin/users/update/:id` → Kullanıcı güncelle (`admin_edit_user`)
- `DELETE /v1/admin/users/soft/:id` → Soft delete (`admin_delete_user`)
- `PUT /v1/admin/users/restore/:id` → Soft delete geri yükle (`admin_create_user`)
- `DELETE /v1/admin/users/hard/:id` → Kalıcı sil (`admin_delete_user`)

### Admin Roles (`/v1/admin/roles`)
- `GET /v1/admin/roles/active` → Aktif roller (`admin_read_roles`)
- `GET /v1/admin/roles/inactive` → Pasif roller (`admin_read_roles`)
- `GET /v1/admin/roles/getAll` → Tüm roller (`admin_read_roles`)
- `GET /v1/admin/roles/getById/:id` → Rol detayı (`admin_read_roles`)
- `POST /v1/admin/roles/add` → Yeni rol (`admin_create_role`)
- `PUT /v1/admin/roles/update/:id` → Rol güncelle (`admin_edit_role`)
- `DELETE /v1/admin/roles/soft/:id` → Soft delete (`admin_delete_role`)
- `PUT /v1/admin/roles/restore/:id` → Soft delete geri yükle (`admin_create_role`)
- `DELETE /v1/admin/roles/hard/:id` → Kalıcı sil (`admin_delete_role`)

### Admin Permissions (`/v1/permissions`)
- `GET /v1/permissions/active` → Aktif yetkiler (`admin_read_roles`)
- `GET /v1/permissions/inactive` → Pasif yetkiler (`admin_read_roles`)
- `GET /v1/permissions/getAll` → Tüm yetkiler (`admin_read_roles`)
- `GET /v1/permissions/getById/:id` → Yetki detayı (`admin_read_roles`)
- `POST /v1/permissions/add` → Yeni yetki (`admin_create_role`)

### Notifications (`/v1/notifications`)
- `POST /v1/notifications` → Bildirim oluşturur/gönderir (`admin_send_notifications`)
- `GET /v1/notifications` → Kullanıcının bildirimlerini listeler (JWT)
- `PATCH /v1/notifications/:notificationId/read` → Okundu işaretle (JWT)
- `PATCH /v1/notifications/:notificationId/unread` → Okunmadı işaretle (JWT)
- `GET /v1/notifications/preferences` → Bildirim tercihlerini getir (JWT)
- `PUT /v1/notifications/preferences` → Bildirim tercihlerini güncelle (JWT)
- `PUT /v1/permissions/update/:id` → Yetki güncelle (`admin_edit_role`)
- `DELETE /v1/permissions/soft/:id` → Soft delete (`admin_delete_role`)
- `PUT /v1/permissions/restore/:id` → Soft delete geri yükle (`admin_create_role`)
- `DELETE /v1/permissions/hard/:id` → Kalıcı sil (`admin_delete_role`)

### Admin Dashboard (`/v1/admin/dashboard`)
- `GET /v1/admin/dashboard/summary` → Admin panel özet metrikleri (`admin_read_users`)

### Billing (`/v1/admin/billing`)
- `POST /v1/admin/billing/subscriptions` → Company için abonelik/paket tanımlar (`admin_manage_billing`)
- `GET /v1/admin/billing/companies/:companyId/features` → Şirket plan özellikleri (`admin_manage_billing`)
- `GET /v1/admin/billing/companies/:companyId/subscription-status` → Şirket abonelik durumu (`admin_manage_billing`)

### Store Billing (`/v1/billing`)
- `POST /v1/billing/store/verify` → Satın alma doğrulama (`billing_verify_purchase`)
- `POST /v1/billing/store/restore` → Abonelik restore (`billing_restore_subscription`)
- `GET /v1/billing/companies/:companyId/subscription-status` → Şirket abonelik durumu (`billing_read_subscription_status`)
- `POST /v1/billing/webhooks/google-play` → Google Play server notification webhook
- `POST /v1/billing/webhooks/app-store` → App Store server notification webhook

Webhook imzası aktifse `x-webhook-signature` header içinde HMAC-SHA256 hex beklenir.

### Tenancy (`/v1/tenancy`)
- `POST /v1/tenancy/companies` → Yeni company oluşturur (`admin_read_users`)
- `POST /v1/tenancy/branches` → Şube oluşturur
- `POST /v1/tenancy/teams` → Takım oluşturur
- `POST /v1/tenancy/memberships` → Kullanıcıyı takıma ekler
- `POST /v1/tenancy/teams/move` → Takımı aynı company içinde taşır
- `GET /v1/tenancy/companies/:companyId/capabilities` → Plan/capability snapshot (`x-branch-id`)
- `GET /v1/tenancy/context/active-branch` → Aktif branch context (`x-branch-id`)

### Audit Logs (`/v1/audit-logs`)
- `GET /v1/audit-logs` → Tüm audit logları (`admin_read_users`)
- `GET /v1/audit-logs/user-activities` → Tüm kullanıcı aktiviteleri (`admin_read_users`)
- `GET /v1/audit-logs/user-activities/:userId` → Kullanıcı aktiviteleri (kullanıcı veya admin)

### Captcha (`/v1/captcha`)
- `GET /v1/captcha/generate` → Captcha üretir
- `POST /v1/captcha/verify` → Captcha doğrular

### Tip Sessions (`/v1/tip-sessions`)
- `POST /v1/tip-sessions` → Yeni tip oturumu (`x-branch-id`, `tipboxEnabled`)
- `GET /v1/tip-sessions/:sessionId` → Tip oturumu detayı (`x-branch-id`)

### Tip Entries (`/v1/tip-entries`)
- `POST /v1/tip-entries` → Tip giriş kaydı

### Distributions (`/v1/distributions`)
- `POST /v1/distributions/run` → Tip oturum dağıtımı

### Workforce (`/v1/workforce`)
- `POST /v1/workforce/shift-templates` → Vardiya şablonu oluşturur (`x-branch-id`, `shiftManagementEnabled`)
- `POST /v1/workforce/weekly-schedules` → Haftalık plan oluşturur (`x-branch-id`, `shiftManagementEnabled`)
- `POST /v1/workforce/assignments` → Kullanıcıyı haftalık plana atar (`x-branch-id`, `shiftManagementEnabled`)
- `GET /v1/workforce/weekly-schedules/:scheduleId` → Haftalık plan detayları (`x-branch-id`, `shiftManagementEnabled`)
- `GET /v1/workforce/weekly-schedules/:scheduleId/report` → Haftalık rapor (`x-branch-id`, `shiftManagementEnabled`)

---

## 7) Admin Panel Backend Sözleşmesi

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

## 8) Test ve Kalite Komutları

```bash
npm run build
npm run lint
npm run test -- --runInBand
```

Bu repoda temel unit test yapısı mevcuttur ve yeni testler eklenmiştir:
- `RequiresFeatureGuard` unit testleri
- `AdminDashboardService` unit testleri

---

## 9) Proje Yapısı (Özet)

- `src/auth` → auth, token, google, email
- `src/admin` → admin users/roles/permissions/dashboard
- `src/tenancy` → tenant context + domain logic
- `src/billing` → plan/subscription/quota/feature guard
- `src/workforce` → schedule domain
- `src/tip-sessions`, `src/tip-entries`, `src/distributions`
- `src/entities` → tüm TypeORM entity’leri
- `src/core` → global exception filter vb.

---

## 10) Güvenlik Notları

- Access token kısa ömürlü (mobil için uygun)
- Refresh token hashli saklanır
- Refresh reuse tespiti ve token family revoke uygulanır
- Permission guard + feature guard birlikte çalışır
- Branch context zorunluluğu tenant izolasyonunu güçlendirir
- Team move işlemi yalnızca aynı company içinde ve en üst paket için açıktır

---

## 11) Not

Bu backend, Expo uygulamasından bağımsız geliştirmeye uygundur; Expo istemcisi farklı repoda geliştirilip sadece bu API sözleşmelerine bağlanabilir.
