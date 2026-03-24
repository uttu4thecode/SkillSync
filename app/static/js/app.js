const API = "https://skillsync-production-f866.up.railway.app/api";

function showTab(tab) {
    document.getElementById("login-form").style.display = tab === "login" ? "block" : "none";
    document.getElementById("register-form").style.display = tab === "register" ? "block" : "none";
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    event.target.classList.add("active");
}

function showMessage(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = "message " + type;
}

async function register() {
    const username = document.getElementById("reg-username").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (res.ok) {
        showMessage("auth-message", "Registered successfully! Please login.", "success");
        showTab("login");
    } else {
        showMessage("auth-message", data.message, "error");
    }
}

async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.username);
        window.location.href = "/api/auth/dashboard";
    } else {
        showMessage("auth-message", data.message, "error");
    }
}