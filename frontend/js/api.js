/**
 * API Module - Handles all HTTP requests to the backend
 */
const API = {
    baseURL: '/api',
    userID: null,

    setUserID(id) {
        this.userID = id;
    },

    getHeaders() {
        const headers = {};
        if (this.userID) {
            headers['X-User-ID'] = String(this.userID);
        }
        return headers;
    },

    async request(method, endpoint, body, isFormData) {
        const headers = this.getHeaders();
        const options = {
            method: method,
            headers: headers,
        };

        if (body) {
            if (isFormData) {
                // For FormData, don't set Content-Type (browser sets it with boundary)
                // But we need to keep X-User-ID header
                options.body = body;
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
        }

        const response = await fetch(this.baseURL + endpoint, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    },

    // Users
    async getUsers() {
        return this.request('GET', '/users');
    },

    async getCurrentUser() {
        return this.request('GET', '/me');
    },

    // Vehicles
    async getVehicles() {
        return this.request('GET', '/vehicles');
    },

    // Master Items
    async getMasterItems() {
        return this.request('GET', '/master-items');
    },

    // Reports
    async getReports() {
        return this.request('GET', '/reports');
    },

    async getReport(id) {
        return this.request('GET', '/reports/' + id);
    },

    async createReport(formData) {
        return this.request('POST', '/reports', formData, true);
    },

    async approveReport(id) {
        const options = {
            method: 'PUT',
            headers: this.getHeaders(),
        };
        const response = await fetch(this.baseURL + '/reports/' + id + '/approve', options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        return data;
    },

    async completeReport(id, formData) {
        return this.request('PUT', '/reports/' + id + '/complete', formData, true);
    }
};
