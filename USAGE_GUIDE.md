# Traffic Power Tool - Panduan Lengkap Penggunaan

## 🚀 Instalasi dan Setup

### 1. Prerequisites
Pastikan sistem Anda memiliki:
- **Docker** versi 20.10 atau lebih baru
- **Docker Compose** versi 2.0 atau lebih baru
- **Git** untuk clone repository
- Minimal **4GB RAM** dan **10GB disk space**

### 2. Clone Repository
```bash
# Clone repository
git clone <repository-url>
cd traffic-power-tool

# Atau jika menggunakan SSH
git clone git@github.com:username/traffic-power-tool.git
cd traffic-power-tool
```

### 3. Setup Environment
```bash
# Copy file environment template
cp .env.example .env

# Edit file .env sesuai kebutuhan
nano .env
```

Contoh isi file `.env`:
```env
# Database Configuration
POSTGRES_DB=traffic_power_tool
POSTGRES_USER=traffic_user
POSTGRES_PASSWORD=your_secure_password_here

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Application Configuration
SECRET_KEY=your_secret_key_here_min_32_chars
NODE_ENV=production
PYTHONPATH=/app

# Optional: Port Configuration
PORT=8000
```

### 4. Build dan Start Application
```bash
# Build dan jalankan semua services
docker-compose up -d

# Atau jika ingin melihat logs secara real-time
docker-compose up
```

### 5. Verifikasi Installation
```bash
# Cek status semua containers
docker-compose ps

# Cek health status
curl http://localhost:8000/health

# Cek logs jika ada masalah
docker-compose logs -f traffic-power-tool
```

## 🌐 Akses Aplikasi

Setelah semua container berjalan, buka browser dan akses:
- **Main Application**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## 📋 Cara Menggunakan Aplikasi

### 1. Dashboard Utama
- Halaman pertama menampilkan overview sistem
- Statistik real-time simulasi yang sedang berjalan
- Quick actions untuk memulai simulasi baru

### 2. Konfigurasi Simulasi Baru

#### Step 1: Basic Configuration
1. Klik **"Configure Simulation"** atau **"Start New Simulation"**
2. Isi form konfigurasi dasar:
   - **Target URL**: Website yang ingin disimulasi (contoh: https://example.com)
   - **Total Sessions**: Jumlah sesi yang ingin disimulasi (1-10,000)
   - **Concurrent Sessions**: Jumlah sesi bersamaan (1-100)
   - **Returning Visitor Rate**: Persentase pengunjung lama (0-100%)
   - **Navigation Timeout**: Timeout halaman dalam milidetik
   - **Mode Type**: Bot (cepat) atau Human (realistis)
   - **Network Type**: Default, 3G, 4G, WiFi, atau Offline

#### Step 2: Demographics Configuration
1. **Country Distribution**: Pilih negara dan atur persentase distribusi
2. **Device Distribution**: Atur persentase Desktop, Mobile, Tablet
3. **Age Distribution**: Atur distribusi umur (18-24, 25-34, 35-44, 45-54, 55+)

#### Step 3: Persona Selection
1. Pilih dari 20+ persona yang tersedia:
   - **Methodical Customer**: Fokus mengisi form dan mencari harga
   - **Deep Researcher**: Konsumsi konten dan download
   - **Performance Analyst**: Koleksi web vitals
   - **Quick Browser**: Navigasi cepat, interaksi minimal
   - **Job Seeker**: Fokus karir dan aplikasi
   - Dan lainnya...

#### Step 4: Review & Launch
1. Review semua konfigurasi
2. Estimasi durasi simulasi akan ditampilkan
3. Klik **"Start Simulation"** untuk memulai

### 3. Monitoring Real-time

Setelah simulasi dimulai, Anda akan diarahkan ke halaman monitoring:

#### Overview Tab
- **Progress Bar**: Menampilkan kemajuan simulasi
- **Live Statistics**: 
  - Total sessions completed
  - Success/failure rate
  - Average duration
  - Current concurrent sessions

#### Live Updates Tab
- Stream real-time dari setiap sesi yang selesai
- Detail persona, device, country, dan hasil

#### Logs Tab
- Log detail dari setiap aktivitas
- Filter berdasarkan level (info, warning, error)

#### Charts Tab
- Grafik distribusi persona
- Grafik distribusi device
- Grafik distribusi negara
- Grafik performa web vitals

### 4. Menghentikan Simulasi
```bash
# Dari interface web: klik tombol "Stop Simulation"
# Atau dari command line:
curl -X POST http://localhost:8000/api/simulation/{simulation_id}/stop
```

### 5. Analisis Hasil

Setelah simulasi selesai:

#### Analytics Dashboard
- **Session Statistics**: Total, sukses, gagal, rata-rata durasi
- **Demographics Breakdown**: Distribusi berdasarkan negara, umur, device
- **Performance Metrics**: Web vitals (TTFB, FCP, DOM Load, Page Load)
- **Behavioral Analysis**: Analisis berdasarkan persona

#### Export Data
1. Klik **"Export"** di halaman analytics
2. Pilih format: CSV, Excel, atau JSON
3. Data akan didownload otomatis

### 6. Manajemen Preset

#### Membuat Preset
1. Setelah konfigurasi simulasi, klik **"Save as Preset"**
2. Beri nama dan deskripsi
3. Preset akan tersimpan untuk digunakan kembali

#### Menggunakan Preset
1. Di halaman konfigurasi, klik **"Load Preset"**
2. Pilih preset yang diinginkan
3. Modifikasi jika diperlukan

### 7. Riwayat Simulasi

#### Melihat History
1. Akses menu **"History"**
2. Lihat semua simulasi yang pernah dijalankan
3. Filter berdasarkan tanggal, status, atau nama

#### Detail Simulasi
1. Klik pada simulasi di history
2. Lihat konfigurasi yang digunakan
3. Analisis hasil lengkap
4. Re-run simulasi dengan konfigurasi yang sama

## 🔧 Troubleshooting

### Container Tidak Bisa Start
```bash
# Cek status containers
docker-compose ps

# Cek logs untuk error
docker-compose logs traffic-power-tool
docker-compose logs postgres
docker-compose logs redis

# Restart semua services
docker-compose down
docker-compose up -d
```

### Database Connection Error
```bash
# Cek apakah PostgreSQL berjalan
docker-compose exec postgres pg_isready -U traffic_user

# Reset database jika perlu
docker-compose down -v
docker-compose up -d
```

### Memory Issues
```bash
# Cek penggunaan resource
docker stats

# Tambahkan memory limit di docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
```

### Port Conflicts
```bash
# Jika port 8000 sudah digunakan, edit docker-compose.yml
ports:
  - "8080:8000"  # Ganti 8000 dengan port lain
```

## 📊 Tips Penggunaan

### 1. Optimasi Performa
- Mulai dengan concurrent sessions kecil (5-10) untuk testing
- Gunakan mode "Bot" untuk simulasi cepat
- Gunakan mode "Human" untuk hasil yang lebih realistis

### 2. Konfigurasi Terbaik
- **E-commerce Testing**: Gunakan persona "Product Explorer" dan "E-commerce Shopper"
- **Content Website**: Gunakan "Content Consumer" dan "Deep Researcher"
- **Corporate Website**: Gunakan "Methodical Customer" dan "Job Seeker"

### 3. Monitoring
- Selalu monitor logs untuk error
- Perhatikan success rate, jika di bawah 80% ada masalah
- Web vitals memberikan insight performa website

### 4. Analisis Data
- Export data untuk analisis lebih lanjut
- Bandingkan hasil dari berbagai konfigurasi
- Gunakan data untuk optimasi website

## 🛠️ Advanced Usage

### Custom Personas
```bash
# Akses container untuk custom configuration
docker-compose exec traffic-power-tool bash

# Edit persona configuration
nano /app/backend/src/core/config.py
```

### API Usage
```bash
# Start simulation via API
curl -X POST http://localhost:8000/api/simulation/start \
  -H "Content-Type: application/json" \
  -d '{"target_url": "https://example.com", "total_sessions": 100}'

# Get simulation status
curl http://localhost:8000/api/simulation/{id}/status
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U traffic_user -d traffic_power_tool

# Query simulation data
SELECT * FROM simulations ORDER BY created_at DESC LIMIT 10;
```

## 🔒 Security & Production

### Production Deployment
1. **Ganti semua password default**
2. **Gunakan HTTPS dengan reverse proxy**
3. **Setup firewall rules**
4. **Regular backup database**

### Backup & Restore
```bash
# Backup database
docker-compose exec postgres pg_dump -U traffic_user traffic_power_tool > backup.sql

# Restore database
docker-compose exec -T postgres psql -U traffic_user traffic_power_tool < backup.sql
```

## 📞 Support

Jika mengalami masalah:
1. Cek logs: `docker-compose logs -f`
2. Cek health endpoint: `curl http://localhost:8000/health`
3. Restart services: `docker-compose restart`
4. Reset semua: `docker-compose down -v && docker-compose up -d`

---

**Traffic Power Tool v2.0** - Professional Traffic Simulation Platform 🚀