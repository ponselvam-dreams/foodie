from app.core.config import settings
from fastapi_mail import ConnectionConfig, FastMail


# Configure FastAPI-Mail
conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.SMTP_FROM_EMAIL,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_SERVER,
    MAIL_STARTTLS=settings.SMTP_STARTTLS,
    MAIL_SSL_TLS=settings.SMTP_SSL_TLS,
    VALIDATE_CERTS=settings.SMTP_VALIDATE_CERTS
)

fast_mail = FastMail(conf)