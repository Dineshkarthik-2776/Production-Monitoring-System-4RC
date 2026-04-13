from pathlib import Path
import os
from rest_framework.authentication import TokenAuthentication

BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================
# CORE SETTINGS
# ============================================================
SECRET_KEY = 'django-insecure-d%=f2-^t(i1w#@fcl3(j5pdl9)k&_3!!u8$xm6+uh13qeoedtf'
DEBUG = True
ALLOWED_HOSTS = ['*']
LOGIN_URL = '/api/auth/login/'

CORS_ORIGIN_ALLOW_ALL = True

# ============================================================
# APPLICATIONS
# ============================================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'user_authentication',
    'data_processor.apps.DataProcessorConfig',
    'corsheaders',
    'reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # put CORS before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'backend.wsgi.application'

# ============================================================
# DATABASE
# ============================================================

# PRODUCTION DATABASE
# DATABASES = {
#     'default': {
#         'ENGINE': 'mssql',  # Requires mssql-django package
#         'NAME': 'Dashboard',
#         'USER': 'django_user',
#         'PASSWORD': '4rc@jkti',
#         'HOST': '192.168.230.101',  
#         'PORT': '1433',
#         'OPTIONS': {
#             'driver': 'ODBC Driver 17 for SQL Server',
#         },
#     }
# }


# LOCAL DATABASE
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'dashboard',
        'USER': 'dinesh',
        'PASSWORD': '2776',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}


# ============================================================
# AUTH / REST FRAMEWORK
# ============================================================
AUTH_USER_MODEL = 'user_authentication.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
}

# ============================================================
# INTERNATIONALIZATION
# ============================================================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ============================================================
# STATIC FILES
# ============================================================
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# ============================================================
# CELERY CONFIG
# ============================================================
CELERY_BROKER_URL = 'redis://127.0.0.1:6379/0'
CELERY_RESULT_BACKEND = 'redis://127.0.0.1:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

CELERY_BEAT_SCHEDULE = {
    'process-raw-data-every-5-minutes': {
        'task': 'process_changeover_data',
        'schedule': 300.0,
        'args': [False],
    },
}

# ============================================================
# LOGGING CONFIGURATION
# ============================================================
LOG_DIR = os.path.join(BASE_DIR, '..', 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{asctime} [{levelname}] {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(LOG_DIR, 'django_backend.log'),
            'formatter': 'verbose',
        },
        'console': {  # 👈 Add this handler properly
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.server': {  # 👈 ensures HTTP requests appear in console
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
