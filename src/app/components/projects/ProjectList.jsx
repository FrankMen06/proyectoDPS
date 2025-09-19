'use client';

import { useState, useEffect } from 'react';
import { projectService, userService } from '../../services/project.service';

export default function ProjectList({ userRole, userId }) {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadProjects();
        loadUsers();
    }, [userRole, userId, filter]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            let projectsData;
            
            if (userRole === 'gerente') {
                // Gerentes ven todos los proyectos
                projectsData = await projectService.getAllProjects();
            } else {
                // Usuarios solo ven proyectos asignados
                projectsData = await projectService.getProjectsByUser(userId);
            }
            
            // Aplicar filtros
            if (filter !== 'todos') {
                projectsData = projectsData.filter(project => project.status === filter);
            }
            
            setProjects(projectsData);
        } catch (err) {
            setError('Error al cargar proyectos: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const usersData = await userService.getAllUsers();
            setUsers(usersData);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
            return;
        }

        try {
            await projectService.deleteProject(projectId);
            setProjects(projects.filter(p => p.id !== projectId));
        } catch (err) {
            setError('Error al eliminar proyecto: ' + err.message);
        }
    };

    const handleStatusChange = async (projectId, newStatus) => {
        try {
            await projectService.updateProjectStatus(projectId, newStatus);
            loadProjects(); // Recargar lista
        } catch (err) {
            setError('Error al cambiar estado: ' + err.message);
        }
    };

    const getUserNames = (userIds) => {
        if (!userIds || userIds.length === 0) return 'Sin asignar';
        return userIds.map(id => {
            const user = users.find(u => u.id === id);
            return user ? user.name : `Usuario ${id}`;
        }).join(', ');
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'planificacion': 'bg-secondary',
            'en_progreso': 'bg-primary',
            'completado': 'bg-success',
            'pausado': 'bg-warning',
            'cancelado': 'bg-danger'
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

    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
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
                <div className="col-md-6 text-dark">
                    <h2>Gestión de Proyectos</h2>
                </div>
                <div className="col-md-6 text-end">
                    {userRole === 'gerente' && (
                        <button 
                            className="btn btn-primary"
                            onClick={() => window.location.href = '/projects/create'}
                        >
                            <i className="bi bi-plus-lg"></i> Nuevo Proyecto
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
            <div className="row mb-3">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar proyectos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <select
                        className="form-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="planificacion">Planificación</option>
                        <option value="en_progreso">En Progreso</option>
                        <option value="completado">Completado</option>
                        <option value="pausado">Pausado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
            </div>

            {/* Lista de proyectos */}
            {filteredProjects.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-folder-x display-1 text-muted"></i>
                    <h3 className="text-secondary fw-medium mt-3">No se encontraron proyectos</h3>
                    <p className="text-secondary">
                        {userRole === 'gerente' 
                            ? 'Crea tu primer proyecto para comenzar.'
                            : 'Aún no tienes proyectos asignados.'
                        }
                    </p>
                </div>
            ) : (
                <div className="row">
                    {filteredProjects.map(project => (
                        <div key={project.id} className="col-lg-6 col-xl-4 mb-4">
                            <div className="card h-100">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">{project.title}</h5>
                                    <div className="dropdown">
                                        <button
                                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                            type="button"
                                            data-bs-toggle="dropdown"
                                        >
                                            <i className="bi bi-three-dots"></i>
                                        </button>
                                        <ul className="dropdown-menu">
                                            <li>
                                                <a 
                                                    className="dropdown-item" 
                                                    href={`/projects/${project.id}`}
                                                >
                                                    <i className="bi bi-eye"></i> Ver detalles
                                                </a>
                                            </li>
                                            {userRole === 'gerente' && (
                                                <>
                                                    <li>
                                                        <a 
                                                            className="dropdown-item" 
                                                            href={`/projects/${project.id}/edit`}
                                                        >
                                                            <i className="bi bi-pencil"></i> Editar
                                                        </a>
                                                    </li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li>
                                                        <button
                                                            className="dropdown-item text-danger"
                                                            onClick={() => handleDeleteProject(project.id)}
                                                        >
                                                            <i className="bi bi-trash"></i> Eliminar
                                                        </button>
                                                    </li>
                                                </>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                                
                                <div className="card-body">
                                    <p className="card-text text-secondary small fw-normal">
                                        {project.description.length > 100 
                                            ? project.description.substring(0, 100) + '...'
                                            : project.description
                                        }
                                    </p>
                                    
                                    <div className="mb-3">
                                        <span className={getStatusBadgeClass(project.status)}>
                                            {project.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className={`ms-2 ${getPriorityBadgeClass(project.priority)}`}>
                                            Prioridad {project.priority}
                                        </span>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small">Progreso: {project.progress || 0}%</label>
                                        <div className="progress">
                                            <div
                                                className="progress-bar"
                                                role="progressbar"
                                                style={{ width: `${project.progress || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="row text-secondary small fw-normal">
                                        <div className="col-6">
                                            <strong>Inicio:</strong><br />
                                            {formatDate(project.startDate)}
                                        </div>
                                        <div className="col-6">
                                            <strong>Fin:</strong><br />
                                            {formatDate(project.endDate)}
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        <small className="text-secondary fw-medium">
                                            <strong>Asignado a:</strong><br />
                                            {getUserNames(project.assignedUsers)}
                                        </small>
                                    </div>
                                </div>

                                {userRole === 'gerente' && (
                                    <div className="card-footer">
                                        <select
                                            className="form-select form-select-sm"
                                            value={project.status}
                                            onChange={(e) => handleStatusChange(project.id, e.target.value)}
                                        >
                                            <option value="planificacion">Planificación</option>
                                            <option value="en_progreso">En Progreso</option>
                                            <option value="completado">Completado</option>
                                            <option value="pausado">Pausado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}