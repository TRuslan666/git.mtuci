from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_reset_email(email: str, token: str) -> None:
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    # Always log the link for debugging/testing purposes
    logger.info(f"Password reset link for {email}: {reset_link}")
    print(f"[PASSWORD RESET] Link for {email}: {reset_link}", flush=True)

    if not settings.SMTP_HOST:
        logger.warning("SMTP_HOST not configured, skipping email send")
        return

    msg = EmailMessage()
    msg["Subject"] = "Password reset"
    msg["From"] = settings.SMTP_USER
    msg["To"] = email
    msg.set_content(
        "Вы запросили восстановление пароля.\n\n"
        f"Перейдите по ссылке: {reset_link}\n\n"
        "Ссылка действует 1 час."
    )

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_USER, [email], msg.as_string())
        logger.info(f"Password reset email sent successfully to {email}")
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")
        # Don't re-raise - we don't want to expose internal errors to the user
        # The user should still see "If the email exists..." message
