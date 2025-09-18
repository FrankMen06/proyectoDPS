'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children, requireAuth = false }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedSession = localStorage.getItem('session');

        if (storedUser && storedSession) {
            const session = JSON.parse(storedSession);
            if (new Date(session.expiresAt) > new Date()) {
                setUser(JSON.parse(storedUser));
            } else {
                localStorage.clear();
                if (requireAuth) router.push('/login');
            }
        } else if (requireAuth) {
            router.push('/login');
        }

        setLoading(false);
    }, [requireAuth, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p>Verificando sesión...</p>
            </div>
        );
    }

    if (requireAuth && !user) return null; // redirigió

    return <>{children}</>;
}
