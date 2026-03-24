const API = "https://skillsync-production-f866.up.railway.app/api";
const token = localStorage.getItem("token");
let currentResumeId = null;

if (!token) window.location.href = "index.html";

document.getElementById("nav-username").textContent = "Hi, " + localStorage.getItem("username");

// Show filename when file is selected
document.getElementById("resume-file").addEventListener("change", function() {
    if (this.files && this.files[0]) {
        document.getElementById("file-name").textContent = "Selected: " + this.files[0].name;
        console.log("File ready:", this.files[0].name);
    }
});

function logout() {
    localStorage.clear();
    window.location.href = "/api/auth/";
}

async function uploadResume(event) {
    event.preventDefault();
    event.stopPropagation();

    const fileInput = document.getElementById("resume-file");

    if (!fileInput.files || fileInput.files.length === 0) {
        showMsg("upload-message", "Please select a file first.", "error");
        return false;
    }

    const file = fileInput.files[0];
    console.log("Uploading:", file.name);

    const formData = new FormData();
    formData.append("file", file);

    showMsg("upload-message", "Uploading...", "");

    try {
        const res = await fetch(`${API}/resume/upload`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + token },
            body: formData
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", data);

        if (res.ok) {
            currentResumeId = data.resume_id;
            document.getElementById("file-name").textContent = "✓ " + file.name;
            showMsg("upload-message", "Uploaded! Resume ID: " + currentResumeId, "success");
        } else {
            showMsg("upload-message", data.message || "Upload failed", "error");
        }

    } catch (err) {
        console.error("Error:", err);
        showMsg("upload-message", "Connection error — is Flask running on port 5000?", "error");
    }

    return false;
}

async function analyze(event) {
    event.preventDefault();

    const jd = document.getElementById("job-description").value.trim();

    if (!currentResumeId) {
        showMsg("analyze-message", "Please upload a resume first.", "error");
        return;
    }
    if (!jd) {
        showMsg("analyze-message", "Please enter a job description.", "error");
        return;
    }

    showMsg("analyze-message", "Analyzing...", "");

    try {
        const res = await fetch(`${API}/resume/analyze`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ resume_id: currentResumeId, job_description: jd })
        });

        const data = await res.json();

        if (res.ok) {
            showMsg("analyze-message", "Analysis complete!", "success");
            displayResult(data.result);
            loadHistory();
        } else {
            showMsg("analyze-message", data.message, "error");
        }

    } catch (err) {
        showMsg("analyze-message", "Connection error.", "error");
    }
}

function displayResult(result) {
    document.getElementById("result-card").style.display = "block";

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

    const matchedEl = document.getElementById("matched-skills");
    matchedEl.innerHTML = result.matched_skills.length
        ? result.matched_skills.map(s => `<span class="skill-tag matched">${s}</span>`).join("")
        : "<small style='color:#aaa'>None found</small>";

    const missingEl = document.getElementById("missing-skills");
    missingEl.innerHTML = result.missing_skills.length
        ? result.missing_skills.map(s => `<span class="skill-tag missing">${s}</span>`).join("")
        : "<small style='color:#22c55e'>No missing skills!</small>";

    document.getElementById("suggestions-list").innerHTML =
        result.suggestions.map(s => `<li>${s}</li>`).join("");
}

async function loadHistory() {
    try {
        const res = await fetch(`${API}/resume/history`, {
            headers: { "Authorization": "Bearer " + token }
        });

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
            </div>
        `).join("");

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