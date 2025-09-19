'use client';

import { useState, useEffect, use } from 'react';
import { projectService, userService } from '../../../services/project.service';
import { useAuthContext } from '../../../hooks/useAuthContext';
import ProjectForm from '../../../components/projects/ProjectForm';

export default function EditProject({ params }) {
    const resolvedParams = use(params);
    const { user, hasRole } = useAuthContext();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Verificar permisos
        if (!hasRole('gerente')) {
            window.location.href = '/dashboard';
            return;
        }

        if (resolvedParams?.id) {
            loadProject();
        }
    }, [resolvedParams?.id]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const projectData = await projectService.getProjectById(resolvedParams.id);
            setProject(projectData);
        } catch (err) {
            setError('Error al cargar el proyecto: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (projectData) => {
        try {
            await projectService.updateProject(resolvedParams.id, projectData);
            window.location.href = `/projects/${resolvedParams.id}`;
        } catch (err) {
            setError('Error al actualizar el proyecto: ' + err.message);
        }
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
                        <a className="nav-link" href={`/projects/${project.id}`}>
                            <i className="bi bi-folder me-1"></i>
                            {project.title}
                        </a>
                        <span className="nav-link active">
                            <i className="bi bi-pencil me-1"></i>
                            Editar
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
                    <li className="breadcrumb-item">
                        <a href={`/projects/${project.id}`} className="text-primary text-decoration-none fw-medium">
                            {project.title}
                        </a>
                    </li>
                    <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">
                        Editar
                    </li>
                </ol>
            </nav>

            <div className="row">
                <div className="col-md-8">
                    <h1 className="h2 mb-4">Editar Proyecto</h1>
                    <ProjectForm 
                        project={project}
                        onSave={handleSave}
                        onCancel={() => window.location.href = `/projects/${project.id}`}
                    />
                </div>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Información</h5>
                        </div>
                        <div className="card-body">
                            <p className="card-text">
                                <small className="text-muted">
                                    Modifica los datos del proyecto. Los cambios se aplicarán inmediatamente después de guardar.
                                </small>
                            </p>
                            <hr />
                            <div className="small">
                                <div className="mb-2">
                                    <strong>Creado:</strong> {new Date(project.createdAt).toLocaleDateString('es-ES')}
                                </div>
                                <div className="mb-2">
                                    <strong>Última modificación:</strong> {new Date(project.updatedAt || project.createdAt).toLocaleDateString('es-ES')}
                                </div>
                                <div>
                                    <strong>ID:</strong> {project.id}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}