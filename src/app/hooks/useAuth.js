// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/auth.service';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const currentUser = authService.getCurrentUser();

            if (currentUser) {
                // Validar sesión con el servidor
                try {
                    const { user: validUser } = await authService.validateSession(currentUser.session.token);
                    setUser(validUser);
                    setIsAuthenticated(true);
                } catch (error) {
                    // Sesión inválida
                    logout();
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const { user: loggedUser, session } = await authService.login(email, password);

            // Guardar en localStorage
            localStorage.setItem('user', JSON.stringify(loggedUser));
            localStorage.setItem('session', JSON.stringify(session));
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
