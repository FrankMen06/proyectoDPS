'use client';

import { useState, useEffect, use } from 'react';
import { taskService } from '../../services/task.service';
import { projectService, userService } from '../../services/project.service';
import { useAuthContext } from '../../hooks/useAuthContext';

export default function TaskDetail({ params }) {
    const resolvedParams = use(params);
    const { user, hasRole } = useAuthContext();
    const [task, setTask] = useState(null);
    const [project, setProject] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updateError, setUpdateError] = useState('');

    useEffect(() => {
        if (resolvedParams?.id) {
            loadTaskData();
        }
    }, [resolvedParams?.id]);

    const loadTaskData = async () => {
        try {
            setLoading(true);
            const [taskData, usersData] = await Promise.all([
                taskService.getTaskById(resolvedParams.id),
                userService.getAllUsers()
            ]);

            setTask(taskData);
            setUsers(usersData);

            // Cargar proyecto relacionado
            if (taskData.projectId) {
                const projectData = await projectService.getProjectById(taskData.projectId);
                setProject(projectData);
            }
        } catch (err) {
            setError('Error al cargar la tarea: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            setUpdateError('');
            await taskService.updateTaskStatus(task.id, newStatus);
            setTask({ ...task, status: newStatus });
        } catch (err) {
            setUpdateError('Error al cambiar estado: ' + err.message);
        }
    };

    const handleProgressChange = async (newProgress) => {
        try {
            setUpdateError('');
            await taskService.updateTaskProgress(task.id, parseInt(newProgress));
            setTask({ ...task, progress: parseInt(newProgress) });
        } catch (err) {
            setUpdateError('Error al actualizar progreso: ' + err.message);
        }
    };

    const handleDeleteTask = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await taskService.deleteTask(task.id);
            window.location.href = '/dashboard';
        } catch (err) {
            setError('Error al eliminar la tarea: ' + err.message);
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
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('es-ES');
    };

    const canEditTask = () => {
        return hasRole('gerente') || task.assignedTo === user?.id;
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
                <button 
                    className="btn btn-secondary"
                    onClick={() => window.history.back()}
                >
                    Volver
                </button>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="container mt-4">
                <div className="alert alert-warning" role="alert">
                    Tarea no encontrada
                </div>
                <button 
                    className="btn btn-secondary"
                    onClick={() => window.history.back()}
                >
                    Volver
                </button>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light">
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                <div className="container-fluid">
                    <a className="navbar-brand" href="/dashboard">
                        <i className="bi bi-kanban me-2"></i>
                        Gestión de Proyectos
                    </a>
                    
                    <div className="navbar-nav me-auto">
                        <a className="nav-link" href="/dashboard">
                            <i className="bi bi-house me-1"></i>
                            Dashboard
                        </a>
                        {project && (
                            <a className="nav-link" href={`/projects/${project.id}`}>
                                <i className="bi bi-folder me-1"></i>
                                {project.title}
                            </a>
                        )}
                        <span className="nav-link active">
                            <i className="bi bi-list-task me-1"></i>
                            {task.title}
                        </span>
                    </div>
                    
                    {user && (
                        <div className="navbar-nav">
                            <span className="navbar-text">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="rounded-circle me-2"
                                    style={{ width: '32px', height: '32px' }}
                                />
                                {user.name}
                                <span className={`badge ms-2 ${user.role === 'gerente' ? 'bg-warning' : 'bg-info'}`}>
                                    {user.role}
                                </span>
                            </span>
                        </div>
                    )}
                </div>
            </nav>

            <div className="container mt-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-md-8">
                    <nav aria-label="breadcrumb" className="mb-3">
                        <ol className="breadcrumb bg-white p-3 rounded shadow-sm">
                            <li className="breadcrumb-item">
                                <a href="/dashboard" className="text-primary text-decoration-none fw-medium">
                                    <i className="bi bi-house me-1"></i>
                                    Dashboard
                                </a>
                            </li>
                            {project && (
                                <li className="breadcrumb-item">
                                    <a href={`/projects/${project.id}`} className="text-primary text-decoration-none fw-medium">
                                        <i className="bi bi-folder me-1"></i>
                                        {project.title}
                                    </a>
                                </li>
                            )}
                            <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">
                                <i className="bi bi-list-task me-1"></i>
                                {task.title}
                            </li>
                        </ol>
                    </nav>
                    <h1 className="h2">{task.title}</h1>
                    <div className="mb-2">
                        <span className={getStatusBadgeClass(task.status)}>
                            {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`${getPriorityBadgeClass(task.priority)} ms-2`}>
                            {task.priority.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="col-md-4 text-end">
                    {hasRole('gerente') && (
                        <div className="btn-group">
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => window.location.href = `/tasks/${task.id}/edit`}
                            >
                                <i className="bi bi-pencil"></i> Editar
                            </button>
                            <button
                                className="btn btn-outline-danger"
                                onClick={handleDeleteTask}
                            >
                                <i className="bi bi-trash"></i> Eliminar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {updateError && (
                <div className="alert alert-danger" role="alert">
                    {updateError}
                </div>
            )}

            <div className="row">
                <div className="col-md-8">
                    {/* Descripción */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Descripción</h5>
                        </div>
                        <div className="card-body">
                            <p className="card-text">
                                {task.description || 'Sin descripción disponible'}
                            </p>
                        </div>
                    </div>

                    {/* Progreso */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Progreso</h5>
                        </div>
                        <div className="card-body">
                            <div className="row align-items-center">
                                <div className="col-md-8">
                                    {canEditTask() ? (
                                        <input
                                            type="range"
                                            className="form-range"
                                            min="0"
                                            max="100"
                                            value={task.progress || 0}
                                            onChange={(e) => handleProgressChange(e.target.value)}
                                        />
                                    ) : (
                                        <div className="progress">
                                            <div
                                                className="progress-bar"
                                                style={{ width: `${task.progress || 0}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-4 text-center">
                                    <span className="h4">{task.progress || 0}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estado */}
                    {canEditTask() && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Cambiar Estado</h5>
                            </div>
                            <div className="card-body">
                                <select
                                    className="form-select"
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="asignada">Asignada</option>
                                    <option value="en_progreso">En Progreso</option>
                                    <option value="en_revision">En Revisión</option>
                                    <option value="completada">Completada</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-md-4">
                    {/* Información General */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Información General</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-5"><strong>Proyecto:</strong></div>
                                <div className="col-7">
                                    {project ? (
                                        <a href={`/projects/${project.id}`} className="text-decoration-none">
                                            {project.title}
                                        </a>
                                    ) : (
                                        'Sin proyecto'
                                    )}
                                </div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-5"><strong>Asignada a:</strong></div>
                                <div className="col-7">
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
                                </div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-5"><strong>Creada:</strong></div>
                                <div className="col-7">
                                    <small>{formatDate(task.createdAt)}</small>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-5"><strong>Vencimiento:</strong></div>
                                <div className="col-7">
                                    <small>{formatDate(task.dueDate)}</small>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-5"><strong>Estimación:</strong></div>
                                <div className="col-7">
                                    <small>{task.estimatedHours ? `${task.estimatedHours} horas` : 'No estimada'}</small>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-5"><strong>Modificada:</strong></div>
                                <div className="col-7">
                                    <small>{formatDateTime(task.updatedAt || task.createdAt)}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comentarios o Notas */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Notas Adicionales</h5>
                        </div>
                        <div className="card-body">
                            {task.notes ? (
                                <p className="card-text small">{task.notes}</p>
                            ) : (
                                <p className="card-text text-secondary small fw-normal">No hay notas adicionales</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}