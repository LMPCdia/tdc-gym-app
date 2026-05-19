import re
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from database import get_db, User

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY no está definida en el archivo .env")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# bcrypt con 12 rondas — más lento para ataques de fuerza bruta contra la DB
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto",
                           bcrypt__rounds=12)

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def validate_password(password: str) -> list:
    """Devuelve lista de requisitos no cumplidos. Vacía = válida."""
    errors = []
    if len(password) < 8:
        errors.append("Mínimo 8 caracteres")
    if not re.search(r'[A-Z]', password):
        errors.append("Al menos 1 letra mayúscula")
    if not re.search(r'[0-9]', password):
        errors.append("Al menos 1 número")
    if not re.search(r'[!@#$%^&*()\-_+=\[\]{};:\'\",./<>?]', password):
        errors.append("Al menos 1 símbolo especial (!@#$%...)")
    return errors
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def require_profesor(current_user: User = Depends(get_current_user)):
    if current_user.role != "profesor":
        raise HTTPException(status_code=403, detail="Solo el profesor puede realizar esta acción")
    return current_user
