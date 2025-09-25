
import { apiRequest } from '../envs/service';

export const taskService = {
    getAllTasks: async () => {
        try {
            return await apiRequest('/tasks');
        } catch (error) {
            console.error('Error al obtener tareas:', error);
            throw error;
        }
    },

    getTasksByProject: async (projectId) => {
        try {
            const tasks = await apiRequest('/tasks');
            return tasks.filter((task) => task.projectId === projectId);
        } catch (error) {
            console.error('Error al obtener tareas del proyecto:', error);
            throw error;
        }
    },

    getTasksByUser: async (userId) => {
        try {
            const tasks = await apiRequest('/tasks');
            return tasks.filter((task) => task.assignedTo === userId);
        } catch (error) {
            console.error('Error al obtener tareas del usuario:', error);
            throw error;
        }
    },

    getTasksByProjectAndUser: async (projectId, userId) => {
        try {
            const tasks = await apiRequest('/tasks');
            return tasks.filter(
                (task) => task.projectId === projectId && task.assignedTo === userId
            );
        } catch (error) {
            console.error('Error al obtener tareas del proyecto y usuario:', error);
            throw error;
        }
    },

    getTaskById: async (id) => {
        try {
            return await apiRequest(`/tasks/${id}`);
        } catch (error) {
            console.error('Error al obtener tarea:', error);
            throw error;
        }
    },

    createTask: async (taskData) => {
        try {
            const newTask = {
                ...taskData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: taskData.status || 'pendiente',
                progress: taskData.progress || 0,
            };

            return await apiRequest('/tasks', {
                method: 'POST',
                body: JSON.stringify(newTask),
            });
        } catch (error) {
            console.error('Error al crear tarea:', error);
            throw error;
        }
    },

    updateTask: async (id, updates) => {
        try {
            const updatedTask = { ...updates, updatedAt: new Date().toISOString() };

            return await apiRequest(`/tasks/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updatedTask),
            });
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
            throw error;
        }
    },

    deleteTask: async (id) => {
        try {
            return await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            throw error;
        }
    },

    updateTaskStatus: async (id, status) => {
        try {
            const updates = { status };
            if (status === 'completada') {
                updates.progress = 100;
                updates.completedAt = new Date().toISOString();
            }
            return await taskService.updateTask(id, updates);
        } catch (error) {
            console.error('Error al cambiar estado de tarea:', error);
            throw error;
        }
    },

    updateTaskProgress: async (id, progress) => {
        try {
            const updates = { progress };
            if (progress >= 100) {
                updates.status = 'completada';
                updates.progress = 100;
                updates.completedAt = new Date().toISOString();
            } else if (progress > 0) {
                updates.status = 'en_progreso';
            }
            return await taskService.updateTask(id, updates);
        } catch (error) {
            console.error('Error al actualizar progreso de tarea:', error);
            throw error;
        }
    },

    assignTaskToUser: async (taskId, userId) => {
        try {
            return await taskService.updateTask(taskId, {
                assignedTo: userId,
                status: 'asignada',
            });
        } catch (error) {
            console.error('Error al asignar tarea:', error);
            throw error;
        }
    },

    unassignTask: async (taskId) => {
        try {
            return await taskService.updateTask(taskId, {
                assignedTo: null,
                status: 'pendiente',
            });
        } catch (error) {
            console.error('Error al desasignar tarea:', error);
            throw error;
        }
    },

    getTaskStatsByProject: async (projectId) => {
        try {
            const tasks = await taskService.getTasksByProject(projectId);
            const stats = {
                total: tasks.length,
                pendiente: tasks.filter((t) => t.status === 'pendiente').length,
                asignada: tasks.filter((t) => t.status === 'asignada').length,
                en_progreso: tasks.filter((t) => t.status === 'en_progreso').length,
                en_revision: tasks.filter((t) => t.status === 'en_revision').length,
                completada: tasks.filter((t) => t.status === 'completada').length,
                cancelada: tasks.filter((t) => t.status === 'cancelada').length,
                averageProgress:
                    tasks.length > 0
                        ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length)
                        : 0,
                completionRate:
                    tasks.length > 0
                        ? Math.round(
                            (tasks.filter((t) => t.status === 'completada').length / tasks.length) * 100
                        )
                        : 0,
            };
            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas de tareas:', error);
            throw error;
        }
    },

    getGeneralTaskStats: async () => {
        try {
            const tasks = await apiRequest('/tasks');
            const stats = {
                total: tasks.length,
                pendiente: tasks.filter((t) => t.status === 'pendiente').length,
                asignada: tasks.filter((t) => t.status === 'asignada').length,
                en_progreso: tasks.filter((t) => t.status === 'en_progreso').length,
                en_revision: tasks.filter((t) => t.status === 'en_revision').length,
                completada: tasks.filter((t) => t.status === 'completada').length,
                cancelada: tasks.filter((t) => t.status === 'cancelada').length,
                averageProgress:
                    tasks.length > 0
                        ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length)
                        : 0,
                completionRate:
                    tasks.length > 0
                        ? Math.round(
                            (tasks.filter((t) => t.status === 'completada').length / tasks.length) * 100
                        )
                        : 0,
                overdueTasks: tasks.filter((t) => {
                    if (!t.dueDate) return false;
                    const now = new Date();
                    const dueDate = new Date(t.dueDate);
                    return dueDate < now && t.status !== 'completada';
                }).length,
            };
            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas generales:', error);
            throw error;
        }
    },

    getOverdueTasks: async () => {
        try {
            const tasks = await apiRequest('/tasks');
            const now = new Date();
            return tasks.filter((task) => {
                if (!task.dueDate || task.status === 'completada') return false;
                const dueDate = new Date(task.dueDate);
                return dueDate < now;
            });
        } catch (error) {
            console.error('Error al obtener tareas vencidas:', error);
            throw error;
        }
    },

    getUpcomingTasks: async (days = 7) => {
        try {
            const tasks = await apiRequest('/tasks');
            const now = new Date();
            const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
            return tasks.filter((task) => {
                if (!task.dueDate || task.status === 'completada') return false;
                const dueDate = new Date(task.dueDate);
                return dueDate >= now && dueDate <= futureDate;
            });
        } catch (error) {
            console.error('Error al obtener tareas próximas a vencer:', error);
            throw error;
        }
    },

    filterTasks: async (filters = {}) => {
        try {
            let tasks = await apiRequest('/tasks');
            if (filters.projectId) {
                tasks = tasks.filter((task) => task.projectId === filters.projectId);
            }
            if (filters.assignedTo) {
                tasks = tasks.filter((task) => task.assignedTo === filters.assignedTo);
            }
            if (filters.status && filters.status.length > 0) {
                tasks = tasks.filter((task) => filters.status.includes(task.status));
            }
            if (filters.priority && filters.priority.length > 0) {
                tasks = tasks.filter((task) => filters.priority.includes(task.priority));
            }
            if (filters.dueDateFrom) {
                const fromDate = new Date(filters.dueDateFrom);
                tasks = tasks.filter((task) => task.dueDate && new Date(task.dueDate) >= fromDate);
            }
            if (filters.dueDateTo) {
                const toDate = new Date(filters.dueDateTo);
                tasks = tasks.filter((task) => task.dueDate && new Date(task.dueDate) <= toDate);
            }
            return tasks;
        } catch (error) {
            console.error('Error al filtrar tareas:', error);
            throw error;
        }
    },
};


export const taskUtils = {
    calculateProjectProgress: async (projectId) => {
        try {
            const tasks = await taskService.getTasksByProject(projectId);
            if (tasks.length === 0) return 0;
            const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
            return Math.round(totalProgress / tasks.length);
        } catch (error) {
            console.error('Error al calcular progreso del proyecto:', error);
            return 0;
        }
    },

    getProjectStatusFromTasks: async (projectId) => {
        try {
            const tasks = await taskService.getTasksByProject(projectId);
            if (tasks.length === 0) return 'planificacion';

            const completedTasks = tasks.filter((t) => t.status === 'completada').length;
            const inProgressTasks = tasks.filter((t) => t.status === 'en_progreso').length;

            if (completedTasks === tasks.length) return 'completado';
            if (inProgressTasks > 0 || completedTasks > 0) return 'en_progreso';
            return 'planificacion';
        } catch (error) {
            console.error('Error al obtener estado del proyecto:', error);
            return 'planificacion';
        }
    },

    validateTaskDates: (startDate, dueDate) => {
        const start = new Date(startDate);
        const due = new Date(dueDate);
        const now = new Date();
        const errors = [];

        if (start > due) {
            errors.push('La fecha de inicio no puede ser posterior a la fecha de vencimiento');
        }
        if (due < now) {
            errors.push('La fecha de vencimiento no puede ser anterior a la fecha actual');
        }
        return { isValid: errors.length === 0, errors };
    },
};
