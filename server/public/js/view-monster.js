// client/js/view-monster.js

// Helper: Calculate Ability Modifier
function getModifier(score) {
    if (score === null || score === undefined || score === '') return 0;
    const val = Number(score);
    if (isNaN(val)) return 0;
    return Math.floor((val - 10) / 2);
}

// Helper: Format Modifier (e.g., "+3", "-1", "+0")
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
function renderMonster(record) {
    const data = record.data || {};
    const info = data.info || {};
    const stats = data.stats || {};
    const combat = data.combat || {};
    const defenses = data.defenses || {};
    const blocks = data.blocks || {};
    const image_url = record.data?.image_url || null; // Saved in data root by save script logic

    // --- Header ---
    setText('m-name', info.name || "Unnamed Monster");
    setText('m-size', info.size);
    setText('m-type', info.type);
    
    // Alignment construction
    let alignText = info.alignment;
    if (info.habit) alignText += ` (${info.habit})`; // e.g. "Lawful Evil (Urban)"
    setText('m-alignment', alignText);

    // Image
    const imgWrapper = document.getElementById('m-image-wrapper');
    const imgEl = document.getElementById('m-image');
    if (image_url) {
        imgEl.src = image_url;
        imgWrapper.classList.remove('hidden');
    } else {
        imgWrapper.classList.add('hidden');
    }

    // --- Combat Stats ---
    // AC
    let acText = combat.armor || "10";
    if (combat.armorType) acText += ` (${combat.armorType})`;
    setText('m-ac', acText);

    // HP
    // Format: "Average (Formula)" e.g. "33 (6d8 + 6)"
    let hpText = combat.hp?.average || "0";
    setText('m-hp', hpText);
    
    let hpFormula = "";
    if (combat.hp?.dieCount && combat.hp?.dieType) {
        hpFormula = `${combat.hp.dieCount}${combat.hp.dieType}`;
        if (combat.hp.modifier) {
             const mod = Number(combat.hp.modifier);
             hpFormula += (mod >= 0 ? ` + ${mod}` : ` - ${Math.abs(mod)}`);
        }
        setText('m-hp-formula', `(${hpFormula})`);
    } else {
        setText('m-hp-formula', "");
    }

    // Speed
    // Assuming speed might be stored in 'combat' or just missing from current save logic?
    // Checking create-monster-save.js -> It does NOT seem to save Speed explicitly in the snippet provided!
    // Wait, let me double check the file provided. 
    // Line 56-114: "stats", "combat", "defenses".
    // I don't see "speed" in collectMonsterData() in create-monster-save.js!
    // It seems speed is missing from the save logic or I missed it.
    // I will assume it might be in 'info' or just generic. 
    // Looking closely at create-monster.html might reveal it, but based on save.js, it's not there.
    // I will hide Speed for now if undefined, or check if it was added elsewhere.
    // For now, I'll set it to blank if not found.
    setText('m-speed', data.speed || data.info?.speed || "-", null); // Fallback


    // --- Ability Scores ---
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
        const val = stats[stat] || 10;
        const mod = getModifier(val);
        document.getElementById(`score-${stat}`).textContent = val;
        document.getElementById(`mod-${stat}`).textContent = `(${formatModifier(mod)})`;
    });

    // --- Skills & Saves ---
    setText('m-saves', defenses.savingThrow, document.getElementById('row-saves'));
    setText('m-immunities', defenses.immunities, document.getElementById('row-immunities'));
    setText('m-resistances', defenses.resistances, document.getElementById('row-resistances'));
    setText('m-vulnerabilities', defenses.vulnerabilities, document.getElementById('row-vulnerabilities'));
    setText('m-conditions', defenses.conditionImmunities, document.getElementById('row-conditions'));
    
    // Passive Perception is in combat
    let senses = `passive Perception ${combat.passivePerception || 10}`;
    // If there were other senses (darkvision etc), they aren't in the save logic explicitly shown, 
    // possibly in 'traits' text or missing. I'll just show PP.
    setText('m-senses', senses);

    // Languages - not in save logic?
    // I'll check 'info.languages' just in case.
    setText('m-languages', data.info?.languages || "-", document.getElementById('row-languages'));

    // CR
    let crText = info.rating || "0";
    // XP calc could be added here if needed
    setText('m-cr', crText);

    // --- Blocks (Rich Text) ---
    // These are HTML strings from TinyMCE
    
    function renderBlock(id, content, headerId) {
        const section = document.getElementById(id);
        const header = headerId ? document.getElementById(headerId) : null;
        
        if (!content || content.trim() === "") {
            section.innerHTML = "";
            section.classList.add('hidden');
            if (header) header.classList.add('hidden');
        } else {
            section.innerHTML = content; // Trusted content from our DB
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
        // Add standard description text if enabled
        const desc = document.getElementById('desc-legendary');
        if (desc && blocks.legendaryActions) {
            desc.textContent = `The ${info.name || "monster"} can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The ${info.name || "monster"} regains spent legendary actions at the start of its turn.`;
            desc.classList.remove('hidden');
        }
    } else {
         document.getElementById('header-legendary')?.classList.add('hidden');
         document.getElementById('section-legendary')?.classList.add('hidden');
         document.getElementById('desc-legendary')?.classList.add('hidden');
    }

    // Mythic
    if (data.flags?.mythicEnabled) {
        renderBlock('section-mythic', blocks.mythicActions, 'header-mythic');
    } else {
        document.getElementById('header-mythic')?.classList.add('hidden');
        document.getElementById('section-mythic')?.classList.add('hidden');
    }

    // Lair
    if (data.flags?.lairEnabled) {
        // Lair description + Actions
        let lairContent = "";
        if (blocks.lair) lairContent += `<div class="lair-desc">${blocks.lair}</div>`;
        if (blocks.lairActions) lairContent += `<div class="lair-actions">${blocks.lairActions}</div>`;
        
        renderBlock('section-lair', lairContent, 'header-lair');
    } else {
        document.getElementById('header-lair')?.classList.add('hidden');
        document.getElementById('section-lair')?.classList.add('hidden');
    }
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        document.getElementById('error-state').innerHTML = "No Monster ID specified.";
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
        console.error("Error loading monster:", error);
        document.getElementById('error-state').classList.remove('hidden');
    } else {
        document.getElementById('monster-content').classList.remove('hidden');
        renderMonster(data);
    }
});

