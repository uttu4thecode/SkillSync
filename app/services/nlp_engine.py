import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

nlp = spacy.load("en_core_web_sm")

SKILLS_VOCAB = [
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go",
    "flask", "django", "fastapi", "spring", "react", "angular", "vue", "nodejs",
    "sql", "mysql", "postgresql", "mongodb", "redis", "sqlite",
    "machine learning", "deep learning", "nlp", "computer vision",
    "scikit-learn", "tensorflow", "pytorch", "keras", "pandas", "numpy",
    "docker", "kubernetes", "aws", "azure", "gcp", "linux",
    "git", "rest api", "graphql", "microservices", "agile", "scrum",
    "data analysis", "data science", "excel", "tableau", "power bi"
]


def extract_keywords(text):
    """Extract meaningful keywords from text using spaCy."""
    doc = nlp(text.lower())
    keywords = set()

    for chunk in doc.noun_chunks:
        keywords.add(chunk.text.strip())
    for ent in doc.ents:
        keywords.add(ent.text.strip())

    for token in doc:
        if not token.is_stop and not token.is_punct and len(token.text) > 2:
            keywords.add(token.lemma_.strip())

    return keywords


def extract_skills(text):
    """Match text against known skills vocabulary."""
    text_lower = text.lower()
    found_skills = set()
    for skill in SKILLS_VOCAB:
        if skill in text_lower:
            found_skills.add(skill)
    return found_skills


def calculate_similarity(resume_text, jd_text):
    """Calculate cosine similarity between resume and job description."""
    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        return round(float(similarity[0][0]) * 100, 2)
    except Exception:
        return 0.0


def analyze_resume(resume_text, jd_text):
    """Main function — returns full analysis."""

    similarity_score = calculate_similarity(resume_text, jd_text)

    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(jd_text)

    matched_skills = resume_skills.intersection(jd_skills)
    missing_skills = jd_skills.difference(resume_skills)

    jd_keywords = extract_keywords(jd_text)
    resume_keywords = extract_keywords(resume_text)
    missing_keywords = jd_keywords.difference(resume_keywords)

    if len(jd_skills) > 0:
        skill_match_score = (len(matched_skills) / len(jd_skills)) * 100
    else:
        skill_match_score = 0.0

    final_score = round((0.6 * similarity_score) + (0.4 * skill_match_score), 2)

    suggestions = []
    if missing_skills:
        suggestions.append(f"Add these missing skills to your resume: {', '.join(list(missing_skills)[:5])}")
    if final_score < 50:
        suggestions.append("Your resume needs significant tailoring for this job.")
    elif final_score < 75:
        suggestions.append("Good match! A few tweaks will improve your score further.")
    else:
        suggestions.append("Excellent match! Your resume is well aligned with this job.")

    return {
        "final_score": final_score,
        "similarity_score": similarity_score,
        "skill_match_score": round(skill_match_score, 2),
        "matched_skills": list(matched_skills),
        "missing_skills": list(missing_skills),
        "missing_keywords": list(missing_keywords)[:10],
        "suggestions": suggestions
    }