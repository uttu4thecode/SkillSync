from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import Resume
from app.utils.file_parser import allowed_file, parse_resume
import os
import uuid

resume_bp = Blueprint("resume", __name__)


@resume_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_resume():
    user_id = get_jwt_identity()

    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"status": "error", "message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"status": "error", "message": "Only PDF and DOCX files allowed"}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_filename)
    file.save(filepath)

    extracted_text = parse_resume(filepath)

    if not extracted_text:
        return jsonify({"status": "error", "message": "Could not extract text from file"}), 422

    resume = Resume(
        user_id=user_id,
        filename=file.filename,
        extracted_text=extracted_text
    )
    db.session.add(resume)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Resume uploaded and parsed successfully",
        "resume_id": resume.id,
        "preview": extracted_text[:300] + "..."
    }), 201