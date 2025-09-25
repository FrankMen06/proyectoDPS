import { apiRequest } from '../envs/service';

export const projectService = {
    getAllProjects: async () => {
        try {
            return await apiRequest('/projects');
        } catch (error) {
            console.error('Error al obtener proyectos:', error);
            throw error;
        }
    },

    getProjectsByUser: async (userId) => {
        try {
            const projects = await apiRequest('/projects');
            return projects.filter(
                (project) => project.assignedUsers && project.assignedUsers.includes(userId)
            );
        } catch (error) {
            console.error('Error al obtener proyectos del usuario:', error);
            throw error;
        }
    },

    getProjectById: async (id) => {
        try {
            return await apiRequest(`/projects/${id}`);
        } catch (error) {
            console.error('Error al obtener proyecto:', error);
            throw error;
        }
    },

    createProject: async (projectData) => {
        try {
            const newProject = {
                ...projectData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                progress: 0,
                status: 'planificacion',
            };

            return await apiRequest('/projects', {
                method: 'POST',
                body: JSON.stringify(newProject),
            });
        } catch (error) {
            console.error('Error al crear proyecto:', error);
            throw error;
        }
    },

    updateProject: async (id, updates) => {
        try {
            const updatedProject = { ...updates, updatedAt: new Date().toISOString() };

            return await apiRequest(`/projects/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updatedProject),
            });
        } catch (error) {
            console.error('Error al actualizar proyecto:', error);
            throw error;
        }
    },

    deleteProject: async (id) => {
        try {
            return await apiRequest(`/projects/${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Error al eliminar proyecto:', error);
            throw error;
        }
    },

    assignUsersToProject: async (projectId, userIds) => {
        try {
            const project = await apiRequest(`/projects/${projectId}`);
            const updatedProject = {
                ...project,
                assignedUsers: [...new Set([...project.assignedUsers, ...userIds])],
                updatedAt: new Date().toISOString(),
            };

            return await apiRequest(`/projects/${projectId}`, {
                method: 'PUT',
                body: JSON.stringify(updatedProject),
            });
        } catch (error) {
            console.error('Error al asignar usuarios:', error);
            throw error;
        }
    },

    removeUsersFromProject: async (projectId, userIds) => {
        try {
            const project = await apiRequest(`/projects/${projectId}`);
            const updatedProject = {
                ...project,
                assignedUsers: project.assignedUsers.filter((id) => !userIds.includes(id)),
                updatedAt: new Date().toISOString(),
            };

            return await apiRequest(`/projects/${projectId}`, {
                method: 'PUT',
                body: JSON.stringify(updatedProject),
            });
        } catch (error) {
            console.error('Error al remover usuarios:', error);
            throw error;
        }
    },

    updateProjectProgress: async (projectId, progress) => {
        try {
            return await projectService.updateProject(projectId, { progress });
        } catch (error) {
            console.error('Error al actualizar progreso:', error);
            throw error;
        }
    },

    updateProjectStatus: async (projectId, status) => {
        try {
            return await projectService.updateProject(projectId, { status });
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            throw error;
        }
    },

    getProjectStats: async () => {
        try {
            const projects = await apiRequest('/projects');

            const stats = {
                total: projects.length,
                planificacion: projects.filter((p) => p.status === 'planificacion').length,
                en_progreso: projects.filter((p) => p.status === 'en_progreso').length,
                completado: projects.filter((p) => p.status === 'completado').length,
                pausado: projects.filter((p) => p.status === 'pausado').length,
                cancelado: projects.filter((p) => p.status === 'cancelado').length,
                averageProgress:
                    projects.length > 0
                        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
                        : 0,
            };

            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    },
};

export const userService = {
    getAllUsers: async () => {
        try {
            return await apiRequest('/users');
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw error;
        }
    },

    getUsersByRole: async (role) => {
        try {
            const users = await apiRequest('/users');
            return users.filter((user) => user.role === role);
        } catch (error) {
            console.error('Error al obtener usuarios por rol:', error);
            throw error;
        }
    },

    getUserById: async (id) => {
        try {
            return await apiRequest(`/users/${id}`);
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            throw error;
        }
    },
};
