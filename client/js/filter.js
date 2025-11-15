// HeroVault - Filter System
// Dedicated filter functionality for the browse page

class FilterSystem {
    constructor() {
        this.filterCategories = this.getFilterCategories();
        this.init();
    }

    init() {
        this.setupFilterButton();
        console.log('Filter system initialized successfully!');
    }

    setupFilterButton() {
        // Add event listener for filter button
        const filterButton = document.querySelector('.filter-button');
        if (filterButton) {
            filterButton.addEventListener('click', () => this.showFilterModal());
        }
    }

    showFilterModal() {
        const modal = document.createElement('div');
        modal.className = 'filter-modal';
        modal.id = 'filterModal';
        
        const categoriesHTML = this.filterCategories.map(category => `
            <label class="checkbox-item">
                <input type="checkbox" id="${category.id}">
                <span class="checkmark"></span>
                <span class="label-text">${category.name}</span>
            </label>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2><i class="fas fa-filter"></i> Filter Options</h2>
                        <button class="close-btn" onclick="FilterSystem.closeFilterModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="filter-categories">
                            <h3>Categories</h3>
                            <div class="checkbox-group">
                                ${categoriesHTML}
                            </div>
                        </div>
                        <div class="filter-actions">
                            <button class="btn-secondary" onclick="FilterSystem.clearAllFilters()">Clear All</button>
                            <button class="btn-primary" onclick="FilterSystem.applyFilters()">Apply Filters</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal styles if not already present
        this.addFilterModalStyles();
        
        document.body.appendChild(modal);
        
        // Add event listeners for closing modal
        const overlay = modal.querySelector('.modal-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                FilterSystem.closeFilterModal();
            }
        });
        
        // Add ESC key listener
        const escListener = (e) => {
            if (e.key === 'Escape') {
                FilterSystem.closeFilterModal();
                document.removeEventListener('keydown', escListener);
            }
        };
        document.addEventListener('keydown', escListener);
        
        // Animate modal in
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-container').style.transform = 'scale(1)';
        }, 10);
    }

    getFilterCategories() {
        // Configuration object for filter categories
        // Easy to add new categories in the future
        return [
            {
                id: 'item',
                name: 'Item',
                keywords: ['Item'],
            },
            {
                id: 'monster', 
                name: 'Monster',
                keywords: ['Monster'],
            },
            {
                id: 'spell',
                name: 'Spell', 
                keywords: ['Spell'],
            },
            {
                id: 'class',
                name: 'Class',
                keywords: ['Class'],
            },
            {
                id: 'race',
                name: 'Race',
                keywords: ['Race'],
            },
            {
                id: 'background',
                name: 'Background',
                keywords: ['Background'],
            },
            {
                id: 'feat',
                name: 'Feat',
                keywords: ['Feat'],
            },
            {
                id: 'npc',
                name: 'NPC',
                keywords: ['NPC'],
            },
            {
                id: 'sub-class',
                name: 'Sub-Class',
                keywords: ['Sub-Class'],
            },
            {
                id: 'pet',
                name: 'Pet',
                keywords: ['Pet'],
            },
            {
                id: 'faith',
                name: 'Faith',
                keywords: ['Faith'],
            }
        ];
    }

    addFilterModalStyles() {
        if (document.getElementById('filter-modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'filter-modal-styles';
        style.textContent = `
            .filter-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .modal-overlay {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            
                         .modal-container {
                 background: linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%);
                 border: 2px solid var(--primary-gold);
                 border-radius: 25px;
                 max-width: 500px;
                 width: 100%;
                 max-height: 80vh;
                 overflow-y: auto;
                 transform: scale(0.8);
                 transition: transform 0.3s ease;
                 box-shadow: 0 20px 40px var(--shadow-dark), 0 0 30px var(--shadow-gold);
                 
                 /* Custom scrollbar */
                 scrollbar-width: thin;
                 scrollbar-color: var(--primary-gold) rgba(212, 175, 55, 0.1);

             }
             
             .modal-container::-webkit-scrollbar {
                 width: 8px;
             }
             
             .modal-container::-webkit-scrollbar-track {
                 background: rgba(212, 175, 55, 0.1);
                 border-radius: 4px;
             }
             
             .modal-container::-webkit-scrollbar-thumb {
                 background: var(--primary-gold);
                 border-radius: 4px;
                 transition: background 0.3s ease;
             }
             
             .modal-container::-webkit-scrollbar-thumb:hover {
                 background: var(--secondary-gold);
             }
            
                         .modal-header {
                 display: flex;
                 justify-content: space-between;
                 align-items: center;
                 padding: 2rem 2rem 1rem;
                 border-bottom: 1px solid rgba(212, 175, 55, 0.3);
             }
             
             .close-btn {
                 background: rgba(212, 175, 55, 0.1);
                 border: 1px solid rgba(212, 175, 55, 0.3);
                 border-radius: 50%;
                 width: 40px;
                 height: 40px;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 cursor: pointer;
                 transition: all 0.3s ease;
                 color: var(--primary-gold);
             }
             
             .close-btn:hover {
                 background: rgba(212, 175, 55, 0.2);
                 border-color: var(--primary-gold);
                 transform: scale(1.1);
                 box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
             }
             
             .close-btn i {
                 font-size: 1.2rem;
                 transition: transform 0.3s ease;
             }
             
             .close-btn:hover i {
                 transform: rotate(90deg);
             }
            
            .modal-header h2 {
                color: var(--primary-gold);
                font-family: 'Cinzel', serif;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .modal-body {
                padding: 2rem;
            }
            
            .filter-categories h3 {
                color: var(--text-light);
                margin-bottom: 1.5rem;
                font-family: 'Cinzel', serif;
            }
            
            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .checkbox-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                cursor: pointer;
                padding: 0.75rem;
                border-radius: 10px;
                transition: background-color 0.3s ease;
            }
            
            .checkbox-item:hover {
                background: rgba(212, 175, 55, 0.1);
            }
            
            .checkbox-item input[type="checkbox"] {
                display: none;
            }
            
            .checkmark {
                width: 24px;
                height: 24px;
                border: 2px solid var(--primary-gold);
                border-radius: 6px;
                position: relative;
                background: rgba(212, 175, 55, 0.1);
                transition: all 0.3s ease;
            }
            
            .checkbox-item input[type="checkbox"]:checked + .checkmark {
                background: var(--primary-gold);
            }
            
            .checkbox-item input[type="checkbox"]:checked + .checkmark::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #1a1a1a;
                font-weight: bold;
                font-size: 14px;
            }
            
            .label-text {
                color: var(--text-light);
                font-weight: 500;
                font-size: 1.1rem;
            }
            
            .filter-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                border-top: 1px solid rgba(212, 175, 55, 0.3);
                padding-top: 10px;
            }
            
            .btn-primary,
            .btn-secondary {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-primary {
                background: linear-gradient(145deg, var(--primary-gold), var(--secondary-gold));
                color: var(--dark-bg);
            }
            
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
            }
            
            .btn-secondary {
                background: rgba(212, 175, 55, 0.1);
                color: var(--primary-gold);
                border: 1px solid rgba(212, 175, 55, 0.3);
            }
            
            .btn-secondary:hover {
                background: rgba(212, 175, 55, 0.2);
            }
            
            @media (max-width: 768px) {
                .modal-overlay {
                    padding: 1rem;
                }
                
                .modal-container {
                    max-height: 90vh;
                }
                
                .filter-actions {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Static methods for global access
    static closeFilterModal() {
        const modal = document.getElementById('filterModal');
        if (modal) {
            modal.style.opacity = '0';
            modal.querySelector('.modal-container').style.transform = 'scale(0.8)';
            setTimeout(() => modal.remove(), 300);
        }
    }

    static clearAllFilters() {
        const checkboxes = document.querySelectorAll('#filterModal input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    static applyFilters() {
        // Get filter categories configuration
        const filterCategories = window.filterSystem?.filterCategories || FilterSystem.getDefaultFilterCategories();
        
        // Get all items in the list
        const items = document.querySelectorAll('.main-list .item');
        
        // Get checked categories
        const checkedCategories = filterCategories.filter(category => {
            const checkbox = document.getElementById(category.id);
            return checkbox && checkbox.checked;
        });
        
        // Add loading state
        const filterButton = document.querySelector('.filter-button');
        if (filterButton) {
            filterButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Applying...</span>';
            filterButton.disabled = true;
        }
        
        items.forEach((item, index) => {
            const itemType = item.querySelector('.item-type')?.textContent || '';
            let shouldShow = false;
            
            // If no filters are selected, show all
            if (checkedCategories.length === 0) {
                shouldShow = true;
            } else {
                // Check if item matches any of the checked categories
                checkedCategories.forEach(category => {
                    category.keywords.forEach(keyword => {
                        if (itemType.includes(keyword)) {
                            shouldShow = true;
                        }
                    });
                });
            }
            
            // Apply visibility with staggered animation
            setTimeout(() => {
                if (shouldShow) {
                    item.style.display = 'grid';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            }, index * 20); // Stagger animation
        });
        
        // Reset filter button
        setTimeout(() => {
            if (filterButton) {
                filterButton.innerHTML = '<i class="fas fa-filter"></i><span>Filter</span>';
                filterButton.disabled = false;
            }
        }, 500);
        
        // Show notification with count
        setTimeout(() => {
            const visibleCount = Array.from(items).filter(item => 
                item.style.display !== 'none'
            ).length;
            
            FilterSystem.showNotification(`Filters applied! Showing ${visibleCount} items.`, 'success');
        }, 600);
        
        // Close modal
        FilterSystem.closeFilterModal();
    }

    static getDefaultFilterCategories() {
        return [
            { id: 'item', name: 'Item', keywords: ['Item'] },
            { id: 'monster', name: 'Monster', keywords: ['Monster'] },
            { id: 'spell', name: 'Spell', keywords: ['Spell'] },
            { id: 'class', name: 'Class', keywords: ['Class'] },
            { id: 'race', name: 'Race', keywords: ['Race'] },
            { id: 'background', name: 'Background', keywords: ['Background'] },
            { id: 'feat', name: 'Feat', keywords: ['Feat'] },
            { id: 'npc', name: 'NPC', keywords: ['NPC'] },
            { id: 'sub-class', name: 'Sub-Class', keywords: ['Sub-Class'] },
            { id: 'pet', name: 'Pet', keywords: ['Pet'] },
            { id: 'faith', name: 'Faith', keywords: ['Faith'] }
        ];
    }

    static showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Helper functions for managing filter categories
window.FilterManager = {
    // Add a new filter category
    addCategory: (category) => {
        if (window.filterSystem) {
            window.filterSystem.filterCategories.push(category);
            console.log(`Added new filter category: ${category.name}`);
        }
    },
    
    // Remove a filter category
    removeCategory: (categoryId) => {
        if (window.filterSystem) {
            const categories = window.filterSystem.filterCategories;
            const index = categories.findIndex(cat => cat.id === categoryId);
            if (index > -1) {
                categories.splice(index, 1);
                console.log(`Removed filter category: ${categoryId}`);
            }
        }
    },
    
    // Update an existing category
    updateCategory: (categoryId, updates) => {
        if (window.filterSystem) {
            const categories = window.filterSystem.filterCategories;
            const category = categories.find(cat => cat.id === categoryId);
            if (category) {
                Object.assign(category, updates);
                console.log(`Updated filter category: ${categoryId}`);
            }
        }
    },
    
    // Get all categories
    getCategories: () => {
        if (window.filterSystem) {
            return window.filterSystem.filterCategories;
        }
        return FilterSystem.getDefaultFilterCategories();
    },
    
    // Example of how to add a new category
    addExampleCategory: () => {
        const newCategory = {
            id: 'custom1',
            name: 'Custom Category',
            keywords: ['Custom', 'Special'],
            description: 'A custom filter category'
        };
        this.addCategory(newCategory);
    }
};

// Initialize the filter system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.filterSystem = new FilterSystem();
});