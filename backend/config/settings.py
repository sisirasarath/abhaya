"""
Django settings for ABHAYA – Women's Safety and Support Portal.
Configured for both local development and production Vercel Python deployment.
"""
import os
import socket
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

IS_VERCEL = (
    os.environ.get('VERCEL', '').strip().lower() in ('1', 'true', 'yes')
    or bool(os.environ.get('VERCEL_ENV'))
)

if not IS_VERCEL:
    load_dotenv(BASE_DIR / '.env')

_default_debug = 'False' if IS_VERCEL else 'True'
DEBUG = (
    False
    if os.environ.get('VERCEL_ENV') == 'production'
    else os.environ.get('DJANGO_DEBUG', _default_debug).strip().lower() in ('true', '1', 'yes')
)

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '').strip()
if not SECRET_KEY:
    if not DEBUG or IS_VERCEL:
        raise ImproperlyConfigured(
            'DJANGO_SECRET_KEY environment variable must be set in production.'
        )
    SECRET_KEY = 'django-insecure-local-dev-only-key-do-not-use-in-production'

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get(
        'DJANGO_ALLOWED_HOSTS',
        '.vercel.app,abhaya-73rt.vercel.app,localhost,127.0.0.1,testserver'
        if IS_VERCEL
        else 'localhost,127.0.0.1,testserver'
    ).split(',')
    if host.strip()
]
if IS_VERCEL and '.vercel.app' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('.vercel.app')

for _vercel_host_var in ('VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL'):
    _v_host = os.environ.get(_vercel_host_var, '').strip()
    if _v_host and _v_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(_v_host)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    # ABHAYA Portal Core App
    'portal.apps.PortalConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'


def _is_postgres_reachable(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=1.0):
            return True
    except OSError:
        return False


def _parse_database_url(url: str) -> dict:
    parsed = urlparse(url)
    scheme = (parsed.scheme or '').lower()
    if scheme not in ('postgres', 'postgresql', 'pgsql'):
        raise ImproperlyConfigured(
            f"Unsupported DATABASE_URL scheme '{scheme}'. Expected postgresql://."
        )
    query_params = parse_qs(parsed.query)
    ssl_require_env = os.environ.get('DB_SSL_REQUIRE', 'True' if (IS_VERCEL or not DEBUG) else 'False').strip().lower() in ('true', '1', 'yes')
    default_sslmode = 'require' if (ssl_require_env or IS_VERCEL or not DEBUG) else 'prefer'
    sslmode = (
        query_params.get('sslmode', [None])[0]
        or os.environ.get('DB_SSLMODE', default_sslmode)
    )
    options = {}
    if sslmode:
        options['sslmode'] = sslmode

    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': unquote(parsed.path.lstrip('/')),
        'USER': unquote(parsed.username or ''),
        'PASSWORD': unquote(parsed.password or ''),
        'HOST': parsed.hostname or '',
        'PORT': str(parsed.port or 5432),
        'CONN_MAX_AGE': int(os.environ.get('DB_CONN_MAX_AGE', '0' if IS_VERCEL else '60')),
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': options,
    }


_database_url = os.environ.get('DATABASE_URL', '').strip()
_db_engine = os.environ.get('DB_ENGINE', 'django.db.backends.postgresql').strip()
_db_host = os.environ.get('DB_HOST', '').strip()
_db_port = int(os.environ.get('DB_PORT', '5432'))
_default_fallback_sqlite = 'False' if (IS_VERCEL or not DEBUG or _database_url) else 'True'
_fallback_sqlite = os.environ.get('DB_FALLBACK_SQLITE', _default_fallback_sqlite).strip().lower() in ('true', '1', 'yes')

if _database_url:
    DATABASES = {
        'default': _parse_database_url(_database_url),
    }
    ACTIVE_DATABASE_BACKEND = 'PostgreSQL'
elif IS_VERCEL or not DEBUG or not _fallback_sqlite:
    # Production / strict PostgreSQL mode: never silently fall back to SQLite
    if not _db_host:
        raise ImproperlyConfigured(
            'Production database is not configured. Set DATABASE_URL (recommended) or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD.'
        )
    _sslmode = os.environ.get('DB_SSLMODE', 'require' if IS_VERCEL or not DEBUG else 'prefer').strip()
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'abhaya_db'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': _db_host,
            'PORT': str(_db_port),
            'CONN_MAX_AGE': int(os.environ.get('DB_CONN_MAX_AGE', '0' if IS_VERCEL else '60')),
            'CONN_HEALTH_CHECKS': True,
            'OPTIONS': {'sslmode': _sslmode} if _sslmode else {},
        }
    }
    ACTIVE_DATABASE_BACKEND = 'PostgreSQL'
elif _db_engine == 'django.db.backends.postgresql' and _db_host and _is_postgres_reachable(_db_host, _db_port):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'abhaya_db'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
            'HOST': _db_host,
            'PORT': str(_db_port),
            'CONN_MAX_AGE': 60,
            'CONN_HEALTH_CHECKS': True,
        }
    }
    ACTIVE_DATABASE_BACKEND = 'PostgreSQL'
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'abhaya_db.sqlite3',
        }
    }
    ACTIVE_DATABASE_BACKEND = 'PostgreSQL-Compatible Local Store (SQLite Fallback)'

AUTH_USER_MODEL = 'portal.PortalUser'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = Path('/tmp/staticfiles') if IS_VERCEL else (BASE_DIR / 'staticfiles')

MEDIA_URL = os.environ.get('MEDIA_URL', '/media/')
MEDIA_ROOT = Path('/tmp/media') if IS_VERCEL else (BASE_DIR / 'media')

# External S3-Compatible Object Storage Support for Production Media Attachments
# Set AWS_STORAGE_BUCKET_NAME (works with AWS S3, Cloudflare R2, Supabase S3, Backblaze B2)
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME', '').strip()
if AWS_STORAGE_BUCKET_NAME:
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '').strip()
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '').strip()
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'auto').strip()
    AWS_S3_ENDPOINT_URL = os.environ.get('AWS_S3_ENDPOINT_URL', '').strip() or None
    AWS_S3_CUSTOM_DOMAIN = os.environ.get('AWS_S3_CUSTOM_DOMAIN', '').strip() or None
    AWS_QUERYSTRING_AUTH = True
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3.S3Storage',
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }

# File upload security limits (5 MB max per attachment)
MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_ATTACHMENT_SIZE_BYTES + (512 * 1024)
FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_ATTACHMENT_SIZE_BYTES

ALLOWED_ATTACHMENT_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'}
ALLOWED_ATTACHMENT_CONTENT_TYPES = {
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'portal.authentication.CookieOrHeaderJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/minute',
        'user': '300/minute',
        'auth_burst': '30/minute',
    },
    'EXCEPTION_HANDLER': 'config.exceptions.custom_exception_handler',
}

ACCESS_TOKEN_MINUTES = int(os.environ.get('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', '120'))
REFRESH_TOKEN_DAYS = int(os.environ.get('JWT_REFRESH_TOKEN_LIFETIME_DAYS', '7'))

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=ACCESS_TOKEN_MINUTES),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=REFRESH_TOKEN_DAYS),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

JWT_ACCESS_COOKIE_NAME = 'abhaya_access_token'
JWT_REFRESH_COOKIE_NAME = 'abhaya_refresh_token'
_default_cookie_secure = 'True' if (IS_VERCEL or not DEBUG) else 'False'
JWT_COOKIE_SECURE = os.environ.get('JWT_COOKIE_SECURE', _default_cookie_secure).strip().lower() in ('true', '1', 'yes')
_default_cookie_samesite = 'None' if JWT_COOKIE_SECURE else 'Lax'
JWT_COOKIE_SAMESITE = os.environ.get('JWT_COOKIE_SAMESITE', _default_cookie_samesite).strip()
JWT_COOKIE_HTTP_ONLY = True

_default_cors_origins = (
    'https://abhaya-womens-safety.vercel.app,'
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000'
)
CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip('/')
    for origin in os.environ.get('CORS_ALLOWED_ORIGINS', _default_cors_origins).split(',')
    if origin.strip()
]
if 'https://abhaya-womens-safety.vercel.app' not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append('https://abhaya-womens-safety.vercel.app')
CORS_ALLOW_CREDENTIALS = True

_default_csrf_origins = (
    'https://abhaya-womens-safety.vercel.app,https://abhaya-73rt.vercel.app,'
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000'
)
CSRF_TRUSTED_ORIGINS = [
    origin.strip().rstrip('/')
    for origin in os.environ.get('CSRF_TRUSTED_ORIGINS', _default_csrf_origins).split(',')
    if origin.strip()
]
for _prod_origin in ('https://abhaya-womens-safety.vercel.app', 'https://abhaya-73rt.vercel.app'):
    if _prod_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_prod_origin)

for _vercel_host_var in ('VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL'):
    _v_host = os.environ.get(_vercel_host_var, '').strip()
    if _v_host:
        _https_origin = f"https://{_v_host}"
        if _https_origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(_https_origin)

# Configurable SMTP Email Service
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.example.edu.in')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').strip().lower() in ('true', '1', 'yes')
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'abhaya-noreply@college.edu.in')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get(
    'DEFAULT_FROM_EMAIL',
    "ABHAYA Women's Safety Portal <abhaya-noreply@college.edu.in>"
)

if not DEBUG or IS_VERCEL:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
