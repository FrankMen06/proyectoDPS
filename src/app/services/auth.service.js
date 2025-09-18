const API_BASE_URL = 'http://localhost:3001';

// Función helper para manejar respuestas
const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
};

// Función helper para hacer requests
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        return await handleResponse(response);
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// ===================
// AUTH SERVICE
// ===================
export const authService = {

    // LOGIN - Autenticar usuario
    login: async (email, password) => {
        try {
            // Obtener todos los usuarios de la base de datos
            const users = await apiRequest('/users');

            // Buscar usuario con credenciales coincidentes
            const user = users.find(u =>
                u.email.toLowerCase() === email.toLowerCase() &&
                u.password === password
            );

            if (!user) {
                throw new Error('Email o contraseña incorrectos');
            }

            // Verificar si el usuario está activo (si tienes esta funcionalidad)
            if (user.status && user.status === 'inactive') {
                throw new Error('Tu cuenta ha sido desactivada. Contacta al administrador');
            }

            // Crear sesión
            const session = {
                id: Date.now().toString(),
                userId: user.id,
                token: `jwt_token_${user.id}_${Date.now()}`,
                isActive: true,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
                lastActivity: new Date().toISOString()
            };

            // Guardar la sesión en la base de datos
            await apiRequest('/sessions', {
                method: 'POST',
                body: JSON.stringify(session),
            });

            // Actualizar último acceso del usuario
            await apiRequest(`/users/${user.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    lastLogin: new Date().toISOString()
                }),
            });

            // Retornar usuario (sin contraseña) y sesión
            const { password: _, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                session
            };

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // REGISTRO - Crear nuevo usuario
    register: async (userData) => {
        try {
            // Verificar si el email ya existe
            const existingUsers = await apiRequest('/users');
            const emailExists = existingUsers.some(u =>
                u.email.toLowerCase() === userData.email.toLowerCase()
            );

            if (emailExists) {
                throw new Error('Este email ya está registrado');
            }

            // Crear nuevo usuario
            const newUser = {
                ...userData,
                id: Date.now().toString(),
                email: userData.email.toLowerCase(),
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random&color=fff`,
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLogin: null
            };

            // Guardar usuario en la base de datos
            const createdUser = await apiRequest('/users', {
                method: 'POST',
                body: JSON.stringify(newUser),
            });

            // Retornar usuario sin contraseña
            const { password, ...userWithoutPassword } = createdUser;
            return userWithoutPassword;

        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    // LOGOUT - Cerrar sesión
    logout: async (sessionId) => {
        try {
            if (!sessionId) {
                throw new Error('ID de sesión requerido');
            }

            // Eliminar sesión de la base de datos
            await apiRequest(`/sessions/${sessionId}`, {
                method: 'DELETE',
            });

            // Limpiar localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('session');
            localStorage.removeItem('isAuthenticated');

            return true;

        } catch (error) {
            console.error('Logout error:', error);
            // Aunque falle la eliminación en la DB, limpiamos el localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('session');
            localStorage.removeItem('isAuthenticated');
            throw error;
        }
    },

    // VALIDAR SESIÓN - Verificar si la sesión es válida
    validateSession: async (token) => {
        try {
            if (!token) {
                throw new Error('Token requerido');
            }

            // Obtener todas las sesiones activas
            const sessions = await apiRequest('/sessions');
            const session = sessions.find(s =>
                s.token === token &&
                s.isActive &&
                new Date(s.expiresAt) > new Date()
            );

            if (!session) {
                throw new Error('Sesión inválida o expirada');
            }

            // Actualizar última actividad
            await apiRequest(`/sessions/${session.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    lastActivity: new Date().toISOString()
                }),
            });

            // Obtener datos del usuario
            const user = await apiRequest(`/users/${session.userId}`);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            const { password, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                session
            };

        } catch (error) {
            console.error('Validate session error:', error);
            throw error;
        }
    },

    // OBTENER USUARIO ACTUAL - Desde localStorage
    getCurrentUser: () => {
        try {
            const userStr = localStorage.getItem('user');
            const sessionStr = localStorage.getItem('session');

            if (!userStr || !sessionStr) {
                return null;
            }

            const user = JSON.parse(userStr);
            const session = JSON.parse(sessionStr);

            // Verificar si la sesión no ha expirado
            if (new Date(session.expiresAt) <= new Date()) {
                // Sesión expirada, limpiar localStorage
                localStorage.removeItem('user');
                localStorage.removeItem('session');
                localStorage.removeItem('isAuthenticated');
                return null;
            }

            return { user, session };

        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },

    // VERIFICAR AUTENTICACIÓN - Simple check
    isAuthenticated: () => {
        const current = authService.getCurrentUser();
        return current !== null;
    },

    // VERIFICAR ROL - Comprobar si el usuario tiene un rol específico
    hasRole: (requiredRole) => {
        const current = authService.getCurrentUser();
        if (!current) return false;

        return current.user.role === requiredRole;
    },

    // CAMBIAR CONTRASEÑA
    changePassword: async (userId, currentPassword, newPassword) => {
        try {
            // Verificar contraseña actual
            const user = await apiRequest(`/users/${userId}`);
            if (user.password !== currentPassword) {
                throw new Error('La contraseña actual es incorrecta');
            }

            // Actualizar contraseña
            await apiRequest(`/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    password: newPassword,
                    updatedAt: new Date().toISOString()
                }),
            });

            return true;

        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    },

    // ACTUALIZAR PERFIL
    updateProfile: async (userId, profileData) => {
        try {
            const updatedData = {
                ...profileData,
                updatedAt: new Date().toISOString()
            };

            const updatedUser = await apiRequest(`/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify(updatedData),
            });

            // Actualizar usuario en localStorage
            const { password, ...userWithoutPassword } = updatedUser;
            localStorage.setItem('user', JSON.stringify(userWithoutPassword));

            return userWithoutPassword;

        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    // LIMPIAR SESIONES EXPIRADAS - Función de mantenimiento
    cleanExpiredSessions: async () => {
        try {
            const sessions = await apiRequest('/sessions');
            const now = new Date();

            const expiredSessions = sessions.filter(s =>
                new Date(s.expiresAt) <= now
            );

            // Eliminar sesiones expiradas
            const deletePromises = expiredSessions.map(s =>
                apiRequest(`/sessions/${s.id}`, { method: 'DELETE' })
            );

            await Promise.all(deletePromises);

            console.log(`${expiredSessions.length} sesiones expiradas eliminadas`);
            return expiredSessions.length;

        } catch (error) {
            console.error('Clean expired sessions error:', error);
            throw error;
        }
    }
};

export default authService;
