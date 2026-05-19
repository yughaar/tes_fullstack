# Fleetify - Fleet Maintenance System

Sistem internal untuk mengelola pemeliharaan armada kendaraan. Dibangun dengan Go (GoFiber + GORM), MySQL 8.0, dan Vanilla JS + Bootstrap 5.

## 🚀 Quick Start

### Menjalankan dengan Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd fleetify

# Jalankan aplikasi
docker-compose up --build
```

Aplikasi akan berjalan di: **http://localhost:3000**

### Menjalankan Tanpa Docker (Development)

```bash
# Pastikan MySQL 8.0 sudah berjalan
# Buat database 'fleetify'

# Set environment variables
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASS=root
export DB_NAME=fleetify

# Jalankan aplikasi
go run main.go
```

## ⚙️ Environment Variables

| Variable | Default | Keterangan |
|----------|---------|------------|
| `APP_PORT` | `3000` | Port aplikasi |
| `DB_HOST` | `localhost` | Host database MySQL |
| `DB_PORT` | `3306` | Port database MySQL |
| `DB_USER` | `root` | Username database |
| `DB_PASS` | `root` | Password database |
| `DB_NAME` | `fleetify` | Nama database |
| `WEBHOOK_URL` | _(kosong)_ | URL untuk webhook notifikasi (opsional) |

## 👤 Akun Testing

| Username | Role | Keterangan |
|----------|------|------------|
| `budi_sa` | SA (Service Advisor) | Membuat & menyelesaikan laporan |
| `manager_andi` | APPROVAL | Menyetujui laporan |

**Cara Login:** Pilih user dari dropdown di halaman login. Sistem menggunakan header `X-User-ID` untuk autentikasi.

## 📋 Fitur

### Fitur Utama
- **F-01**: SA membuat laporan pemeliharaan (pilih kendaraan, input odometer, keluhan, foto, dan estimasi part/jasa)
- **F-02**: Approval menyetujui laporan (status → APPROVED)
- **F-03**: SA menyelesaikan laporan dengan upload foto bukti (status → COMPLETED)
- **F-04**: Riwayat seluruh laporan pemeliharaan

### Fitur Bonus
- **B-01**: Export CSV (Native JavaScript, tanpa library pihak ketiga)
- **B-02**: Webhook notifikasi via Goroutine saat status berubah ke APPROVED/COMPLETED

## 🔌 API Endpoints

### Public
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/users` | Daftar semua user |

### Protected (Header: `X-User-ID`)
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/me` | All | Info user saat ini |
| GET | `/api/vehicles` | All | Daftar kendaraan |
| GET | `/api/master-items` | All | Daftar master item |
| GET | `/api/reports` | All | Daftar semua laporan |
| GET | `/api/reports/:id` | All | Detail laporan |
| POST | `/api/reports` | SA | Buat laporan baru |
| PUT | `/api/reports/:id/approve` | APPROVAL | Setujui laporan |
| PUT | `/api/reports/:id/complete` | SA | Selesaikan laporan |

### POST /api/reports (Multipart Form Data)
```
vehicle_id: uint (required)
odometer: int (required)
complaint: string (required)
items: JSON string [{"item_id": 1, "quantity": 2}] (required)
initial_photo: file (optional)
```

### PUT /api/reports/:id/complete (Multipart Form Data)
```
proof_photo: file (required)
```

## 🏗️ Arsitektur

```
fleetify/
├── main.go                 # Entry point
├── config/
│   └── database.go         # Database connection
├── models/                 # GORM models
│   ├── user.go
│   ├── vehicle.go
│   ├── master_item.go
│   ├── maintenance_report.go
│   └── report_item.go
├── repositories/           # Repository pattern (data access)
│   ├── user_repository.go
│   ├── vehicle_repository.go
│   ├── master_item_repository.go
│   └── report_repository.go
├── handlers/               # HTTP handlers
│   ├── user_handler.go
│   ├── vehicle_handler.go
│   ├── master_item_handler.go
│   └── report_handler.go
├── middleware/
│   └── auth.go             # RBAC middleware (X-User-ID)
├── routes/
│   └── routes.go           # Route definitions
├── seeders/
│   └── seeder.go           # Auto-seeder
├── webhook/
│   └── webhook.go          # Async webhook (Goroutine)
├── frontend/               # Static frontend files
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── api.js          # API module
│       └── app.js          # Main application
├── init.sql                # Database schema + seed data
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## 🔑 Keputusan Arsitektur

1. **Repository Pattern**: Memisahkan logika akses data dari handler untuk maintainability dan testability.
2. **Atomic Transaction**: Pembuatan laporan (header + detail items) dibungkus dalam `db.Transaction` GORM.
3. **Price Snapshot**: Harga item di-snapshot saat pembuatan laporan untuk menjaga integritas data historis.
4. **RBAC via Middleware**: Validasi role menggunakan header `X-User-ID` dengan middleware chain.
5. **DOM Manipulation**: Frontend menggunakan `document.createElement()` dan `DocumentFragment` (tanpa `.innerHTML`).
6. **Webhook Goroutine**: Notifikasi dikirim secara asynchronous agar tidak memblokir response.

## 📊 Database

- Engine: **InnoDB** (semua tabel)
- Foreign Keys: Diterapkan pada semua relasi
- Seeder: Otomatis berjalan saat aplikasi start (jika tabel kosong)
- Schema: Tersedia di `init.sql`

## 📝 Catatan

- Aplikasi menggunakan auto-migration GORM + seeder Go function
- File `init.sql` juga tersedia sebagai backup schema untuk Docker init
- Upload foto disimpan di folder `frontend/uploads/`
