'use client';

import { useState, useEffect } from 'react';
import { taskService } from '../../services/task.service';
import { projectService, userService } from '../../services/project.service';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function TaskForm({ task = null, taskId = null, projectId = null, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: projectId || '',
        assignedTo: '',
        priority: 'media',
        status: 'pendiente',
        startDate: '',
        dueDate: '',
        estimatedHours: '',
        progress: 0
    });
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isEdit, setIsEdit] = useState(false);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(currentUser.role);

        loadInitialData();

        if (task) {
            setIsEdit(true);
            setFormData((prev) => ({
                ...prev,
                ...task,
                startDate: task.startDate || '',
                dueDate: task.dueDate || '',
                estimatedHours: task.estimatedHours || '',
                progress: task.progress || 0,
            }));
        } else if (taskId) {
            setIsEdit(true);
            loadTask(taskId);
        }
    }, [task, taskId, projectId]);

    const loadInitialData = async () => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

            const [usersData, projectsData] = await Promise.all([
                userService.getAllUsers(),
                currentUser.role === 'gerente'
                    ? projectService.getAllProjects()
                    : projectService.getProjectsByUser(currentUser.id)
            ]);

            const regularUsers = usersData.filter(u => u.role === 'usuario');
            setUsers(regularUsers);
            setProjects(projectsData);
        } catch (err) {
            console.error('Error al cargar datos iniciales:', err);
        }
    };

    const loadTask = async (id) => {
        try {
            setLoading(true);
            const taskData = await taskService.getTaskById(id);
            setFormData({
                title: taskData.title || '',
                description: taskData.description || '',
                projectId: taskData.projectId || '',
                assignedTo: taskData.assignedTo || '',
                priority: taskData.priority || 'media',
                status: taskData.status || 'pendiente',
                startDate: taskData.startDate || '',
                dueDate: taskData.dueDate || '',
                estimatedHours: taskData.estimatedHours || '',
                progress: taskData.progress || 0,
            });
        } catch (err) {
            console.error('Error al cargar tarea:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'El título es obligatorio';
        if (!formData.description.trim()) newErrors.description = 'La descripción es obligatoria';
        if (!formData.projectId) newErrors.projectId = 'Debe seleccionar un proyecto';
        if (!formData.priority) newErrors.priority = 'Debe seleccionar una prioridad';

        if (formData.startDate && formData.dueDate) {
            const startDate = new Date(formData.startDate);
            const dueDate = new Date(formData.dueDate);
            if (startDate >= dueDate) {
                newErrors.dueDate = 'La fecha de vencimiento debe ser posterior a la fecha de inicio';
            }
        }

        if (formData.estimatedHours && (isNaN(formData.estimatedHours) || parseFloat(formData.estimatedHours) < 0)) {
            newErrors.estimatedHours = 'Las horas estimadas deben ser un número positivo';
        }

        if (formData.progress < 0 || formData.progress > 100) {
            newErrors.progress = 'El progreso debe estar entre 0 y 100';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const taskData = {
                ...formData,
                estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
                progress: parseInt(formData.progress) || 0,
                status: formData.progress >= 100 ? 'completada' : formData.status
            };

            let savedTask;
            if (isEdit) {
                const idToUpdate = taskId || task?.id;
                savedTask = await taskService.updateTask(idToUpdate, taskData);
            } else {
                savedTask = await taskService.createTask(taskData);
            }

            if (onSave) onSave(savedTask);
        } catch (err) {
            setErrors({ submit: 'Error al guardar tarea: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    const getProjectUsers = () => {
        if (!formData.projectId) return users;
        const selectedProject = projects.find(p => p.id === formData.projectId);
        if (!selectedProject || !selectedProject.assignedUsers) return users;
        return users.filter(user => selectedProject.assignedUsers.includes(user.id));
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
                            <h4 className="card-title mb-0" style={{ color: '#212529', fontWeight: 'bold' }}>
                                {isEdit ? 'Editar Tarea' : 'Crear Nueva Tarea'}
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
                                            Título de la Tarea *
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="Ingrese el título de la tarea"
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
                                            placeholder="Describe la tarea en detalle"
                                        ></textarea>
                                        {errors.description && (
                                            <div className="invalid-feedback">{errors.description}</div>
                                        )}
                                    </div>

                                    {/* Proyecto */}
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="projectId" className="form-label">
                                            Proyecto *
                                        </label>
                                        <select
                                            className={`form-select ${errors.projectId ? 'is-invalid' : ''}`}
                                            id="projectId"
                                            name="projectId"
                                            value={formData.projectId}
                                            onChange={handleChange}
                                            disabled={!!projectId} // Deshabilitar si viene de un proyecto específico
                                        >
                                            <option value="">Seleccionar proyecto</option>
                                            {projects.map(project => (
                                                <option key={project.id} value={project.id}>
                                                    {project.title}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.projectId && (
                                            <div className="invalid-feedback">{errors.projectId}</div>
                                        )}
                                    </div>

                                    {/* Usuario asignado */}
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="assignedTo" className="form-label">
                                            Asignar a
                                        </label>
                                        <select
                                            className="form-select"
                                            id="assignedTo"
                                            name="assignedTo"
                                            value={formData.assignedTo}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sin asignar</option>
                                            {getProjectUsers().map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                        {formData.projectId && getProjectUsers().length === 0 && (
                                            <div className="form-text text-warning">
                                                No hay usuarios asignados a este proyecto
                                            </div>
                                        )}
                                    </div>

                                    {/* Prioridad y Estado */}
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="priority" className="form-label">
                                            Prioridad *
                                        </label>
                                        <select
                                            className={`form-select ${errors.priority ? 'is-invalid' : ''}`}
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
                                        {errors.priority && (
                                            <div className="invalid-feedback">{errors.priority}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="status" className="form-label">Estado</label>
                                        <select
                                            className="form-select"
                                            id="status"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="asignada">Asignada</option>
                                            <option value="en_progreso">En Progreso</option>
                                            <option value="en_revision">En Revisión</option>
                                            <option value="completada">Completada</option>
                                            <option value="cancelada">Cancelada</option>
                                        </select>
                                    </div>

                                    {/* Fechas */}
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="startDate" className="form-label">
                                            Fecha de Inicio
                                        </label>
                                        <DatePicker
                                            selected={formData.startDate ? new Date(formData.startDate) : null}
                                            onChange={(date) => handleChange({ target: { name: 'startDate', value: date.toISOString().split('T')[0] } })}
                                            className="form-control"
                                            dateFormat="yyyy-MM-dd"
                                            placeholderText="yyyy-MM-dd" // Mostrar máscara de fecha
                                            showPopperArrow={false} // Deshabilitar entrada manual
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="dueDate" className="form-label">
                                            Fecha de Vencimiento
                                        </label>
                                        <DatePicker
                                            selected={formData.dueDate ? new Date(formData.dueDate) : null}
                                            onChange={(date) => handleChange({ target: { name: 'dueDate', value: date.toISOString().split('T')[0] } })}
                                            className={`form-control ${errors.dueDate ? 'is-invalid' : ''}`}
                                            dateFormat="yyyy-MM-dd"
                                            placeholderText="yyyy-MM-dd" // Mostrar máscara de fecha
                                            showPopperArrow={false} // Deshabilitar entrada manual
                                        />
                                        {errors.dueDate && (
                                            <div className="invalid-feedback">{errors.dueDate}</div>
                                        )}
                                    </div>

                                    {/* Horas estimadas */}
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="estimatedHours" className="form-label">
                                            Horas Estimadas
                                        </label>
                                        <input
                                            type="number"
                                            className={`form-control ${errors.estimatedHours ? 'is-invalid' : ''}`}
                                            id="estimatedHours"
                                            name="estimatedHours"
                                            value={formData.estimatedHours}
                                            onChange={handleChange}
                                            placeholder="0"
                                            step="0.5"
                                            min="0"
                                        />
                                        {errors.estimatedHours && (
                                            <div className="invalid-feedback">{errors.estimatedHours}</div>
                                        )}
                                    </div>

                                    {/* Progreso */}
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="progress" className="form-label">
                                            Progreso: {formData.progress}%
                                        </label>
                                        <input
                                            type="range"
                                            className={`form-range ${errors.progress ? 'is-invalid' : ''}`}
                                            id="progress"
                                            name="progress"
                                            min="0"
                                            max="100"
                                            value={formData.progress}
                                            onChange={handleChange}
                                        />
                                        <div className="d-flex justify-content-between">
                                            <small className="text-secondary fw-medium">0%</small>
                                            <small className="text-secondary fw-medium">100%</small>
                                        </div>
                                        {errors.progress && (
                                            <div className="invalid-feedback">{errors.progress}</div>
                                        )}
                                        {formData.progress >= 100 && (
                                            <div className="form-text text-success">
                                                La tarea se marcará automáticamente como completada
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Información adicional para edición */}
                                {isEdit && (
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="alert alert-info">
                                                <small>
                                                    <strong>Nota:</strong> Los cambios en el progreso y estado 
                                                    pueden afectar las estadísticas del proyecto.
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                )}

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
                        isEdit ? 'Actualizar Tarea' : 'Crear Tarea'
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
