import random   
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List
import logging
from pydantic import EmailStr


from .core.config import settings
# from .core.email_config import fast_mail
from app.core.email_config import email_sender
from fastapi_mail import MessageSchema

if settings.DEBUG:
    log_level = logging.DEBUG
else:
    log_level = logging.ERROR

logging.basicConfig(level=log_level)
logger = logging.getLogger(__name__)

# create product category from product_category.json

#
# send email 
# 
def send_email(
        subject: str,
        body: str,
        to_emails: List[str], 
        from_email: str, 
        smtp_server: str = settings.SMTP_SERVER, 
        smtp_port: int = settings.SMTP_PORT, 
        smtp_user: str = settings.SMTP_USER, 
        smtp_password: str = settings.SMTP_PASSWORD):
    try:
        # Create the email
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = ", ".join(to_emails)
        msg['Subject'] = subject

        # Attach the body with the msg instance
        msg.attach(MIMEText(body, 'plain'))

        # Create server
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()

        # Login Credentials for sending the mail
        server.login(smtp_user, smtp_password)

        # Send the email
        text = msg.as_string()
        server.sendmail(from_email, to_emails, text)

        # Terminate the SMTP session and close the connection
        server.quit()

        print("Email sent successfully!")
    except Exception as e:
        print(f"Failed to send email: {e}")


# async def send_email_otp(email, otp):

#     message = MessageSchema(
#         subject="GreenBHP - OTP Verification",
#         recipients=[email],
#         body=f"Your OTP code is {otp}",
#         subtype="plain",
#         multipart_subtype="alternative",
#     )
#     await fast_mail.send_message(message)


async def send_email_otp(email, otp):
    await email_sender.send("FoodieAI - OTP Verification", email, f"Your OTP code is {otp}")
