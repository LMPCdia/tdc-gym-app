import os
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import secrets
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from database import get_db, User, Routine, Day, Exercise, WeekSet, BodyMeasurement, ExerciseCatalog, create_tables
from auth import (verify_password, get_password_hash, create_access_token,
                  get_current_user, require_profesor, validate_password,
                  MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES)
from email_service import (send_verification_email, send_welcome_email,
                           send_profesor_welcome_email, send_reset_password_email,
                           generate_password)
from seed import seed

load_dotenv()
BASE_URL = os.getenv("FRONTEND_URL", "http://localhost:5173/tdc-gym")

limiter = Limiter(key_func=get_remote_address, default_limits=[])
app = FastAPI(title="TDC Gym API", version="2.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    seed()

# ── Schemas ──────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class WeekSetSchema(BaseModel):
    id: int; semana: int; series_reps: Optional[str]; peso: Optional[float]
    class Config: from_attributes = True

class ExerciseSchema(BaseModel):
    id: int; numero: int; nombre: str; semanas: List[WeekSetSchema]
    class Config: from_attributes = True

class DaySchema(BaseModel):
    id: int; numero: int; nombre: str; entrada_calor: str
    musculatura: str = ""; finalizar_con: str = ""
    ejercicios: List[ExerciseSchema]
    class Config: from_attributes = True

class RoutineSchema(BaseModel):
    id: int; nombre: str; objetivo: str; inicio: Optional[str]
    alumno_id: int; alumno_nombre: Optional[str] = None; dias: List[DaySchema]
    class Config: from_attributes = True

class RoutineSummary(BaseModel):
    id: int; nombre: str; objetivo: str; inicio: Optional[str]
    alumno_id: int; alumno_nombre: Optional[str] = None
    class Config: from_attributes = True

class UpdatePesoRequest(BaseModel):
    peso: Optional[float]

class CreateExerciseRequest(BaseModel):
    numero: int; nombre: str; semanas: List[dict]

class CreateDayRequest(BaseModel):
    numero: int; nombre: str; entrada_calor: str = ""
    musculatura: str = ""; finalizar_con: str = ""
    ejercicios: List[CreateExerciseRequest] = []

class CreateRoutineRequest(BaseModel):
    nombre: str; objetivo: str = "Hipertrofia"; inicio: Optional[str] = None
    alumno_id: int; dias: List[CreateDayRequest] = []

class UpdateRoutineRequest(BaseModel):
    nombre: Optional[str] = None; objetivo: Optional[str] = None; inicio: Optional[str] = None

class UserSummary(BaseModel):
    id: int; name: str; email: str; tdc_email: Optional[str]; dni: Optional[str]; role: str
    class Config: from_attributes = True

class RegisterRequest(BaseModel):
    apellido: str
    nombre: str
    dni: str
    email: str

class CreateProfesorRequest(BaseModel):
    nombre_completo: str
    email: str

class VerifyEmailRequest(BaseModel):
    token: str

class BodyMeasurementSchema(BaseModel):
    id: int; user_id: int; fecha: str
    edad: Optional[int]; altura: Optional[float]; peso: Optional[float]
    imc: Optional[float]; masa_grasa: Optional[float]; masa_muscular: Optional[float]
    edad_biologica: Optional[int]; grasa_visceral: Optional[int]
    class Config: from_attributes = True

class CreateMeasurementRequest(BaseModel):
    fecha: str
    edad: Optional[int] = None
    altura: Optional[float] = None
    peso: Optional[float] = None
    masa_grasa: Optional[float] = None
    masa_muscular: Optional[float] = None
    edad_biologica: Optional[int] = None
    grasa_visceral: Optional[int] = None

class ExerciseCatalogSchema(BaseModel):
    id: int; nombre: str; grupo: str; youtube_url: Optional[str]
    class Config: from_attributes = True

class UpdateYoutubeUrlRequest(BaseModel):
    youtube_url: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ── Helpers ───────────────────────────────────────────────

def _generate_tdc_username(apellido: str, nombre: str, dni: str) -> str:
    apellido_clean = apellido.strip().lower().replace(" ", "")
    nombre_inicial = nombre.strip()[0].lower() if nombre.strip() else "x"
    return f"{apellido_clean}{nombre_inicial}{dni[:2]}{dni[-2:]}"


# ── Auth & Register ────────────────────────────────────────

@app.post("/auth/register")
@limiter.limit("5/minute")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    dni_clean = body.dni.strip().replace(".", "")
    if not dni_clean.isdigit():
        raise HTTPException(400, "El DNI debe contener solo números")
    if len(dni_clean) < 7 or len(dni_clean) > 9:
        raise HTTPException(400, "DNI inválido (debe tener entre 7 y 9 dígitos)")
    if db.query(User).filter(User.dni == dni_clean).first():
        raise HTTPException(400, "Ya existe una cuenta con ese DNI")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Ya existe una cuenta con ese email")
    if "@" not in body.email or "." not in body.email.split("@")[-1]:
        raise HTTPException(400, "Email inválido")

    tdc_user = _generate_tdc_username(body.apellido, body.nombre, dni_clean)
    tdc_email = f"{tdc_user}@tdc.com"
    if db.query(User).filter(User.tdc_email == tdc_email).first():
        raise HTTPException(400, "Ya existe una cuenta TDC con ese nombre y DNI")

    full_name = f"{body.apellido.strip().title()} {body.nombre.strip().title()}"
    token = secrets.token_urlsafe(32)
    user = User(
        name=full_name,
        dni=dni_clean,
        email=body.email,
        tdc_email=tdc_email,
        hashed_password=get_password_hash(secrets.token_urlsafe(16)),
        role="alumno",
        is_active=False,
        is_verified=False,
        verification_token=token
    )
    db.add(user)
    db.commit()

    send_verification_email(body.email, full_name, token, BASE_URL)

    return {
        "message": f"Registro exitoso. Te enviamos un email de verificación a {body.email}.",
        "email": body.email
    }


@app.post("/auth/verify-email")
def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    # Búsqueda con lock para evitar race condition por doble-clic
    user = db.query(User).filter(
        User.verification_token == body.token,
        User.is_verified == False
    ).with_for_update().first()

    if not user:
        raise HTTPException(400, "Token de verificación inválido o ya utilizado")

    password = generate_password()
    user.hashed_password = get_password_hash(password)
    user.is_verified = True
    user.is_active = True
    user.verification_token = None
    db.commit()

    send_welcome_email(user.email, user.name, user.tdc_email, password)

    return {
        "message": "Email verificado exitosamente. Te enviamos tus credenciales de acceso.",
        "tdc_email": user.tdc_email
    }


@app.post("/auth/create-profesor", response_model=UserSummary)
def create_profesor(body: CreateProfesorRequest, db: Session = Depends(get_db),
                    current_user: User = Depends(require_profesor)):
    if "@" not in body.email or "." not in body.email.split("@")[-1]:
        raise HTTPException(400, "Email inválido")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Ya existe una cuenta con ese email")

    password = generate_password()
    profesor = User(
        name=body.nombre_completo.strip().title(),
        email=body.email,
        tdc_email=body.email,
        hashed_password=get_password_hash(password),
        role="profesor",
        is_active=True,
        is_verified=True,
    )
    db.add(profesor)
    db.commit()
    db.refresh(profesor)

    send_profesor_welcome_email(body.email, profesor.name, password)

    return profesor


@app.post("/auth/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.tdc_email == form_data.username) | (User.email == form_data.username)
    ).first()

    if user and user.locked_until and user.locked_until > datetime.utcnow():
        remaining = max(1, int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1)
        raise HTTPException(status_code=429,
                            detail=f"Cuenta bloqueada por demasiados intentos. Intentá en {remaining} minutos.")

    if not user or not verify_password(form_data.password, user.hashed_password):
        if user:
            user.failed_attempts = (user.failed_attempts or 0) + 1
            if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
                db.commit()
                raise HTTPException(status_code=429,
                                    detail=f"Cuenta bloqueada por {MAX_FAILED_ATTEMPTS} intentos fallidos. Intentá en {LOCKOUT_MINUTES} minutos.")
            db.commit()
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Tu cuenta no está activa. Verificá tu email.")

    user.failed_attempts = 0
    user.locked_until = None
    db.commit()

    token = create_access_token({"sub": user.email})
    return {
        "access_token": token, "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email,
                 "tdc_email": user.tdc_email, "dni": user.dni, "role": user.role}
    }


@app.post("/auth/change-password")
def change_password(body: ChangePasswordRequest, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(400, "La contraseña actual es incorrecta")
    errors = validate_password(body.new_password)
    if errors:
        raise HTTPException(400, "; ".join(errors))
    current_user.hashed_password = get_password_hash(body.new_password)
    db.commit()
    return {"message": "Contraseña actualizada correctamente"}


@app.post("/auth/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == body.email) | (User.tdc_email == body.email)
    ).first()
    if user and user.is_active:
        token = f"reset_{secrets.token_urlsafe(32)}"
        user.verification_token = token
        db.commit()
        reset_url = f"{BASE_URL}/reset-password?token={token}"
        send_reset_password_email(user.email, user.name, reset_url)
    return {"message": "Si el usuario existe, te enviamos un email con instrucciones."}


@app.post("/auth/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not body.token.startswith("reset_"):
        raise HTTPException(400, "Token inválido")
    user = db.query(User).filter(User.verification_token == body.token).first()
    if not user:
        raise HTTPException(400, "Token inválido o expirado")
    errors = validate_password(body.new_password)
    if errors:
        raise HTTPException(400, "; ".join(errors))
    user.hashed_password = get_password_hash(body.new_password)
    user.verification_token = None
    user.failed_attempts = 0
    user.locked_until = None
    db.commit()
    return {"message": "Contraseña restablecida correctamente. Ya podés iniciar sesión."}


@app.post("/auth/resend-credentials/{user_id}")
def resend_credentials(user_id: int, db: Session = Depends(get_db),
                       current_user: User = Depends(require_profesor)):
    user = db.query(User).filter(User.id == user_id, User.role == "alumno").first()
    if not user:
        raise HTTPException(404, "Alumno no encontrado")
    from email_service import generate_password
    new_password = generate_password()
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    send_welcome_email(user.email, user.name, user.tdc_email, new_password)
    return {"message": f"Credenciales reenviadas a {user.email}"}


@app.get("/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email,
            "tdc_email": current_user.tdc_email, "dni": current_user.dni, "role": current_user.role}


# ── Users ─────────────────────────────────────────────────

@app.get("/users", response_model=List[UserSummary])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_profesor)):
    return db.query(User).filter(User.role == "alumno", User.is_active == True).all()


# ── Body Measurements ─────────────────────────────────────

@app.get("/users/{user_id}/measurements", response_model=List[BodyMeasurementSchema])
def list_measurements(user_id: int, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    if current_user.role == "alumno" and current_user.id != user_id:
        raise HTTPException(403, "No tenés acceso")
    return (db.query(BodyMeasurement)
              .filter(BodyMeasurement.user_id == user_id)
              .order_by(BodyMeasurement.created_at.desc())
              .all())


@app.post("/users/{user_id}/measurements", response_model=BodyMeasurementSchema)
def create_measurement(user_id: int, body: CreateMeasurementRequest,
                       db: Session = Depends(get_db),
                       current_user: User = Depends(require_profesor)):
    alumno = db.query(User).filter(User.id == user_id, User.role == "alumno").first()
    if not alumno:
        raise HTTPException(404, "Alumno no encontrado")

    imc = None
    if body.peso and body.altura and body.altura > 0:
        imc = round(body.peso / (body.altura ** 2), 1)

    m = BodyMeasurement(
        user_id=user_id,
        fecha=body.fecha,
        edad=body.edad,
        altura=body.altura,
        peso=body.peso,
        imc=imc,
        masa_grasa=body.masa_grasa,
        masa_muscular=body.masa_muscular,
        edad_biologica=body.edad_biologica,
        grasa_visceral=body.grasa_visceral,
    )
    db.add(m); db.commit(); db.refresh(m)
    return m


@app.delete("/measurements/{measurement_id}")
def delete_measurement(measurement_id: int, db: Session = Depends(get_db),
                       current_user: User = Depends(require_profesor)):
    m = db.query(BodyMeasurement).filter(BodyMeasurement.id == measurement_id).first()
    if not m:
        raise HTTPException(404)
    db.delete(m); db.commit()
    return {"message": "Eliminado"}


# ── Routines ──────────────────────────────────────────────

@app.get("/routines", response_model=List[RoutineSummary])
def list_routines(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "profesor":
        routines = db.query(Routine).all()
    else:
        routines = db.query(Routine).filter(Routine.alumno_id == current_user.id).all()
    result = []
    for r in routines:
        alumno = db.query(User).filter(User.id == r.alumno_id).first()
        s = RoutineSummary.model_validate(r)
        s.alumno_nombre = alumno.name if alumno else ""
        result.append(s)
    return result


@app.get("/routines/{routine_id}", response_model=RoutineSchema)
def get_routine(routine_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine: raise HTTPException(404, "Rutina no encontrada")
    if current_user.role == "alumno" and routine.alumno_id != current_user.id:
        raise HTTPException(403, "No tenés acceso a esta rutina")
    alumno = db.query(User).filter(User.id == routine.alumno_id).first()
    r = RoutineSchema.model_validate(routine)
    r.alumno_nombre = alumno.name if alumno else ""
    return r


@app.post("/routines", response_model=RoutineSummary)
def create_routine(body: CreateRoutineRequest, db: Session = Depends(get_db),
                   current_user: User = Depends(require_profesor)):
    routine = Routine(nombre=body.nombre, objetivo=body.objetivo, inicio=body.inicio,
                      alumno_id=body.alumno_id, profesor_id=current_user.id)
    db.add(routine); db.commit(); db.refresh(routine)
    for day_data in body.dias:
        day = Day(numero=day_data.numero, nombre=day_data.nombre,
                  entrada_calor=day_data.entrada_calor, musculatura=day_data.musculatura,
                  finalizar_con=day_data.finalizar_con, routine_id=routine.id)
        db.add(day); db.commit(); db.refresh(day)
        for ej_data in day_data.ejercicios:
            ej = Exercise(numero=ej_data.numero, nombre=ej_data.nombre, day_id=day.id)
            db.add(ej); db.commit(); db.refresh(ej)
            for ws in ej_data.semanas:
                db.add(WeekSet(semana=ws.get("semana"), series_reps=ws.get("series_reps"),
                               peso=ws.get("peso"), exercise_id=ej.id))
        db.commit()
    alumno = db.query(User).filter(User.id == routine.alumno_id).first()
    s = RoutineSummary.model_validate(routine)
    s.alumno_nombre = alumno.name if alumno else ""
    return s


@app.put("/routines/{routine_id}", response_model=RoutineSummary)
def update_routine(routine_id: int, body: UpdateRoutineRequest, db: Session = Depends(get_db),
                   current_user: User = Depends(require_profesor)):
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine: raise HTTPException(404, "Rutina no encontrada")
    if body.nombre: routine.nombre = body.nombre
    if body.objetivo: routine.objetivo = body.objetivo
    if body.inicio: routine.inicio = body.inicio
    db.commit(); db.refresh(routine)
    alumno = db.query(User).filter(User.id == routine.alumno_id).first()
    s = RoutineSummary.model_validate(routine)
    s.alumno_nombre = alumno.name if alumno else ""
    return s


@app.delete("/routines/{routine_id}")
def delete_routine(routine_id: int, db: Session = Depends(get_db),
                   current_user: User = Depends(require_profesor)):
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine: raise HTTPException(404)
    db.delete(routine); db.commit()
    return {"message": "Rutina eliminada"}


# ── Exercises ─────────────────────────────────────────────

@app.patch("/weeksets/{weekset_id}/peso")
def update_peso(weekset_id: int, body: UpdatePesoRequest,
                db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ws = db.query(WeekSet).filter(WeekSet.id == weekset_id).first()
    if not ws: raise HTTPException(404)
    if current_user.role == "alumno":
        exercise = db.query(Exercise).filter(Exercise.id == ws.exercise_id).first()
        day = db.query(Day).filter(Day.id == exercise.day_id).first()
        routine = db.query(Routine).filter(Routine.id == day.routine_id).first()
        if routine.alumno_id != current_user.id: raise HTTPException(403)
    ws.peso = body.peso
    db.commit(); db.refresh(ws)
    return {"id": ws.id, "peso": ws.peso, "semana": ws.semana, "series_reps": ws.series_reps}


@app.post("/days/{day_id}/exercises")
def add_exercise(day_id: int, body: CreateExerciseRequest,
                 db: Session = Depends(get_db), current_user: User = Depends(require_profesor)):
    day = db.query(Day).filter(Day.id == day_id).first()
    if not day: raise HTTPException(404)
    ej = Exercise(numero=body.numero, nombre=body.nombre, day_id=day.id)
    db.add(ej); db.commit(); db.refresh(ej)
    for ws_data in body.semanas:
        db.add(WeekSet(semana=ws_data.get("semana"), series_reps=ws_data.get("series_reps"),
                       peso=ws_data.get("peso"), exercise_id=ej.id))
    db.commit()
    return {"id": ej.id, "nombre": ej.nombre}


@app.delete("/exercises/{exercise_id}")
def delete_exercise(exercise_id: int, db: Session = Depends(get_db),
                    current_user: User = Depends(require_profesor)):
    ej = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ej: raise HTTPException(404)
    db.delete(ej); db.commit()
    return {"message": "Eliminado"}


# ── Exercises catalog ─────────────────────────────────────

@app.get("/exercises/catalog")
def get_exercises_catalog(search: str = "", current_user: User = Depends(get_current_user)):
    from exercises_db import get_all_exercises, EXERCISES_DB
    if search:
        sl = search.lower()
        return [e for e in get_all_exercises() if sl in e["nombre"].lower()]
    return [{"grupo": g, "ejercicios": e} for g, e in EXERCISES_DB.items()]


# ── Exercise Catalog (YouTube) ────────────────────────────

@app.get("/exercise-catalog", response_model=List[ExerciseCatalogSchema])
def list_exercise_catalog(
    grupo: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(ExerciseCatalog)
    if grupo:
        q = q.filter(ExerciseCatalog.grupo == grupo)
    if search:
        q = q.filter(ExerciseCatalog.nombre.ilike(f"%{search}%"))
    return q.order_by(ExerciseCatalog.grupo, ExerciseCatalog.nombre).all()


@app.patch("/exercise-catalog/{entry_id}", response_model=ExerciseCatalogSchema)
def update_exercise_youtube(
    entry_id: int,
    body: UpdateYoutubeUrlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_profesor)
):
    entry = db.query(ExerciseCatalog).filter(ExerciseCatalog.id == entry_id).first()
    if not entry:
        raise HTTPException(404, "Ejercicio no encontrado en el catálogo")
    entry.youtube_url = body.youtube_url or None
    db.commit(); db.refresh(entry)
    return entry


@app.get("/")
def root():
    return {"message": "TDC Gym API v2 💪", "docs": "/docs"}
