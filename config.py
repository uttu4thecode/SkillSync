import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-jwt-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URI", "sqlite:///skillsync.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    DEBUG = os.getenv("DEBUG", "False") == "True"