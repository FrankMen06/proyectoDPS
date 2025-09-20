'use client';

import { useState, useEffect, use } from 'react';
import { projectService, userService } from '../../services/project.service';
import { taskService } from '../../services/task.service';
import { useAuthContext } from '../../hooks/useAuthContext';

export default function ProjectDetail({ params }) {
    const resolvedParams = use(params);
    const { user, hasRole } = useAuthContext();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('details');

    useEffect(() => {
        if (resolvedParams?.id) {
            loadProjectData();
        }
    }, [resolvedParams?.id]);

    const loadProjectData = async () => {
        try {
            setLoading(true);
            const [projectData, usersData] = await Promise.all([
                projectService.getProjectById(resolvedParams.id),
                userService.getAllUsers()
            ]);

            setProject(projectData);
            setUsers(usersData);

            // Cargar tareas del proyecto
            const tasksData = await taskService.getTasksByProject(resolvedParams.id);
            setTasks(tasksData);
        } catch (err) {
            setError('Error al cargar el proyecto: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await projectService.deleteProject(resolvedParams.id);
            window.location.href = '/dashboard';
        } catch (err) {
            setError('Error al eliminar el proyecto: ' + err.message);
        }
    };

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Usuario desconocido';
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'planificacion': 'bg-info',
            'en_progreso': 'bg-primary',
            'completado': 'bg-success',
            'pausado': 'bg-warning',
            'cancelado': 'bg-danger'
        };
        return `badge ${statusClasses[status] || 'bg-secondary'}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    const calculateProgress = () => {
        if (tasks.length === 0) return 0;
        const completedTasks = tasks.filter(task => task.status === 'completada').length;
        return Math.round((completedTasks / tasks.length) * 100);
    };

    const getTaskStatusStats = () => {
        const stats = {
            pendiente: 0,
            asignada: 0,
            en_progreso: 0,
            en_revision: 0,
            completada: 0,
            cancelada: 0
        };

        tasks.forEach(task => {
            if (stats.hasOwnProperty(task.status)) {
                stats[task.status]++;
            }
        });

        return stats;
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

    if (!project) {
        return (
            <div className="container mt-4">
                <div className="alert alert-warning" role="alert">
                    Proyecto no encontrado
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

    const taskStats = getTaskStatusStats();
    const progress = calculateProgress();

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
                        <span className="nav-link active">
                            <i className="bi bi-folder me-1"></i>
                            {project.title}
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
                            <li className="breadcrumb-item">
                                <a href="/dashboard" className="text-primary text-decoration-none fw-medium">
                                    <i className="bi bi-folder me-1"></i>
                                    Proyectos
                                </a>
                            </li>
                            <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">
                                {project.title}
                            </li>
                        </ol>
                    </nav>
                    <h1 className="h2 text-dark">{project.title}</h1>
                    <span className={getStatusBadgeClass(project.status)}>
                        {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
                <div className="col-md-4 text-end">
                    {hasRole('gerente') && (
                        <div className="btn-group">
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => window.location.href = `/projects/${project.id}/edit`}
                            >
                                <i className="bi bi-pencil"></i> Editar
                            </button>
                            <button
                                className="btn btn-outline-danger"
                                onClick={handleDeleteProject}
                            >
                                <i className="bi bi-trash"></i> Eliminar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        <i className="bi bi-info-circle"></i> Detalles
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tasks')}
                    >
                        <i className="bi bi-list-task"></i> Tareas ({tasks.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'team' ? 'active' : ''}`}
                        onClick={() => setActiveTab('team')}
                    >
                        <i className="bi bi-people"></i> Equipo ({project.assignedUsers?.length || 0})
                    </button>
                </li>
            </ul>

            {/* Tab Content */}
            {activeTab === 'details' && (
                <div className="row">
                    <div className="col-md-8">
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Información del Proyecto</h5>
                            </div>
                            <div className="card-body">
                                <div className="row mb-3">
                                    <div className="col-sm-3"><strong>Descripción:</strong></div>
                                    <div className="col-sm-9">{project.description || 'Sin descripción'}</div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-sm-3"><strong>Fecha de inicio:</strong></div>
                                    <div className="col-sm-9">{formatDate(project.startDate)}</div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-sm-3"><strong>Fecha de fin:</strong></div>
                                    <div className="col-sm-9">{formatDate(project.endDate)}</div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-sm-3"><strong>Prioridad:</strong></div>
                                    <div className="col-sm-9">
                                        <span className={`badge ${project.priority === 'alta' ? 'bg-danger' : project.priority === 'media' ? 'bg-warning' : 'bg-info'}`}>
                                            {project.priority}
                                        </span>
                                    </div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-sm-3"><strong>Presupuesto:</strong></div>
                                    <div className="col-sm-9">
                                        {project.budget ? `$${project.budget.toLocaleString()}` : 'No especificado'}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-sm-3"><strong>Creado:</strong></div>
                                    <div className="col-sm-9">{formatDate(project.createdAt)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Progreso del Proyecto</h5>
                            </div>
                            <div className="card-body text-center">
                                <div className="mb-3">
                                    <div className="display-4 text-primary">{progress}%</div>
                                    <div className="progress mb-2">
                                        <div
                                            className="progress-bar"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <small className="text-secondary fw-medium">
                                        {tasks.filter(t => t.status === 'completada').length} de {tasks.length} tareas completadas
                                    </small>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Estado de Tareas</h5>
                            </div>
                            <div className="card-body">
                                <div className="row text-center">
                                    <div className="col-6 mb-2">
                                        <div className="text-secondary fw-medium">Pendientes</div>
                                        <div className="h5">{taskStats.pendiente + taskStats.asignada}</div>
                                    </div>
                                    <div className="col-6 mb-2">
                                        <div className="text-secondary fw-medium">En Progreso</div>
                                        <div className="h5">{taskStats.en_progreso + taskStats.en_revision}</div>
                                    </div>
                                    <div className="col-6">
                                        <div className="text-secondary fw-medium">Completadas</div>
                                        <div className="h5 text-success">{taskStats.completada}</div>
                                    </div>
                                    <div className="col-6">
                                        <div className="text-secondary fw-medium">Canceladas</div>
                                        <div className="h5 text-danger">{taskStats.cancelada}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">Tareas del Proyecto</h5>
                        {hasRole('gerente') && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => window.location.href = `/tasks/create?projectId=${project.id}`}
                            >
                                <i className="bi bi-plus-lg"></i> Nueva Tarea
                            </button>
                        )}
                    </div>
                    <div className="card-body p-0">
                        {tasks.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="bi bi-list-task display-1 text-muted"></i>
                                <h5 className="text-secondary fw-medium mt-3">No hay tareas en este proyecto</h5>
                                <p className="text-secondary">Crea la primera tarea para comenzar.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Tarea</th>
                                            <th>Estado</th>
                                            <th>Prioridad</th>
                                            <th>Asignada a</th>
                                            <th>Progreso</th>
                                            <th>Vencimiento</th>
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
                                                                {task.description.length > 50 
                                                                    ? task.description.substring(0, 50) + '...'
                                                                    : task.description
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={getStatusBadgeClass(task.status)}>
                                                        {task.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${task.priority === 'alta' ? 'bg-danger' : task.priority === 'media' ? 'bg-warning' : 'bg-info'}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td>
                                                    {task.assignedTo ? getUserName(task.assignedTo) : 'Sin asignar'}
                                                </td>
                                                <td>
                                                    <div style={{ minWidth: '80px' }}>
                                                        <div className="small mb-1">{task.progress || 0}%</div>
                                                        <div className="progress" style={{ height: '6px' }}>
                                                            <div
                                                                className="progress-bar"
                                                                style={{ width: `${task.progress || 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{formatDate(task.dueDate)}</td>
                                                <td>
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-outline-primary"
                                                            onClick={() => window.location.href = `/tasks/${task.id}`}
                                                            title="Ver detalles"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </button>
                                                        {hasRole('gerente') && (
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
            )}

            {activeTab === 'team' && (
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Equipo del Proyecto</h5>
                    </div>
                    <div className="card-body">
                        {!project.assignedUsers || project.assignedUsers.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="bi bi-people display-1 text-muted"></i>
                                <h5 className="text-secondary fw-medium mt-3">No hay usuarios asignados</h5>
                                <p className="text-secondary">Asigna usuarios a este proyecto para comenzar a trabajar.</p>
                            </div>
                        ) : (
                            <div className="row">
                                {project.assignedUsers.map(userId => {
                                    const user = users.find(u => u.id === userId);
                                    if (!user) return null;
                                    
                                    return (
                                        <div key={user.id} className="col-md-6 col-lg-4 mb-3">
                                            <div className="card">
                                                <div className="card-body text-center">
                                                    <img
                                                        src={user.avatar}
                                                        alt={user.name}
                                                        className="rounded-circle mb-2"
                                                        style={{ width: '60px', height: '60px' }}
                                                    />
                                                    <h6 className="card-title">{user.name}</h6>
                                                    <p className="card-text small text-muted">{user.email}</p>
                                                    <span className={`badge ${user.role === 'gerente' ? 'bg-primary' : 'bg-secondary'}`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}