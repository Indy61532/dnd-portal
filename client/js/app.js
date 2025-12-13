// HeroVault - D&D Character Manager
// Main application JavaScript

class HeroVault {
    constructor() {
        this.currentPage = 'home';
        this.isLoading = false;
        this.currentLoadingCard = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addParticleEffect();
        this.initializeCards();
        console.log('HeroVault initialized successfully!');
    }

    setupEventListeners() {
        // Card click handlers - use event delegation
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            const link = e.target.closest('a');
            
            // Only handle card clicks that are NOT inside a link (Browse page)
            if (card && !link) {
                this.handleCardClick(e);
            }
        });

        // Card hover effects
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', (e) => this.handleCardHover(e, true));
            card.addEventListener('mouseleave', (e) => this.handleCardHover(e, false));
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());
    }



    handleCardClick(e) {
        const card = e.target.closest('.card');
        if (!card) return;
        
        const page = card.dataset.page;
        
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentLoadingCard = card;
        this.showLoadingState(card);
        
        // Simulate loading time for better UX
        setTimeout(() => {
            this.navigateToPage(page);
        }, 300);
    }

    handleCardHover(e, isEntering) {
        const card = e.currentTarget;
        const icon = card.querySelector('i');
        
        if (isEntering) {
            this.addHoverEffects(card, icon);
        } else {
            this.removeHoverEffects(card, icon);
        }
    }

    addHoverEffects(card, icon) {
        // Add subtle glow effect
        card.style.transform = 'translateY(-10px) scale(1.02)';
        
        // Animate icon
        if (icon) {
            icon.style.transform = 'scale(1.2) rotate(5deg)';
        }
        
        // Add ripple effect
        this.createRippleEffect(card, event);
    }

    removeHoverEffects(card, icon) {
        card.style.transform = 'translateY(0) scale(1)';
        
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    }

    createRippleEffect(card, event) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        `;
        
        const rect = card.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        card.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    showLoadingState(card) {
        const content = card.querySelector('.card-content');
        const originalContent = content.innerHTML;
        
        content.innerHTML = `
            <div class="loading"></div>
            <p style="margin-top: 1rem; color: var(--text-muted);">Loading...</p>
        `;
        
        // Store original content for restoration
        card.dataset.originalContent = originalContent;
    }

    resetLoadingState() {
        if (this.currentLoadingCard) {
            const card = this.currentLoadingCard;
            const content = card.querySelector('.card-content');
            const originalContent = card.dataset.originalContent;
            
            if (content && originalContent) {
                content.innerHTML = originalContent;
                delete card.dataset.originalContent;
            }
            
            this.currentLoadingCard = null;
            this.isLoading = false;
        }
    }

    navigateToPage(page) {
        console.log(`Navigating to: ${page}`);
        
        // Pages that require authentication
        const authRequiredPages = ['characters', 'collection', 'creation', 'campaigns', 'create'];
        
        // Check if auth modal is enabled
        const authModalEnabled = typeof window.ENABLE_AUTH_MODAL !== 'undefined' ? window.ENABLE_AUTH_MODAL : true;
        
        if (authRequiredPages.includes(page) && authModalEnabled) {
            // If already logged in, DO NOT open modal, just navigate.
            if (window.ensureAuthOrPrompt) {
                window.ensureAuthOrPrompt().then((ok) => {
                    if (!ok) return;

                    const pageMap = {
                        'characters': 'pages/charakters.html',
                        'collection': 'pages/collection.html',
                        'creation': 'pages/creation.html',
                        'campaigns': 'pages/campaigns.html',
                        'create': 'pages/create.html'
                    };

                    const pagePath = pageMap[page];
                    if (pagePath) {
                        const basePath = window.location.pathname.includes('/pages/') ? '../' : '';
                        window.location.href = basePath + pagePath;
                    } else {
                        this.showPageModal(page);
                    }
                });
                return;
            }

            // Fallback: old behavior
            if (window.AuthModalInstance) {
                window.AuthModalInstance.show();
            } else {
                console.warn('AuthModal not initialized');
                this.showPageModal(page);
            }
            return;
        } else if (authRequiredPages.includes(page) && !authModalEnabled) {
            // Auth modal is disabled - navigate to actual page
            const pageMap = {
                'characters': 'pages/charakters.html',
                'collection': 'pages/collection.html',
                'creation': 'pages/creation.html',
                'campaigns': 'pages/campaigns.html',
                'create': 'pages/create.html'
            };
            
            const pagePath = pageMap[page];
            if (pagePath) {
                // Determine base path (current page might be in pages/ folder)
                const basePath = window.location.pathname.includes('/pages/') ? '../' : '';
                window.location.href = basePath + pagePath;
            } else {
                this.showPageModal(page);
            }
        } else {
            // For other pages, show modal or navigate
            this.showPageModal(page);
        }
    }

    showPageModal(page) {
        const modal = document.createElement('div');
        modal.className = 'page-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${this.getPageTitle(page)}</h2>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Welcome to the ${this.getPageTitle(page)} section!</p>
                    <p>This feature is coming soon. Stay tuned for updates!</p>
                    <div class="feature-preview">
                        <i class="fas ${this.getPageIcon(page)}"></i>
                        <h3>${this.getPageDescription(page)}</h3>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal styles
        this.addModalStyles();
        
        document.body.appendChild(modal);
        
        // Animate modal in
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);
    }

    getPageTitle(page) {
        const titles = {
            characters: 'Character Management',
            collection: 'Collection Library',
            creation: 'Character Creation',
            campaigns: 'Campaign Manager',
            create: 'Create New',
            homebrew: 'Homebrew Content'
        };
        return titles[page] || 'Page';
    }

    getPageIcon(page) {
        const icons = {
            characters: 'fa-users',
            collection: 'fa-book-open',
            creation: 'fa-magic',
            campaigns: 'fa-map',
            create: 'fa-plus-circle',
            homebrew: 'fa-flask'
        };
        return icons[page] || 'fa-star';
    }

    getPageDescription(page) {
        const descriptions = {
            characters: 'Manage your heroes and their adventures',
            collection: 'Browse your D&D library and resources',
            creation: 'Forge new heroes with powerful tools',
            campaigns: 'Track your campaigns and sessions',
            create: 'Start new projects and adventures',
            homebrew: 'Create and share custom content'
        };
        return descriptions[page] || 'Explore this section';
    }

    addParticleEffect() {
        // Particle system is now handled by separate particles.js script
        // This method is kept for compatibility but does nothing
        console.log('Particle system initialized via particles.js');
    }

    initializeCards() {
        // Add staggered animation delay
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    handleKeyboard(e) {
        // Add keyboard navigation
        const cards = Array.from(document.querySelectorAll('.card'));
        const currentIndex = cards.findIndex(card => card === document.activeElement);
        
        switch(e.key) {
            case 'ArrowRight':
                e.preventDefault();
                if (currentIndex < cards.length - 1) {
                    cards[currentIndex + 1].focus();
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (currentIndex > 0) {
                    cards[currentIndex - 1].focus();
                }
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (document.activeElement.classList.contains('card')) {
                    document.activeElement.click();
                }
                break;
        }
    }

    handleResize() {
        // Handle responsive behavior
        const cards = document.querySelectorAll('.card');
        const isMobile = window.innerWidth <= 768;
        
        cards.forEach(card => {
            if (isMobile) {
                card.style.minHeight = '200px';
            } else {
                card.style.minHeight = '250px';
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.HeroVaultApp = new HeroVault();
});



// Profile functionality
function editProfile() {
    showProfileModal('edit', {
        title: 'Edit Profile',
        icon: 'fa-edit',
        content: `
            <form class="profile-form">
                <div class="form-group">
                    <label for="profileName">Display Name</label>
                    <input type="text" id="profileName" value="Adventure Master" required>
                </div>
                <div class="form-group">
                    <label for="profileEmail">Email</label>
                    <input type="email" id="profileEmail" value="adventure@herovault.com" required>
                </div>
                <div class="form-group">
                    <label for="profileBio">Bio</label>
                    <textarea id="profileBio" rows="3" placeholder="Tell us about your adventures...">Dungeon Master and avid D&D player with a passion for storytelling and epic campaigns.</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeProfileModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        `
    });
}

function showProfileModal(type, config) {
    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    modal.id = 'profileModal';
    
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-container">
                <div class="modal-header">
                    <h2><i class="fas ${config.icon}"></i> ${config.title}</h2>
                    <button class="close-btn" onclick="closeProfileModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${config.content}
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles if not already present
    addProfileModalStyles();
    
    document.body.appendChild(modal);
    
    // Animate modal in
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-container').style.transform = 'scale(1)';
    }, 10);
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.querySelector('.modal-container').style.transform = 'scale(0.8)';
        setTimeout(() => modal.remove(), 300);
    }
}

function addProfileModalStyles() {
    if (document.getElementById('profile-modal-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'profile-modal-styles';
    style.textContent = `
        .profile-modal {
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
            max-width: 600px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            transform: scale(0.8);
            transition: transform 0.3s ease;
            box-shadow: 0 20px 40px var(--shadow-dark), 0 0 30px var(--shadow-gold);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2rem 2rem 1rem;
            border-bottom: 1px solid rgba(212, 175, 55, 0.3);
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
        
        .profile-form .form-group {
            margin-bottom: 1.5rem;
        }
        
        .profile-form label {
            display: block;
            color: var(--text-light);
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        
        .profile-form input,
        .profile-form textarea,
        .profile-form select {
            width: 100%;
            padding: 0.75rem;
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 8px;
            color: var(--text-light);
            font-size: 1rem;
        }
        
        .profile-form input:focus,
        .profile-form textarea:focus,
        .profile-form select:focus {
            outline: none;
            border-color: var(--primary-gold);
            box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
        }
        
        .form-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 2rem;
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
        }
    `;
    
    document.head.appendChild(style);
}

// Add some utility functions
window.HeroVault = {
    showNotification: (message, type = 'info') => {
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
};

// ========================================
// CONFIGURATION FLAGS
// ========================================
// Enable/disable auth modal popup when clicking on protected pages
// Set to false to disable auth modal (cards will navigate normally)
window.ENABLE_AUTH_MODAL = true; // Change to false to turn off
