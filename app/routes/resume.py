from flask import Blueprint

resume_bp = Blueprint("resume", __name__)

@resume_bp.route("/test")
def test():
    return {"message": "Resume route working!"}