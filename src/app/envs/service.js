// TRUE Para que sirva publicado y FAlse para usar con json-server
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_USE_NEXT_API === 'true'
        ? '/api'                 // Next.js API Routes
        : 'http://localhost:3001'; // json-server (local)

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
};

export const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    const res = await fetch(url, config);
    return handleResponse(res);
};
