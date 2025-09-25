'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { authService } from '@/app/services/auth.service';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
            const user = await authService.register(formData);

            alert('✅ Usuario registrado con éxito. Ahora puedes iniciar sesión.');
            router.push('/');
        } catch (err) {
            setError(err.message || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
            <div className="card shadow-lg p-4" style={{ maxWidth: '420px', width: '100%' }}>
                <div className="text-center mb-4">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/1828/1828506.png"
                        alt="Register"
                        className="mb-3"
                        width="70"
                    />
                    <h4 className="fw-bold">Registro</h4>
                    <p className="text-secondary fw-normal">Crea tu cuenta de usuario</p>
                </div>

                {error && <div className="alert alert-danger py-2">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label fw-semibold">Nombre</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Tu nombre"
                            required
                        />
                    </div>

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

                    <button type="submit" disabled={loading} className="btn btn-success w-100">
                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                </form>

                <div className="mt-3 text-center">
                    <small className="text-muted">
                        ¿Ya tienes cuenta?{' '}
                        <Link href="/" className="text-decoration-none">
                            Inicia sesión aquí
                        </Link>
                    </small>
                </div>
            </div>
        </div>
    );
}
