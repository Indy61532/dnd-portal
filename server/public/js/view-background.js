// client/js/view-background.js

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

function renderBackground(record) {
    const data = record.data || {};
    const info = data.info || {};
    const feature = data.feature || {};
    
    // Header
    setText('b-name', info.name || "Unnamed Background");

    // Description
    const descEl = document.getElementById('b-description');
    if (info.descriptionHtml && info.descriptionHtml.trim() !== "") {
        descEl.innerHTML = info.descriptionHtml;
    } else {
        descEl.textContent = "No description provided.";
    }

    // Proficiencies
    // Skills are saved as array of strings
    const skills = data.skills || [];
    const skillsText = skills.length > 0 ? skills.join(", ") : "None";
    setText('b-skills', skillsText);

    // Tools
    setText('b-tools', info.tools || "None");

    // Languages are saved as array of strings
    const languages = data.languages || [];
    const langText = languages.length > 0 ? languages.join(", ") : "None";
    setText('b-languages', langText);

    // Feature
    setText('b-feature-name', feature.name || "Feature");
    
    const featDescEl = document.getElementById('b-feature-desc');
    if (feature.descriptionHtml && feature.descriptionHtml.trim() !== "") {
        featDescEl.innerHTML = feature.descriptionHtml;
        featDescEl.parentElement.classList.remove('hidden');
    } else {
        // If no description, maybe hide whole section?
        // Or keep it visible if at least name is there?
        if (!feature.name) {
             featDescEl.parentElement.classList.add('hidden');
        } else {
             featDescEl.textContent = "";
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
        document.getElementById('error-state').innerHTML = "No Background ID specified.";
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
        console.error("Error loading background:", error);
        document.getElementById('error-state').classList.remove('hidden');
    } else {
        document.getElementById('bg-content').classList.remove('hidden');
        renderBackground(data);
    }
});

