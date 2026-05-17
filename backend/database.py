from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./tdc_gym.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    dni = Column(String, unique=True, index=True, nullable=True)   # DNI como ID único
    email = Column(String, unique=True, index=True, nullable=False)
    tdc_email = Column(String, unique=True, index=True, nullable=True)  # DNI@tdc.com
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="alumno")
    is_active = Column(Boolean, default=False)   # False hasta verificar email
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    routines = relationship("Routine", back_populates="alumno", foreign_keys="Routine.alumno_id")


class Routine(Base):
    __tablename__ = "routines"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    objetivo = Column(String, default="Hipertrofia")
    inicio = Column(String)
    alumno_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    profesor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alumno = relationship("User", foreign_keys=[alumno_id], back_populates="routines")
    profesor = relationship("User", foreign_keys=[profesor_id])
    dias = relationship("Day", back_populates="routine", cascade="all, delete-orphan")


class Day(Base):
    __tablename__ = "days"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(Integer, nullable=False)
    nombre = Column(String, default="")
    routine_id = Column(Integer, ForeignKey("routines.id"), nullable=False)
    routine = relationship("Routine", back_populates="dias")
    entrada_calor = Column(Text, default="")
    musculatura = Column(String, default="")
    finalizar_con = Column(Text, default="")
    ejercicios = relationship("Exercise", back_populates="day", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(Integer)
    nombre = Column(String, nullable=False)
    day_id = Column(Integer, ForeignKey("days.id"), nullable=False)
    day = relationship("Day", back_populates="ejercicios")
    semanas = relationship("WeekSet", back_populates="exercise", cascade="all, delete-orphan")


class WeekSet(Base):
    __tablename__ = "week_sets"
    id = Column(Integer, primary_key=True, index=True)
    semana = Column(Integer, nullable=False)
    series_reps = Column(String)
    peso = Column(Float, nullable=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    exercise = relationship("Exercise", back_populates="semanas")


class BodyMeasurement(Base):
    __tablename__ = "body_measurements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    fecha = Column(String, nullable=False)
    edad = Column(Integer, nullable=True)
    altura = Column(Float, nullable=True)
    peso = Column(Float, nullable=True)
    imc = Column(Float, nullable=True)
    masa_grasa = Column(Float, nullable=True)
    masa_muscular = Column(Float, nullable=True)
    edad_biologica = Column(Integer, nullable=True)
    grasa_visceral = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", foreign_keys=[user_id])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
    # Migración segura: agrega columnas nuevas si no existen (SQLite no soporta ALTER TABLE con constraints)
    from sqlalchemy import text, inspect as sa_inspect
    inspector = sa_inspect(engine)
    existing = {c["name"] for c in inspector.get_columns("users")}
    with engine.begin() as conn:
        if "failed_attempts" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0"))
        if "locked_until" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN locked_until DATETIME"))
