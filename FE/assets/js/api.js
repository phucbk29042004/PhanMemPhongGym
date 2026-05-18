/**
 * API Utility - Paradise GYM
 * Handles base URL, JWT tokens, and standardized responses.
 */
(function() {
    const BASE_URL = 'http://localhost:3000/api';

    window.GymApp.api = {
        /**
         * Core fetch wrapper
         */
        fetch: async (endpoint, options = {}) => {
            const url = `${BASE_URL}${endpoint}`;
            const token = localStorage.getItem('gym-token');

            const headers = {
                'Content-Type': 'application/json',
                ...options.headers,
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            try {
                const response = await fetch(url, {
                    ...options,
                    headers,
                });

                const data = await response.json();

                if (!response.ok) {
                    // Handle unauthorized
                    if (response.status === 401) {
                        window.GymApp.auth.logout();
                        return null;
                    }
                    throw new Error(data.message || 'Có lỗi xảy ra');
                }

                return data;
            } catch (error) {
                console.error(`API Error [${endpoint}]:`, error);
                window.GymApp.toast(error.message, 'error');
                throw error;
            }
        },

        get: (endpoint) => window.GymApp.api.fetch(endpoint, { method: 'GET' }),
        post: (endpoint, body) => window.GymApp.api.fetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
        put: (endpoint, body) => window.GymApp.api.fetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
        patch: (endpoint, body) => window.GymApp.api.fetch(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
        delete: (endpoint) => window.GymApp.api.fetch(endpoint, { method: 'DELETE' }),
        download: async (endpoint, filename) => {
            const url = `${BASE_URL}${endpoint}`;
            const token = localStorage.getItem('gym-token');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            try {
                const response = await fetch(url, { headers });
                if (!response.ok) throw new Error('Không thể tải báo cáo từ máy chủ.');
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(blobUrl);
                return true;
            } catch (error) {
                console.error('Download error:', error);
                window.GymApp.toast('Có lỗi xảy ra khi xuất file!', 'error');
                return false;
            }
        },

        /**
         * Special fetch for FormData (file uploads)
         */
        upload: async (endpoint, formData) => {
            const url = `${BASE_URL}${endpoint}`;
            const token = localStorage.getItem('gym-token');

            const headers = { ...window.GymApp.api.headers };
            delete headers['Content-Type']; // Let browser set boundary
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }, // Form data handles its own content-type
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Upload thất bại');
            return data;
        }
    };
})();
