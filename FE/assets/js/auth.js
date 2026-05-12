/**
 * Authentication Module - Paradise GYM
 */
(function() {
    window.GymApp.auth = {
        user: null,

        /**
         * Initialize auth state
         */
        init: async function() {
            const token = localStorage.getItem('gym-token');
            if (!token) {
                this.redirectToLogin();
                return false;
            }

            try {
                const res = await window.GymApp.api.get('/auth/me');
                if (res && res.success) {
                    this.user = res.data;
                    this.updateUI();
                    return true;
                }
            } catch (err) {
                console.error('Auth verification failed', err);
            }
            
            this.redirectToLogin();
            return false;
        },

        /**
         * Login action
         */
        login: async function(username, password) {
            try {
                const res = await window.GymApp.api.post('/auth/login', { ten_dang_nhap: username, mat_khau: password });
                if (res && res.success) {
                    // Fix: Access token and user from res.data
                    localStorage.setItem('gym-token', res.data.token);
                    this.user = res.data.user;
                    
                    window.GymApp.toast('Đăng nhập thành công!', 'success');

                    // Redirect theo role
                    setTimeout(() => {
                        const role = res.data.user?.vai_tro;
                        if (role === 'pt') {
                            window.location.href = 'pt-portal.html';
                        } else if (role === 'hoi_vien') {
                            window.location.href = 'member-portal.html';
                        } else {
                            window.location.href = 'index.html';
                        }
                    }, 100);
                    return true;
                }
            } catch (err) {
                console.error('Login error:', err);
            }
            return false;
        },

        /**
         * Logout action
         */
        logout: function() {
            localStorage.removeItem('gym-token');
            this.user = null;
            this.redirectToLogin();
        },

        /**
         * Update UI with user info
         */
        updateUI: function() {
            if (!this.user) return;
            
            // Update User Name and Role in Header
            const headerUser = document.querySelector('header .flex.items-center span.font-bold');
            if (headerUser) headerUser.textContent = this.user.ho_ten || this.user.ten_dang_nhap;

            // Update Avatar if exists
            const headerAvatar = document.querySelector('header .flex.items-center .w-7.h-7, header .flex.items-center .w-10.h-10');
            if (headerAvatar && window.GymApp.avatarImg) {
                headerAvatar.innerHTML = window.GymApp.avatarImg(this.user.avatar_url, this.user.ho_ten, 'sm');
            }
        },

        /**
         * Helper to check if current page is login
         */
        isLoginPage: function() {
            return window.location.pathname.endsWith('login.html');
        },

        /**
         * Redirect to login if not already there
         */
        redirectToLogin: function() {
            if (!this.isLoginPage()) {
                window.location.href = 'login.html';
            }
        }
    };
})();
