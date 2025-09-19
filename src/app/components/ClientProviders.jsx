'use client';

import { AuthProvider } from '../hooks/useAuthContext';

export default function ClientProviders({ children }) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}