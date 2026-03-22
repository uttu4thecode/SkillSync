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


from app.services.nlp_engine import analyze_resume
from app.models.user import Resume, ScanResult
import json

@resume_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get("resume_id") or not data.get("job_description"):
        return jsonify({"status": "error", "message": "resume_id and job_description are required"}), 400

    resume = Resume.query.filter_by(id=data["resume_id"], user_id=user_id).first()
    if not resume:
        return jsonify({"status": "error", "message": "Resume not found"}), 404

    result = analyze_resume(resume.extracted_text, data["job_description"])

    scan = ScanResult(
        user_id=user_id,
        resume_id=resume.id,
        job_description=data["job_description"],
        final_score=result["final_score"],
        similarity_score=result["similarity_score"],
        skill_match_score=result["skill_match_score"],
        matched_skills=",".join(result["matched_skills"]),
        missing_skills=",".join(result["missing_skills"]),
        suggestions="|".join(result["suggestions"])
    )
    db.session.add(scan)
    db.session.commit()

    return jsonify({
        "status": "success",
        "scan_id": scan.id,
        "result": result
    }), 200