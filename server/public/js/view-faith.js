// client/js/view-faith.js

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

function renderFaith(record) {
    const data = record.data || {};
    const info = data.info || {};
    const deity = data.deityPatron || {};
    
    // Header
    setText('f-name', info.name || "Unnamed Faith");

    // Description
    const descEl = document.getElementById('f-description');
    if (info.descriptionHtml && info.descriptionHtml.trim() !== "") {
        descEl.innerHTML = info.descriptionHtml;
    } else {
        descEl.textContent = "No description provided.";
    }

    // Deity
    setText('f-deity-name', deity.name || "Unknown Deity");

    const deityDescEl = document.getElementById('f-deity-desc');
    if (deity.descriptionHtml && deity.descriptionHtml.trim() !== "") {
        deityDescEl.innerHTML = deity.descriptionHtml;
    } else {
        if (!deity.name) {
             // If neither name nor desc, hide whole deity section?
             // But structure has H3 inside div inside section.
             // We can hide the section if totally empty.
             const section = document.querySelector('.deity-section');
             if (section) section.classList.add('hidden');
        } else {
             deityDescEl.textContent = "";
        }
    }
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        document.getElementById('error-state').innerHTML = "No Faith ID specified.";
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
        console.error("Error loading faith:", error);
        document.getElementById('error-state').classList.remove('hidden');
    } else {
        document.getElementById('faith-content').classList.remove('hidden');
        renderFaith(data);
    }
});

