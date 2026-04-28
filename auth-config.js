// ========== SIMPLE GOOGLE SHEET LOGIN - NO FORGOT PASSWORD ==========

const USERS_SHEET_URL = "https://docs.google.com/spreadsheets/d/1-MT2nyCwg4OeKV4vjfRZb5cRWVx1ZYcnXkxRbYIi5cQ/export?format=csv&gid=0";

// Verify login from Google Sheet (Column A = Username, Column B = Password)
window.verifyLoginWithSheet = async function(username, password) {
    try {
        const response = await fetch(USERS_SHEET_URL);
        const csvText = await response.text();
        const rows = csvText.split(/\r?\n/).filter(row => row.trim());
        
        if (rows.length < 2) {
            console.error("Sheet has no data rows");
            return false;
        }
        
        // Skip header row (first row)
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',').map(c => c.replace(/["']/g, '').trim());
            if (cols.length >= 2) {
                const sheetUsername = cols[0];
                const sheetPassword = cols[1];
                
                if (sheetUsername.toLowerCase() === username.toLowerCase() && sheetPassword === password) {
                    console.log(`✅ Login successful for: ${sheetUsername}`);
                    return true;
                }
            }
        }
        
        console.log("❌ Invalid credentials");
        return false;
        
    } catch(err) {
        console.error("Sheet fetch error:", err);
        return false;
    }
};

// Enable viewer buttons
window.enableViewerButtons = function() {
    setTimeout(() => {
        const selectAll = document.getElementById('selectAllTerritories');
        const clearAll = document.getElementById('clearAllTerritories');
        if (selectAll) { 
            selectAll.disabled = false; 
            selectAll.style.opacity = '1'; 
            selectAll.style.pointerEvents = 'auto';
        }
        if (clearAll) { 
            clearAll.disabled = false; 
            clearAll.style.opacity = '1';
            clearAll.style.pointerEvents = 'auto';
        }
    }, 500);
};

console.log("✅ auth-config.js loaded - Sheet login active (No forgot password)");