document.addEventListener('DOMContentLoaded', () => {
    const itemTypeInput = document.querySelector('.item-type input[list="list-item-type"]');
    const armorBlock = document.querySelector('.armor');
    const weaponSection = document.querySelector('.weapon-section');
    const weaponTypeInput = document.querySelector('.weapon-type input[list="list-weapon-type"]');
    const rangeBlock = document.querySelector('.Range');

    function normalize(value) {
        return (value || '').trim().toLowerCase();
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
});


