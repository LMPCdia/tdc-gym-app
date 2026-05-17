import os
import smtplib
import random
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "TDC Gym & Fitness")


def send_email(to: str, subject: str, html_body: str, text_body: str = ""):
    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL SIN SMTP] → {to} | {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
    msg["To"] = to
    msg.attach(MIMEText(text_body or html_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, [to], msg.as_string())
        print(f"[EMAIL ENVIADO] → {to} | {subject}")
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")


def generate_password(length=10):
    chars = string.ascii_letters + string.digits + "!@#$"
    pwd = [
        random.choice(string.ascii_uppercase),
        random.choice(string.digits),
        random.choice("!@#$"),
    ]
    pwd += [random.choice(chars) for _ in range(length - 3)]
    random.shuffle(pwd)
    return "".join(pwd)


def send_verification_email(email: str, nombre: str, token: str, base_url: str):
    verify_url = f"{base_url}/verify-email?token={token}"
    subject = "TDC Gym - Verificá tu email"
    text = f"""Hola {nombre}!

Gracias por registrarte en TDC Gym & Fitness.

Para verificar tu cuenta, ingresá al siguiente link:
{verify_url}

Este link expira en 24 horas.

Saludos,
TDC Gym & Fitness
"""
    html = f"""
<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:#F0A500;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);width:64px;height:64px;line-height:64px;font-size:22px;font-weight:bold;color:#000;">TDC</div>
    <h2 style="color:#F0A500;margin:12px 0 4px;letter-spacing:2px;">TIEMPO DE CAMBIO</h2>
    <p style="color:#888;margin:0;font-size:12px;letter-spacing:3px;">GYM & FITNESS</p>
  </div>
  <h3 style="color:#fff;">Hola, {nombre}! 👋</h3>
  <p style="color:#aaa;">Gracias por registrarte. Para activar tu cuenta hacé clic en el botón:</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="{verify_url}" style="background:#F0A500;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px;letter-spacing:1px;">VERIFICAR MI EMAIL</a>
  </div>
  <p style="color:#666;font-size:12px;">O copiá este link en tu navegador:<br><span style="color:#F0A500;">{verify_url}</span></p>
  <p style="color:#666;font-size:12px;">Este link expira en 24 horas.</p>
</div>
"""
    return send_email(email, subject, html, text)


def send_welcome_email(email: str, nombre: str, tdc_email: str, password: str):
    subject = "TDC Gym - Bienvenido! Tus credenciales de acceso"
    text = f"""Bienvenido a TDC Gym & Fitness, {nombre}!

Tu cuenta ha sido creada exitosamente.

Tus credenciales de acceso:
  Usuario: {tdc_email}
  Contraseña: {password}

Saludos,
TDC Gym & Fitness
"""
    html = f"""
<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:#F0A500;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);width:64px;height:64px;line-height:64px;font-size:22px;font-weight:bold;color:#000;">TDC</div>
    <h2 style="color:#F0A500;margin:12px 0 4px;letter-spacing:2px;">TIEMPO DE CAMBIO</h2>
    <p style="color:#888;margin:0;font-size:12px;letter-spacing:3px;">GYM & FITNESS</p>
  </div>
  <h3 style="color:#fff;">Bienvenido, {nombre}! 💪</h3>
  <p style="color:#aaa;">Tu cuenta en TDC Gym ha sido activada. Estos son tus datos de acceso:</p>
  <div style="background:#161616;border:1px solid #F0A50044;border-radius:10px;padding:20px;margin:20px 0;">
    <p style="margin:0 0 10px;color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Tus credenciales</p>
    <div style="margin-bottom:12px;">
      <p style="color:#888;font-size:12px;margin:0 0 4px;">Usuario</p>
      <p style="color:#F0A500;font-size:18px;font-weight:bold;margin:0;letter-spacing:1px;">{tdc_email}</p>
    </div>
    <div>
      <p style="color:#888;font-size:12px;margin:0 0 4px;">Contraseña</p>
      <p style="color:#fff;font-size:18px;font-weight:bold;margin:0;letter-spacing:2px;background:#0a0a0a;padding:8px 12px;border-radius:6px;border:1px solid #2a2a2a;">{password}</p>
    </div>
  </div>
  <p style="color:#666;font-size:12px;text-align:center;">Te recomendamos guardar estas credenciales en un lugar seguro.</p>
</div>
"""
    return send_email(email, subject, html, text)


def send_reset_password_email(email: str, nombre: str, reset_url: str):
    subject = "TDC Gym - Recuperar contraseña"
    text = f"""Hola {nombre}!

Recibimos una solicitud para restablecer tu contraseña.

Hacé clic en el siguiente link para crear una nueva contraseña:
{reset_url}

Este link expira en 1 hora. Si no solicitaste el cambio, ignorá este mensaje.

Saludos,
TDC Gym & Fitness
"""
    html = f"""
<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:#F0A500;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);width:64px;height:64px;line-height:64px;font-size:22px;font-weight:bold;color:#000;">TDC</div>
    <h2 style="color:#F0A500;margin:12px 0 4px;letter-spacing:2px;">TIEMPO DE CAMBIO</h2>
    <p style="color:#888;margin:0;font-size:12px;letter-spacing:3px;">GYM & FITNESS</p>
  </div>
  <h3 style="color:#fff;">Hola, {nombre}! 🔑</h3>
  <p style="color:#aaa;">Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón:</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="{reset_url}" style="background:#F0A500;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px;letter-spacing:1px;">RESTABLECER CONTRASEÑA</a>
  </div>
  <p style="color:#666;font-size:12px;">O copiá este link:<br><span style="color:#F0A500;">{reset_url}</span></p>
  <p style="color:#666;font-size:12px;">Este link expira en 1 hora. Si no solicitaste el cambio, ignorá este mensaje.</p>
</div>
"""
    return send_email(email, subject, html, text)


def send_profesor_welcome_email(email: str, nombre: str, password: str):
    subject = "TDC Gym - Cuenta de Profesor creada"
    text = f"""Hola {nombre}!

Se creó tu cuenta de profesor en TDC Gym & Fitness.

Tus credenciales de acceso:
  Usuario: {email}
  Contraseña: {password}

Saludos,
TDC Gym & Fitness
"""
    html = f"""
<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:#F0A500;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);width:64px;height:64px;line-height:64px;font-size:22px;font-weight:bold;color:#000;">TDC</div>
    <h2 style="color:#F0A500;margin:12px 0 4px;letter-spacing:2px;">TIEMPO DE CAMBIO</h2>
    <p style="color:#888;margin:0;font-size:12px;letter-spacing:3px;">GYM & FITNESS</p>
  </div>
  <h3 style="color:#fff;">Hola, {nombre}! 👋</h3>
  <p style="color:#aaa;">Se creó tu cuenta de <strong style="color:#F0A500;">Profesor</strong> en TDC Gym.</p>
  <div style="background:#161616;border:1px solid #F0A50044;border-radius:10px;padding:20px;margin:20px 0;">
    <p style="margin:0 0 10px;color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Tus credenciales</p>
    <div style="margin-bottom:12px;">
      <p style="color:#888;font-size:12px;margin:0 0 4px;">Usuario</p>
      <p style="color:#F0A500;font-size:18px;font-weight:bold;margin:0;letter-spacing:1px;">{email}</p>
    </div>
    <div>
      <p style="color:#888;font-size:12px;margin:0 0 4px;">Contraseña</p>
      <p style="color:#fff;font-size:18px;font-weight:bold;margin:0;letter-spacing:2px;background:#0a0a0a;padding:8px 12px;border-radius:6px;border:1px solid #2a2a2a;">{password}</p>
    </div>
  </div>
</div>
"""
    return send_email(email, subject, html, text)
