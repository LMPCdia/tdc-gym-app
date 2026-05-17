# 🏋️ TDC Gym & Fitness — Sistema de Rutinas

Sistema web para gestión de rutinas de entrenamiento.  
**Profesor** crea y administra rutinas · **Alumno** registra sus pesos semana a semana.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite → GitHub Pages |
| Backend | FastAPI (Python) → Render.com |
| Base de datos | SQLite + SQLAlchemy |
| Auth | JWT con roles (profesor / alumno) |

---

## Usuarios demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Profesor | profe@tdc.com | profe123 |
| Alumno | ivan@tdc.com | ivan123 |

---

## 🚀 Deploy paso a paso

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit - TDC Gym"
git remote add origin https://github.com/TU_USUARIO/tdc-gym.git
git push -u origin main
```

### 2. Deploy Backend en Render.com

1. Ir a **https://render.com** → crear cuenta gratuita
2. Click **"New +"** → **"Web Service"**
3. Conectar tu repositorio de GitHub
4. Configurar:
   - **Name:** `tdc-gym-api`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Click **"Create Web Service"**
6. Esperar que termine el deploy (2-3 min)
7. Copiar la URL que te da Render: `https://tdc-gym-api.onrender.com`

### 3. Configurar GitHub Pages + Secret

1. En tu repo de GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
   - Name: `VITE_API_URL`
   - Value: `https://tdc-gym-api.onrender.com` (la URL de Render)
3. Ir a **Settings** → **Pages**
4. Source: **"GitHub Actions"**
5. El workflow se ejecuta automáticamente al hacer push

### 4. ¡Listo! 🎉

Tu app estará en:
- **Frontend:** `https://TU_USUARIO.github.io/tdc-gym/`
- **Backend API:** `https://tdc-gym-api.onrender.com`
- **Docs API:** `https://tdc-gym-api.onrender.com/docs`

---

## Desarrollo local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed.py       # Crea la DB y carga datos de demo
uvicorn main:app --reload
# API disponible en http://localhost:8000
# Docs en http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
# Crear archivo .env.local:
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
# App en http://localhost:5173/tdc-gym/
```

---

## Permisos por rol

| Acción | Profesor | Alumno |
|--------|---------|--------|
| Ver sus rutinas | ✅ | ✅ |
| Ver todas las rutinas | ✅ | ❌ |
| Crear rutina | ✅ | ❌ |
| Editar rutina | ✅ | ❌ |
| Eliminar rutina | ✅ | ❌ |
| Agregar ejercicios | ✅ | ❌ |
| Eliminar ejercicios | ✅ | ❌ |
| **Editar pesos** | ✅ | ✅ |

---

## Estructura del proyecto

```
tdc-gym/
├── .github/workflows/deploy.yml   # Auto-deploy a GitHub Pages
├── backend/
│   ├── main.py          # FastAPI app + endpoints
│   ├── database.py      # Modelos SQLAlchemy
│   ├── auth.py          # JWT + roles
│   ├── seed.py          # Datos demo (Ivan Gamarra)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Router
│   │   ├── api.js               # Axios client
│   │   ├── context/AuthContext  # Auth global
│   │   ├── components/Navbar
│   │   └── pages/
│   │       ├── Login
│   │       ├── Dashboard
│   │       ├── RoutineDetail    # Vista principal alumno
│   │       ├── RoutineForm      # Crear/editar (profesor)
│   │       └── AddExercise
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── Procfile
└── README.md
```

---

## Nota importante sobre Render free tier

El plan gratuito de Render "duerme" el servidor si no recibe tráfico por 15 minutos.  
La primera request puede tardar ~30 segundos en "despertar" la API.  
Para producción real, considerar el plan pago ($7/mes).
