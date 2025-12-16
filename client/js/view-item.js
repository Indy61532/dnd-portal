// client/js/view-item.js

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

function renderItem(record) {
    const data = record.data || {};
    const info = data.info || {};
    const armor = data.armor || {};
    const weapon = data.weapon || {};
    
    // Header
    setText('i-name', info.name || record.name || "Unnamed Item");
    setText('i-rarity', info.rarity);
    
    // Type formatting
    let typeText = info.itemType || "Item";
    if (info.itemType && info.itemType.toLowerCase().includes('weapon')) {
         if (weapon.weaponType) typeText = weapon.weaponType; // e.g. "Martial Weapon"
         else typeText = "Weapon";
    }
    setText('i-type', typeText);

    // Magic Badge
    const magicBadge = document.getElementById('i-magic-badge');
    if (info.isMagic) {
        magicBadge.classList.remove('hidden');
    } else {
        magicBadge.classList.add('hidden');
    }
    
    // Attunement (displayed in meta or near magic badge)
    // We can append " (Requires Attunement)" to meta or separate badge.
    // Let's modify rarity or type line if attunement is true.
    if (info.attunement) {
        const attSpan = document.createElement('span');
        attSpan.innerHTML = '<i class="fa-solid fa-link"></i> Requires Attunement';
        attSpan.style.color = '#b39ddb'; // light purple
        attSpan.style.fontSize = '0.9rem';
        document.querySelector('.item-meta').appendChild(attSpan);
    }

    // Image logic (create-item.js saves flat in root or inside data? Checked file: saves as flat fields in JSON root)
    const image_url = data.image_url || null; // Flat fields in 'data' object
    
    const imgWrapper = document.getElementById('i-image-wrapper');
    const imgEl = document.getElementById('i-image');
    if (image_url) {
        imgEl.src = image_url;
        imgWrapper.classList.remove('hidden');
    } else {
        imgWrapper.classList.add('hidden');
    }

    // --- Basic Stats ---
    setText('i-cost', info.cost ? `${info.cost} gp` : "-");
    setText('i-weight', info.weight ? `${info.weight} lb.` : "-");

    // --- Dynamic Stats ---
    const rawType = (info.itemType || "").toLowerCase();

    // Armor AC
    const boxAC = document.getElementById('box-ac');
    if (rawType.includes('armor') || rawType.includes('shield')) {
        setText('i-ac', armor.ac, boxAC);
    } else {
        boxAC.classList.add('hidden');
    }

    // Weapon Damage & Range
    const boxDamage = document.getElementById('box-damage');
    const boxRange = document.getElementById('box-range');
    
    if (rawType.includes('weapon')) {
        // Damage: "2d6 Slashing"
        let dmgText = "";
        if (weapon.diceTrove && weapon.dieType) {
            dmgText = `${weapon.diceTrove}${weapon.dieType}`;
        }
        if (weapon.damageType) {
            dmgText += ` ${weapon.damageType}`;
        }
        
        setText('i-damage', dmgText, boxDamage);

        // Range
        setText('i-range', weapon.range, boxRange);
        
        // Properties
        const boxProps = document.getElementById('box-properties');
        if (weapon.properties && weapon.properties.trim() !== "") {
            setText('i-properties', weapon.properties, boxProps);
        } else {
            boxProps.classList.add('hidden');
        }

    } else {
        boxDamage.classList.add('hidden');
        boxRange.classList.add('hidden');
        document.getElementById('box-properties').classList.add('hidden');
    }

    // --- Description ---
    const descEl = document.getElementById('i-description');
    if (data.description && data.description.trim() !== "") {
        descEl.innerHTML = data.description;
        descEl.parentElement.classList.remove('hidden');
    } else {
        descEl.parentElement.classList.add('hidden');
    }
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        document.getElementById('error-state').innerHTML = "No Item ID specified.";
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
        console.error("Error loading item:", error);
        document.getElementById('error-state').classList.remove('hidden');
    } else {
        document.getElementById('item-content').classList.remove('hidden');
        renderItem(data);
    }
});

