"use client";

import { useState, useEffect, use } from 'react';
import { taskService } from '../../../services/task.service';
import { useAuthContext } from '../../../hooks/useAuthContext';
import TaskForm from '../../../components/tasks/TaskForm';

export default function EditTask({ params }) {
    const { user, hasRole } = useAuthContext();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Unwrap params using React.use()
    const resolvedParams = use(params);

    useEffect(() => {
        if (!resolvedParams?.id) return;

        if (user && !hasRole('gerente')) {
            window.location.href = '/dashboard';
            return;
        }

        if (user && hasRole('gerente')) {
            loadTask(resolvedParams.id);
        }
    }, [resolvedParams?.id, user]);

    const loadTask = async (id) => {
        try {
            setLoading(true);
            const taskData = await taskService.getTaskById(id);
            setTask(taskData);
        } catch (err) {
            setError('Error al cargar la tarea: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (taskData) => {
        try {
            await taskService.updateTask(params.id, taskData);
            window.location.href = `/tasks/${params.id}`;
        } catch (err) {
            setError('Error al actualizar la tarea: ' + err.message);
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
                        <a className="nav-link" href={`/tasks/${task.id}`}>
                            <i className="bi bi-list-task me-1"></i>
                            {task.title}
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
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb px-3 py-2 bg-white rounded shadow-sm mb-4" style={{ border: '1px solid #eee', fontSize: '1.1rem' }}>
                    <li className="breadcrumb-item">
                        <a href="/dashboard" style={{ color: '#0d6efd', fontWeight: '500', textDecoration: 'none' }}>
                            <i className="bi bi-house-door me-1"></i> Dashboard
                        </a>
                    </li>
                    <li className="breadcrumb-item">
                        <a href="/dashboard" style={{ color: '#0d6efd', fontWeight: '500', textDecoration: 'none' }}>
                            <i className="bi bi-folder me-1"></i> Tareas
                        </a>
                    </li>
                    <li className="breadcrumb-item">
                        <a href={`/tasks/${task.id}`} style={{ color: '#212529', fontWeight: '500', textDecoration: 'none' }}>
                            {task.title}
                        </a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page" style={{ color: '#212529', fontWeight: 'bold' }}>
                        Editar
                    </li>
                </ol>
            </nav>

            <div className="row">
                <div className="col-md-8">
                   <TaskForm
    taskId={task.id}   
    projectId={task.projectId} 
    onSave={handleSave}
    onCancel={() => window.location.href = `/tasks/${task.id}`}
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
                                    Modifica los datos de la tarea. Los cambios se aplicarán inmediatamente después de guardar.
                                </small>
                            </p>
                            <hr />
                            <div className="small">
                                <div className="mb-2">
                                    <strong>Creada:</strong> {new Date(task.createdAt).toLocaleDateString('es-ES')}
                                </div>
                                <div className="mb-2">
                                    <strong>Última modificación:</strong> {new Date(task.updatedAt || task.createdAt).toLocaleDateString('es-ES')}
                                </div>
                                <div>
                                    <strong>ID:</strong> {task.id}
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