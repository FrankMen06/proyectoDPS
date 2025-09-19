'use client';

import { useState, useEffect } from 'react';
import { taskService } from '../../services/task.service';
import { projectService, userService } from '../../services/project.service';

export default function TaskList({ userRole, userId, projectId = null }) {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        status: [],
        priority: [],
        projectId: projectId || '',
        assignedTo: userRole === 'usuario' ? userId : ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadInitialData();
    }, [userRole, userId, projectId]);

    useEffect(() => {
        loadTasks();
    }, [filters]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            
            const [usersData, projectsData] = await Promise.all([
                userService.getAllUsers(),
                userRole === 'gerente' 
                    ? projectService.getAllProjects()
                    : projectService.getProjectsByUser(userId)
            ]);

            setUsers(usersData);
            setProjects(projectsData);
            
        } catch (err) {
            setError('Error al cargar datos iniciales: ' + err.message);
        }
    };

    const loadTasks = async () => {
        try {
            setLoading(true);
            let tasksData;

            if (projectId) {
                // Si hay un proyecto específico, cargar solo sus tareas
                tasksData = await taskService.getTasksByProject(projectId);
            } else if (userRole === 'gerente') {
                // Gerentes ven todas las tareas
                tasksData = await taskService.getAllTasks();
            } else {
                // Usuarios solo ven sus tareas asignadas
                tasksData = await taskService.getTasksByUser(userId);
            }

            // Aplicar filtros
            tasksData = await taskService.filterTasks({
                ...filters,
                status: filters.status.length > 0 ? filters.status : undefined,
                priority: filters.priority.length > 0 ? filters.priority : undefined
            });

            setTasks(tasksData);
        } catch (err) {
            setError('Error al cargar tareas: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await taskService.updateTaskStatus(taskId, newStatus);
            loadTasks(); // Recargar lista
        } catch (err) {
            setError('Error al cambiar estado: ' + err.message);
        }
    };

    const handleProgressChange = async (taskId, newProgress) => {
        try {
            await taskService.updateTaskProgress(taskId, parseInt(newProgress));
            loadTasks(); // Recargar lista
        } catch (err) {
            setError('Error al actualizar progreso: ' + err.message);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
            return;
        }

        try {
            await taskService.deleteTask(taskId);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (err) {
            setError('Error al eliminar tarea: ' + err.message);
        }
    };

    const handleFilterChange = (filterType, value, checked) => {
        setFilters(prev => {
            if (filterType === 'status' || filterType === 'priority') {
                const currentArray = prev[filterType];
                return {
                    ...prev,
                    [filterType]: checked
                        ? [...currentArray, value]
                        : currentArray.filter(item => item !== value)
                };
            } else {
                return {
                    ...prev,
                    [filterType]: value
                };
            }
        });
    };

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Usuario desconocido';
    };

    const getUserAvatar = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? user.avatar : 'https://ui-avatars.com/api/?name=Unknown&background=gray&color=fff';
    };

    const getProjectName = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        return project ? project.title : 'Proyecto desconocido';
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'pendiente': 'bg-secondary',
            'asignada': 'bg-info',
            'en_progreso': 'bg-primary',
            'en_revision': 'bg-warning',
            'completada': 'bg-success',
            'cancelada': 'bg-danger'
        };
        return `badge ${statusClasses[status] || 'bg-secondary'}`;
    };

    const getPriorityBadgeClass = (priority) => {
        const priorityClasses = {
            'baja': 'bg-info',
            'media': 'bg-warning',
            'alta': 'bg-danger',
            'critica': 'bg-dark'
        };
        return `badge ${priorityClasses[priority] || 'bg-secondary'}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    const isOverdue = (dueDate, status) => {
        if (!dueDate || status === 'completada') return false;
        return new Date(dueDate) < new Date();
    };

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProjectName(task.projectId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row mb-4">
                <div className="col-md-6">
                    <h2>
                        {projectId ? 'Tareas del Proyecto' : 'Gestión de Tareas'}
                    </h2>
                </div>
                <div className="col-md-6 text-end">
                    {userRole === 'gerente' && (
                        <button 
                            className="btn btn-primary"
                            onClick={() => window.location.href = projectId ? `/projects/${projectId}/tasks/create` : '/tasks/create'}
                        >
                            <i className="bi bi-plus-lg"></i> Nueva Tarea
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* Filtros */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="card-title mb-0">
                                <i className="bi bi-funnel"></i> Filtros
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {/* Búsqueda */}
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Buscar</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Buscar tareas..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Proyecto */}
                                {!projectId && (
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Proyecto</label>
                                        <select
                                            className="form-select"
                                            value={filters.projectId}
                                            onChange={(e) => handleFilterChange('projectId', e.target.value)}
                                        >
                                            <option value="">Todos los proyectos</option>
                                            {projects.map(project => (
                                                <option key={project.id} value={project.id}>
                                                    {project.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Usuario asignado (solo para gerentes) */}
                                {userRole === 'gerente' && (
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Asignado a</label>
                                        <select
                                            className="form-select"
                                            value={filters.assignedTo}
                                            onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                                        >
                                            <option value="">Todos los usuarios</option>
                                            {users.filter(u => u.role === 'usuario').map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Estados */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Estados</label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {['pendiente', 'asignada', 'en_progreso', 'en_revision', 'completada', 'cancelada'].map(status => (
                                            <div key={status} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`status-${status}`}
                                                    checked={filters.status.includes(status)}
                                                    onChange={(e) => handleFilterChange('status', status, e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor={`status-${status}`}>
                                                    <span className={getStatusBadgeClass(status)}>
                                                        {status.replace('_', ' ')}
                                                    </span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Prioridades */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Prioridades</label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {['baja', 'media', 'alta', 'critica'].map(priority => (
                                            <div key={priority} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`priority-${priority}`}
                                                    checked={filters.priority.includes(priority)}
                                                    onChange={(e) => handleFilterChange('priority', priority, e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor={`priority-${priority}`}>
                                                    <span className={getPriorityBadgeClass(priority)}>
                                                        {priority}
                                                    </span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de tareas */}
            {filteredTasks.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-list-task display-1 text-muted"></i>
                    <h3 className="text-secondary fw-medium mt-3">No se encontraron tareas</h3>
                    <p className="text-secondary">
                        {userRole === 'gerente' 
                            ? 'Crea tu primera tarea para comenzar.'
                            : 'Aún no tienes tareas asignadas.'
                        }
                    </p>
                </div>
            ) : (
                <div className="card">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Tarea</th>
                                        {!projectId && <th>Proyecto</th>}
                                        <th>Asignada a</th>
                                        <th>Estado</th>
                                        <th>Prioridad</th>
                                        <th>Progreso</th>
                                        <th>Vence</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.map(task => (
                                        <tr 
                                            key={task.id} 
                                            className={isOverdue(task.dueDate, task.status) ? 'table-warning' : ''}
                                        >
                                            <td>
                                                <div>
                                                    <strong>{task.title}</strong>
                                                    {isOverdue(task.dueDate, task.status) && (
                                                        <i className="bi bi-exclamation-triangle text-warning ms-2" title="Tarea vencida"></i>
                                                    )}
                                                    {task.description && (
                                                        <div className="small text-muted">
                                                            {task.description.length > 80 
                                                                ? task.description.substring(0, 80) + '...'
                                                                : task.description
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            {!projectId && (
                                                <td>
                                                    <small>{getProjectName(task.projectId)}</small>
                                                </td>
                                            )}
                                            <td>
                                                {task.assignedTo ? (
                                                    <div className="d-flex align-items-center">
                                                        <img
                                                            src={getUserAvatar(task.assignedTo)}
                                                            alt={getUserName(task.assignedTo)}
                                                            className="rounded-circle me-2"
                                                            style={{ width: '24px', height: '24px' }}
                                                        />
                                                        <small>{getUserName(task.assignedTo)}</small>
                                                    </div>
                                                ) : (
                                                    <small className="text-secondary fw-medium">Sin asignar</small>
                                                )}
                                            </td>
                                            <td>
                                                {userRole === 'gerente' || task.assignedTo === userId ? (
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={task.status}
                                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                    >
                                                        <option value="pendiente">Pendiente</option>
                                                        <option value="asignada">Asignada</option>
                                                        <option value="en_progreso">En Progreso</option>
                                                        <option value="en_revision">En Revisión</option>
                                                        <option value="completada">Completada</option>
                                                        <option value="cancelada">Cancelada</option>
                                                    </select>
                                                ) : (
                                                    <span className={getStatusBadgeClass(task.status)}>
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={getPriorityBadgeClass(task.priority)}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td>
                                                {userRole === 'gerente' || task.assignedTo === userId ? (
                                                    <div style={{ minWidth: '120px' }}>
                                                        <input
                                                            type="range"
                                                            className="form-range"
                                                            min="0"
                                                            max="100"
                                                            value={task.progress || 0}
                                                            onChange={(e) => handleProgressChange(task.id, e.target.value)}
                                                        />
                                                        <div className="small text-center">{task.progress || 0}%</div>
                                                    </div>
                                                ) : (
                                                    <div style={{ minWidth: '100px' }}>
                                                        <div className="small mb-1">{task.progress || 0}%</div>
                                                        <div className="progress" style={{ height: '6px' }}>
                                                            <div
                                                                className="progress-bar"
                                                                style={{ width: `${task.progress || 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <small className={isOverdue(task.dueDate, task.status) ? 'text-danger fw-bold' : ''}>
                                                    {formatDate(task.dueDate)}
                                                </small>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => window.location.href = `/tasks/${task.id}`}
                                                        title="Ver detalles"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                    {userRole === 'gerente' && (
                                                        <>
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => window.location.href = `/tasks/${task.id}/edit`}
                                                                title="Editar"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-danger"
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                title="Eliminar"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Estadísticas rápidas */}
            {filteredTasks.length > 0 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card bg-light">
                            <div className="card-body">
                                <div className="row text-center">
                                    <div className="col">
                                        <div className="h5 mb-0 text-primary">{filteredTasks.length}</div>
                                        <small className="text-secondary fw-medium">Total</small>
                                    </div>
                                    <div className="col">
                                        <div className="h5 mb-0 text-success">
                                            {filteredTasks.filter(t => t.status === 'completada').length}
                                        </div>
                                        <small className="text-secondary fw-medium">Completadas</small>
                                    </div>
                                    <div className="col">
                                        <div className="h5 mb-0 text-info">
                                            {filteredTasks.filter(t => t.status === 'en_progreso').length}
                                        </div>
                                        <small className="text-secondary fw-medium">En Progreso</small>
                                    </div>
                                    <div className="col">
                                        <div className="h5 mb-0 text-warning">
                                            {filteredTasks.filter(t => isOverdue(t.dueDate, t.status)).length}
                                        </div>
                                        <small className="text-secondary fw-medium">Vencidas</small>
                                    </div>
                                    <div className="col">
                                        <div className="h5 mb-0 text-dark">
                                            {filteredTasks.length > 0 
                                                ? Math.round((filteredTasks.filter(t => t.status === 'completada').length / filteredTasks.length) * 100)
                                                : 0
                                            }%
                                        </div>
                                        <small className="text-secondary fw-medium">Tasa de Finalización</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}