'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProjectList from '../components/projects/ProjectList';

export default function ProjectsPage() {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
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
                    
                    <div className="navbar-nav me-auto">
                        <a className="nav-link" href="/dashboard">
                            <i className="bi bi-house me-1"></i>
                            Dashboard
                        </a>
                        <a className="nav-link active" href="/projects">
                            <i className="bi bi-folder me-1"></i>
                            Proyectos
                        </a>
                        <a className="nav-link" href="/tasks">
                            <i className="bi bi-list-task me-1"></i>
                            Tareas
                        </a>
                    </div>
                    
                    <div className="navbar-nav">
                        <div className="nav-item dropdown">
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
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                    <button className="dropdown-item" onClick={handleLogout}>
                                        <i className="bi bi-box-arrow-right me-2"></i>
                                        Cerrar Sesión
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Contenido principal */}
            <div className="container-fluid py-4">
                <ProjectList 
                    userRole={user.role} 
                    userId={user.id}
                />
            </div>
        </div>
    );
}