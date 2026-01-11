// Auth Modal Functionality

class AuthModal {
    constructor() {
        this.modal = null;
        this.currentTab = 'login';
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('auth-modal');
        if (existing) existing.remove();

        this.modal = document.createElement('div');
        this.modal.id = 'auth-modal';
        this.modal.className = 'auth-modal';
        this.modal.innerHTML = `
            <div class="auth-modal-overlay">
                <div class="auth-modal-container">
                    <div class="auth-modal-header">
                        <h2><i class="fas fa-dragon"></i> HeroVault</h2>
                        <button class="auth-modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">
                            Login
                        </button>
                        <button class="auth-tab" data-tab="register">
                            Registration
                        </button>
                    </div>
                    
                    <!-- Login Tab Content -->
                    <div class="auth-tab-content active" id="login-content">
                        <form class="auth-form" id="login-form">
                            <div class="auth-form-group">
                                <label for="login-email">Mail</label>
                                <input 
                                    type="email" 
                                    id="login-email" 
                                    name="email" 
                                    placeholder="your@email.com" 
                                    required
                                    autocomplete="email"
                                >
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="login-password">Heslo</label>
                                <input 
                                    type="password" 
                                    id="login-password" 
                                    name="password" 
                                    placeholder="••••••••" 
                                    required
                                    autocomplete="current-password"
                                >
                                <div class="auth-forgot-password">
                                    <a href="#" class="forgot-password-link">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>
                            
                            <div class="auth-error" id="login-error"></div>
                            
                            <button type="submit" class="auth-submit-btn">
                                Login
                            </button>
                        </form>
                    </div>
                    
                    <!-- Register Tab Content -->
                    <div class="auth-tab-content" id="register-content">
                        <form class="auth-form" id="register-form">
                            <div class="auth-form-group">
                                <label for="register-name">Jméno</label>
                                <input 
                                    type="text" 
                                    id="register-name" 
                                    name="name" 
                                    placeholder="Your Name" 
                                    required
                                    autocomplete="name"
                                >
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="register-email">Mail</label>
                                <input 
                                    type="email" 
                                    id="register-email" 
                                    name="email" 
                                    placeholder="your@email.com" 
                                    required
                                    autocomplete="email"
                                >
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="register-password">Heslo</label>
                                <input 
                                    type="password" 
                                    id="register-password" 
                                    name="password" 
                                    placeholder="••••••••" 
                                    required
                                    autocomplete="new-password"
                                >
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="register-password-confirm">Kontrola hesla</label>
                                <input 
                                    type="password" 
                                    id="register-password-confirm" 
                                    name="passwordConfirm" 
                                    placeholder="••••••••" 
                                    required
                                    autocomplete="new-password"
                                >
                                <div class="password-match" id="password-match-indicator"></div>
                            </div>
                            
                            <div class="auth-error" id="register-error"></div>
                            
                            <button type="submit" class="auth-submit-btn">
                                Register
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        this.setupFormListeners();
        this.setupPasswordValidation();
        
        // Setup event listeners for close and forgot password
        const closeBtn = this.modal.querySelector('.auth-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        const forgotPasswordLink = this.modal.querySelector('.forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword(e);
            });
        }

        const overlay = this.modal.querySelector('.auth-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }
    }

    setupEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-tab')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    setupFormListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e);
            });
        }
    }

    setupPasswordValidation() {
        const passwordInput = document.getElementById('register-password');
        const confirmInput = document.getElementById('register-password-confirm');
        const indicator = document.getElementById('password-match-indicator');

        if (passwordInput && confirmInput && indicator) {
            const validatePasswords = () => {
                const password = passwordInput.value;
                const confirm = confirmInput.value;

                if (confirm.length === 0) {
                    indicator.classList.remove('show');
                    return;
                }

                indicator.classList.add('show');
                if (password === confirm && password.length > 0) {
                    indicator.textContent = '✓ Hesla se shodují';
                    indicator.classList.remove('password-mismatch');
                } else {
                    indicator.textContent = '✗ Hesla se neshodují';
                    indicator.classList.add('password-mismatch');
                }
            };

            passwordInput.addEventListener('input', validatePasswords);
            confirmInput.addEventListener('input', validatePasswords);
        }
    }

    switchTab(tabName) {
        if (this.currentTab === tabName) return;

        this.currentTab = tabName;

        // Update tabs
        const tabs = this.modal.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update content
        const loginContent = document.getElementById('login-content');
        const registerContent = document.getElementById('register-content');

        if (tabName === 'login') {
            loginContent.classList.add('active');
            registerContent.classList.remove('active');
            // Clear errors
            this.clearErrors();
        } else {
            registerContent.classList.add('active');
            loginContent.classList.remove('active');
            // Clear errors
            this.clearErrors();
        }
    }

    show() {
        if (!this.modal) {
            this.createModal();
        }
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
            // Clear forms
            this.clearForms();
            this.clearErrors();
            // Reset to login tab
            if (this.currentTab !== 'login') {
                this.switchTab('login');
            }
            // Reset loading state on card
            if (window.HeroVaultApp && typeof window.HeroVaultApp.resetLoadingState === 'function') {
                window.HeroVaultApp.resetLoadingState();
            } else {
                // Fallback: find and reset any cards with loading state
                const cardsWithLoading = document.querySelectorAll('.card[data-original-content]');
                cardsWithLoading.forEach(card => {
                    const content = card.querySelector('.card-content');
                    const originalContent = card.dataset.originalContent;
                    if (content && originalContent) {
                        content.innerHTML = originalContent;
                        delete card.dataset.originalContent;
                    }
                });
            }
        }
    }

    clearForms() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
    }

    clearErrors() {
        const errors = this.modal.querySelectorAll('.auth-error');
        errors.forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
    }

    showError(formId, message) {
        const errorEl = document.getElementById(`${formId}-error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
    }

    async handleLogin(e) {
        const form = e.target;
        const submitBtn = form.querySelector('.auth-submit-btn');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Clear previous errors
        this.clearErrors();

        // Basic validation
        if (!email || !password) {
            this.showError('login', 'Prosím vyplňte všechna pole.');
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            if (!window.supabase) {
                this.showError('login', 'Supabase není inicializovaný. Zkontroluj načtení `supabase-client.js`.');
                return;
            }

            const { error } = await window.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                this.showError('login', error.message);
                return;
            }

            this.close();
            if (window.HeroVault && window.HeroVault.showNotification) {
                window.HeroVault.showNotification('Přihlášení proběhlo úspěšně!', 'success');
            }
        } catch (err) {
            this.showError('login', err?.message || 'Přihlášení se nezdařilo.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        const form = e.target;
        const submitBtn = form.querySelector('.auth-submit-btn');
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!name || !email || !password || !passwordConfirm) {
            this.showError('register', 'Prosím vyplňte všechna pole.');
            return;
        }

        if (password !== passwordConfirm) {
            this.showError('register', 'Hesla se neshodují.');
            return;
        }

        if (password.length < 6) {
            this.showError('register', 'Heslo musí mít alespoň 6 znaků.');
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            if (!window.supabase) {
                this.showError('register', 'Supabase není inicializovaný. Zkontroluj načtení `supabase-client.js`.');
                return;
            }

            const { data, error } = await window.supabase.auth.signUp({
                email,
                password,
                options: {
                    // user_metadata (užitečné, pokud máš trigger na vytvoření profilu z metadata)
                    data: { name }
                }
            });

            if (error) {
                this.showError('register', error.message);
                return;
            }

            // Insert profile row (id = auth.user.id) so UI can read `profiles.name`
            // Requires RLS policy allowing insert where auth.uid() = id (typical setup).
            try {
                const user = data?.user;
                if (user?.id) {
                    await window.supabase
                        .from('profiles')
                        .upsert({ id: user.id, name }, { onConflict: 'id' });
                }
            } catch (_e) {
                // Best-effort; ignore if RLS/email-confirmation prevents insert at this step
            }

            this.close();

            // Pokud je v Supabase zapnuté potvrzení emailu, session může být null.
            const msg = data?.session
                ? 'Registrace proběhla úspěšně!'
                : 'Registrace proběhla. Zkontroluj email pro potvrzení účtu.';

            if (window.HeroVault && window.HeroVault.showNotification) {
                window.HeroVault.showNotification(msg, 'success');
            }
        } catch (err) {
            this.showError('register', err?.message || 'Registrace se nezdařila.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    handleForgotPassword(e) {
        if (e) e.preventDefault();
        // TODO: Implement forgot password functionality
        alert('Funkce pro obnovení hesla bude brzy k dispozici.');
    }
}

// Initialize auth modal
let AuthModalInstance;
document.addEventListener('DOMContentLoaded', () => {
    AuthModalInstance = new AuthModal();
    
    // Make it globally accessible
    window.AuthModalInstance = AuthModalInstance;
});

