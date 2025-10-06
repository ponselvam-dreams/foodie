from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from app.core.config import settings

# Initialize OAuth
# config = Config(environ={
#     'GOOGLE_CLIENT_ID': settings.OAUTH_CLIENT_ID,
#     'GOOGLE_CLIENT_SECRET': settings.OAUTH_CLIENT_SECRET,
# })
# oauth = OAuth(config)
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.OAUTH_CLIENT_ID,
    client_secret=settings.OAUTH_CLIENT_SECRET,
    # authorize_url=settings.OAUTH_AUTH_URL,
    # authorize_params=settings.OAUTH_AUTHORIZE_PARAMS,
    # access_token_url=settings.OAUTH_ACCESS_TOKEN_URL,
    # access_token_params=settings.OAUTH_ACCESS_TOKEN_PARAMS,
    # refresh_token_url=settings.OAUTH_REFRESH_TOKEN_URL,
    # redirect_uri=settings.OAUTH_REDIRECT_URI,
    client_kwargs={"scope": settings.OAUTH_SCOPE,
                   "redirect_url": settings.OAUTH_REDIRECT_URI},
    server_metadata_url=settings.OAUTH_SERVER_METADATA_URL
)