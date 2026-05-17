"""
Email service - simulado para desarrollo.
Para producción: cambiar send_email() para usar smtplib con Gmail/SMTP real.
"""
import os
import json
import random
import string
from datetime import datetime
from pathlib import Path

# Simulador: guarda mails en archivo JSON
MAIL_LOG_FILE = Path("./mail_log.json")

def _load_log():
    if MAIL_LOG_FILE.exists():
        try:
            return json.loads(MAIL_LOG_FILE.read_text(encoding='utf-8'))
        except:
            pass
    return []

def _save_log(log):
    MAIL_LOG_FILE.write_text(json.dumps(log, ensure_ascii=True, indent=2), encoding='utf-8')

def send_email(to: str, subject: str, html_body: str, text_body: str = ""):
    """
    Envía un email.
    Modo simulado: guarda en mail_log.json y loguea en consola.
    Para producción: descomentar bloque smtplib abajo.
    """
    mail = {
        "id": len(_load_log()) + 1,
        "to": to,
        "subject": subject,
        "body_html": html_body,
        "body_text": text_body or html_body,
        "sent_at": datetime.now().isoformat(),
        "read": False
    }

    # ── Simulador ──
    log = _load_log()
    log.insert(0, mail)
    _save_log(log[:50])  # max 50 mails

    print("\n" + "="*60)
    print(f"📧 MAIL SIMULADO → {to}")
    print(f"   Asunto: {subject}")
    print(f"   {text_body[:200] if text_body else '(ver body_html)'}")
    print("="*60 + "\n")

    # ── Para producción con Gmail ──
    # import smtplib
    # from email.mime.multipart import MIMEMultipart
    # from email.mime.text import MIMEText
    # SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    # SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    # SMTP_USER = os.getenv("SMTP_USER")   # tu-cuenta@gmail.com
    # SMTP_PASS = os.getenv("SMTP_PASS")   # App Password de Gmail
    # msg = MIMEMultipart("alternative")
    # msg["Subject"] = subject
    # msg["From"] = f"TDC Gym <{SMTP_USER}>"
    # msg["To"] = to
    # msg.attach(MIMEText(text_body, "plain"))
    # msg.attach(MIMEText(html_body, "html"))
    # with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
    #     s.starttls()
    #     s.login(SMTP_USER, SMTP_PASS)
    #     s.sendmail(SMTP_USER, [to], msg.as_string())

    return mail


def generate_password(length=10):
    chars = string.ascii_letters + string.digits + "!@#$"
    # Al menos 1 mayúscula, 1 número, 1 especial
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

Si no te registraste en TDC Gym, ignorá este mensaje.

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


def send_welcome_email(email: str, nombre: str, dni: str, password: str):
    tdc_email = f"{dni}@tdc.com"
    subject = "TDC Gym - Bienvenido! Tus credenciales de acceso"
    text = f"""Bienvenido a TDC Gym & Fitness, {nombre}!

Tu cuenta ha sido creada exitosamente.

Tus credenciales de acceso:
  Usuario: {tdc_email}
  Contraseña: {password}

Podés iniciar sesión en: https://TU_USUARIO.github.io/tdc-gym/

Te recomendamos cambiar tu contraseña al ingresar por primera vez.

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


def get_mail_log():
    return _load_log()


def mark_read(mail_id: int):
    log = _load_log()
    for m in log:
        if m["id"] == mail_id:
            m["read"] = True
    _save_log(log)
