# Traffic Power Tool - Single Docker Container

Konfigurasi Docker yang menggunakan **hanya 1 container** untuk menjalankan seluruh aplikasi.

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd traffic-power-tool
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit jika diperlukan (opsional untuk single container)
nano .env
```

### 3. Build dan Run
```bash
# Build dan jalankan single container
docker-compose -f docker-compose.single.yml up -d

# Atau build manual
docker build -t traffic-power-tool .
docker run -d -p 8000:8000 --name traffic-power-tool traffic-power-tool
```

### 4. Akses Aplikasi
- **Main App**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## 🏗️ Arsitektur Single Container

Container ini menjalankan semua services:

### Services yang Berjalan:
1. **PostgreSQL** - Database (port 5432 internal)
2. **Redis** - Cache & Sessions (port 6379 internal)
3. **Nginx** - Reverse Proxy (port 8000)
4. **Python Flask** - Backend API (port 5000 internal)
5. **Next.js** - Frontend (port 3000 internal)

### Supervisor Configuration:
- Semua services dikelola oleh **Supervisor**
- Auto-restart jika service crash
- Centralized logging

## 📊 Monitoring

### Cek Status Services
```bash
# Masuk ke container
docker exec -it traffic-power-tool bash

# Cek status semua services
supervisorctl status

# Restart service tertentu
supervisorctl restart traffic-app
supervisorctl restart postgresql
supervisorctl restart redis
```

### Logs
```bash
# Lihat logs aplikasi
docker logs -f traffic-power-tool

# Atau logs spesifik service
docker exec -it traffic-power-tool tail -f /var/log/supervisor/app.log
docker exec -it traffic-power-tool tail -f /var/log/supervisor/postgresql.log
docker exec -it traffic-power-tool tail -f /var/log/supervisor/redis.log
```

### Database Access
```bash
# Connect ke PostgreSQL
docker exec -it traffic-power-tool psql -h localhost -U traffic_user -d traffic_power_tool

# Connect ke Redis
docker exec -it traffic-power-tool redis-cli
```

## 🔧 Konfigurasi

### Resource Limits
Edit `docker-compose.single.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'      # Sesuaikan dengan CPU
      memory: 8G       # Sesuaikan dengan RAM
    reservations:
      cpus: '2.0'
      memory: 4G
```

### Port Configuration
Jika port 8000 sudah digunakan:
```yaml
ports:
  - "8080:8000"  # Ganti 8000 dengan port lain
```

### Volume Mapping
```yaml
volumes:
  - ./data:/app/data              # Data aplikasi
  - ./logs:/var/log/supervisor    # Logs
  - ./config:/app/config          # Konfigurasi custom
  - ./backups:/app/backups        # Backup database
```

## 🛠️ Maintenance

### Backup Database
```bash
# Backup otomatis
docker exec traffic-power-tool pg_dump -h localhost -U traffic_user traffic_power_tool > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i traffic-power-tool psql -h localhost -U traffic_user traffic_power_tool < backup_20241228.sql
```

### Update Aplikasi
```bash
# Stop container
docker-compose -f docker-compose.single.yml down

# Pull update terbaru
git pull

# Rebuild dan start
docker-compose -f docker-compose.single.yml up -d --build
```

### Reset Data
```bash
# Stop dan hapus container + data
docker-compose -f docker-compose.single.yml down -v

# Start fresh
docker-compose -f docker-compose.single.yml up -d
```

## 🔒 Security

### Production Deployment
1. **Ganti SECRET_KEY** di `.env`
2. **Setup HTTPS** dengan reverse proxy eksternal
3. **Firewall rules** untuk port 8000
4. **Regular backup** database

### Hardening
```bash
# Run sebagai non-root user (sudah dikonfigurasi)
# Disable unnecessary services
# Setup log rotation
# Monitor resource usage
```

## 📈 Performance

### Optimasi
- **CPU**: Minimal 2 cores, recommended 4+ cores
- **RAM**: Minimal 4GB, recommended 8GB+
- **Storage**: SSD recommended untuk database
- **Network**: Stable internet untuk browser automation

### Scaling
Untuk load tinggi, pertimbangkan:
- Multiple container instances dengan load balancer
- External PostgreSQL dan Redis
- Horizontal scaling dengan Kubernetes

## 🆘 Troubleshooting

### Container Tidak Start
```bash
# Cek logs
docker logs traffic-power-tool

# Cek resource usage
docker stats traffic-power-tool

# Restart container
docker restart traffic-power-tool
```

### Service Crash
```bash
# Masuk ke container
docker exec -it traffic-power-tool bash

# Cek supervisor status
supervisorctl status

# Restart service yang crash
supervisorctl restart traffic-app
```

### Database Issues
```bash
# Cek PostgreSQL status
docker exec -it traffic-power-tool pg_isready -h localhost -U traffic_user

# Reset database jika perlu
docker exec -it traffic-power-tool psql -h localhost -U traffic_user -d traffic_power_tool -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Memory Issues
```bash
# Monitor memory usage
docker exec -it traffic-power-tool free -h
docker exec -it traffic-power-tool ps aux --sort=-%mem | head

# Restart jika perlu
docker restart traffic-power-tool
```

## ✅ Keuntungan Single Container

1. **Simplicity**: Hanya 1 container untuk dikelola
2. **Resource Efficiency**: Shared resources antar services
3. **Easy Deployment**: Single command deployment
4. **Development**: Mudah untuk development dan testing
5. **Portability**: Mudah dipindah antar environment

## ⚠️ Pertimbangan

1. **Scalability**: Tidak bisa scale individual services
2. **Maintenance**: Update memerlukan restart seluruh container
3. **Resource**: Semua services berbagi resource yang sama
4. **Isolation**: Kurang isolasi antar services

---

**Traffic Power Tool v2.0** - Single Container Professional Setup 🐳