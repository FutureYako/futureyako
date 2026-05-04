from .base import *  # noqa

DEBUG = True

ALLOWED_HOSTS = ["*"]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Use local file storage for dev (no S3 needed)
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"

# Relax CORS for local dev
CORS_ALLOW_ALL_ORIGINS = True

# Use SQLite for development (easier than PostgreSQL)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
