// client/js/view-spell.js

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

// Helper: Format Ordinal (1st, 2nd, 3rd)
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function renderSpell(record) {
    const data = record.data || {};
    const info = data.info || {};
    const details = data.details || {};
    const blocks = data.blocks || {};
    
    // Header
    setText('s-name', info.name || record.name || "Unnamed Spell");

    // Level & School formatting
    // e.g. "1st-level evocation" OR "Evocation cantrip"
    let levelText = "";
    const lvl = Number(info.level);
    const school = info.school || "School";

    if (lvl === 0) {
        levelText = `${school} cantrip`;
    } else {
        levelText = `${getOrdinal(lvl)}-level ${school}`;
    }
    // Capitalize first letter
    levelText = levelText.charAt(0).toUpperCase() + levelText.slice(1);
    setText('s-level-school', levelText);

    // Image logic
    const image_url = data.image_url || null; // Flat fields in 'data' object
    const imgWrapper = document.getElementById('s-image-wrapper');
    const imgEl = document.getElementById('s-image');
    if (image_url) {
        imgEl.src = image_url;
        imgWrapper.classList.remove('hidden');
    } else {
        imgWrapper.classList.add('hidden');
    }

    // --- Details ---
    setText('s-cast-time', details.castTime || "-");
    setText('s-range', details.range || "-");
    
    // Components (e.g. V, S, M (a tiny bat))
    setText('s-components', details.components || "-");
    
    // Duration
    setText('s-duration', details.duration || "Instantaneous");

    // Classes
    const classes = info.classes || [];
    if (classes.length > 0) {
        setText('s-classes', classes.join(", "), document.getElementById('box-classes'));
    } else {
        document.getElementById('box-classes').classList.add('hidden');
    }

    // --- Description ---
    const descEl = document.getElementById('s-description');
    if (blocks.description && blocks.description.trim() !== "") {
        descEl.innerHTML = blocks.description;
    } else {
        descEl.textContent = "No description provided.";
    }

    // --- Higher Levels ---
    const higherEl = document.getElementById('s-higher-levels');
    const higherBox = document.getElementById('higher-levels-box');
    
    if (blocks.higherLevels && blocks.higherLevels.trim() !== "") {
        higherEl.innerHTML = blocks.higherLevels;
        higherBox.classList.remove('hidden');
    } else {
        higherBox.classList.add('hidden');
    }
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        document.getElementById('error-state').innerHTML = "No Spell ID specified.";
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
        console.error("Error loading spell:", error);
        document.getElementById('error-state').classList.remove('hidden');
    } else {
        document.getElementById('spell-content').classList.remove('hidden');
        renderSpell(data);
    }
});

