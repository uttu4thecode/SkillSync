const API = "/api";
const token = localStorage.getItem("token");
let currentResumeId = null;
let currentScanId = null;

if (!token) window.location.href = "/api/auth/";

document.getElementById("nav-username").textContent = "Hi, " + localStorage.getItem("username");

document.getElementById("resume-file").addEventListener("change", function () {
    if (this.files && this.files[0]) {
        document.getElementById("file-name").textContent = "Selected: " + this.files[0].name;
    }
});

function logout() {
    localStorage.clear();
    window.location.href = "/api/auth/";
}

/* ──────────────────────────────────────────
   UPLOAD
────────────────────────────────────────── */
async function uploadResume(event) {
    event.preventDefault();
    const fileInput = document.getElementById("resume-file");
    if (!fileInput.files || fileInput.files.length === 0) {
        showMsg("upload-message", "Please select a file first.", "error");
        return;
    }
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    showMsg("upload-message", "Uploading...", "");

    try {
        const res = await fetch(`${API}/resume/upload`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + token },
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            currentResumeId = data.resume_id;
            document.getElementById("file-name").textContent = "✓ " + file.name;
            showMsg("upload-message", "Uploaded! Resume ID: " + currentResumeId, "success");
        } else {
            showMsg("upload-message", data.message || "Upload failed", "error");
        }
    } catch (err) {
        showMsg("upload-message", "Connection error — is Flask running?", "error");
    }
}

/* ──────────────────────────────────────────
   ANALYZE (NLP)
────────────────────────────────────────── */
async function analyze(event) {
    event.preventDefault();
    const jd = document.getElementById("job-description").value.trim();
    if (!currentResumeId) { showMsg("analyze-message", "Please upload a resume first.", "error"); return; }
    if (!jd) { showMsg("analyze-message", "Please enter a job description.", "error"); return; }

    showMsg("analyze-message", "Analyzing with NLP...", "");

    // Hide old AI panel
    document.getElementById("ai-insights-panel").style.display = "none";
    document.getElementById("result-card").style.display = "none";

    try {
        const res = await fetch(`${API}/resume/analyze`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({ resume_id: currentResumeId, job_description: jd })
        });
        const data = await res.json();
        if (res.ok) {
            currentScanId = data.scan_id;
            showMsg("analyze-message", "NLP analysis complete! Click below to get AI insights.", "success");
            displayResult(data.result);
            loadHistory();
        } else {
            showMsg("analyze-message", data.message, "error");
        }
    } catch (err) {
        showMsg("analyze-message", "Connection error.", "error");
    }
}

/* ──────────────────────────────────────────
   DISPLAY NLP RESULT
────────────────────────────────────────── */
function displayResult(result) {
    document.getElementById("result-card").style.display = "block";
    document.getElementById("btn-ai-insights").style.display = "block";

    const score = result.final_score;
    document.getElementById("score-value").textContent = score + "%";

    const circle = document.getElementById("score-circle");
    if (score >= 75) circle.style.borderColor = "#22c55e";
    else if (score >= 50) circle.style.borderColor = "#f59e0b";
    else circle.style.borderColor = "#ef4444";

    document.getElementById("similarity-bar").style.width = result.similarity_score + "%";
    document.getElementById("similarity-value").textContent = result.similarity_score + "%";
    document.getElementById("skill-bar").style.width = result.skill_match_score + "%";
    document.getElementById("skill-value").textContent = result.skill_match_score + "%";

    document.getElementById("matched-skills").innerHTML = result.matched_skills.filter(s => s).length
        ? result.matched_skills.filter(s => s).map(s => `<span class="skill-tag matched">${s}</span>`).join("")
        : "<small style='color:#aaa'>None found — try pasting a detailed JD</small>";

    document.getElementById("missing-skills").innerHTML = result.missing_skills.filter(s => s).length
        ? result.missing_skills.filter(s => s).map(s => `<span class="skill-tag missing">${s}</span>`).join("")
        : "<small style='color:#22c55e'>No hard skill gaps detected by NLP engine</small>";

    document.getElementById("suggestions-list").innerHTML =
        result.suggestions.map(s => `<li>${s}</li>`).join("");
}

/* ──────────────────────────────────────────
   LOAD AI INSIGHTS (GROQ)
────────────────────────────────────────── */
async function loadAIInsights() {
    if (!currentScanId) { alert("Please analyze a resume first."); return; }

    document.getElementById("btn-ai-insights").style.display = "none";
    document.getElementById("ai-loading-msg").style.display = "block";
    document.getElementById("ai-insights-panel").style.display = "none";

    try {
        const res = await fetch(`${API}/resume/ai-insights`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({ scan_id: currentScanId })
        });
        const data = await res.json();

        document.getElementById("ai-loading-msg").style.display = "none";

        if (data.status === "success" || data.insights) {
            renderAIInsights(data.insights);
            document.getElementById("ai-insights-panel").style.display = "block";
            document.getElementById("ai-insights-panel").scrollIntoView({ behavior: "smooth" });
        } else {
            document.getElementById("btn-ai-insights").style.display = "block";
            alert("AI insights error: " + (data.message || "Unknown error"));
        }
    } catch (err) {
        document.getElementById("ai-loading-msg").style.display = "none";
        document.getElementById("btn-ai-insights").style.display = "block";
        alert("Connection error while loading AI insights.");
    }
}

/* ──────────────────────────────────────────
   RENDER AI INSIGHTS
────────────────────────────────────────── */
function renderAIInsights(ins) {
    /* 1. Skill Analysis */
    const sa = ins.skill_analysis || {};
    document.getElementById("skill-analysis-content").innerHTML = `
        <div class="sa-grid">
            <div class="sa-box strong">
                <h5>💪 Strongest Areas</h5>
                <ul>${(sa.strongest_areas || []).map(a => `<li>${a}</li>`).join("") || "<li>N/A</li>"}</ul>
            </div>
            <div class="sa-box gaps">
                <h5>⚠️ Critical Gaps</h5>
                <ul>${(sa.critical_gaps || []).map(a => `<li>${a}</li>`).join("") || "<li>N/A</li>"}</ul>
            </div>
        </div>
        <p class="market-demand">📈 <strong>Market Outlook:</strong> ${sa.market_demand || "N/A"}</p>`;

    /* 2. Learning Paths */
    const lp = ins.learning_paths || [];
    document.getElementById("learning-path-content").innerHTML = lp.length
        ? lp.map(path => `
            <div class="lp-item">
                <div class="lp-header">
                    <span class="lp-skill">${path.skill}</span>
                    <span class="lp-priority priority-${(path.priority || "medium").toLowerCase()}">${path.priority || "Medium"} Priority</span>
                </div>
                <div class="lp-resources">
                    ${(path.resources || []).map(r => `
                        <a href="${r.url}" target="_blank" class="resource-link">
                            <span class="resource-platform">${r.platform}</span>
                            <span class="resource-title">${r.title}</span>
                            <span class="resource-arrow">→</span>
                        </a>`).join("")}
                </div>
            </div>`).join("")
        : "<p class='ai-empty'>No skill gaps detected — great profile!</p>";

    /* 3. Job Predictions */
    const jp = ins.job_predictions || [];
    document.getElementById("job-predictions-content").innerHTML = jp.length
        ? jp.map(job => `
            <div class="job-card">
                <div class="job-header">
                    <span class="job-title">${job.title}</span>
                    <span class="job-match match-${(job.match_level || "").replace(/\s+/g, "-").toLowerCase()}">${job.match_level || "Match"}</span>
                </div>
                <div class="job-salary">💰 $${(job.salary_min || 0).toLocaleString()} – $${(job.salary_max || 0).toLocaleString()} / year</div>
                <div class="job-why">${job.why || ""}</div>
            </div>`).join("")
        : "<p class='ai-empty'>No job predictions available.</p>";

    /* 4. Career Roadmap */
    const cr = ins.career_roadmap || {};
    document.getElementById("career-roadmap-content").innerHTML = `
        <div class="roadmap-meta">
            <span class="rm-tag">📍 Current: <strong>${cr.current_level || "N/A"}</strong></span>
            <span class="rm-tag">🎯 Target: <strong>${cr.target_role || "N/A"}</strong></span>
            <span class="rm-tag">⏱ Timeline: <strong>${cr.timeline || "N/A"}</strong></span>
        </div>
        <div class="roadmap-milestones">
            ${(cr.milestones || []).map((m, i) => `
                <div class="milestone">
                    <div class="milestone-num">${m.phase || i + 1}</div>
                    <div class="milestone-body">
                        <div class="milestone-title">${m.title} <span class="milestone-dur">${m.duration || ""}</span></div>
                        <ul class="milestone-tasks">${(m.tasks || []).map(t => `<li>${t}</li>`).join("")}</ul>
                    </div>
                </div>`).join("")}
        </div>`;

    /* 5. Interview Prep */
    const ip = ins.interview_prep || [];
    document.getElementById("interview-prep-content").innerHTML = ip.length
        ? ip.map((q, i) => `
            <div class="interview-q">
                <div class="iq-header">
                    <span class="iq-num">Q${i + 1}</span>
                    <span class="iq-cat">${q.category || ""}</span>
                    <span class="iq-diff diff-${(q.difficulty || "medium").toLowerCase()}">${q.difficulty || "Medium"}</span>
                </div>
                <p class="iq-question">${q.question}</p>
                <p class="iq-tip">💡 <em>${q.tip || ""}</em></p>
            </div>`).join("")
        : "<p class='ai-empty'>No interview questions generated.</p>";

    /* 6. Resume Tips */
    const rt = ins.resume_tips || [];
    document.getElementById("resume-tips-content").innerHTML = rt.length
        ? `<ul class="resume-tips-list">${rt.map(t => `<li>${t}</li>`).join("")}</ul>`
        : "<p class='ai-empty'>No resume tips available.</p>";
}

/* ──────────────────────────────────────────
   HISTORY
────────────────────────────────────────── */
async function loadHistory() {
    try {
        const res = await fetch(`${API}/resume/history`, { headers: { "Authorization": "Bearer " + token } });
        const data = await res.json();
        const container = document.getElementById("history-list");
        if (!data.scans || data.scans.length === 0) {
            container.innerHTML = "<p class='no-history'>No scans yet.</p>";
            return;
        }
        container.innerHTML = data.scans.map(scan => `
            <div class="history-item">
                <span>Scan #${scan.id} — ${new Date(scan.created_at).toLocaleDateString()}</span>
                <span class="history-score">${scan.final_score}%</span>
            </div>`).join("");
    } catch (err) {
        console.error("History error:", err);
    }
}

function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = "message " + type;
}

loadHistory();