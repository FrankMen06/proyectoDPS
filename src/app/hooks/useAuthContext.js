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
            
            setUser(userData);
            setSession(sessionData);
            setIsAuthenticated(true);
            
            return true;
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            return false;
        }
    };

    const logout = () => {
        try {
            localStorage.removeItem('user');
            localStorage.removeItem('session');
            localStorage.removeItem('isAuthenticated');
            
            setUser(null);
            setSession(null);
            setIsAuthenticated(false);
            
            router.push('/');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const updateUser = (updatedUserData) => {
        try {
            const newUserData = { ...user, ...updatedUserData };
            localStorage.setItem('user', JSON.stringify(newUserData));
            setUser(newUserData);
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
        }
    };

    // Verificar si el usuario tiene un rol específico
    const hasRole = (role) => {
        // Si el usuario no está cargado aún, evitar la redirección inmediata
        // Esto previene redirecciones falsas durante la carga inicial
        if (!user) {
            console.log('hasRole: usuario no disponible aún');
            // Retornar null en lugar de false para indicar "aún no se sabe"
            return null;
        }
        
        console.log('hasRole comprobando:', user.role, '===', role, ':', user.role === role);
        return user.role === role;
    };

    // Verificar si el usuario tiene permisos para una acción
    const hasPermission = (permission) => {
        if (!user) return false;

        const permissions = {
            // Permisos de gerente
            'create_project': user.role === 'gerente',
            'edit_project': user.role === 'gerente',
            'delete_project': user.role === 'gerente',
            'assign_users': user.role === 'gerente',
            'create_task': user.role === 'gerente',
            'edit_task': user.role === 'gerente',
            'delete_task': user.role === 'gerente',
            'view_all_projects': user.role === 'gerente',
            'view_all_tasks': user.role === 'gerente',
            'manage_users': user.role === 'gerente',
            
            // Permisos de usuario
            'view_assigned_projects': true,
            'view_assigned_tasks': true,
            'update_task_progress': true,
            'update_task_status': true,
            'view_project_details': true,
            'view_task_details': true
        };

        return permissions[permission] || false;
    };

    // Verificar si el usuario puede acceder a un recurso específico
    const canAccess = (resource, resourceId = null) => {
        if (!user) return false;

        // Gerentes pueden acceder a todo
        if (user.role === 'gerente') return true;

        // Para usuarios regulares, verificar acceso específico
        switch (resource) {
            case 'project':
                // Los usuarios solo pueden acceder a proyectos asignados
                // Esta verificación se debe hacer con los datos del proyecto
                return true; // Se validará en el componente específico
            
            case 'task':
                // Los usuarios solo pueden acceder a tareas asignadas
                // Esta verificación se debe hacer con los datos de la tarea
                return true; // Se validará en el componente específico
            
            default:
                return false;
        }
    };

    const value = {
        user,
        session,
        isAuthenticated,
        loading,
        login,
        logout,
        updateUser,
        hasRole,
        hasPermission,
        canAccess,
        checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Componente de ruta protegida
export const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null, fallback = null }) => {
    const { isAuthenticated, user, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.push('/');
                return;
            }

            // Verificar rol requerido
            if (requiredRole && user?.role !== requiredRole) {
                router.push('/dashboard'); // Redirigir a dashboard si no tiene el rol
                return;
            }

            // Verificar permiso requerido
            if (requiredPermission && !hasPermission(requiredPermission)) {
                router.push('/dashboard'); // Redirigir a dashboard si no tiene el permiso
                return;
            }
        }
    }, [isAuthenticated, user, loading, requiredRole, requiredPermission, router, hasPermission]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return fallback || null;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return fallback || (
            <div className="alert alert-warning" role="alert">
                No tienes permisos para acceder a esta página.
            </div>
        );
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        return fallback || (
            <div className="alert alert-warning" role="alert">
                No tienes permisos para realizar esta acción.
            </div>
        );
    }

    return children;
};

// Hook personalizado para verificar autenticación
export const useAuthCheck = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();

    const requireAuth = (redirectTo = '/') => {
        useEffect(() => {
            if (!loading && !isAuthenticated) {
                router.push(redirectTo);
            }
        }, [isAuthenticated, loading, router, redirectTo]);
    };

    const requireRole = (role, redirectTo = '/dashboard') => {
        useEffect(() => {
            if (!loading && (!isAuthenticated || user?.role !== role)) {
                router.push(redirectTo);
            }
        }, [isAuthenticated, user, loading, role, router, redirectTo]);
    };

    return {
        isAuthenticated,
        user,
        loading,
        requireAuth,
        requireRole
    };
};

// Exportar con ambos nombres para compatibilidad
export const useAuthContext = useAuth;
export default useAuth;