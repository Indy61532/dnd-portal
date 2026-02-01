document.addEventListener('DOMContentLoaded', () => {
    const itemTypeInput = document.querySelector('.item-type input[list="list-item-type"]');
    const armorBlock = document.querySelector('.armor');
    const weaponSection = document.querySelector('.weapon-section');
    const weaponTypeInput = document.querySelector('.weapon-type input[list="list-weapon-type"]');
    const rangeBlock = document.querySelector('.Range');
    const saveBtn = document.querySelector('.button-create');

    const STORAGE_BUCKET = 'homebrew-images';
    const LOCAL_STORAGE_KEY = 'hv_current_item_id';
    let currentItemId = localStorage.getItem(LOCAL_STORAGE_KEY);
    let existingRecordData = null; // preserve image fields on update if no new upload

    // Prefer URL id for edit mode. If no ?id= provided, treat as NEW and clear stored id.
    try {
        const urlId = new URLSearchParams(window.location.search || '').get('id');
        if (urlId) {
            currentItemId = urlId;
            localStorage.setItem(LOCAL_STORAGE_KEY, String(urlId));
        } else {
            currentItemId = null;
            existingRecordData = null;
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    } catch (_e) {
        // ignore
    }

    function normalize(value) {
        return (value || '').trim().toLowerCase();
    }

    function toNumberOrNull(value) {
        const n = parseFloat(String(value ?? '').trim());
        return Number.isFinite(n) ? n : null;
    }

    function getItemDescriptionHtml() {
        try {
            const fromTiny = window.tinymce?.get('item-description')?.getContent();
            if (typeof fromTiny === 'string') return fromTiny;
        } catch (e) {
            // ignore
        }
        const el = document.getElementById('item-description');
        return el ? (el.value || '') : '';
    }

    function collectItemData() {
        const itemType = (document.getElementById('item-type')?.value || '').trim();
        const name = (document.getElementById('item-name')?.value || '').trim();
        const weight = toNumberOrNull(document.getElementById('item-weight')?.value);
        const cost = toNumberOrNull(document.getElementById('item-cost')?.value);
        const rarity = (document.getElementById('item-rarity')?.value || '').trim();
        const isMagic = Boolean(document.getElementById('item-magic-checkbox')?.checked);
        const attunement = Boolean(document.getElementById('item-attunement-checkbox')?.checked);
        const ac = toNumberOrNull(document.getElementById('item-armor-ac')?.value);

        const weaponType = (document.getElementById('item-weapon-type')?.value || '').trim();
        const diceTrove = toNumberOrNull(document.getElementById('item-dice-trove')?.value);
        const dieType = (document.getElementById('item-die-type')?.value || '').trim();
        const damageType = (document.getElementById('item-damage-type')?.value || '').trim();
        const range = (document.getElementById('item-range')?.value || '').trim();
        const properties = (document.getElementById('item-properties')?.value || '').trim();

        return {
            info: {
                itemType,
                name,
                weight,
                cost,
                rarity,
                isMagic,
                attunement
            },
            armor: {
                ac
            },
            weapon: {
                weaponType,
                diceTrove,
                dieType,
                damageType,
                range,
                properties
            },
            description: getItemDescriptionHtml(),
            image_path: existingRecordData?.image_path || null,
            image_url: existingRecordData?.image_url || null
        };
    }

    async function getSessionOrPrompt() {
        const supabase = window.supabase;
        if (!supabase) return null;
        const { data } = await supabase.auth.getSession();
        const session = data?.session || null;
        if (!session) {
            window.AuthModalInstance?.show?.();
            return null;
        }
        return session;
    }

    async function loadExistingItemData(id, userId) {
        try {
            const { data, error } = await window.supabase
                .from('homebrew')
                .select('id, user_id, name, data')
                .eq('id', id)
                .eq('user_id', userId)
                .single();
            if (error) return null;
            return data || null;
        } catch (e) {
            return null;
        }
    }

    async function uploadItemImage({ userId, homebrewId, file }) {
        const safeName = String(file.name || 'image').replace(/[^\w.\-]+/g, '_');
        const path = `${userId}/items/${homebrewId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await window.supabase.storage
            .from(STORAGE_BUCKET)
            .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = window.supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(path);

        return { image_path: path, image_url: publicData?.publicUrl || null };
    }

    function notifySuccess(message) {
        if (window.HeroVault?.showNotification) {
            window.HeroVault.showNotification(message, 'success');
            return;
        }
        console.info(message);
    }

    function setSavingState(isSaving) {
        if (!saveBtn) return;
        saveBtn.disabled = Boolean(isSaving);
        saveBtn.textContent = isSaving ? 'Saving...' : (currentItemId ? 'Update item' : 'Create item');
    }

    function updateVisibilityByType() {
        const value = normalize(itemTypeInput && itemTypeInput.value);

        // Armor AC input visibility
        if (armorBlock) {
            if (value === 'armor' || value === 'armour') {
                armorBlock.classList.add('visible');
            } else {
                armorBlock.classList.remove('visible');
            }
        }

        // Weapon section visibility
        if (weaponSection) {
            if (value.includes('weapon')) {
                weaponSection.classList.add('visible');
            } else {
                weaponSection.classList.remove('visible');
            }
        }
    }

    function updateRangeVisibility() {
        if (!rangeBlock) return;
        const itemType = normalize(itemTypeInput && itemTypeInput.value);
        const weaponType = normalize(weaponTypeInput && weaponTypeInput.value);
        const showRange = weaponType.includes('range') || itemType.includes('ranged');
        if (showRange) rangeBlock.classList.add('visible'); else rangeBlock.classList.remove('visible');
    }

    // Wire events
    if (itemTypeInput) {
        itemTypeInput.addEventListener('change', updateVisibilityByType);
        itemTypeInput.addEventListener('input', updateVisibilityByType);
    }
    if (weaponTypeInput) {
        weaponTypeInput.addEventListener('change', updateRangeVisibility);
        weaponTypeInput.addEventListener('input', updateRangeVisibility);
    }

    // Initial state
    updateVisibilityByType();
    updateRangeVisibility();

    // Button label
    if (saveBtn) {
        saveBtn.textContent = currentItemId ? 'Update item' : 'Create item';
    }

    function setDescriptionHtml(html) {
        const safeHtml = typeof html === 'string' ? html : '';
        try {
            const editor = window.tinymce?.get('item-description');
            if (editor) {
                editor.setContent(safeHtml);
                return;
            }
        } catch (_e) {
            // ignore
        }
        const textarea = document.getElementById('item-description');
        if (textarea) textarea.value = safeHtml;
    }

    function applyExistingItemData(record) {
        if (!record) return;
        const data = record.data || {};
        const info = data.info || {};
        const armor = data.armor || {};
        const weapon = data.weapon || {};

        const nameValue = String(record.name || info.name || '').trim();
        const itemTypeValue = String(info.itemType || '').trim();

        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value ?? '';
        };

        setValue('item-type', itemTypeValue);
        setValue('item-name', nameValue);
        setValue('item-weight', info.weight ?? '');
        setValue('item-cost', info.cost ?? '');
        setValue('item-rarity', info.rarity ?? '');
        setValue('item-armor-ac', armor.ac ?? '');
        setValue('item-weapon-type', weapon.weaponType ?? '');
        setValue('item-dice-trove', weapon.diceTrove ?? '');
        setValue('item-die-type', weapon.dieType ?? '');
        setValue('item-damage-type', weapon.damageType ?? '');
        setValue('item-range', weapon.range ?? '');
        setValue('item-properties', weapon.properties ?? '');

        const magicCheckbox = document.getElementById('item-magic-checkbox');
        if (magicCheckbox) magicCheckbox.checked = Boolean(info.isMagic);
        const attuneCheckbox = document.getElementById('item-attunement-checkbox');
        if (attuneCheckbox) attuneCheckbox.checked = Boolean(info.attunement);

        setDescriptionHtml(data.description || '');

        updateVisibilityByType();
        updateRangeVisibility();
    }

    async function hydrateFormForEdit() {
        if (!currentItemId) return;
        const session = await getSessionOrPrompt();
        if (!session) return;
        const record = await loadExistingItemData(currentItemId, session.user.id);
        if (!record) return;
        existingRecordData = record.data || null;
        applyExistingItemData(record);
    }

    async function handleSave() {
        setSavingState(true);
        try {
            const session = await getSessionOrPrompt();
            if (!session) return;

            const name = (document.getElementById('item-name')?.value || '').trim();
            if (!name) {
                console.info('Name is required.');
                return;
            }

            // preserve existing image if updating and no new file uploaded
            if (currentItemId && !existingRecordData) {
                const record = await loadExistingItemData(currentItemId, session.user.id);
                existingRecordData = record?.data || null;
            }

            let dataJson = collectItemData();
            const file = document.getElementById('item-image')?.files?.[0] || null;

            if (!currentItemId) {
                // INSERT
                const { data, error } = await window.supabase
                    .from('homebrew')
                    .insert({
                        user_id: session.user.id,
                        type: 'item',
                        status: 'draft',
                        name,
                        data: dataJson
                    })
                    .select()
                    .single();

                if (error) throw error;

                currentItemId = data.id;
                localStorage.setItem(LOCAL_STORAGE_KEY, String(currentItemId));

                if (file) {
                    const img = await uploadItemImage({ userId: session.user.id, homebrewId: currentItemId, file });
                    dataJson = { ...dataJson, ...img };
                    existingRecordData = dataJson;

                    const { error: upErr } = await window.supabase
                        .from('homebrew')
                        .update({ name, data: dataJson })
                        .eq('id', currentItemId)
                        .eq('user_id', session.user.id);

                    if (upErr) throw upErr;
                }

                if (saveBtn) saveBtn.textContent = 'Update item';
                notifySuccess('Item saved');
                return;
            }

            // UPDATE
            if (file) {
                const img = await uploadItemImage({ userId: session.user.id, homebrewId: currentItemId, file });
                dataJson = { ...dataJson, ...img };
                existingRecordData = dataJson;
            }

            const { error: updErr } = await window.supabase
                .from('homebrew')
                .update({ name, data: dataJson })
                .eq('id', currentItemId)
                .eq('user_id', session.user.id);

            if (updErr) throw updErr;

            notifySuccess('Item saved');
        } catch (err) {
            console.error('Save failed:', err);
            console.info(`Save failed: ${err?.message || 'Unknown error'}`);
        } finally {
            setSavingState(false);
        }
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleSave();
        });
    }

    hydrateFormForEdit();
});



