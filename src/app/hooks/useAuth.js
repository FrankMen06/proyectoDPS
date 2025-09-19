'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';

// Crear contexto de autenticación
const AuthContext = createContext({});

// Hook para usar el contexto de autenticación
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de AuthProvider');
    }
    return context;
};

// Proveedor de autenticación
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        try {
            const userData = localStorage.getItem('user');
            const sessionData = localStorage.getItem('session');
            const authStatus = localStorage.getItem('isAuthenticated');

            if (userData && sessionData && authStatus === 'true') {
                const parsedUser = JSON.parse(userData);
                const parsedSession = JSON.parse(sessionData);

                // Verificar si la sesión no ha expirado
                const now = new Date();
                const expiresAt = new Date(parsedSession.expiresAt);

                if (now < expiresAt && parsedSession.isActive) {
                    setUser(parsedUser);
                    setSession(parsedSession);
                    setIsAuthenticated(true);
                } else {
                    // Sesión expirada
                    logout();
                }
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (userData, sessionData) => {
        try {
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('session', JSON.stringify(sessionData));
            localStorage.setItem('isAuthenticated', 'true');

            setUser(loggedUser);
            setIsAuthenticated(true);

            // Redirigir según rol
            if (loggedUser.role === 'gerente') {
                router.push('/dashboard/manager');
            } else {
                router.push('/dashboard/user');
            }

            return loggedUser;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            const currentUser = authService.getCurrentUser();
            if (currentUser?.session?.id) {
                await authService.logout(currentUser.session.id);
            }
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            // Siempre limpiar el estado local
            setUser(null);
            setIsAuthenticated(false);
            router.push('/login');
        }
    };

    const hasRole = (role) => {
        return user?.role === role;
    };

    const isManager = () => hasRole('gerente');
    const isUser = () => hasRole('usuario');

    return {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        hasRole,
        isManager,
        isUser,
        checkAuth
    };
};

export default useAuth;
