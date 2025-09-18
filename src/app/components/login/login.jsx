'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Consumir JSON Server
            const res = await fetch(`http://localhost:3001/users?email=${formData.email}&password=${formData.password}`);
            const users = await res.json();

            if (!users.length) {
                setError('Correo o contraseña incorrectos');
                return;
            }

            const user = users[0];
            // Crear sesión básica
            const session = {
                id: Date.now().toString(),
                userId: user.id,
                token: `jwt_${user.id}_${Date.now()}`,
                isActive: true,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
            };

            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('session', JSON.stringify(session));
            localStorage.setItem('isAuthenticated', 'true');

            router.push('/dashboard');
        } catch (err) {
            setError('Error en el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
            <div className="card shadow-lg p-4" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="text-center mb-4">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
                        alt="Logo"
                        className="mb-3"
                        width="70"
                    />
                    <h4 className="fw-bold">Iniciar Sesión</h4>
                    <p className="text-muted">Accede a tu sistema de proyectos</p>
                </div>

                {error && <div className="alert alert-danger py-2">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label fw-semibold">Correo</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="usuario@correo.com"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password" className="form-label fw-semibold">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-100"
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2"></span>
                        ) : null}
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <div className="mt-3 text-center">
                    <small className="text-muted">
                        ¿No tienes cuenta?{' '}
                        <Link href="../register" className="text-decoration-none">
                            Regístrate aquí
                        </Link>
                    </small>
                </div>
            </div>
        </div>
    );
}
