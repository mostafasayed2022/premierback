from datetime import timedelta
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = [
    'premierhealthclinics.com',
    'www.premierhealthclinics.com',
    'api.premierhealthclinics.com',

]

CSRF_TRUSTED_ORIGINS = [
    'https://premierhealthclinics.com/',
    'https://www.premierhealthclinics.com/',
    'https://api.premierhealthclinics.com/',

]

CORS_ALLOWED_ORIGINS = [
    'https://premierhealthclinics.com',
    'https://www.premierhealthclinics.com',
]
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True  
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept', 'authorization', 'content-type',
    'x-csrftoken', 'x-requested-with',
]

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'cloudinary_storage',
    'django.contrib.staticfiles',
    'cloudinary',
    'rest_framework_simplejwt',
    'rest_framework',
    'corsheaders',
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",

    #project apps
    'client',
    
    "apps",
   
    
    "apps.files",          # ← new
    "apps.schema",
    "core",

]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

ROOT_URLCONF = 'premierhealthcare.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'premierhealthcare.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#         'OPTIONS': {
#             # Increase timeout to 20 seconds to fix "database is locked" OperationalErrors
#             # when handling concurrent requests or Celery tasks
#             'timeout': 20,
#         }
#     }
# }
AUTH_USER_MODEL = "client.CustomUser"
DATABASES = {

    "default": {

        "ENGINE": "django.db.backends.postgresql",

        "NAME": os.getenv("DB_NAME", "premierdb"),

        "USER": os.getenv("DB_USER", "premieruser"),

        "PASSWORD": os.getenv("DB_PASSWORD", "MOHAMEDhossam123"),

        "HOST": "127.0.0.1",

        "PORT": "5432",

        "CONN_MAX_AGE": 600,

    }

}

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# ── File upload limits ────────────────────────────────────────────────────
# Django's default DATA_UPLOAD_MAX_MEMORY_SIZE is 2.5 MB — raise it so
# video files (up to 100 MB) are accepted before reaching DRF validation.
DATA_UPLOAD_MAX_MEMORY_SIZE  = 150 * 1024 * 1024   # 150 MB
FILE_UPLOAD_MAX_MEMORY_SIZE  = 150 * 1024 * 1024   # 150 MB (switches to temp-file above this)

# ── DRF ──────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "core.authentication.SafeJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAdminUser",
    ),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardResultsPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_FILTER_BACKENDS": [
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "10000/day",
        "user": "50000/day",
    },
}

# Media & Cloudinary Storage
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
}

STORAGES = {
    "default": {
        # AutoTypeCloudinaryStorage automatically picks resource_type='image',
        # 'video', or 'raw' based on the file extension, so .mp4/.mov uploads
        # are sent to Cloudinary as videos instead of failing with
        # "Invalid image file".
        "BACKEND": "core.storage.AutoTypeCloudinaryStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        # or "cloudinary_storage.storage.StaticHashedCloudinaryStorage" if you
        # also want static assets (not just uploads) served from Cloudinary
    },
}

FRONTEND_DIR = os.path.join(BASE_DIR, "..", "front_end")
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'core.staticfiles.NpmBuildFinder',   # your custom finder
]


EMAIL_USE_TLS = True



# Fix SSL hostname mismatch
EMAIL_SSL_CERTFILE = None
EMAIL_SSL_KEYFILE = None
EMAIL_TIMEOUT = 30
#email config

EMAIL_FILE_PATH = BASE_DIR / 'sent_emails'
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

EMAIL_USE_TLS = True  
EMAIL_HOST = os.getenv('EMAIL_HOST')  
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')   #server email
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')   
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
   


PAYMOB_API_KEY = os.getenv('PAYMOB_API_KEY')
PAYMOB_INTEGRATION_ID = os.getenv('PAYMOB_INTEGRATION_ID')
PAYMOB_HMAC_SECRET = os.getenv('PAYMOB_HMAC_SECRET')
PAYMOB_IFRAME_ID = os.getenv('PAYMOB_IFRAME_ID')

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
#celery 


# ==================== CELERY CONFIGURATION ====================
from kombu import Queue

CELERY_BROKER_URL = "redis://127.0.0.1:6379/0"
CELERY_RESULT_BACKEND = None         # <-- disable result backend completely

CELERY_TASK_IGNORE_RESULT = True     # you already have this
# ... rest of your settings (seria

CELERY_RESULT_EXPIRES = 60

CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']

CELERY_WORKER_POOL = 'threads'

CELERY_ENABLE_UTC = True
CELERY_TIMEZONE = 'UTC'

CELERY_WORKER_CONCURRENCY = 4
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_MAX_TASKS_PER_CHILD = 50
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True

CELERY_TASK_SOFT_TIME_LIMIT = 30
CELERY_TASK_TIME_LIMIT = 60

CELERY_TASK_DEFAULT_RETRY_DELAY = 10
CELERY_TASK_MAX_RETRIES = 3
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BROKER_CONNECTION_MAX_RETRIES = 10

CELERY_BROKER_TRANSPORT_OPTIONS = {
    'global_keyprefix': 'celery:',
    'visibility_timeout': 3600,
    'broker_connection_retry_on_startup': True,
}
# ---- Priority queues ----
CELERY_TASK_QUEUES = (
    Queue('default', routing_key='default'),
    Queue('high_priority', routing_key='high_priority'),
)
CELERY_TASK_DEFAULT_QUEUE = 'default'
CELERY_TASK_DEFAULT_ROUTING_KEY = 'default'

CELERY_TASK_ROUTES = {
    # Replace 'your_app.tasks.send_password_reset_email' with the actual path
    
    'client.tasks.test_print':{
       'queue': 'high_priority',
              'routing_key': 'high_priority',  
    },
}
