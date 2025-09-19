'use client';

import { useState, useEffect } from 'react';
import { projectService } from '../../services/project.service';
import { useAuthContext } from '../../hooks/useAuthContext';
import ProjectForm from '../../components/projects/ProjectForm';

export default function CreateProject() {
    const { user, hasRole } = useAuthContext();
    const [error, setError] = useState('');

    useEffect(() => {
        // No hacer nada si el usuario aún no está cargado
        if (!user) {
            console.log('Usuario aún no cargado, esperando...');
            return;
        }

        // Verificar permisos sólo cuando el usuario esté disponible
        console.log('Usuario actual:', user);
        
        const hasRoleResult = hasRole('gerente');
        console.log('¿Tiene rol gerente?:', hasRoleResult);
        
        // Solo redirigir si explícitamente no tiene el rol (false), no si aún no se sabe (null)
        if (hasRoleResult === false) {
            console.log('No tiene rol gerente, redirigiendo...');
            window.location.href = '/dashboard';
            return;
        }
    }, [user, hasRole]);

    const handleSave = async (createdProject) => {
        try {
            // El proyecto ya está creado por ProjectForm, solo redirigimos
            console.log('Proyecto creado:', createdProject);
            window.location.href = `/projects/${createdProject.id}`;
        } catch (err) {
            setError('Error al crear el proyecto: ' + err.message);
        }
    };

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
                            <i className="bi bi-plus-lg me-1"></i>
                            Nuevo Proyecto
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
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <a href="/dashboard">Dashboard</a>
                    </li>
                    <li className="breadcrumb-item">
                        <a href="/dashboard">Proyectos</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Nuevo Proyecto
                    </li>
                </ol>
            </nav>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            <div className="row">
                <div className="col-md-8">
                    <h1 className="h2 mb-4">Nuevo Proyecto</h1>
                    <ProjectForm 
                        onSave={handleSave}
                        onCancel={() => window.location.href = '/dashboard'}
                    />
                </div>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Instrucciones</h5>
                        </div>
                        <div className="card-body">
                            <p className="card-text">
                                <small className="text-muted">
                                    Completa el formulario para crear un nuevo proyecto. 
                                    Podrás agregar tareas y asignar usuarios después de crearlo.
                                </small>
                            </p>
                            <ul className="small text-muted">
                                <li>Título: Nombre del proyecto</li>
                                <li>Descripción: Objetivos y alcance</li>
                                <li>Fechas: Define el cronograma</li>
                                <li>Prioridad: Importancia del proyecto</li>
                                <li>Presupuesto: Recursos asignados</li>
                                <li>Equipo: Selecciona usuarios participantes</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}