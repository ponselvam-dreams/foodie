# from app.core.config import settings
# from fastapi_mail import ConnectionConfig, FastMail


# # Configure FastAPI-Mail
# conf = ConnectionConfig(
#     MAIL_USERNAME=settings.SMTP_USER,
#     MAIL_PASSWORD=settings.SMTP_PASSWORD,
#     MAIL_FROM=settings.SMTP_FROM_EMAIL,
#     MAIL_PORT=settings.SMTP_PORT,
#     MAIL_SERVER=settings.SMTP_SERVER,
#     MAIL_STARTTLS=settings.SMTP_STARTTLS,
#     MAIL_SSL_TLS=settings.SMTP_SSL_TLS,
#     VALIDATE_CERTS=settings.SMTP_VALIDATE_CERTS
# )

# fast_mail = FastMail(conf)


########### FAST API MAIL IS NOT COMPATIBLE WITH PYDANTIC SO USING AIOSMTP ###########
import aiosmtplib
from email.message import EmailMessage
from app.core.config import settings

class EmailSender:
    def __init__(self, server, port, user, password, starttls):
        self.server = server
        self.port = port
        self.user = user
        self.password = password
        self.starttls = starttls

    async def send(self, subject, recipient, body):
        msg = EmailMessage()
        msg["From"] = self.user
        msg["To"] = recipient
        msg["Subject"] = subject
        msg.set_content(body)
        await aiosmtplib.send(
            msg,
            hostname=self.server,
            port=self.port,
            username=self.user,
            password=self.password,
            start_tls=self.starttls,
        )

email_sender = EmailSender(
    server=settings.SMTP_SERVER,
    port=settings.SMTP_PORT,
    user=settings.SMTP_USER,
    password=settings.SMTP_PASSWORD,
    starttls=settings.SMTP_STARTTLS,

)