'use client';

import { useState, useEffect } from 'react';
import { projectService, userService } from '../../services/project.service';
import { taskService } from '../../services/task.service';

export default function ProjectDetail({ projectId, userRole, userId }) {
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (projectId) {
            loadProjectData();
        }
    }, [projectId]);

    const loadProjectData = async () => {
        try {
            setLoading(true);
            
            // Cargar proyecto, tareas y usuarios en paralelo
            const [projectData, tasksData, usersData, statsData] = await Promise.all([
                projectService.getProjectById(projectId),
                taskService.getTasksByProject(projectId),
                userService.getAllUsers(),
                taskService.getTaskStatsByProject(projectId)
            ]);

            setProject(projectData);
            setTasks(tasksData);
            setUsers(usersData);
            setStats(statsData);
        } catch (err) {
            setError('Error al cargar datos del proyecto: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskStatusChange = async (taskId, newStatus) => {
        try {
            await taskService.updateTaskStatus(taskId, newStatus);
            loadProjectData(); // Recargar datos
        } catch (err) {
            setError('Error al cambiar estado de tarea: ' + err.message);
        }
    };

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Usuario desconocido';
    };

    const getUserAvatar = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? user.avatar : 'https://ui-avatars.com/api/?name=Unknown&background=gray&color=fff';
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'planificacion': 'bg-secondary',
            'en_progreso': 'bg-primary',
            'completado': 'bg-success',
            'pausado': 'bg-warning',
            'cancelado': 'bg-danger',
            'pendiente': 'bg-secondary',
            'asignada': 'bg-info',
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
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    if (!project) {
        return (
            <div className="alert alert-warning" role="alert">
                Proyecto no encontrado.
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Header del proyecto */}
            <div className="row mb-4">
                <div className="col-md-8">
                    <h1 className="display-6">{project.title}</h1>
                    <p className="text-muted">{project.description}</p>
                </div>
                <div className="col-md-4 text-end">
                    {userRole === 'gerente' && (
                        <div className="btn-group" role="group">
                            <button 
                                className="btn btn-outline-primary"
                                onClick={() => window.location.href = `/projects/${project.id}/edit`}
                            >
                                <i className="bi bi-pencil"></i> Editar
                            </button>
                            <button 
                                className="btn btn-outline-success"
                                onClick={() => window.location.href = `/projects/${project.id}/tasks/create`}
                            >
                                <i className="bi bi-plus-lg"></i> Nueva Tarea
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Información general del proyecto */}
            <div className="row mb-4">
                <div className="col-lg-8">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-info-circle"></i> Información General
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <dl className="row">
                                        <dt className="col-sm-4">Estado:</dt>
                                        <dd className="col-sm-8">
                                            <span className={getStatusBadgeClass(project.status)}>
                                                {project.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </dd>
                                        
                                        <dt className="col-sm-4">Prioridad:</dt>
                                        <dd className="col-sm-8">
                                            <span className={getPriorityBadgeClass(project.priority)}>
                                                {project.priority.toUpperCase()}
                                            </span>
                                        </dd>
                                        
                                        <dt className="col-sm-4">Categoría:</dt>
                                        <dd className="col-sm-8">{project.category}</dd>
                                        
                                        <dt className="col-sm-4">Presupuesto:</dt>
                                        <dd className="col-sm-8">{formatCurrency(project.budget || 0)}</dd>
                                    </dl>
                                </div>
                                
                                <div className="col-md-6">
                                    <dl className="row">
                                        <dt className="col-sm-4">Inicio:</dt>
                                        <dd className="col-sm-8">{formatDate(project.startDate)}</dd>
                                        
                                        <dt className="col-sm-4">Fin:</dt>
                                        <dd className="col-sm-8">{formatDate(project.endDate)}</dd>
                                        
                                        <dt className="col-sm-4">Creado:</dt>
                                        <dd className="col-sm-8">{formatDate(project.createdAt)}</dd>
                                        
                                        <dt className="col-sm-4">Actualizado:</dt>
                                        <dd className="col-sm-8">{formatDate(project.updatedAt)}</dd>
                                    </dl>
                                </div>
                            </div>
                            
                            {/* Progreso */}
                            <div className="mt-3">
                                <label className="form-label">
                                    Progreso General: {project.progress || 0}%
                                </label>
                                <div className="progress">
                                    <div
                                        className="progress-bar"
                                        role="progressbar"
                                        style={{ width: `${project.progress || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estadísticas de tareas */}
                <div className="col-lg-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-bar-chart"></i> Estadísticas de Tareas
                            </h5>
                        </div>
                        <div className="card-body">
                            {stats && (
                                <div className="row text-center">
                                    <div className="col-6 mb-3">
                                        <div className="h3 mb-0 text-primary">{stats.total}</div>
                                        <small className="text-muted">Total</small>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <div className="h3 mb-0 text-success">{stats.completada}</div>
                                        <small className="text-muted">Completadas</small>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <div className="h3 mb-0 text-info">{stats.en_progreso}</div>
                                        <small className="text-muted">En Progreso</small>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <div className="h3 mb-0 text-warning">{stats.pendiente}</div>
                                        <small className="text-muted">Pendientes</small>
                                    </div>
                                    <div className="col-12">
                                        <div className="h4 mb-0 text-dark">{stats.completionRate}%</div>
                                        <small className="text-muted">Tasa de Finalización</small>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Equipo asignado */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-people"></i> Equipo Asignado
                            </h5>
                        </div>
                        <div className="card-body">
                            {project.assignedUsers && project.assignedUsers.length > 0 ? (
                                <div className="row">
                                    {project.assignedUsers.map(userId => {
                                        const user = users.find(u => u.id === userId);
                                        if (!user) return null;
                                        
                                        return (
                                            <div key={userId} className="col-md-6 col-lg-4 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <img
                                                        src={user.avatar}
                                                        alt={user.name}
                                                        className="rounded-circle me-3"
                                                        style={{ width: '48px', height: '48px' }}
                                                    />
                                                    <div>
                                                        <h6 className="mb-0">{user.name}</h6>
                                                        <small className="text-muted">{user.email}</small>
                                                        <br />
                                                        <span className="badge bg-outline-primary">
                                                            {user.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-muted mb-0">No hay usuarios asignados a este proyecto.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de tareas */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-list-task"></i> Tareas del Proyecto
                            </h5>
                            {userRole === 'gerente' && (
                                <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => window.location.href = `/projects/${project.id}/tasks/create`}
                                >
                                    <i className="bi bi-plus-lg"></i> Nueva Tarea
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            {tasks.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="bi bi-list-task display-4 text-muted"></i>
                                    <p className="text-muted mt-2">No hay tareas en este proyecto.</p>
                                    {userRole === 'gerente' && (
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => window.location.href = `/projects/${project.id}/tasks/create`}
                                        >
                                            Crear Primera Tarea
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Tarea</th>
                                                <th>Asignada a</th>
                                                <th>Estado</th>
                                                <th>Prioridad</th>
                                                <th>Progreso</th>
                                                <th>Vence</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map(task => (
                                                <tr key={task.id}>
                                                    <td>
                                                        <div>
                                                            <strong>{task.title}</strong>
                                                            {task.description && (
                                                                <div className="small text-muted">
                                                                    {task.description.length > 60 
                                                                        ? task.description.substring(0, 60) + '...'
                                                                        : task.description
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
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
                                                            <small className="text-muted">Sin asignar</small>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {userRole === 'gerente' || task.assignedTo === userId ? (
                                                            <select
                                                                className="form-select form-select-sm"
                                                                value={task.status}
                                                                onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
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
                                                                {task.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={getPriorityBadgeClass(task.priority)}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ minWidth: '100px' }}>
                                                            <div className="small mb-1">{task.progress || 0}%</div>
                                                            <div className="progress" style={{ height: '6px' }}>
                                                                <div
                                                                    className="progress-bar"
                                                                    style={{ width: `${task.progress || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {task.dueDate ? (
                                                            <small>{formatDate(task.dueDate)}</small>
                                                        ) : (
                                                            <small className="text-muted">-</small>
                                                        )}
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
                                                                <button
                                                                    className="btn btn-outline-secondary"
                                                                    onClick={() => window.location.href = `/tasks/${task.id}/edit`}
                                                                    title="Editar"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}