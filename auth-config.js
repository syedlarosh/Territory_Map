// ========== GOOGLE SHEET CREDENTIALS FETCH (With Per-Sheet Cache) ==========

// Sheet URLs
const SCOTT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1-MT2nyCwg4OeKV4vjfRZb5cRWVx1ZYcnXkxRbYIi5cQ/export?format=csv&gid=0";
const MELANIE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1EE-NlNC1FeaqJvE5kTKoC0wlS_sRgo-cX6d2x1MF43Q/export?format=csv&gid=0";

// Forgot Password Emails
window.ALLOWED_EMAILS = {
    "geographer.larosh@gmail.com": {
        sheetUrls: [
            "https://docs.google.com/spreadsheets/d/1-MT2nyCwg4OeKV4vjfRZb5cRWVx1ZYcnXkxRbYIi5cQ/edit?usp=sharing",
            "https://docs.google.com/spreadsheets/d/1ON_ueBYptOJ5DajaiiIjp9JWArEGCu5PTnElsYx00NE/edit?usp=sharing"
        ]
    },
    "melanie@i4searchgroup.com": {
        sheetUrl: "https://docs.google.com/spreadsheets/d/1EE-NlNC1FeaqJvE5kTKoC0wlS_sRgo-cX6d2x1MF43Q/edit?usp=sharing"
    },
    "scott@i4searchgroup.com": {
        sheetUrl: "https://docs.google.com/spreadsheets/d/1-MT2nyCwg4OeKV4vjfRZb5cRWVx1ZYcnXkxRbYIi5cQ/edit?usp=sharing"
    }
};

// ========== PER-SHEET CACHE FUNCTIONS ==========

// 1. Kisi ek sheet ka cache load karna
function loadSheetCache(sheetName) {
    try {
        const cached = localStorage.getItem(`territory_credentials_${sheetName}`);
        if (cached) {
            const data = JSON.parse(cached);
            // Cache 30 days valid
            if (Date.now() - data.timestamp < 30 * 24 * 60 * 60 * 1000) {
                console.log(`✅ ${sheetName} credentials loaded from cache.`);
                return data;
            } else {
                console.log(`${sheetName} cache expired.`);
            }
        }
    } catch (e) {
        console.error(`Error loading ${sheetName} cache:`, e);
    }
    return null;
}

// 2. Kisi ek sheet ka cache save karna
function saveSheetCache(sheetName, username, password) {
    const data = {
        username: username,
        password: password,
        timestamp: Date.now()
    };
    localStorage.setItem(`territory_credentials_${sheetName}`, JSON.stringify(data));
    console.log(`✅ ${sheetName} credentials saved to cache.`);
}

// 3. Check karo sheet public hai ya nahi (fast HEAD request)
async function isSheetAccessible(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        return response.ok;
    } catch (err) {
        return false; // Private ya error
    }
}

// 4. Ek specific sheet se fetch karna (agar public hai to)
async function fetchSheetCredentials(url, sheetName, defaultUsername, defaultPassword) {
    const isPublic = await isSheetAccessible(url);

    if (isPublic) {
        console.log(`📡 ${sheetName} sheet is PUBLIC - Fetching fresh...`);
        try {
            const response = await fetch(url);
            const csv = await response.text();
            const rows = csv.split(/\r?\n/).filter(row => row.trim());
            if (rows.length > 1) {
                const data = rows[1].split(',').map(c => c.replace(/["']/g, '').trim());
                const username = data[0] || defaultUsername;
                const password = data[1] || defaultPassword;
                // Naya cache save karo
                saveSheetCache(sheetName, username, password);
                return { username, password };
            }
        } catch (err) {
            console.error(`${sheetName} fetch error:`, err);
        }
    } else {
        console.log(`🔒 ${sheetName} sheet is PRIVATE - Using cache...`);
    }

    // Agar public nahi hai ya fetch fail hua, to cache se lao
    const cache = loadSheetCache(sheetName);
    if (cache) {
        return { username: cache.username, password: cache.password };
    }

    // Kuch nahi mila to defaults return karo
    console.log(`⚠️ No cache for ${sheetName}, using defaults.`);
    return { username: defaultUsername, password: defaultPassword };
}

// ========== MAIN FETCH FUNCTION (Dono sheets alag alag handle karega) ==========
window.fetchCredentialsFromSheets = async function () {
    console.log("🔄 Checking both sheets independently...");

    // Scott ki sheet fetch karo (ya cache se lo)
    const scottCreds = await fetchSheetCredentials(
        SCOTT_SHEET_URL,
        "scott",
        "scott",
        "scott123"
    );
    window.SCOTT_USERNAME = scottCreds.username;
    window.SCOTT_PASSWORD = scottCreds.password;

    // Melanie ki sheet fetch karo (ya cache se lo)
    const melanieCreds = await fetchSheetCredentials(
        MELANIE_SHEET_URL,
        "melanie",
        "melanie",
        "melanie123"
    );
    window.MELANIE_USERNAME = melanieCreds.username;
    window.MELANIE_PASSWORD = melanieCreds.password;

    console.log("✅ Credentials ready:", {
        scott: { user: window.SCOTT_USERNAME, pass: "***" },
        melanie: { user: window.MELANIE_USERNAME, pass: "***" }
    });
};

// ========== RESET PASSWORD WALE KO CACHE CLEAR KARNE KI ZAROORAT NAHI ==========
// Kyunki jab dobara public karega aur refresh karega to auto fetch ho jayega

// ========== BAAKI SAB ORIGINAL JAISA ==========

window.enableViewerButtons = function () {
    setTimeout(() => {
        const selectAll = document.getElementById('selectAllTerritories');
        const clearAll = document.getElementById('clearAllTerritories');
        if (selectAll) { selectAll.disabled = false; selectAll.style.opacity = '1'; }
        if (clearAll) { clearAll.disabled = false; clearAll.style.opacity = '1'; }
    }, 500);
};

window.setupForgotPassword = function () {
    setTimeout(() => {
        const forgotBtn = document.getElementById('forgotPasswordBtn');
        const sendBtn = document.getElementById('sendResetLinkBtn');

        if (forgotBtn) {
            forgotBtn.onclick = (e) => {
                e.preventDefault();
                const section = document.getElementById('forgotSection');
                if (section) section.style.display = section.style.display === 'none' ? 'block' : 'none';
            };
        }

        if (sendBtn) {
            sendBtn.onclick = (e) => {
                e.preventDefault();
                const email = document.getElementById('resetEmail').value.trim().toLowerCase();
                const errorMsg = document.getElementById('resetErrorMsg');

                if (!email) {
                    if (errorMsg) errorMsg.textContent = 'Please enter your email';
                    if (errorMsg) errorMsg.classList.add('show');
                    return;
                }

                if (window.ALLOWED_EMAILS[email]) {
                    const emailData = window.ALLOWED_EMAILS[email];

                    if (emailData.sheetUrls) {
                        emailData.sheetUrls.forEach(url => window.open(url, "_blank"));
                        if (typeof showToast === 'function') showToast('📧 Opening both sheets...', false);
                    } else if (emailData.sheetUrl) {
                        window.open(emailData.sheetUrl, "_blank");
                        if (typeof showToast === 'function') showToast('Opening password sheet...', false);
                    }

                    if (errorMsg) errorMsg.classList.remove('show');
                    const forgotSection = document.getElementById('forgotSection');
                    if (forgotSection) forgotSection.style.display = 'none';
                    document.getElementById('resetEmail').value = '';
                } else {
                    if (errorMsg) errorMsg.textContent = 'Email not recognized!';
                    if (errorMsg) errorMsg.classList.add('show');
                }
            };
        }
    }, 500);
};

// Initialize
// Initialize - Wait for credentials to load first
(async function () {
    console.log("Loading credentials...");
    await window.fetchCredentialsFromSheets();
    console.log("Credentials ready, setting up forgot password...");
    window.setupForgotPassword();
    console.log("✅ auth-config.js loaded with cache system.");
})();