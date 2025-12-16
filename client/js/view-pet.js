// client/js/view-pet.js

// Helper: Calculate Ability Modifier
function getModifier(score) {
    if (score === null || score === undefined || score === '') return 0;
    const val = Number(score);
    if (isNaN(val)) return 0;
    return Math.floor((val - 10) / 2);
}

// Helper: Format Modifier
function formatModifier(mod) {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

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

// Main Render Function
function renderPet(record) {
    const data = record.data || {};
    const info = data.info || {};
    const stats = data.stats || {};
    const abilities = stats.abilities || {}; // Pet save structure has nested abilities
    const hp = stats.hp || {}; // Pet HP structure is simpler
    const blocks = data.blocks || {};
    const image_url = record.data?.image_url || null; // Top-level in save data object logic

    // --- Header ---
    setText('p-name', info.type || record.name || "Unnamed Pet"); // 'type' is used as name in form sometimes? No, name is root.
    // wait, create-pet-save.js saves 'name' to root column, but doesn't seem to duplicate it inside data.info like monster might.
    // Actually, create-pet-save.js saves `name` to the DB column, but inside `data` it only has info.type.
    // So we should use record.name for the title.
    setText('p-name', record.name || "Unnamed Pet");

    setText('p-size', info.size);
    setText('p-type', info.type); // e.g. "Beast"
    
    // Alignment construction
    let alignText = info.alignment;
    if (info.subType) alignText += ` (${info.subType})`; // Using subType as secondary info
    setText('p-alignment', alignText);

    // Image
    const imgWrapper = document.getElementById('p-image-wrapper');
    const imgEl = document.getElementById('p-image');
    if (image_url) {
        imgEl.src = image_url;
        imgWrapper.classList.remove('hidden');
    } else {
        imgWrapper.classList.add('hidden');
    }

    // --- Combat Stats ---
    // AC
    setText('p-ac', stats.armor || "10");

    // HP
    // Format: "Average"
    let hpText = hp.avg || "0";
    if (hp.modifier) {
        const mod = Number(hp.modifier);
        hpText += (mod >= 0 ? ` (+${mod})` : ` (${mod})`);
    }
    setText('p-hp', hpText);

    // Initiative Bonus
    const init = stats.initiativeBonus || 0;
    setText('p-init', formatModifier(Number(init)));

    // --- Ability Scores ---
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
        const val = abilities[stat] || 10; // Note: abilities object
        const mod = getModifier(val);
        document.getElementById(`score-${stat}`).textContent = val;
        document.getElementById(`mod-${stat}`).textContent = `(${formatModifier(mod)})`;
    });

    // --- Skills & Saves ---
    // Note: create-pet-save.js names: savingThrow, resistance, immunities, vulnerabilities, conditionImmunities
    setText('p-saves', stats.savingThrow, document.getElementById('row-saves'));
    setText('p-immunities', stats.immunities, document.getElementById('row-immunities'));
    setText('p-resistances', stats.resistance, document.getElementById('row-resistances')); // Note: singular 'resistance' in save script
    setText('p-vulnerabilities', stats.vulnerabilities, document.getElementById('row-vulnerabilities'));
    setText('p-conditions', stats.conditionImmunities, document.getElementById('row-conditions'));
    
    // Senses
    let senses = `passive Perception ${stats.passivePerception || 10}`;
    setText('p-senses', senses);

    // --- Blocks (Rich Text) ---
    function renderBlock(id, content, headerId) {
        const section = document.getElementById(id);
        const header = headerId ? document.getElementById(headerId) : null;
        
        if (!content || content.trim() === "") {
            section.innerHTML = "";
            section.classList.add('hidden');
            if (header) header.classList.add('hidden');
        } else {
            section.innerHTML = content; 
            section.classList.remove('hidden');
            if (header) header.classList.remove('hidden');
        }
    }

    renderBlock('section-traits', blocks.traits);
    renderBlock('section-actions', blocks.actions, 'header-actions');
    renderBlock('section-bonus', blocks.bonusActions, 'header-bonus');
    renderBlock('section-reactions', blocks.reactions, 'header-reactions');
    
    // Legendary
    if (data.flags?.legendaryEnabled) {
        renderBlock('section-legendary', blocks.legendaryActions, 'header-legendary');
    } else {
         document.getElementById('header-legendary')?.classList.add('hidden');
         document.getElementById('section-legendary')?.classList.add('hidden');
    }

    // Mythic
    if (data.flags?.mythicEnabled) {
        renderBlock('section-mythic', blocks.mythicActions, 'header-mythic');
    } else {
        document.getElementById('header-mythic')?.classList.add('hidden');
        document.getElementById('section-mythic')?.classList.add('hidden');
    }
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        document.getElementById('error-state').innerHTML = "No Pet ID specified.";
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
        console.error("Error loading pet:", error);
        document.getElementById('error-state').classList.remove('hidden');
    } else {
        document.getElementById('pet-content').classList.remove('hidden');
        renderPet(data);
    }
});

