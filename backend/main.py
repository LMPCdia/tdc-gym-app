from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import secrets
from database import get_db, User, Routine, Day, Exercise, WeekSet, create_tables
from auth import (verify_password, get_password_hash, create_access_token,
                  get_current_user, require_profesor)
from email_service import (send_verification_email, send_welcome_email,
                           generate_password, get_mail_log, mark_read)
from seed import seed

app = FastAPI(title="TDC Gym API", version="2.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

BASE_URL = "http://localhost:5173/tdc-gym"

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
    name: str
    dni: str
    email: str

class VerifyEmailRequest(BaseModel):
    token: str

# ── Auth & Register ────────────────────────────────────────

@app.post("/auth/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    # Validate DNI
    dni_clean = body.dni.strip().replace(".", "")
    if not dni_clean.isdigit():
        raise HTTPException(400, "El DNI debe contener solo números")
    if len(dni_clean) < 7 or len(dni_clean) > 9:
        raise HTTPException(400, "DNI inválido (debe tener entre 7 y 9 dígitos)")

    # Check duplicates
    if db.query(User).filter(User.dni == dni_clean).first():
        raise HTTPException(400, "Ya existe una cuenta con ese DNI")
        # Validación básica de email
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Ya existe una cuenta con ese email")
    if "@" not in body.email or "." not in body.email.split("@")[-1]:
        raise HTTPException(400, "Email inválido")

    tdc_email = f"{dni_clean}@tdc.com"
    if db.query(User).filter(User.tdc_email == tdc_email).first():
        raise HTTPException(400, "Ya existe una cuenta TDC con ese DNI")

    token = secrets.token_urlsafe(32)
    user = User(
        name=body.name.strip().title(),
        dni=dni_clean,
        email=body.email,
        tdc_email=tdc_email,
        hashed_password=get_password_hash(secrets.token_urlsafe(16)),  # temp pass
        role="alumno",
        is_active=False,
        is_verified=False,
        verification_token=token
    )
    db.add(user)
    db.commit()

    send_verification_email(body.email, user.name, token, BASE_URL)

    return {
        "message": f"Registro exitoso. Te enviamos un email de verificación a {body.email}.",
        "email": body.email
    }


@app.post("/auth/verify-email")
def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == body.token).first()
    if not user:
        raise HTTPException(400, "Token de verificación inválido o expirado")
    if user.is_verified:
        raise HTTPException(400, "Este email ya fue verificado")

    # Generate TDC credentials
    password = generate_password()
    user.hashed_password = get_password_hash(password)
    user.is_verified = True
    user.is_active = True
    user.verification_token = None
    db.commit()

    # Send welcome email with credentials
    send_welcome_email(user.email, user.name, user.dni, password)

    return {
        "message": "Email verificado exitosamente. Te enviamos tus credenciales de acceso.",
        "tdc_email": user.tdc_email
    }


@app.post("/auth/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Accept both tdc_email (DNI@tdc.com) and personal email
    user = db.query(User).filter(
        (User.tdc_email == form_data.username) | (User.email == form_data.username)
    ).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Tu cuenta no está activa. Verificá tu email.")
    token = create_access_token({"sub": user.email})
    return {
        "access_token": token, "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email,
                 "tdc_email": user.tdc_email, "dni": user.dni, "role": user.role}
    }


@app.get("/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email,
            "tdc_email": current_user.tdc_email, "dni": current_user.dni, "role": current_user.role}


# ── Dev: mail simulator ────────────────────────────────────

@app.get("/dev/mailbox")
def mailbox():
    return get_mail_log()

@app.post("/dev/mailbox/{mail_id}/read")
def read_mail(mail_id: int):
    mark_read(mail_id)
    return {"ok": True}


# ── Users ─────────────────────────────────────────────────

@app.get("/users", response_model=List[UserSummary])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_profesor)):
    return db.query(User).filter(User.role == "alumno", User.is_active == True).all()


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


@app.get("/")
def root():
    return {"message": "TDC Gym API v2 💪", "docs": "/docs"}
