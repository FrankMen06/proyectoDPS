    import { apiRequest } from '../envs/service';

    export const authService = {
        login: async (email, password) => {
            try {
                const users = await apiRequest('/users');
                const user = users.find(u =>
                    u.email.toLowerCase() === email.toLowerCase() && u.password === password
                );
                if (!user) throw new Error('Email o contraseña incorrectos');
                if (user.status && user.status === 'inactive') {
                    throw new Error('Tu cuenta ha sido desactivada. Contacta al administrador');
                }

                const session = {
                    id: Date.now().toString(),
                    userId: user.id,
                    token: `jwt_token_${user.id}_${Date.now()}`,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    lastActivity: new Date().toISOString()
                };

                await apiRequest('/sessions', { method: 'POST', body: JSON.stringify(session) });
                await apiRequest(`/users/${user.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ lastLogin: new Date().toISOString() }),
                });

                const { password: _, ...userWithoutPassword } = user;
                return { user: userWithoutPassword, session };
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        },

        register: async (userData) => {
            try {
                const existingUsers = await apiRequest('/users');
                const emailExists = existingUsers.some(u =>
                    u.email.toLowerCase() === userData.email.toLowerCase()
                );
                if (emailExists) throw new Error('Este email ya está registrado');

                const newUser = {
                    ...userData,
                    id: Date.now().toString(),
                    email: userData.email.toLowerCase(),
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random&color=fff`,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                };

                const createdUser = await apiRequest('/users', {
                    method: 'POST',
                    body: JSON.stringify(newUser),
                });

                const { password, ...userWithoutPassword } = createdUser;
                return userWithoutPassword;
            } catch (error) {
                console.error('Register error:', error);
                throw error;
            }
        },

        logout: async (sessionId) => {
            try {
                if (!sessionId) throw new Error('ID de sesión requerido');
                await apiRequest(`/sessions/${sessionId}`, { method: 'DELETE' });

                localStorage.removeItem('user');
                localStorage.removeItem('session');
                localStorage.removeItem('isAuthenticated');
                return true;
            } catch (error) {
                console.error('Logout error:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('session');
                localStorage.removeItem('isAuthenticated');
                throw error;
            }
        },

        validateSession: async (token) => {
            try {
                if (!token) throw new Error('Token requerido');

                const sessions = await apiRequest('/sessions');
                const session = sessions.find(s =>
                    s.token === token && s.isActive && new Date(s.expiresAt) > new Date()
                );
                if (!session) throw new Error('Sesión inválida o expirada');

                await apiRequest(`/sessions/${session.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ lastActivity: new Date().toISOString() }),
                });

                const user = await apiRequest(`/users/${session.userId}`);
                if (!user) throw new Error('Usuario no encontrado');

                const { password, ...userWithoutPassword } = user;
                return { user: userWithoutPassword, session };
            } catch (error) {
                console.error('Validate session error:', error);
                throw error;
            }
        },

        getCurrentUser: () => {
            try {
                const userStr = localStorage.getItem('user');
                const sessionStr = localStorage.getItem('session');
                if (!userStr || !sessionStr) return null;

                const user = JSON.parse(userStr);
                const session = JSON.parse(sessionStr);

                if (new Date(session.expiresAt) <= new Date()) {
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

        isAuthenticated: () => {
            const current = authService.getCurrentUser();
            return current !== null;
        },

        hasRole: (requiredRole) => {
            const current = authService.getCurrentUser();
            if (!current) return false;
            return current.user.role === requiredRole;
        },

        changePassword: async (userId, currentPassword, newPassword) => {
            try {
                const user = await apiRequest(`/users/${userId}`);
                if (user.password !== currentPassword) {
                    throw new Error('La contraseña actual es incorrecta');
                }
                await apiRequest(`/users/${userId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ password: newPassword, updatedAt: new Date().toISOString() }),
                });
                return true;
            } catch (error) {
                console.error('Change password error:', error);
                throw error;
            }
        },

        updateProfile: async (userId, profileData) => {
            try {
                const updatedData = { ...profileData, updatedAt: new Date().toISOString() };
                const updatedUser = await apiRequest(`/users/${userId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(updatedData),
                });

                const { password, ...userWithoutPassword } = updatedUser;
                localStorage.setItem('user', JSON.stringify(userWithoutPassword));
                return userWithoutPassword;
            } catch (error) {
                console.error('Update profile error:', error);
                throw error;
            }
        },

        cleanExpiredSessions: async () => {
            try {
                const sessions = await apiRequest('/sessions');
                const now = new Date();
                const expiredSessions = sessions.filter(s => new Date(s.expiresAt) <= now);

                await Promise.all(
                    expiredSessions.map(s => apiRequest(`/sessions/${s.id}`, { method: 'DELETE' }))
                );

                console.log(`${expiredSessions.length} sesiones expiradas eliminadas`);
                return expiredSessions.length;
            } catch (error) {
                console.error('Clean expired sessions error:', error);
                throw error;
            }
        }
    };

    export default authService;
