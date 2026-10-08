/* Shared helper: talks to the RemotifyJobs backend (same server as the pages). */
window.JoblyAPI = (function () {
    const TOKEN_KEY = "joblyToken";
    const USER_KEY = "joblyUser";
    const ADMIN_KEY = "joblyAdminToken";

    function safeGet(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function getToken() { return safeGet(TOKEN_KEY); }

    function getUser() {
        try { return JSON.parse(safeGet(USER_KEY)) || null; } catch (e) { return null; }
    }

    // A poster is simply someone with a valid login token.
    function isPoster() { return !!getToken(); }

    function setSession(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    /* Admin (internships + scholarships). Only a hint for the UI; the server checks every request. */
    function getAdminToken() { return safeGet(ADMIN_KEY); }
    function isAdmin() { return !!getAdminToken(); }
    function setAdminSession(token) { localStorage.setItem(ADMIN_KEY, token); }
    function adminLogout() { localStorage.removeItem(ADMIN_KEY); }

    async function request(path, options) {
        options = options || {};
        const headers = { "Content-Type": "application/json" };
        const token = options.admin ? getAdminToken() : getToken();
        if (token) headers.Authorization = "Bearer " + token;

        let response;
        try {
            response = await fetch("/api" + path, {
                method: options.method || "GET",
                headers: headers,
                body: options.body ? JSON.stringify(options.body) : undefined
            });
        } catch (e) {
            throw new Error("Cannot reach the server. Check your connection.");
        }

        let data = null;
        try { data = await response.json(); } catch (e) { /* no body */ }

        if (response.status === 401 && token) {
            if (options.admin) adminLogout(); else logout(); // expired login
        }
        if (!response.ok) {
            throw new Error((data && data.error) || "Something went wrong.");
        }
        return data;
    }

    return {
        getToken, getUser, isPoster, setSession, logout,
        isAdmin, setAdminSession, adminLogout,
        request
    };
})();
