'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProjectList from '../components/projects/ProjectList';
import TaskList from '../components/tasks/TaskList';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('projects');
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        try {
            const userData = localStorage.getItem('user');
            const authStatus = localStorage.getItem('isAuthenticated');

            if (userData && authStatus === 'true') {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } else {
                router.push('/');
                return;
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('session');
        localStorage.removeItem('isAuthenticated');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
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
                    
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item">
                                <button
                                    className={`nav-link btn btn-link ${activeTab === 'projects' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('projects')}
                                >
                                    <i className="bi bi-folder me-1"></i>
                                    Proyectos
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link btn btn-link ${activeTab === 'tasks' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('tasks')}
                                >
                                    <i className="bi bi-list-task me-1"></i>
                                    Tareas
                                </button>
                            </li>
                        </ul>
                        
                        <ul className="navbar-nav">
                            <li className="nav-item dropdown">
                                <a
                                    className="nav-link dropdown-toggle d-flex align-items-center"
                                    href="#"
                                    id="navbarDropdown"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                >
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
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <span className="dropdown-item-text">
                                            <small className="text-secondary fw-medium">{user.email}</small>
                                        </span>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <a className="dropdown-item" href="#" onClick={() => setActiveTab('profile')}>
                                            <i className="bi bi-person me-2"></i>
                                            Mi Perfil
                                        </a>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={handleLogout}>
                                            <i className="bi bi-box-arrow-right me-2"></i>
                                            Cerrar Sesión
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Header con información del usuario */}
            <div className="bg-white border-bottom">
                <div className="container-fluid py-3">
                    <div className="row align-items-center">
                        <div className="col">
                            <h1 className="h3 mb-0 text-primary">
                                Bienvenido, {user.name}
                            </h1>
                            <p className="text-secondary fw-normal mb-0">
                                {user.role === 'gerente' 
                                    ? 'Panel de administración de proyectos y tareas'
                                    : 'Tus proyectos y tareas asignadas'
                                }
                            </p>
                        </div>
                        <div className="col-auto">
                            <div className="d-flex gap-2">
                                {user.role === 'gerente' && activeTab === 'tasks' && (
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => window.location.href = '/tasks/create'}
                                    >
                                        <i className="bi bi-plus-lg me-1"></i>
                                        Nueva Tarea
                                    </button>
                                )}
                                <button 
                                    className="btn btn-outline-secondary"
                                    onClick={() => window.location.reload()}
                                >
                                    <i className="bi bi-arrow-clockwise"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="container-fluid py-4">
                {activeTab === 'projects' && (
                    <ProjectList 
                        userRole={user.role} 
                        userId={user.id}
                    />
                )}
                
                {activeTab === 'tasks' && (
                    <TaskList 
                        userRole={user.role} 
                        userId={user.id}
                    />
                )}

                {activeTab === 'profile' && (
                    <div className="row justify-content-center">
                        <div className="col-lg-6">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="bi bi-person me-2"></i>
                                        Mi Perfil
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="text-center mb-4">
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="rounded-circle"
                                            style={{ width: '120px', height: '120px' }}
                                        />
                                    </div>
                                    <dl className="row">
                                        <dt className="col-sm-4">Nombre:</dt>
                                        <dd className="col-sm-8">{user.name}</dd>
                                        
                                        <dt className="col-sm-4">Email:</dt>
                                        <dd className="col-sm-8">{user.email}</dd>
                                        
                                        <dt className="col-sm-4">Rol:</dt>
                                        <dd className="col-sm-8">
                                            <span className={`badge ${user.role === 'gerente' ? 'bg-warning' : 'bg-info'}`}>
                                                {user.role === 'gerente' ? 'Gerente' : 'Usuario'}
                                            </span>
                                        </dd>
                                        
                                        <dt className="col-sm-4">Miembro desde:</dt>
                                        <dd className="col-sm-8">
                                            {new Date(user.createdAt).toLocaleDateString('es-ES')}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-dark text-white py-3 mt-auto">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-6">
                            <small>© 2024 Sistema de Gestión de Proyectos</small>
                        </div>
                        <div className="col-md-6 text-end">
                            <small>
                                Versión 1.0 | 
                                <a href="#" className="text-white ms-1">Soporte</a>
                            </small>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}