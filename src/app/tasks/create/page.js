'use client';

import { Suspense, useState, useEffect } from 'react';
import { taskService } from '../../services/task.service';
import { useAuthContext } from '../../hooks/useAuthContext';
import TaskForm from '../../components/tasks/TaskForm';
import { useSearchParams } from 'next/navigation';

function CreateTaskInner() {
    const { user, hasRole } = useAuthContext();
    const [error, setError] = useState('');
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');

    useEffect(() => {
        if (user && !hasRole('gerente')) {
            window.location.href = '/dashboard';
        }
    }, [user, hasRole]);

    useEffect(() => {
        if (projectId === null) {
            console.log('El projectId no se especificó en la URL, se permitirá seleccionar en el formulario.');
        }
    }, [projectId]);

    const handleSave = async (taskData) => {
        try {
            const createdTask = await taskService.createTask(taskData);
            window.location.href = `/tasks/${createdTask.id}`;
        } catch (err) {
            setError('Error al crear la tarea: ' + err.message);
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
              Nueva Tarea
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
                                <i className="bi bi-list-task me-1"></i>
                                Tareas
                            </a>
                        </li>
                        <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">
                            Nueva Tarea
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
                        <TaskForm
                            onSave={handleSave}
                            onCancel={() => (window.location.href = '/dashboard')}
                            projectId={projectId || undefined}
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
                                        Completa el formulario para crear una nueva tarea. Asegúrate de asignar la tarea a un proyecto y usuario específico.
                                    </small>
                                </p>
                                <ul className="small text-muted">
                                    <li>Título: Nombre descriptivo de la tarea</li>
                                    <li>Descripción: Detalles específicos del trabajo</li>
                                    <li>Proyecto: Selecciona el proyecto asociado</li>
                                    <li>Usuario: Asigna a un miembro del equipo</li>
                                    <li>Prioridad: Define la importancia de la tarea</li>
                                    <li>Fecha límite: Establece un plazo realista</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CreateTaskPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <CreateTaskInner />
        </Suspense>
    );
}
