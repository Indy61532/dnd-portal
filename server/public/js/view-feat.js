// client/js/view-feat.js

// Helper: Safely get text or hide element if empty
function setText(id, text, parentToHide = null) {
    const el = document.getElementById(id);
    if (!el) return;

    if (!text || text === "") {
        if (parentToHide) {
            parentToHide.classList.add('hidden');
        } else {
            el.innerHTML = ""; 
        }
    } else {
        if (parentToHide) parentToHide.classList.remove('hidden');
        el.innerHTML = text;
    }
}

function renderFeat(record) {
    const data = record.data || {};
    const info = data.info || {};
    const stats = data.stats || []; // array of strings
    
    // Header
    setText('f-name', info.name || record.name || "Unnamed Feat");

    // Stats
    const statsSection = document.getElementById('stats-section');
    if (info.hasStats && stats.length > 0) {
        setText('f-stats', stats.join(", "));
        statsSection.classList.remove('hidden');
    } else {
        statsSection.classList.add('hidden');
    }

    // Description
    const descEl = document.getElementById('f-description');
    if (info.descriptionHtml && info.descriptionHtml.trim() !== "") {
        descEl.innerHTML = info.descriptionHtml;
    } else {
        descEl.textContent = "No description provided.";
    }
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        document.getElementById('error-state').innerHTML = "No Feat ID specified.";
        return;
    }

    // Load from Supabase
    const { data, error } = await window.supabase
        .from('homebrew')
        .select('*')
        .eq('id', id)
        .single();

    document.getElementById('loading-state').classList.add('hidden');

    if (error || !data) {
        console.error("Error loading feat:", error);
        document.getElementById('error-state').classList.remove('hidden');
    } else {
        document.getElementById('feat-content').classList.remove('hidden');
        renderFeat(data);
    }
});

