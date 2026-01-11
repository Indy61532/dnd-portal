// client/js/view-subclass.js

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

function renderSubclass(record) {
    const data = record.data || {};
    const info = data.info || {};
    const progression = data.progression || {};
    const levels = progression.levels || [];
    const lists = data.lists || {};
    const customFeatures = data.customFeatures || [];
    
    // Header
    setText('sc-name', info.name || record.name || "Unnamed Subclass");
    setText('sc-parent', info.parentClass || "Unknown Class");

    // Image logic
    // create-subclass-save.js saves image object inside data.image
    const imageObj = data.image || {};
    const image_url = imageObj.publicUrl || null;

    const imgWrapper = document.getElementById('sc-image-wrapper');
    const imgEl = document.getElementById('sc-image');
    if (image_url) {
        imgEl.src = image_url;
        imgWrapper.classList.remove('hidden');
    } else {
        imgWrapper.classList.add('hidden');
    }

    // Description
    const descEl = document.getElementById('sc-description');
    if (info.descriptionHtml && info.descriptionHtml.trim() !== "") {
        descEl.innerHTML = info.descriptionHtml;
    } else {
        descEl.textContent = "No description provided.";
    }

    // --- Optional Lists (Spells / Proficiencies) ---
    // Arrays of strings
    const spells = lists.spells || [];
    const profs = lists.proficiencies || []; // In save script: subclass-proficiencies
    // Note: features list also exists in lists.features, but usually progression handles level-based features.
    // We can show lists.features as "Other features" if needed, but usually redundant.
    
    const spellsListEl = document.getElementById('sc-spells-list');
    if (spells.length > 0) {
        spellsListEl.innerHTML = `<ul>${spells.map(s => `<li>${s}</li>`).join('')}</ul>`;
        document.getElementById('box-spells').classList.remove('hidden');
    } else {
        document.getElementById('box-spells').classList.add('hidden');
    }

    const profsListEl = document.getElementById('sc-profs-list');
    if (profs.length > 0) {
        profsListEl.innerHTML = `<ul>${profs.map(p => `<li>${p}</li>`).join('')}</ul>`;
        document.getElementById('box-profs').classList.remove('hidden');
    } else {
        document.getElementById('box-profs').classList.add('hidden');
    }

    const listsSection = document.getElementById('lists-section');
    if (spells.length === 0 && profs.length === 0) {
        listsSection.classList.add('hidden');
    } else {
        listsSection.classList.remove('hidden');
    }

    // --- Progression Table ---
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = "";

    // Iterate levels. Subclasses usually have features at specific levels (e.g. 3, 7, 10, 15, 18 for Fighter).
    // However, the save script collects for ALL levels 1-20 (empty if no features).
    // Should we show all 20 levels or only those with features?
    // Class table shows all. Consistency says show all, or at least filter empty ones.
    // Let's show only rows that have features to be concise, since subclasses are sparse.
    
    const levelsWithFeatures = levels.filter(l => l.features && l.features.length > 0);
    
    if (levelsWithFeatures.length > 0) {
        levelsWithFeatures.forEach(l => {
            const tr = document.createElement('tr');
            
            const tdLvl = document.createElement('td');
            tdLvl.textContent = l.level;
            tr.appendChild(tdLvl);
            
            const tdFeat = document.createElement('td');
            tdFeat.textContent = l.features.join(", ");
            tr.appendChild(tdFeat);
            
            tbody.appendChild(tr);
        });
        document.querySelector('.subclass-table-section').classList.remove('hidden');
    } else {
        // No progression defined? Hide table.
        document.querySelector('.subclass-table-section').classList.add('hidden');
    }

    // --- Custom Features Descriptions ---
    const featuresList = document.getElementById('features-list');
    const noFeatText = document.querySelector('.no-features-text');
    featuresList.innerHTML = "";
    featuresList.appendChild(noFeatText);

    if (customFeatures && customFeatures.length > 0) {
        noFeatText.classList.add('hidden');
        customFeatures.forEach(feat => {
            const item = document.createElement('div');
            item.className = 'feature-item';
            
            const h3 = document.createElement('h3');
            h3.textContent = feat.name;
            
            const p = document.createElement('div');
            p.className = 'feature-desc';
            // Save script uses card.querySelector("p")?.textContent, so it's plain text usually.
            // But let's assume it might be HTML if rich text editor was used (save script implies plain text though).
            p.textContent = feat.description; 
            
            item.appendChild(h3);
            item.appendChild(p);
            featuresList.appendChild(item);
        });
    } else {
        noFeatText.classList.remove('hidden');
    }
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        document.getElementById('error-state').innerHTML = "No Subclass ID specified.";
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
        console.error("Error loading subclass:", error);
        document.getElementById('error-state').classList.remove('hidden');
    } else {
        document.getElementById('subclass-content').classList.remove('hidden');
        renderSubclass(data);
    }
});

