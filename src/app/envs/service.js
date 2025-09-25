const USE_NEXT_API =
    String(process.env.NEXT_PUBLIC_USE_NEXT_API ?? '')
        .trim()
        .toLowerCase() === 'true';

// en producción usa /api aunque la env no llegue
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && /^localhost$|^127\.0\.0\.1$|^0\.0\.0\.0$/.test(window.location.hostname);

export const API_BASE_URL =
    USE_NEXT_API || (isBrowser && !isLocalhost) ? '/api' : 'http://localhost:3001';

if (isBrowser) {
    console.log('[service] NEXT_PUBLIC_USE_NEXT_API =', process.env.NEXT_PUBLIC_USE_NEXT_API);
    console.log('[service] API_BASE_URL =', API_BASE_URL);
}

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
};

export const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    // console.log('[apiRequest] →', url, options?.method || 'GET'); // debug si lo necesitas
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    return handleResponse(res);
};
