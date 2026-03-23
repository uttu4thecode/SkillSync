# SkillSync — AI-Powered ATS Resume Scorer

SkillSync is a full-stack AI-powered web application that analyzes resumes against job descriptions using NLP to generate a match score and detailed feedback.

## Features

- Upload resume in PDF or DOCX format
- Paste any job description and get instant analysis
- AI-powered match score using TF-IDF and cosine similarity
- Identifies matched skills, missing skills and keyword gaps
- Actionable suggestions to improve your resume
- Scan history to track previous analyses
- Secure JWT-based user authentication

## Tech Stack

**Backend:** Python, Flask, Flask-SQLAlchemy, Flask-JWT-Extended

**NLP:** scikit-learn, spaCy, TF-IDF Vectorization, Cosine Similarity

**Database:** SQLite (development), PostgreSQL (production)

**Frontend:** HTML, CSS, JavaScript

**File Parsing:** pdfplumber, python-docx

## Project Structure
```
skillsync/
├── app/
│   ├── __init__.py         # App factory
│   ├── routes/             # API endpoints
│   ├── models/             # Database models
│   ├── services/           # NLP engine
│   ├── utils/              # File parser
│   ├── static/             # CSS and JS
│   └── templates/          # HTML pages
├── config.py               # Configuration
├── run.py                  # Entry point
└── requirements.txt        # Dependencies
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get token |
| POST | `/api/resume/upload` | Upload resume file |
| POST | `/api/resume/analyze` | Analyze against JD |
| GET | `/api/resume/history` | Get scan history |
| GET | `/api/resume/result/<id>` | Get single result |

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/skillsync.git
cd skillsync
```

### 2. Create virtual environment
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 4. Create `.env` file
```
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
DATABASE_URI=sqlite:///skillsync.db
```

### 5. Run the application
```bash
python run.py
```

### 6. Open in browser
```
http://127.0.0.1:5000/api/auth/
```

## How It Works

1. User registers and logs in
2. Upload your resume (PDF or DOCX)
3. Paste the job description
4. SkillSync extracts skills from both using NLP
5. Calculates match score using TF-IDF cosine similarity
6. Returns matched skills, missing skills and improvement suggestions

## Author

Built by Utkarsh635