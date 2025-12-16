// client/js/view-race.js

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

function renderRace(record) {
    const data = record.data || {};
    const info = data.info || {};
    
    // Image logic:
    // create-race-save.js saves image inside 'data.image' object with path/publicUrl
    const imageObj = data.image || {}; 
    const image_url = imageObj.publicUrl || null;

    // --- Header ---
    setText('r-name', info.name || "Unnamed Race");
    setText('r-type', info.type || "Humanoid");
    setText('r-size', info.size ? `(${info.size})` : "");

    // Image
    const imgWrapper = document.getElementById('r-image-wrapper');
    const imgEl = document.getElementById('r-image');
    if (image_url) {
        imgEl.src = image_url;
        imgWrapper.classList.remove('hidden');
    } else {
        imgWrapper.classList.add('hidden');
    }

    // --- Info Grid ---
    setText('r-speed', info.speed);
    setText('r-vision', info.vision);
    setText('r-languages', info.language);

    // --- Resistances ---
    // create-race-save.js saves 'resistances' as array of strings in root of data object
    const resistances = data.resistances || [];
    const resSection = document.getElementById('resistance-section');
    const resValue = document.getElementById('r-resistances');
    
    if (resistances.length > 0) {
        resValue.textContent = resistances.join(", ");
        resSection.classList.remove('hidden');
    } else {
        resSection.classList.add('hidden');
    }

    // --- Description ---
    const descEl = document.getElementById('r-description');
    if (info.descriptionHtml && info.descriptionHtml.trim() !== "") {
        descEl.innerHTML = info.descriptionHtml;
        descEl.parentElement.classList.remove('hidden'); // Show section
    } else {
        descEl.parentElement.classList.add('hidden');
    }

    // --- Traits ---
    const traitsEl = document.getElementById('r-traits');
    if (data.traitsHtml && data.traitsHtml.trim() !== "") {
        traitsEl.innerHTML = data.traitsHtml;
        traitsEl.parentElement.classList.remove('hidden');
    } else {
        traitsEl.parentElement.classList.add('hidden');
    }
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
        document.getElementById('error-state').innerHTML = "No Race ID specified.";
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
        console.error("Error loading race:", error);
        document.getElementById('error-state').classList.remove('hidden');
    } else {
        document.getElementById('race-content').classList.remove('hidden');
        renderRace(data);
    }
});

