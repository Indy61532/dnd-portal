// client/js/view-class.js

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

// Helper: Format PB
function formatPB(val) {
    if (!val) return "+2"; // Default starting
    const n = Number(val);
    return n >= 0 ? `+${n}` : `${n}`;
}

function renderClass(record) {
    const data = record.data || {};
    const info = data.info || {};
    const progression = data.progression || {};
    const levels = progression.levels || [];
    const casterTable = progression.casterTable;
    const customFeatures = data.customFeatures || [];
    const image_url = record.data?.image_url || null; // Saved in data root by save script logic (actually check save script line 171)

    // --- Header ---
    setText('c-name', info.name || "Unnamed Class");
    
    // Caster Type
    let typeText = "Non-Caster";
    if (info.casterType && info.casterType !== 'none') {
        // Capitalize first letter
        typeText = info.casterType.charAt(0).toUpperCase() + info.casterType.slice(1) + " Caster";
    }
    setText('c-caster-type', typeText);

    // Image
    const imgWrapper = document.getElementById('c-image-wrapper');
    const imgEl = document.getElementById('c-image');
    if (image_url) {
        imgEl.src = image_url;
        imgWrapper.classList.remove('hidden');
    } else {
        imgWrapper.classList.add('hidden');
    }

    // --- Description ---
    const descEl = document.getElementById('c-description');
    if (info.descriptionHtml) {
        descEl.innerHTML = info.descriptionHtml;
        descEl.classList.remove('hidden');
    } else {
        descEl.classList.add('hidden');
    }

    // --- Progression Table ---
    const theadRow = document.getElementById('table-header-row');
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = "";

    // 1. Setup Caster Columns if needed
    let casterHeaders = [];
    if (casterTable && casterTable.header && casterTable.header.length > 0) {
        casterHeaders = casterTable.header;
        // Append TH for each spell level
        casterHeaders.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            th.className = "slot-header";
            theadRow.appendChild(th);
        });
    }

    // 2. Build Rows (Level 1-20)
    // We iterate 1 to 20 to ensure full table even if data is partial, 
    // but usually we rely on stored 'levels' array.
    // Let's iterate the stored levels array which should have 20 items.
    // If not, we fallback to loop 1..20
    
    for (let i = 1; i <= 20; i++) {
        const levelData = levels.find(l => l.level === i) || { level: i, profBonus: null, features: [] };
        
        const tr = document.createElement('tr');
        
        // Level
        const tdLevel = document.createElement('td');
        tdLevel.textContent = i;
        tr.appendChild(tdLevel);

        // PB
        const tdPB = document.createElement('td');
        // Calculate standard PB if null? (Math.ceil(1 + i/4)) -> 2,2,2,2,3,3...
        // But user inputs it manually. If null, show standard calc or '-'?
        // Let's use standard calc fallback if missing.
        const stdPB = Math.ceil(1 + i/4);
        tdPB.textContent = levelData.profBonus ? formatPB(levelData.profBonus) : formatPB(stdPB);
        tr.appendChild(tdPB);

        // Features
        const tdFeat = document.createElement('td');
        if (levelData.features && levelData.features.length > 0) {
            tdFeat.textContent = levelData.features.join(", ");
        } else {
            tdFeat.textContent = "-";
        }
        tr.appendChild(tdFeat);

        // Caster Slots
        if (casterHeaders.length > 0) {
            // Find caster row data for this level
            const casterRow = casterTable.rows ? casterTable.rows.find(r => r.level === i) : null;
            
            casterHeaders.forEach((_, idx) => {
                const tdSlot = document.createElement('td');
                tdSlot.className = "slot-cell";
                if (casterRow && casterRow.values && casterRow.values[idx] !== null) {
                    tdSlot.textContent = casterRow.values[idx];
                } else {
                    tdSlot.textContent = "—";
                }
                tr.appendChild(tdSlot);
            });
        }

        tbody.appendChild(tr);
    }

    // --- Custom Features ---
    const featuresList = document.getElementById('features-list');
    const noFeatText = document.querySelector('.no-features-text');
    
    // Clear previous except static text
    // actually, best to rebuild
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
            p.innerHTML = feat.description; // TinyMCE or text area content? 
            // Save script uses 'collectCustomFeatures' which reads textContent for description from 'p' tag in card.
            // Wait, create-class-save.js line 145: card.querySelector("p")?.textContent
            // So it saves plain text, not HTML for custom features.
            // But if it was textarea, we treat as text.
            
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
        document.getElementById('error-state').innerHTML = "No Class ID specified.";
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
        console.error("Error loading class:", error);
        document.getElementById('error-state').classList.remove('hidden');
    } else {
        document.getElementById('class-content').classList.remove('hidden');
        renderClass(data);
    }
});

