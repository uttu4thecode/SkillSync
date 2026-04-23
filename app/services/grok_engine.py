import requests
import json

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def generate_ai_insights(api_key, matched_skills, missing_skills, job_description, resume_text):
    """Generate comprehensive AI career insights using Groq API."""

    matched_str = ", ".join(matched_skills) if matched_skills else "None detected"
    missing_str = ", ".join(missing_skills) if missing_skills else None

    if missing_str:
        learning_context = (
            f"The candidate is MISSING these skills required by the JD: {missing_str}. "
            "Build the learning path around closing these gaps."
        )
    else:
        learning_context = (
            "The NLP engine detected NO specific skill gaps. "
            "Generate a GENERALIZED growth-oriented learning plan based on the job description — "
            "focus on advanced topics, certifications, tools, and best practices relevant to this role "
            "to help the candidate go from good to excellent."
        )

    prompt = f"""You are an expert career counselor. Analyze this candidate profile and provide detailed career guidance.

**Candidate's Current Skills:** {matched_str}
**Skill Gaps (from NLP analysis):** {missing_str or "None detected by NLP"}
**Learning Instruction:** {learning_context}
**Job Description:** {job_description[:1500]}
**Resume Summary:** {resume_text[:1500]}

Return ONLY a valid JSON object (no markdown, no code blocks) with exactly these keys:

1. "learning_paths": Array of 4-6 items. Each item: {{"skill":"skill name","priority":"High/Medium/Low","resources":[{{"title":"course or video title","url":"real working URL to YouTube/Coursera/freeCodeCamp/official docs","platform":"YouTube/Coursera/freeCodeCamp/Docs"}}]}} (2-3 resources per skill)

2. "job_predictions": Array of 4-5 jobs the candidate can apply for: {{"title":"Job Title","salary_min":number,"salary_max":number,"match_level":"Strong Match/Good Match/Growing Into","why":"one line reason"}}

3. "career_roadmap": {{"current_level":"Junior/Mid/Senior","target_role":"role from JD","timeline":"e.g. 6-12 months","milestones":[{{"phase":1,"title":"Phase title","tasks":["task1","task2","task3"],"duration":"e.g. 2 months"}}]}} with 4-6 milestones

4. "interview_prep": Array of 5 questions: {{"question":"full question text","category":"Technical/Behavioral/System Design","difficulty":"Easy/Medium/Hard","tip":"brief answering strategy"}}

5. "resume_tips": Array of 4-5 specific actionable improvement tip strings.

6. "skill_analysis": {{"strongest_areas":["area1","area2","area3"],"critical_gaps":["gap1","gap2","gap3"],"market_demand":"1-2 sentence market outlook for this role"}}

Return ONLY the JSON object with no extra text."""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You are a career guidance expert. Always respond with only valid JSON, no markdown."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 4000
    }

    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()

        data = response.json()
        content = data["choices"][0]["message"]["content"].strip()

        # Strip markdown code fences if present
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        insights = json.loads(content)
        return {"status": "success", "insights": insights}

    except Exception as e:
        print(f"Groq API Error: {e}")
        return {
            "status": "error",
            "message": str(e),
            "insights": {
                "learning_paths": [],
                "job_predictions": [],
                "career_roadmap": {
                    "current_level": "N/A",
                    "target_role": "N/A",
                    "timeline": "N/A",
                    "milestones": []
                },
                "interview_prep": [],
                "resume_tips": ["AI insights temporarily unavailable. Please try again."],
                "skill_analysis": {
                    "strongest_areas": [],
                    "critical_gaps": [],
                    "market_demand": "N/A"
                }
            }
        }
