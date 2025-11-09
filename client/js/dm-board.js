const STORAGE_KEY = 'dmBoardState';

const DEFAULT_FOLDERS = [
    { id: 'items', name: 'Items', description: 'Magic trinkets, loot tables, crafting materials.' },
    { id: 'players', name: 'Players', description: 'Character secrets, side quests, downtime notes.' },
    { id: 'world', name: 'World', description: 'Locations, factions, lore snippets, historical events.' },
    { id: 'notes', name: 'Notes', description: 'Session prep, reminders, loose ideas.' },
    { id: 'beasts', name: 'Beasts', description: 'Monsters, encounter ideas, stat references.' },
    { id: 'npc', name: 'NPC', description: 'Allies, villains, patrons, quest givers.' },
    { id: 'initiative', name: 'Initiative', description: 'Track combat order, round notes, and status effects.' }
];

const elements = {
    folderList: document.getElementById('folder-list'),
    boardTitle: document.getElementById('board-title'),
    boardSubtitle: document.getElementById('board-subtitle'),
    boardGrid: document.getElementById('board-grid'),
    createFolderBtn: document.getElementById('create-folder-btn'),
    addNoteBtn: document.getElementById('add-note-btn'),
    clearFolderBtn: document.getElementById('clear-folder-btn')
};

let appState = {
    folders: {},
    folderOrder: [],
    activeFolderId: DEFAULT_FOLDERS[0].id
};

function loadState() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            bootstrapDefaults();
            return;
        }

        const parsed = JSON.parse(stored);
        if (!parsed || typeof parsed !== 'object') {
            bootstrapDefaults();
            return;
        }

        appState = {
            folders: parsed.folders || {},
            folderOrder: parsed.folderOrder || [],
            activeFolderId: parsed.activeFolderId || DEFAULT_FOLDERS[0].id
        };

        ensureDefaultFolders();
        syncFolderOrder();
    } catch (error) {
        console.error('Failed to parse DM board state', error);
        bootstrapDefaults();
    }
}

function bootstrapDefaults() {
    appState.folders = {};
    DEFAULT_FOLDERS.forEach((folder) => {
        appState.folders[folder.id] = {
            id: folder.id,
            name: folder.name,
            description: folder.description,
            cards: []
        };
    });
    appState.folderOrder = DEFAULT_FOLDERS.map((folder) => folder.id);
    appState.activeFolderId = DEFAULT_FOLDERS[0].id;
    persistState();
}

function ensureDefaultFolders() {
    DEFAULT_FOLDERS.forEach((folder) => {
        if (!appState.folders[folder.id]) {
            appState.folders[folder.id] = {
                id: folder.id,
                name: folder.name,
                description: folder.description,
                cards: []
            };
        }
    });
    syncFolderOrder();
    persistState();
}

function persistState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (error) {
        console.warn('Unable to save DM board state', error);
    }
}

function renderFolders() {
    if (!elements.folderList) return;

    elements.folderList.innerHTML = '';

    const orderedIds = getOrderedFolderIds();

    orderedIds.forEach((id) => {
        const folder = appState.folders[id];
        if (!folder) return;

        const button = document.createElement('button');
        button.className = `folder-item ${folder.id === appState.activeFolderId ? 'active' : ''}`;
        button.dataset.folderId = folder.id;
        button.type = 'button';
        button.draggable = true;
        button.innerHTML = `
            <span>${folder.name}</span>
            <span class="folder-count">${folder.cards.length}</span>
        `;
        button.addEventListener('click', () => selectFolder(folder.id));
        button.addEventListener('dragstart', handleDragStart);
        button.addEventListener('dragend', handleDragEnd);
        button.addEventListener('dragover', handleDragOver);
        button.addEventListener('dragleave', handleDragLeave);
        button.addEventListener('drop', handleDrop);
        elements.folderList.appendChild(button);
    });
}

function selectFolder(folderId) {
    if (!appState.folders[folderId]) return;
    appState.activeFolderId = folderId;
    persistState();
    renderFolders();
    renderBoard();
}

function renderBoard() {
    const folder = appState.folders[appState.activeFolderId];
    if (!folder || !elements.boardGrid) return;

    elements.boardTitle.textContent = folder.name;
    elements.boardSubtitle.textContent = folder.description;

    elements.boardGrid.innerHTML = '';

    if (!folder.cards.length) {
        const placeholder = document.createElement('div');
        placeholder.className = 'empty-state';
        placeholder.innerHTML = `
            <i class="fas fa-hat-wizard"></i>
            <strong>No cards yet</strong>
            <span>Click "Add Card" to drop session notes, loot ideas, or NPC hooks.</span>
        `;
        elements.boardGrid.appendChild(placeholder);
        return;
    }

    folder.cards.forEach((card) => {
        const cardEl = document.createElement('article');
        cardEl.className = 'board-card';
        cardEl.innerHTML = `
            <h3 class="card-title">${escapeHtml(card.title)}</h3>
            <p class="card-content">${escapeHtml(card.content)}</p>
            <footer class="card-footer">
                <span>${card.created}</span>
                <button class="card-delete" data-card-id="${card.id}" title="Delete card">
                    <i class="fas fa-times"></i>
                </button>
            </footer>
        `;
        cardEl.querySelector('.card-delete').addEventListener('click', () => deleteCard(card.id));
        elements.boardGrid.appendChild(cardEl);
    });
}

function deleteCard(cardId) {
    const folder = appState.folders[appState.activeFolderId];
    if (!folder) return;
    folder.cards = folder.cards.filter((card) => card.id !== cardId);
    persistState();
    renderBoard();
    renderFolders();
}

function createFolder() {
    const name = prompt('Name of the new folder?');
    if (!name) return;

    const trimmed = name.trim();
    if (!trimmed) return;

    const id = slugify(trimmed);
    if (appState.folders[id]) {
        alert('Folder with this name already exists.');
        return;
    }

    appState.folders[id] = {
        id,
        name: trimmed,
        description: 'Custom folder',
        cards: []
    };
    appState.folderOrder.push(id);
    appState.activeFolderId = id;
    persistState();
    renderFolders();
    renderBoard();
}

function addCard() {
    const title = prompt('Card title');
    if (!title) return;

    const content = prompt('Card details');
    if (content === null) return;

    const folder = appState.folders[appState.activeFolderId];
    if (!folder) return;

    folder.cards.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: title.trim() || 'Untitled',
        content: content.trim(),
        created: new Date().toLocaleDateString()
    });
    persistState();
    renderBoard();
    renderFolders();
}

function clearFolder() {
    const folder = appState.folders[appState.activeFolderId];
    if (!folder) return;

    const confirmed = confirm(`Remove all cards from "${folder.name}"?`);
    if (!confirmed) return;

    folder.cards = [];
    persistState();
    renderBoard();
    renderFolders();
}

function escapeHtml(str = '') {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function slugify(value) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `folder-${Date.now()}`;
}

function getOrderedFolderIds() {
    const allIds = Object.keys(appState.folders);
    const ordered = appState.folderOrder.filter((id) => allIds.includes(id));
    const missing = allIds.filter((id) => !ordered.includes(id));
    return [...ordered, ...missing];
}

function syncFolderOrder() {
    appState.folderOrder = getOrderedFolderIds();
}

function handleDragStart(event) {
    const { folderId } = event.currentTarget.dataset;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', folderId);
    event.currentTarget.classList.add('dragging');
}

function handleDragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    elements.folderList
        .querySelectorAll('.folder-item')
        .forEach((item) => item.classList.remove('drag-over-top', 'drag-over-bottom'));
}

function handleDragOver(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const offset = event.clientY - rect.top;
    const insertBefore = offset < rect.height / 2;

    target.classList.toggle('drag-over-top', insertBefore);
    target.classList.toggle('drag-over-bottom', !insertBefore);
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
}

function handleDrop(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const draggedId = event.dataTransfer.getData('text/plain');
    const targetId = target.dataset.folderId;

    if (!draggedId || !targetId || draggedId === targetId) {
        target.classList.remove('drag-over-top', 'drag-over-bottom');
        return;
    }

    const rect = target.getBoundingClientRect();
    const insertBefore = event.clientY - rect.top < rect.height / 2;
    reorderFolders(draggedId, targetId, insertBefore);

    target.classList.remove('drag-over-top', 'drag-over-bottom');
}

function reorderFolders(draggedId, targetId, insertBefore) {
    const order = getOrderedFolderIds().filter((id) => id !== draggedId);
    const targetIndex = order.indexOf(targetId);

    if (targetIndex === -1) return;

    const newIndex = insertBefore ? targetIndex : targetIndex + 1;
    order.splice(newIndex, 0, draggedId);
    appState.folderOrder = order;
    persistState();
    renderFolders();
}

function bindEvents() {
    elements.createFolderBtn?.addEventListener('click', createFolder);
    elements.addNoteBtn?.addEventListener('click', addCard);
    elements.clearFolderBtn?.addEventListener('click', clearFolder);
}

function init() {
    loadState();
    bindEvents();
    renderFolders();
    renderBoard();
}

document.addEventListener('DOMContentLoaded', init);

