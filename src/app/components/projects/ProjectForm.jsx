'use client';

import { useState, useEffect } from 'react';
import { projectService, userService } from '../../services/project.service';

export default function ProjectForm({ projectId = null, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'planificacion',
        priority: 'media',
        startDate: '',
        endDate: '',
        budget: '',
        category: '',
        assignedUsers: []
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        loadUsers();
        if (projectId) {
            setIsEdit(true);
            loadProject();
        }
    }, [projectId]);

    const loadUsers = async () => {
        try {
            const usersData = await userService.getAllUsers();
            // Filtrar solo usuarios (no gerentes) para asignación
            const regularUsers = usersData.filter(user => user.role === 'usuario');
            setUsers(regularUsers);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
        }
    };

    const loadProject = async () => {
        try {
            setLoading(true);
            const project = await projectService.getProjectById(projectId);
            setFormData({
                title: project.title || '',
                description: project.description || '',
                status: project.status || 'planificacion',
                priority: project.priority || 'media',
                startDate: project.startDate || '',
                endDate: project.endDate || '',
                budget: project.budget || '',
                category: project.category || '',
                assignedUsers: project.assignedUsers || []
            });
        } catch (err) {
            console.error('Error al cargar proyecto:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'assignedUsers') {
            const userId = value;
            setFormData(prev => ({
                ...prev,
                assignedUsers: checked
                    ? [...prev.assignedUsers, userId]
                    : prev.assignedUsers.filter(id => id !== userId)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
        
        // Limpiar error del campo modificado
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'El título es obligatorio';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'La descripción es obligatoria';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'La fecha de inicio es obligatoria';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'La fecha de fin es obligatoria';
        }

        if (formData.startDate && formData.endDate) {
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            if (startDate >= endDate) {
                newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
            }
        }

        if (formData.budget && (isNaN(formData.budget) || parseFloat(formData.budget) < 0)) {
            newErrors.budget = 'El presupuesto debe ser un número positivo';
        }

        if (!formData.category.trim()) {
            newErrors.category = 'La categoría es obligatoria';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            
            const projectData = {
                ...formData,
                budget: formData.budget ? parseFloat(formData.budget) : 0,
                createdBy: JSON.parse(localStorage.getItem('user')).id
            };

            let savedProject;
            if (isEdit) {
                savedProject = await projectService.updateProject(projectId, projectData);
            } else {
                savedProject = await projectService.createProject(projectData);
            }

            if (onSave) {
                onSave(savedProject);
            }
        } catch (err) {
            setErrors({ submit: 'Error al guardar proyecto: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEdit) {
        return (
            <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">
                                {isEdit ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
                            </h4>
                        </div>
                        
                        <div className="card-body">
                            {errors.submit && (
                                <div className="alert alert-danger" role="alert">
                                    {errors.submit}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    {/* Título */}
                                    <div className="col-md-12 mb-3">
                                        <label htmlFor="title" className="form-label">
                                            Título del Proyecto *
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="Ingrese el título del proyecto"
                                        />
                                        {errors.title && (
                                            <div className="invalid-feedback">{errors.title}</div>
                                        )}
                                    </div>

                                    {/* Descripción */}
                                    <div className="col-md-12 mb-3">
                                        <label htmlFor="description" className="form-label">
                                            Descripción *
                                        </label>
                                        <textarea
                                            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                            id="description"
                                            name="description"
                                            rows="4"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Describe el proyecto en detalle"
                                        ></textarea>
                                        {errors.description && (
                                            <div className="invalid-feedback">{errors.description}</div>
                                        )}
                                    </div>

                                    {/* Estado y Prioridad */}
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="status" className="form-label">Estado</label>
                                        <select
                                            className="form-select"
                                            id="status"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="planificacion">Planificación</option>
                                            <option value="en_progreso">En Progreso</option>
                                            <option value="completado">Completado</option>
                                            <option value="pausado">Pausado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="priority" className="form-label">Prioridad</label>
                                        <select
                                            className="form-select"
                                            id="priority"
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                        >
                                            <option value="baja">Baja</option>
                                            <option value="media">Media</option>
                                            <option value="alta">Alta</option>
                                            <option value="critica">Crítica</option>
                                        </select>
                                    </div>

                                    {/* Fechas */}
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="startDate" className="form-label">
                                            Fecha de Inicio *
                                        </label>
                                        <input
                                            type="date"
                                            className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                                            id="startDate"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                        />
                                        {errors.startDate && (
                                            <div className="invalid-feedback">{errors.startDate}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="endDate" className="form-label">
                                            Fecha de Fin *
                                        </label>
                                        <input
                                            type="date"
                                            className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                                            id="endDate"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleChange}
                                        />
                                        {errors.endDate && (
                                            <div className="invalid-feedback">{errors.endDate}</div>
                                        )}
                                    </div>

                                    {/* Presupuesto y Categoría */}
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="budget" className="form-label">Presupuesto ($)</label>
                                        <input
                                            type="number"
                                            className={`form-control ${errors.budget ? 'is-invalid' : ''}`}
                                            id="budget"
                                            name="budget"
                                            value={formData.budget}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                        />
                                        {errors.budget && (
                                            <div className="invalid-feedback">{errors.budget}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="category" className="form-label">
                                            Categoría *
                                        </label>
                                        <select
                                            className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                        >
                                            <option value="">Seleccionar categoría</option>
                                            <option value="desarrollo_web">Desarrollo Web</option>
                                            <option value="desarrollo_movil">Desarrollo Móvil</option>
                                            <option value="marketing">Marketing</option>
                                            <option value="diseno">Diseño</option>
                                            <option value="infraestructura">Infraestructura</option>
                                            <option value="investigacion">Investigación</option>
                                            <option value="otros">Otros</option>
                                        </select>
                                        {errors.category && (
                                            <div className="invalid-feedback">{errors.category}</div>
                                        )}
                                    </div>

                                    {/* Usuarios asignados */}
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Usuarios Asignados</label>
                                        <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {users.length === 0 ? (
                                                <p className="text-muted mb-0">No hay usuarios disponibles</p>
                                            ) : (
                                                users.map(user => (
                                                    <div key={user.id} className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`user-${user.id}`}
                                                            name="assignedUsers"
                                                            value={user.id}
                                                            checked={formData.assignedUsers.includes(user.id)}
                                                            onChange={handleChange}
                                                        />
                                                        <label className="form-check-label" htmlFor={`user-${user.id}`}>
                                                            <img
                                                                src={user.avatar}
                                                                alt={user.name}
                                                                className="rounded-circle me-2"
                                                                style={{ width: '24px', height: '24px' }}
                                                            />
                                                            {user.name} ({user.email})
                                                        </label>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Botones */}
                                <div className="d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={onCancel}
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Guardando...
                                            </>
                                        ) : (
                                            isEdit ? 'Actualizar Proyecto' : 'Crear Proyecto'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}