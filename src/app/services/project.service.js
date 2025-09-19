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
// PROJECTS SERVICE
// ===================
export const projectService = {

    // Obtener todos los proyectos
    getAllProjects: async () => {
        try {
            return await apiRequest('/projects');
        } catch (error) {
            console.error('Error al obtener proyectos:', error);
            throw error;
        }
    },

    // Obtener proyectos por usuario (para rol usuario)
    getProjectsByUser: async (userId) => {
        try {
            const projects = await apiRequest('/projects');
            // Filtrar proyectos donde el usuario esté asignado
            return projects.filter(project => 
                project.assignedUsers && project.assignedUsers.includes(userId)
            );
        } catch (error) {
            console.error('Error al obtener proyectos del usuario:', error);
            throw error;
        }
    },

    // Obtener un proyecto por ID
    getProjectById: async (id) => {
        try {
            return await apiRequest(`/projects/${id}`);
        } catch (error) {
            console.error('Error al obtener proyecto:', error);
            throw error;
        }
    },

    // Crear nuevo proyecto (solo gerentes)
    createProject: async (projectData) => {
        try {
            const newProject = {
                ...projectData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                progress: 0,
                status: 'planificacion'
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

    // Actualizar proyecto
    updateProject: async (id, updates) => {
        try {
            const updatedProject = {
                ...updates,
                updatedAt: new Date().toISOString()
            };

            return await apiRequest(`/projects/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updatedProject),
            });
        } catch (error) {
            console.error('Error al actualizar proyecto:', error);
            throw error;
        }
    },

    // Eliminar proyecto (solo gerentes)
    deleteProject: async (id) => {
        try {
            return await apiRequest(`/projects/${id}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Error al eliminar proyecto:', error);
            throw error;
        }
    },

    // Asignar usuarios a proyecto
    assignUsersToProject: async (projectId, userIds) => {
        try {
            const project = await apiRequest(`/projects/${projectId}`);
            const updatedProject = {
                ...project,
                assignedUsers: [...new Set([...project.assignedUsers, ...userIds])], // Evitar duplicados
                updatedAt: new Date().toISOString()
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

    // Remover usuarios de proyecto
    removeUsersFromProject: async (projectId, userIds) => {
        try {
            const project = await apiRequest(`/projects/${projectId}`);
            const updatedProject = {
                ...project,
                assignedUsers: project.assignedUsers.filter(id => !userIds.includes(id)),
                updatedAt: new Date().toISOString()
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

    // Actualizar progreso del proyecto
    updateProjectProgress: async (projectId, progress) => {
        try {
            return await projectService.updateProject(projectId, { progress });
        } catch (error) {
            console.error('Error al actualizar progreso:', error);
            throw error;
        }
    },

    // Cambiar estado del proyecto
    updateProjectStatus: async (projectId, status) => {
        try {
            return await projectService.updateProject(projectId, { status });
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            throw error;
        }
    },

    // Obtener estadísticas de proyectos
    getProjectStats: async () => {
        try {
            const projects = await apiRequest('/projects');
            
            const stats = {
                total: projects.length,
                planificacion: projects.filter(p => p.status === 'planificacion').length,
                en_progreso: projects.filter(p => p.status === 'en_progreso').length,
                completado: projects.filter(p => p.status === 'completado').length,
                pausado: projects.filter(p => p.status === 'pausado').length,
                cancelado: projects.filter(p => p.status === 'cancelado').length,
                averageProgress: projects.length > 0 
                    ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
                    : 0
            };

            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    }
};

// ===================
// USERS SERVICE (para asignaciones)
// ===================
export const userService = {
    
    // Obtener todos los usuarios
    getAllUsers: async () => {
        try {
            return await apiRequest('/users');
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw error;
        }
    },

    // Obtener usuarios por rol
    getUsersByRole: async (role) => {
        try {
            const users = await apiRequest('/users');
            return users.filter(user => user.role === role);
        } catch (error) {
            console.error('Error al obtener usuarios por rol:', error);
            throw error;
        }
    },

    // Obtener usuario por ID
    getUserById: async (id) => {
        try {
            return await apiRequest(`/users/${id}`);
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            throw error;
        }
    }
};