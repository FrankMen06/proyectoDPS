'use client';

import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Bienvenido {user?.name}</h1>
            <p>Tu rol es: {user?.role}</p>

            {/* Aquí metes proyectos/tareas */}
        </div>
    );
}
