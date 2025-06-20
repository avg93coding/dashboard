import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar, User, Filter, X, Download, Plus, Edit, Trash2 } from 'lucide-react';

// --- Helper Functions ---
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + timezoneOffset);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return adjustedDate.toLocaleDateString('en-US', options);
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + timezoneOffset);
    return adjustedDate.toISOString().split('T')[0];
}

const getStatus = (project, currentDate) => {
    if (project.status === 'Completed') return { label: 'Completed', color: 'bg-green-500', icon: '✅' };
    const deadline = new Date(project.deadline);
    if (deadline < currentDate && project.status !== 'Completed') {
        return { label: 'Overdue', color: 'bg-red-500', icon: '🔴' };
    }
    return { label: 'In Progress', color: 'bg-yellow-500', icon: '🟡' };
};

const exportToCSV = (data) => {
    const headers = ['ID', 'Project Name', 'Responsible', 'Start Date', 'Deadline', 'Status', 'Potential Tasks'];
    const rows = data.map(p => [
        p.id,
        `"${p.name}"`,
        p.responsible,
        p.startDate,
        p.deadline,
        getStatus(p, new Date()).label,
        `"${p.potentialTasks.join(', ')}"`
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "project_tracker_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// --- Mock Data ---
const initialProjects = [
    { id: 1, name: 'Quantum Entanglement Research', responsible: 'Rep 1', startDate: '2025-05-01', deadline: '2025-07-30', status: 'In Progress', potentialTasks: ['Initial experiment setup', 'Data collection phase 1', 'Peer review preparation'] },
    { id: 2, name: 'AI in Medical Diagnosis', responsible: 'Rep 2', startDate: '2025-06-15', deadline: '2025-09-20', status: 'In Progress', potentialTasks: ['Algorithm development', 'Testing with sample data', 'Clinical trial proposal'] },
    { id: 3, name: 'Renewable Energy Storage Solutions', responsible: 'Rep 1', startDate: '2025-04-10', deadline: '2025-05-30', status: 'Completed', potentialTasks: ['Battery prototype design', 'Material sourcing', 'Final report'] },
    { id: 4, name: 'Urban Farming Automation', responsible: 'Rep 2', startDate: '2025-07-01', deadline: '2025-10-15', status: 'In Progress', potentialTasks: ['Sensor integration', 'Robotics arm programming', 'Yield analysis'] },
    { id: 5, name: 'Dark Matter Particle Simulation', responsible: 'Rep 1', startDate: '2025-03-20', deadline: '2025-06-10', status: 'In Progress', potentialTasks: ['Model refinement', 'Computational runs', 'Result visualization'] },
    { id: 6, name: 'Neuro-linguistic Programming Analysis', responsible: 'Rep 2', startDate: '2025-08-01', deadline: '2025-11-30', status: 'In Progress', potentialTasks: ['Corpus collection', 'Pattern recognition model', 'Publishing paper'] },
    { id: 7, name: 'Advanced Water Purification Tech', responsible: 'Rep 1', startDate: '2025-05-20', deadline: '2025-08-10', status: 'Completed', potentialTasks: ['Filter membrane synthesis', 'Testing water quality', 'Scaling up prototype'] },
];

// --- Sub-Components ---

const Header = () => (
    <div className="bg-white/70 backdrop-blur-lg p-4 border-b border-gray-200 sticky top-0 z-20">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">Research Project Dashboard</h1>
        <p className="text-gray-500 mt-1">Track progress, deadlines, and responsibilities.</p>
    </div>
);

const FilterControls = ({ filters, setFilters, reps, onExport, onAddNew }) => {
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ responsible: 'all', status: 'all', dateRange: { start: '', end: '' } });
    };

    const anyFilterActive = filters.responsible !== 'all' || filters.status !== 'all' || filters.dateRange.start || filters.dateRange.end;

    return (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><select value={filters.responsible} onChange={(e) => handleFilterChange('responsible', e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none"><option value="all">All Reps</option>{reps.map(rep => <option key={rep} value={rep}>{rep}</option>)}</select></div>
                <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none"><option value="all">All Statuses</option><option value="Completed">Completed</option><option value="In Progress">In Progress</option><option value="Overdue">Overdue</option></select></div>
                <div className="relative col-span-1 sm:col-span-2 lg:col-span-1"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="date" value={filters.dateRange.start} onChange={(e) => handleFilterChange('dateRange', {...filters.dateRange, start: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none" placeholder="Start Date"/></div>
                <div className="relative col-span-1 sm:col-span-2 lg:col-span-1"><input type="date" value={filters.dateRange.end} onChange={(e) => handleFilterChange('dateRange', {...filters.dateRange, end: e.target.value})} className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none" placeholder="End Date"/></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 items-center">
                 <button onClick={onAddNew} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-green-500"><Plus size={16} /> Add Project</button>
                {anyFilterActive && (<button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition-colors"><X size={14} /> Clear Filters</button>)}
                <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-auto"><Download size={16} /> Export CSV</button>
            </div>
        </div>
    );
};

const ProjectCard = ({ project, currentDate, onProjectClick }) => {
    const status = getStatus(project, currentDate);
    return (
        <div onClick={() => onProjectClick(project)} className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start"><span className={`text-xs font-semibold px-2 py-1 ${status.color} text-white rounded-full`}>{status.label}</span><span className="text-sm font-medium text-gray-600">{project.responsible}</span></div>
                <h3 className="font-bold text-gray-800 mt-3 text-lg">{project.name}</h3>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100"><p className="text-sm text-gray-500"><span className="font-semibold">Timeline:</span> {formatDate(project.startDate)} - {formatDate(project.deadline)}</p></div>
        </div>
    );
};

const GanttChart = ({ projects, currentDate, onProjectClick }) => {
    if (projects.length === 0) return <div className="text-center py-10 text-gray-500">No projects match the current filters.</div>;
    const allDates = projects.flatMap(p => [new Date(p.startDate), new Date(p.deadline)]);
    const minDate = new Date(Math.min.apply(null, allDates.length > 0 ? allDates : [new Date()]));
    const maxDate = new Date(Math.max.apply(null, allDates.length > 0 ? allDates : [new Date()]));
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);
    const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    const getMonthMarkers = () => {
        const markers = []; let currentDateMarker = new Date(minDate);
        while (currentDateMarker <= maxDate) {
            const leftPosition = ((currentDateMarker - minDate) / (1000 * 60 * 60 * 24) / totalDays) * 100;
            markers.push({ date: new Date(currentDateMarker), label: currentDateMarker.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }), left: `${leftPosition}%` });
            currentDateMarker.setMonth(currentDateMarker.getMonth() + 1); currentDateMarker.setDate(1);
        }
        return markers;
    };
    const monthMarkers = getMonthMarkers();
    return (
        <div className="p-4 md:p-6 overflow-x-auto"><div className="relative" style={{ minWidth: '800px' }}>
            <div className="relative h-8 mb-2 border-b-2 border-gray-200">{monthMarkers.map((marker, index) => (<div key={index} className="absolute -bottom-1 text-xs text-gray-500" style={{ left: marker.left, transform: 'translateX(-50%)' }}><div className="h-2 w-px bg-gray-300"></div>{marker.label}</div>))}</div>
            <div className="space-y-3">{projects.map(project => {
                const projectStart = new Date(project.startDate); const projectEnd = new Date(project.deadline);
                const status = getStatus(project, currentDate);
                const left = totalDays > 0 ? ((projectStart - minDate) / (1000 * 60 * 60 * 24) / totalDays) * 100 : 0;
                const width = totalDays > 0 ? ((projectEnd - projectStart) / (1000 * 60 * 60 * 24) / totalDays) * 100 : 0;
                return (<div key={project.id} className="w-full h-12 flex items-center group" onClick={() => onProjectClick(project)}><div className="w-48 truncate pr-4 text-sm font-medium text-gray-700">{project.name}</div><div className="flex-1 h-full relative"><div className={`absolute h-8 top-2 rounded-lg ${status.color} transition-all duration-300 ease-out group-hover:opacity-80 cursor-pointer flex items-center px-2`} style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%`, minWidth: '10px' }}><span className="text-white text-xs font-bold truncate hidden sm:inline">{project.name}</span></div></div></div>);
            })}</div>
        </div></div>
    );
};

const ProjectModal = ({ project, mode, onClose, onSave, onDelete, setMode }) => {
    const [formData, setFormData] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (project) {
            setFormData({
                ...project,
                potentialTasks: project.potentialTasks ? project.potentialTasks.join('\n') : '',
            });
        }
    }, [project, mode]);

    if (!project) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave({
            ...formData,
            potentialTasks: formData.potentialTasks.split('\n').filter(task => task.trim() !== ''),
        });
    };

    const handleDelete = () => {
        onDelete(project.id);
    }
    
    const isEditingOrCreating = mode === 'edit' || mode === 'create';
    const status = getStatus(project, new Date());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative transform transition-all duration-300 ease-out" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"><X size={24} /></button>
                
                {isEditingOrCreating ? (
                    // EDIT/CREATE VIEW
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900">{mode === 'create' ? 'Add New Project' : 'Edit Project'}</h2>
                        <div><label className="text-sm font-medium text-gray-600">Project Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg"/></div>
                        <div><label className="text-sm font-medium text-gray-600">Responsible</label><input type="text" name="responsible" value={formData.responsible || ''} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium text-gray-600">Start Date</label><input type="date" name="startDate" value={formatDateForInput(formData.startDate)} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg"/></div>
                            <div><label className="text-sm font-medium text-gray-600">Deadline</label><input type="date" name="deadline" value={formatDateForInput(formData.deadline)} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg"/></div>
                        </div>
                        <div><label className="text-sm font-medium text-gray-600">Status</label><select name="status" value={formData.status || 'In Progress'} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg"><option>In Progress</option><option>Completed</option></select></div>
                        <div><label className="text-sm font-medium text-gray-600">Potential Tasks (one per line)</label><textarea name="potentialTasks" value={formData.potentialTasks || ''} onChange={handleChange} rows="4" className="w-full mt-1 p-2 border border-gray-300 rounded-lg"></textarea></div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
                        </div>
                    </div>
                ) : (
                    // VIEW MODE
                    <div>
                        <div className="flex items-center gap-3"><span className={`w-4 h-4 rounded-full ${status.color}`}></span><h2 className="text-2xl font-bold text-gray-900">{project.name}</h2></div>
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 font-semibold">Responsible</p><p className="text-gray-800 font-medium">{project.responsible}</p></div>
                            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 font-semibold">Status</p><p className="text-gray-800 font-medium">{status.label}</p></div>
                            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 font-semibold">Start Date</p><p className="text-gray-800 font-medium">{formatDate(project.startDate)}</p></div>
                            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500 font-semibold">Deadline</p><p className="text-gray-800 font-medium">{formatDate(project.deadline)}</p></div>
                        </div>
                        <div className="mt-6"><h3 className="font-semibold text-gray-700">Potential Tasks (Tareas Potenciales)</h3><ul className="mt-2 list-disc list-inside space-y-1 text-gray-600 bg-gray-50 p-3 rounded-lg">{project.potentialTasks.map((task, i) => <li key={i}>{task}</li>)}</ul></div>
                        
                        {showDeleteConfirm ? (
                             <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                <p className="font-semibold text-red-800">Are you sure you want to delete this project?</p>
                                <p className="text-sm text-red-600">This action cannot be undone.</p>
                                <div className="flex justify-center gap-3 mt-4">
                                    <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Yes, Delete</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><Trash2 size={16} /> Delete</button>
                                <button onClick={() => setMode('edit')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit size={16} /> Edit</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [projects, setProjects] = useState(initialProjects);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProject, setModalProject] = useState(null);
    const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'create'
    const [filters, setFilters] = useState({ responsible: 'all', status: 'all', dateRange: { start: '', end: '' } });
    const [viewMode, setViewMode] = useState('gantt'); // 'gantt' or 'card'

    useEffect(() => { const timer = setInterval(() => setCurrentDate(new Date()), 60000); return () => clearInterval(timer); }, []);

    const responsibleReps = useMemo(() => [...new Set(projects.map(p => p.responsible).filter(Boolean))].sort(), [projects]);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            if (filters.responsible !== 'all' && p.responsible !== filters.responsible) return false;
            const status = getStatus(p, currentDate).label;
            if (filters.status !== 'all' && status !== filters.status) return false;
            const startDate = new Date(p.startDate); const deadline = new Date(p.deadline);
            if(filters.dateRange.start && deadline < new Date(filters.dateRange.start)) return false;
            if(filters.dateRange.end && startDate > new Date(filters.dateRange.end)) return false;
            return true;
        }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    }, [projects, filters, currentDate]);

    const handleProjectClick = useCallback((project) => {
        setModalProject(project); setModalMode('view'); setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false); setModalProject(null);
    }, []);

    const handleAddNew = useCallback(() => {
        setModalProject({ name: '', responsible: '', startDate: '', deadline: '', status: 'In Progress', potentialTasks: [] });
        setModalMode('create'); setIsModalOpen(true);
    }, []);

    const handleSaveProject = useCallback((projectData) => {
        setProjects(prevProjects => {
            if (modalMode === 'create') {
                const newId = Math.max(0, ...prevProjects.map(p => p.id)) + 1;
                return [...prevProjects, { ...projectData, id: newId }];
            } else {
                return prevProjects.map(p => p.id === projectData.id ? projectData : p);
            }
        });
        handleCloseModal();
    }, [modalMode, handleCloseModal]);

    const handleDeleteProject = useCallback((projectId) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        handleCloseModal();
    }, [handleCloseModal]);

    const handleExport = useCallback(() => { exportToCSV(filteredProjects); }, [filteredProjects]);

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
            <Header />
            <FilterControls filters={filters} setFilters={setFilters} reps={responsibleReps} onExport={handleExport} onAddNew={handleAddNew} />
            <div className="p-4">
                <div className="flex justify-end mb-4"><div className="flex rounded-lg border border-gray-300 p-1 bg-white shadow-sm">
                    <button onClick={() => setViewMode('gantt')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'gantt' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'} transition-colors`}>Timeline</button>
                    <button onClick={() => setViewMode('card')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'} transition-colors`}>Cards</button>
                </div></div>
                <main className="bg-white rounded-xl shadow-md border border-gray-200">
                    {viewMode === 'gantt' ? ( <GanttChart projects={filteredProjects} currentDate={currentDate} onProjectClick={handleProjectClick} /> ) : 
                    ( filteredProjects.length > 0 ? ( <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filteredProjects.map(project => (<ProjectCard key={project.id} project={project} currentDate={currentDate} onProjectClick={handleProjectClick} />))}</div> ) : 
                    ( <div className="text-center py-10 text-gray-500">No projects match the current filters.</div> )
                    )}
                </main>
            </div>
            {isModalOpen && <ProjectModal project={modalProject} mode={modalMode} onClose={handleCloseModal} onSave={handleSaveProject} onDelete={handleDeleteProject} setMode={setModalMode}/>}
        </div>
    );
}
