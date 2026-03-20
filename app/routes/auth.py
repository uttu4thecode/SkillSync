from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    
    if not data or not data.get("username") or not data.get("email") or not data.get("password"):
        return jsonify({"status": "error", "message": "All fields are required"}), 400

    
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"status": "error", "message": "Email already registered"}), 409

    
    hashed_password = generate_password_hash(data["password"])
    new_user = User(
        username=data["username"],
        email=data["email"],
        password=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"status": "success", "message": "User registered successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"status": "error", "message": "Email and password required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not check_password_hash(user.password, data["password"]):
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "status": "success",
        "message": "Login successful",
        "token": access_token,
        "user": user.to_dict()
    }), 200