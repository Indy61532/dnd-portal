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
        
        // If user is already authenticated, don't show card loading state.
        // We can navigate immediately for snappier UX.
        if (window.__authSession) {
            this.navigateToPage(page);
            return;
        }
        
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
