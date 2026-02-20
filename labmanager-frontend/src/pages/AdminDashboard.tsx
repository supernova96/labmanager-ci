import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, LayoutGrid, AlertTriangle, LogOut, Plus, Edit, Trash2, Activity, QrCode, Download, Settings, Calendar, MessageSquare, Star, Menu, X } from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';
import LogsTable from '../components/LogsTable';
import ThemeToggle from '../components/ThemeToggle';
import { toast, ToastContainer } from 'react-toastify';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import { Scanner } from '@yudiel/react-qr-scanner';

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'inventory' | 'incidents' | 'handover' | 'requests' | 'users' | 'analytics' | 'reports' | 'whitelist' | 'logs' | 'config' | 'ratings'>('analytics');
    const [inventory, setInventory] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [blockedDates, setBlockedDates] = useState<any[]>([]);
    const [newBlockedDate, setNewBlockedDate] = useState('');
    const [newBlockedReason, setNewBlockedReason] = useState('Festivo / Vacaciones');

    // User Registration State
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUser, setNewUser] = useState<{ fullName: string, matricula: string, email: string, password: string, role: string[] }>({ fullName: '', matricula: '', email: '', password: '', role: ['student'] });

    // Laptop Management State
    const [showLaptopModal, setShowLaptopModal] = useState(false);
    const [editingLaptop, setEditingLaptop] = useState<any>(null);
    const [laptopForm, setLaptopForm] = useState({ model: '', serialNumber: '', status: 'AVAILABLE' });
    const [viewingEvidence, setViewingEvidence] = useState<string | null>(null);

    // QR Scanner State
    const [showScanner, setShowScanner] = useState(false);
    const [scannedReservation, setScannedReservation] = useState<any>(null); // For handling the scanned result action

    const handleScan = (result: any) => {
        if (result && result[0]) {
            const rawValue = result[0].rawValue;

            // Expected format: RES-123 (Standard) OR ReservaID:123 (Legacy/Email)
            let reservationId = null;

            // Try Standard "RES-123"
            if (rawValue.startsWith('RES-')) {
                const parts = rawValue.split('-');
                if (parts[1]) reservationId = parseInt(parts[1]);
            }
            // Try Legacy "ReservaID:123..."
            else {
                const match = rawValue.match(/ReservaID:(\d+)/);
                if (match && match[1]) reservationId = parseInt(match[1]);
            }

            if (reservationId) {
                setShowScanner(false);
                toast.info(`Código detectado: Reserva #${reservationId}`);

                // Fetch the reservation and open the Handover/Return logic
                api.get(`/reservations/${reservationId}`)
                    .then(res => {
                        const reservation = res.data;
                        // Switch to 'handover' tab to simplify context or handle it directly
                        // Ideally, we open the "Action Modal" for this reservation.
                        // We can reuse the existing 'handover' tab logic if we switch tabs and highlight it, 
                        // or we can implement a specific "Quick Action" modal here.
                        // Let's go with Quick Action Modal approach reusing existing state variables if possible?
                        // Actually, the handover tab has its own list.
                        // Let's just set 'activeTab' to 'handover' and maybe filter?
                        // Better: Open a specific modal just for this action.
                        // For simplicity in this iteration: Switch to Handover tab and search/filter isn't easily exposed.
                        // Let's create a "Quick Action" flow.
                        setScannedReservation(reservation);
                    })
                    .catch(() => toast.error('Error al buscar la reserva escaneada.'));
            }
        }
    };



    const downloadReport = async (type: 'inventory' | 'incidents', format: 'pdf' | 'excel') => {
        try {
            // filterStatus is not defined in the current scope.
            // For now, removing the params part to ensure syntactical correctness.
            // If filterStatus is needed, it should be defined or passed as an argument.
            const response = await api.get(`/reports/${type}/${format}`, {
                responseType: 'blob',
                // params: type === 'inventory' ? { status: filterStatus } : {}
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_report.${format === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error("Error downloading report", error);
            toast.error('Error al descargar el reporte.');
        }
    };


    // Mobile Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Whitelist State
    const [whitelist, setWhitelist] = useState<any[]>([]);
    const [newWhitelistMatricula, setNewWhitelistMatricula] = useState('');

    const fetchWhitelist = () => {
        api.get('/admin/whitelist')
            .then(res => setWhitelist(res.data))
            .catch(() => toast.error('Error al cargar la whitelist'));
    };

    const handleAddToWhitelist = async () => {
        if (!/^\d+$/.test(newWhitelistMatricula)) {
            toast.error('La matrícula debe ser numérica');
            return;
        }
        try {
            await api.post('/admin/whitelist', { matricula: newWhitelistMatricula });
            toast.success('Matrícula agregada a la whitelist');
            setNewWhitelistMatricula('');
            fetchWhitelist();
        } catch (e: any) {
            toast.error(e.response?.data || 'Error al agregar matrícula');
        }
    };

    const handleRemoveFromWhitelist = async (matricula: string) => {
        if (!window.confirm(`¿Eliminar matrícula ${matricula} de la whitelist?`)) return;
        try {
            await api.delete(`/admin/whitelist/${matricula}`);
            toast.success('Matrícula eliminada');
            fetchWhitelist();
        } catch (e) {
            toast.error('Error al eliminar matrícula');
        }
    };

    const fetchData = () => {
        if (activeTab === 'inventory') {
            api.get('/laptops/all').then(res => setInventory(res.data)).catch(() => toast.error('Error al cargar inventario'));
            api.get('/incidents').then(res => setIncidents(res.data)).catch(() => console.error('Error fetching incidents for filter'));
            // Fetch reservations to determine 'IN_USE' status
            api.get('/reservations/all').then(res => setReservations(res.data)).catch(() => console.error('Error fetching reservations for inventory status'));
        } else if (activeTab === 'handover' || activeTab === 'requests' || activeTab === 'ratings') {
            api.get('/reservations/all').then(res => setReservations(res.data)).catch(() => toast.error('Error al cargar reservas'));
        } else if (activeTab === 'incidents') {
            api.get('/incidents').then(res => setIncidents(res.data)).catch(() => toast.error('Error al cargar incidentes'));
        } else if (activeTab === 'users' || activeTab === 'reports') {
            api.get('/admin/users').then(res => setUsers(res.data)).catch(() => toast.error('Error al cargar usuarios'));
        } else if (activeTab === 'whitelist') {
            fetchWhitelist();
        } else if (activeTab === 'config') {
            api.get('/admin/blocked-dates')
                .then(res => setBlockedDates(res.data))
                .catch(() => toast.error('Error al cargar fechas bloqueadas'));
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await api.put(`/reservations/${id}/status?status=${status}`);
            toast.success(`Estado actualizado a ${status}`);
            fetchData();
        } catch (e) {
            toast.error('Error al actualizar estado');
        }
    };

    const handleRegisterUser = async () => {
        // Validation
        if (!/^\d+$/.test(newUser.matricula)) {
            toast.error('Error: La matrícula debe ser numérica.');
            return;
        }
        if (!newUser.email.includes('@')) {
            toast.error('Error: Correo no válido.');
            return;
        }
        if (newUser.password.length < 6 || newUser.password.includes(' ')) {
            toast.error('Error: Contraseña insegura (min 6 caracteres, sin espacios).');
            return;
        }
        if (!newUser.fullName.trim()) {
            toast.error('Error: El nombre es obligatorio.');
            return;
        }

        try {
            await api.post('/admin/users', newUser);
            toast.success('Usuario registrado exitosamente');
            setShowUserModal(false);
            setNewUser({ fullName: '', matricula: '', email: '', password: '', role: ['student'] });
            fetchData();
        } catch (e: any) {
            const errorMsg = e.response?.data?.message || 'Error al registrar usuario.';
            toast.error(errorMsg);
        }
    };

    const handleAddBlockedDate = async () => {
        if (!newBlockedDate) return toast.error('Selecciona una fecha');
        try {
            await api.post('/admin/blocked-dates', { date: newBlockedDate, reason: newBlockedReason });
            toast.success('Fecha bloqueada correctamente');
            setNewBlockedDate('');
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data || 'Error al bloquear fecha');
        }
    };

    const handleDeleteBlockedDate = async (id: number) => {
        if (!window.confirm('¿Desbloquear esta fecha?')) return;
        try {
            await api.delete(`/admin/blocked-dates/${id}`);
            toast.success('Fecha desbloqueada');
            fetchData();
        } catch (e) {
            toast.error('Error al eliminar fecha');
        }
    };

    const handleToggleSanction = async (id: number) => {
        // Optimistic update for immediate feedback
        setUsers(prevUsers => prevUsers.map(u =>
            u.id === id ? { ...u, isSanctioned: !u.isSanctioned } : u
        ));

        try {
            await api.put(`/admin/users/${id}/sanction`);
            toast.success('Estado de sanción actualizado');
            // We can still fetch data to ensuring sync, but the local update handles the UI glich
            fetchData();
        } catch (e) {
            // Revert state on error
            setUsers(prevUsers => prevUsers.map(u =>
                u.id === id ? { ...u, isSanctioned: !u.isSanctioned } : u
            ));
            toast.error('Error al actualizar sanción');
        }
    };

    // Laptop CRUD Handlers
    const [softwareInput, setSoftwareInput] = useState('');

    const handleSaveLaptop = async () => {
        try {
            // Parse software input (comma or newline separated)
            const softwareList = softwareInput.split(/[\n,]/)
                .map(s => s.trim())
                .filter(s => s.length > 0)
                .map(s => {
                    // formats: "Name-Version" or just "Name"
                    const parts = s.split('-');
                    if (parts.length > 1) {
                        return { name: parts[0].trim(), version: parts[1].trim() };
                    }
                    return { name: s, version: 'Latest' };
                });

            const payload = { ...laptopForm, installedSoftware: softwareList };

            if (editingLaptop) {
                await api.put(`/laptops/${editingLaptop.id}`, payload);
                toast.success('Equipo actualizado');
            } else {
                await api.post('/laptops', payload);
                toast.success('Equipo agregado');
            }
            setShowLaptopModal(false);
            setEditingLaptop(null);
            setLaptopForm({ model: '', serialNumber: '', status: 'AVAILABLE' });
            setSoftwareInput('');
            fetchData();
        } catch (e) {
            toast.error('Error al guardar equipo');
        }
    };

    const handleDeleteLaptop = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este equipo?')) return;
        try {
            await api.delete(`/laptops/${id}`);
            toast.success('Equipo eliminado');
            fetchData();
        } catch (e) {
            toast.error('Error al eliminar equipo');
        }
    };

    const openEditLaptop = (laptop: any) => {
        setEditingLaptop(laptop);
        setLaptopForm({ model: laptop.model, serialNumber: laptop.serialNumber, status: laptop.status });
        // Pre-fill software input
        const softwareStr = laptop.installedSoftware ? laptop.installedSoftware.map((s: any) => `${s.name}-${s.version}`).join(', ') : '';
        setSoftwareInput(softwareStr);
        setShowLaptopModal(true);
    };

    const openAddLaptop = () => {
        setEditingLaptop(null);
        setLaptopForm({ model: '', serialNumber: '', status: 'AVAILABLE' });
        setSoftwareInput('');
        setShowLaptopModal(true);
    };


    const handleResolveIncident = async (id: number) => {
        try {
            await api.put(`/incidents/${id}/resolve`);
            toast.success('Incidente resuelto');
            fetchData();
        } catch (e) {
            toast.error('Error al resolver incidente');
        }
    };

    // Inventory Filter State
    const [inventoryFilter, setInventoryFilter] = useState('ALL');

    const handleDownloadReport = async (url: string, filename: string) => {
        try {
            const response = await api.get(url, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading report:', error);
            toast.error('Error al descargar el reporte. Intente nuevamente.');
        }
    };

    return (
        <div className="min-h-screen">
            <ToastContainer theme="dark" />
            <nav className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-white/10 mr-2"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">LabManager <span className="text-blue-400">Admin</span></span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <span className="text-sm text-slate-600 dark:text-slate-300">Operador: <span className="font-semibold text-slate-900 dark:text-white">{user?.fullName}</span></span>
                            <button onClick={logout} className="p-2 rounded-full hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex h-[calc(100vh-64px)]">
                <aside className="w-64 bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-xl border-r border-slate-200 dark:border-white/10 hidden lg:block">
                    <div className="p-4 space-y-1">
                        <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'requests' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <ClipboardCheck className="h-5 w-5 mr-3" /> Solicitudes
                        </button>
                        <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <Activity className="h-5 w-5 mr-3" /> BI & Analítica
                        </button>
                        <button onClick={() => setActiveTab('handover')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'handover' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <ClipboardCheck className="h-5 w-5 mr-3" /> Entregas
                        </button>
                        <button onClick={() => setActiveTab('users')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <div className="flex items-center"><span className="h-5 w-5 mr-3">👥</span> Usuarios</div>
                        </button>
                        <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'inventory' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <LayoutGrid className="h-5 w-5 mr-3" /> Inventario
                        </button>
                        <button onClick={() => setActiveTab('whitelist')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'whitelist' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <div className="flex items-center"><span className="h-5 w-5 mr-3">📜</span> Whitelist</div>
                        </button>
                        <button onClick={() => setActiveTab('incidents')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'incidents' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <AlertTriangle className="h-5 w-5 mr-3" /> Incidentes
                        </button>
                        <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'reports' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <ClipboardCheck className="h-5 w-5 mr-3" /> Reportes
                        </button>
                        <button onClick={() => setActiveTab('logs')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'logs' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <div className="flex items-center"><span className="h-5 w-5 mr-3">📋</span> Logs del Sistema</div>
                        </button>
                        <button onClick={() => setActiveTab('ratings')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'ratings' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <MessageSquare className="h-5 w-5 mr-3" /> Calificaciones
                        </button>
                        <button onClick={() => setActiveTab('config')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'config' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <Settings className="h-5 w-5 mr-3" /> Configuración
                        </button>
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Mobile Sidebar */}
                <aside className={`fixed top-[64px] bottom-0 left-0 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-white/10 z-50 transition-transform duration-300 lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-4 space-y-1 h-full overflow-y-auto">
                        <button onClick={() => { setActiveTab('requests'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'requests' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <ClipboardCheck className="h-5 w-5 mr-3" /> Solicitudes
                        </button>
                        <button onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <Activity className="h-5 w-5 mr-3" /> BI & Analítica
                        </button>
                        <button onClick={() => { setActiveTab('handover'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'handover' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <ClipboardCheck className="h-5 w-5 mr-3" /> Entregas
                        </button>
                        <button onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <div className="flex items-center"><span className="h-5 w-5 mr-3">👥</span> Usuarios</div>
                        </button>
                        <button onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'inventory' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <LayoutGrid className="h-5 w-5 mr-3" /> Inventario
                        </button>
                        <button onClick={() => { setActiveTab('whitelist'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'whitelist' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <div className="flex items-center"><span className="h-5 w-5 mr-3">📜</span> Whitelist</div>
                        </button>
                        <button onClick={() => { setActiveTab('incidents'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'incidents' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <AlertTriangle className="h-5 w-5 mr-3" /> Incidentes
                        </button>
                        <button onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'reports' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <ClipboardCheck className="h-5 w-5 mr-3" /> Reportes
                        </button>
                        <button onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'logs' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <div className="flex items-center"><span className="h-5 w-5 mr-3">📋</span> Logs del Sistema</div>
                        </button>
                        <button onClick={() => { setActiveTab('ratings'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'ratings' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <MessageSquare className="h-5 w-5 mr-3" /> Calificaciones
                        </button>
                        <button onClick={() => { setActiveTab('config'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'config' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white'}`}>
                            <Settings className="h-5 w-5 mr-3" /> Configuración
                        </button>
                    </div>
                </aside>

                <main className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'analytics' && <AnalyticsDashboard />}

                    {activeTab === 'ratings' && (
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Calificaciones y Comentarios</h1>
                            <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-white/10 overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Equipo</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Usuario</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Fecha</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Calificación</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Comentario</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {reservations.filter((r: any) => r.rating !== null && r.rating !== undefined).map((res: any) => (
                                            <tr key={res.id} className="hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{res.laptop.model}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{res.laptop.serialNumber}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-900 dark:text-slate-200">{res.user ? res.user.fullName : 'Usuario Eliminado'}</div>
                                                    <div className="text-xs text-slate-500">{res.user?.matricula}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {format(new Date(res.startTime), 'dd MMM yyyy', { locale: es })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(res.rating)].map((_, i) => (
                                                            <Star key={i} className="h-4 w-4 fill-current" />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 italic">
                                                    "{res.feedback || 'Sin comentarios'}"
                                                </td>
                                            </tr>
                                        ))}
                                        {reservations.filter((r: any) => r.rating !== null && r.rating !== undefined).length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                    No hay calificaciones registradas aún.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'requests' && (
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Solicitudes Pendientes</h1>
                            <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-white/10 overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Estudiante</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Info Clase</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Equipo</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Fecha y Hora</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {reservations.filter((r: any) => r.status === 'PENDING').map((res: any) => (
                                            <tr key={res.id} className="hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">{res.user ? res.user.fullName : 'Desconocido'} <br /><span className="text-xs text-slate-500">{res.user?.matricula}</span></td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{res.subject || 'N/A'} <br /><span className="text-xs text-slate-500 dark:text-slate-400">{res.professor || 'N/A'}</span></td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{res.laptop.model} <br /><span className="text-xs text-slate-500 dark:text-slate-400">{res.laptop.serialNumber}</span></td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    <div className="font-semibold text-slate-500 dark:text-slate-400 capitalize">{format(new Date(res.startTime), 'dd MMM yyyy', { locale: es })}</div>
                                                    <div>{format(new Date(res.startTime), 'HH:mm')} - {format(new Date(res.endTime), 'HH:mm')}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => handleStatusUpdate(res.id, 'APPROVED')} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">Aprobar</button>
                                                        <button onClick={() => handleStatusUpdate(res.id, 'REJECTED')} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">Rechazar</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {reservations.filter((r: any) => r.status === 'PENDING').length === 0 && (
                                            <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">No hay solicitudes pendientes.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Usuarios</h1>
                                <button onClick={() => setShowUserModal(true)} className="px-4 py-2 bg-blue-600 text-slate-900 dark:text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30">Registrar Usuario</button>
                            </div>
                            <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-white/10 overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Matrícula</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Nombre</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Estado</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {users.map((u: any) => (
                                            <tr key={u.id} className="hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">{u.matricula}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{u.fullName}</td>
                                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.isSanctioned ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>{u.isSanctioned ? 'Sancionado' : 'Activo'}</span></td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => handleToggleSanction(u.id)} className={`px-3 py-1 rounded-lg text-sm font-medium ${u.isSanctioned ? 'bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/20' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/20'}`}>
                                                        {u.isSanctioned ? 'Quitar Sanción' : 'Sancionar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Register User Modal */}
                            {showUserModal && (
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Registrar Nuevo Usuario</h3>
                                        <div className="space-y-3 mb-6">
                                            <input type="text" placeholder="Nombre Completo" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} className="block w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500" />
                                            <input type="text" placeholder="Matrícula" value={newUser.matricula} onChange={e => setNewUser({ ...newUser, matricula: e.target.value })} className="block w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500" />
                                            <input type="email" placeholder="Correo Electrónico" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="block w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500" />
                                            <input type="password" placeholder="Contraseña" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="block w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500" />
                                            <select
                                                value={newUser.role ? newUser.role[0] : 'student'}
                                                onChange={e => setNewUser({ ...newUser, role: [e.target.value] })}
                                                className="block w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="student" className="bg-white dark:bg-slate-900">Estudiante</option>
                                                <option value="professor" className="bg-white dark:bg-slate-900">Profesor</option>
                                                <option value="admin" className="bg-white dark:bg-slate-900">Administrador</option>
                                            </select>
                                        </div>
                                        <div className="flex space-x-3">
                                            <button onClick={() => setShowUserModal(false)} className="flex-1 px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">Cancelar</button>
                                            <button onClick={handleRegisterUser} className="flex-1 px-4 py-2 bg-blue-600 text-slate-900 dark:text-white rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-500/20">Registrar</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'whitelist' && (
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Lista Blanca de Estudiantes</h1>
                            <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-white/10 p-6 mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Agregar Matrícula Permitida</h3>
                                <div className="flex space-x-4">
                                    <input
                                        type="text"
                                        placeholder="Matrícula"
                                        value={newWhitelistMatricula}
                                        onChange={e => setNewWhitelistMatricula(e.target.value)}
                                        className="flex-1 rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    <button onClick={handleAddToWhitelist} className="px-6 py-2 bg-blue-600 text-slate-900 dark:text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">Agregar</button>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-white/10 overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Matrícula</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {whitelist.map((w: any) => (
                                            <tr key={w.matricula} className="hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">{w.matricula}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleRemoveFromWhitelist(w.matricula)} className="text-red-400 hover:text-red-300 transition-colors">
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {whitelist.length === 0 && (
                                            <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-500">No hay matrículas en la lista blanca.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'handover' && (
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Centro de Entregas</h1>
                            <div className="mb-4 flex justify-end">
                                <button
                                    onClick={() => {
                                        const code = prompt("Simulador de Escáner QR\nEscanea el código del alumno (escribe 'RES-ID'):");
                                        if (code && code.startsWith('RES-')) {
                                            const id = parseInt(code.split('-')[1]);
                                            if (!isNaN(id)) {
                                                handleStatusUpdate(id, 'ACTIVE');
                                                toast.success(`Reserva #${id} procesada por QR`);
                                            }
                                        }
                                    }}
                                    className="bg-blue-600 text-slate-900 dark:text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    <QrCode className="w-5 h-5 mr-2" /> Escanear Entrega (Cámara)
                                </button>
                            </div>
                            <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-white/10 overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Estudiante</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Equipo</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Estado</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {reservations.filter((r: any) => ['APPROVED', 'ACTIVE'].includes(r.status)).map((res: any) => (
                                            <tr key={res.id} className="hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">{res.user ? res.user.fullName : 'Desconocido'}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{res.laptop.model}</td>
                                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${res.status === 'ACTIVE' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>{res.status === 'APPROVED' ? 'Listo para Recoger' : 'En Uso'}</span></td>
                                                <td className="px-6 py-4">
                                                    {res.status === 'APPROVED' && (
                                                        <button onClick={() => handleStatusUpdate(res.id, 'ACTIVE')} className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline">Marcar Entregado</button>
                                                    )}
                                                    {res.status === 'ACTIVE' && (
                                                        <button onClick={() => handleStatusUpdate(res.id, 'COMPLETED')} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium hover:underline">Marcar Devuelto</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario</h1>
                                <div className='flex space-x-3'>
                                    <select value={inventoryFilter} onChange={e => setInventoryFilter(e.target.value)} className="rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500">
                                        <option value="ALL" className="bg-white dark:bg-slate-900">Todo el Inventario</option>
                                        <option value="HAS_INCIDENTS" className="bg-white dark:bg-slate-900">⚠️ Con Incidentes</option>
                                        <option value="AVAILABLE" className="bg-white dark:bg-slate-900">Disponibles</option>
                                        <option value="IN_USE" className="bg-white dark:bg-slate-900">En Uso</option>
                                        <option value="EN_REPARACION" className="bg-white dark:bg-slate-900">En Reparación</option>
                                        <option value="MAINTENANCE_REQUIRED" className="bg-white dark:bg-slate-900">Mantenimiento Requerido</option>
                                        <option value="INACTIVE" className="bg-white dark:bg-slate-900">Inactivo</option>
                                    </select>
                                    <button onClick={openAddLaptop} className="flex items-center px-4 py-2 bg-blue-600 text-slate-900 dark:text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                                        <Plus className="h-5 w-5 mr-2" /> Agregar Equipo
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {inventory.filter((laptop: any) => {
                                    if (inventoryFilter === 'ALL') return true;
                                    if (inventoryFilter === 'HAS_INCIDENTS') {
                                        const safeIncidents = Array.isArray(incidents) ? incidents : [];
                                        return safeIncidents.some((inc: any) => inc.laptop?.id === laptop.id && !inc.resolved);
                                    }

                                    // Smart Filter for Status
                                    // SAFETY: Check if reservations is array and use safe access
                                    const safeReservations = Array.isArray(reservations) ? reservations : [];
                                    const activeRes = safeReservations.find((r: any) => r?.laptop?.id === laptop.id && r.status === 'ACTIVE');

                                    if (inventoryFilter === 'IN_USE') {
                                        return laptop.status === 'IN_USE' || !!activeRes;
                                    }
                                    if (inventoryFilter === 'AVAILABLE') {
                                        return laptop.status === 'AVAILABLE' && !activeRes;
                                    }

                                    return laptop.status === inventoryFilter;
                                }).map((laptop: any) => {
                                    const safeReservations = Array.isArray(reservations) ? reservations : [];
                                    const activeRes = safeReservations.find((r: any) => r?.laptop?.id === laptop.id && r.status === 'ACTIVE');
                                    const approvedRes = safeReservations.find((r: any) => r?.laptop?.id === laptop.id && r.status === 'APPROVED');

                                    return (
                                        <div key={laptop.id} id={`laptop-${laptop.id}`} className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-lg relative group transition-all duration-300 hover:bg-white/10">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{laptop.model}</h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wider">{laptop.serialNumber}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${laptop.status === 'MAINTENANCE_REQUIRED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                                    laptop.status === 'EN_REPARACION' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                                        (laptop.status === 'IN_USE' || activeRes) ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                                            approvedRes ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                                                'bg-green-500/20 text-green-300 border border-green-500/30'
                                                    }`}>
                                                    {(() => {
                                                        if (laptop.status === 'IN_USE' || activeRes) return 'En Uso';
                                                        if (approvedRes) return 'Reservado';
                                                        if (laptop.status === 'AVAILABLE') return 'Disponible';
                                                        if (laptop.status === 'EN_REPARACION') return 'En Reparación';
                                                        if (laptop.status === 'MAINTENANCE_REQUIRED') return 'Mantenimiento';
                                                        if (laptop.status === 'INACTIVE') return 'Inactivo';
                                                        return laptop.status;
                                                    })()}
                                                </span>
                                            </div>

                                            {/* Show user if IN_USE */}
                                            {(laptop.status === 'IN_USE' || activeRes) && activeRes && (
                                                <div className="mt-3 text-xs bg-orange-500/10 text-orange-200 p-2 rounded border border-orange-500/20">
                                                    <strong>En uso por:</strong> {activeRes.user?.fullName || 'Usuario Desconocido'}
                                                    <div className='text-orange-300/70'>{activeRes.user?.matricula || 'S/M'}</div>
                                                </div>
                                            )}

                                            {/* Show user if RESERVED */}
                                            {approvedRes && (
                                                <div className="mt-3 text-xs bg-yellow-500/10 text-yellow-200 p-2 rounded border border-yellow-500/20">
                                                    <strong>Reservado para:</strong> {approvedRes.user?.fullName || 'Desconocido'}
                                                    <div className='text-yellow-300/70'>Recoge: {new Date(approvedRes.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            )}

                                            {/* Show Incident if HAS_INCIDENTS filter matches or generally if there are active incidents */}
                                            {(() => {
                                                const activeIncident = incidents.find((inc: any) => inc.laptop?.id === laptop.id && !inc.resolved);
                                                if (activeIncident) {
                                                    return (
                                                        <div className="mt-3 text-xs bg-red-500/10 text-red-200 p-2 rounded border border-red-500/20">
                                                            <strong>⚠️ Incidente Activo:</strong>
                                                            <div className='text-red-300/90 italic'>"{activeIncident.description}"</div>
                                                            <div className='mt-1 font-semibold flex justify-between'>
                                                                <span>Severidad: {activeIncident.severity === 'HIGH' ? 'Alta' : activeIncident.severity === 'MEDIUM' ? 'Media' : activeIncident.severity === 'LOW' ? 'Baja' : activeIncident.severity === 'CRITICAL' ? 'Crítica' : activeIncident.severity}</span>
                                                                <span>{activeIncident.reporter?.fullName} ({activeIncident.reporter?.matricula})</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}

                                            {laptop.installedSoftware && laptop.installedSoftware.length > 0 && (
                                                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                                    <strong>Software:</strong> {laptop.installedSoftware.map((s: any) => s.name).join(', ')}
                                                </div>
                                            )}
                                            <div className="mt-4 flex space-x-2">
                                                <button onClick={() => openEditLaptop(laptop)} className="flex-1 px-3 py-1.5 bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none text-slate-600 dark:text-slate-300 text-xs font-medium rounded hover:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/10">
                                                    <Edit className="h-3 w-3 mr-1" /> Editar
                                                </button>
                                                <button onClick={() => handleDeleteLaptop(laptop.id)} className="flex-1 px-3 py-1.5 bg-red-500/10 text-red-300 text-xs font-medium rounded hover:bg-red-500/20 flex items-center justify-center border border-red-500/20">
                                                    <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Laptop Modal */}
                            {showLaptopModal && (
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{editingLaptop ? 'Editar Equipo' : 'Agregar Equipo'}</h3>
                                        <div className="space-y-3 mb-6">
                                            <input type="text" placeholder="Modelo (ej. Dell XPS 15)" value={laptopForm.model} onChange={e => setLaptopForm({ ...laptopForm, model: e.target.value })} className="block w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500" />
                                            <input type="text" placeholder="Número de Serie" value={laptopForm.serialNumber} onChange={e => setLaptopForm({ ...laptopForm, serialNumber: e.target.value })} className="block w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500" />
                                            <textarea
                                                placeholder="Software Instalado (Separado por comas. Ej: Java-17, Python, Docker)"
                                                value={softwareInput}
                                                onChange={e => setSoftwareInput(e.target.value)}
                                                className="block w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 h-24"
                                            ></textarea>
                                            <select value={laptopForm.status} onChange={e => setLaptopForm({ ...laptopForm, status: e.target.value })} className="block w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500">
                                                <option value="AVAILABLE" className="bg-white dark:bg-slate-900">Disponible</option>
                                                <option value="IN_USE" className="bg-white dark:bg-slate-900">En Uso</option>
                                                <option value="INACTIVE" className="bg-white dark:bg-slate-900">Inactivo</option>
                                                <option value="EN_REPARACION" className="bg-white dark:bg-slate-900">En Reparación</option>
                                                <option value="MAINTENANCE_REQUIRED" className="bg-white dark:bg-slate-900">Mantenimiento</option>
                                            </select>
                                        </div>
                                        <div className="flex space-x-3">
                                            <button onClick={() => setShowLaptopModal(false)} className="flex-1 px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">Cancelar</button>
                                            <button onClick={handleSaveLaptop} className="flex-1 px-4 py-2 bg-blue-600 text-slate-900 dark:text-white rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-500/20">Guardar</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && <LogsTable />}

                    {activeTab === 'config' && (
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Configuración del Sistema</h1>

                            {/* Blocked Dates Section */}
                            <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-white/10 p-6 mb-6">
                                <div className="flex items-center mb-4">
                                    <Calendar className="h-6 w-6 text-blue-400 mr-3" />
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Días Inhábiles (Bloqueo de Reservas)</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Las reservas no estarán permitidas en las fechas agregadas aquí.</p>
                                    </div>
                                </div>

                                <div className="flex space-x-4 mb-6 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Fecha a Bloquear</label>
                                        <input
                                            type="date"
                                            value={newBlockedDate}
                                            onChange={e => setNewBlockedDate(e.target.value)}
                                            className="w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Motivo</label>
                                        <input
                                            type="text"
                                            value={newBlockedReason}
                                            onChange={e => setNewBlockedReason(e.target.value)}
                                            placeholder="Ej. Vacaciones de Semana Santa"
                                            className="w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <button onClick={handleAddBlockedDate} className="px-6 py-2 bg-blue-600 text-slate-900 dark:text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 h-10 mb-[1px]">
                                        Agregar Bloqueo
                                    </button>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                                    <table className="min-w-full divide-y divide-white/10">
                                        <thead className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Fecha</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Motivo</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {blockedDates.map((bd: any) => (
                                                <tr key={bd.id} className="hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200 capitalize">{format(new Date(bd.date + 'T00:00:00'), 'PPPP', { locale: es })}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{bd.reason}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => handleDeleteBlockedDate(bd.id)} className="text-red-400 hover:text-red-300 transition-colors">
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {blockedDates.length === 0 && (
                                                <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No hay fechas bloqueadas.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'incidents' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Incidentes Reportados</h1>
                                <div className="flex space-x-2">
                                    <button onClick={() => downloadReport('incidents', 'pdf')} className="flex items-center px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20">
                                        <Download className="h-4 w-4 mr-2" /> PDF
                                    </button>
                                    <button onClick={() => downloadReport('incidents', 'excel')} className="flex items-center px-3 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20">
                                        <Download className="h-4 w-4 mr-2" /> Excel
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {incidents.filter((inc: any) => !inc.resolved).map((inc: any) => (
                                    <div key={inc.id} className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md border border-slate-200 dark:border-white/10 border-l-4 border-l-red-500 rounded-r-xl p-4 shadow-lg flex justify-between items-center hover:bg-white/10 transition-colors">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-red-400">Gravedad: {inc.severity === 'HIGH' ? 'Alta' : inc.severity === 'LOW' ? 'Baja' : inc.severity}</h3>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{format(new Date(inc.reportedAt), 'PPP p', { locale: es })}</span>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-slate-900 dark:text-slate-200">{inc.description}</p>
                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                {inc.reportType === 'DESKTOP' ? (
                                                    <span className="text-blue-300 font-bold">🖥️ Ubicación: {inc.location}</span>
                                                ) : (
                                                    <span>Equipo: {inc.laptop?.model} ({inc.laptop?.serialNumber})</span>
                                                )}
                                                {inc.reporter && <span className="ml-4 font-semibold text-slate-600 dark:text-slate-300">Reportado por: {inc.reporter.fullName} ({inc.reporter.matricula})</span>}
                                            </p>
                                        </div>
                                        {/* Actions Column */}
                                        <div className="flex flex-col space-y-2 ml-4">
                                            {inc.laptop && (
                                                <button
                                                    onClick={() => {
                                                        setActiveTab('inventory');
                                                        setTimeout(() => {
                                                            const el = document.getElementById(`laptop-${inc.laptop.id}`);
                                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        }, 100);
                                                    }}
                                                    className="text-xs bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-300 px-3 py-2 rounded flex items-center justify-center border border-slate-200 dark:border-white/10"
                                                >
                                                    <LayoutGrid className="w-3 h-3 mr-1" />
                                                    Ver Equipo
                                                </button>
                                            )}
                                            {inc.evidencePath && (
                                                <button
                                                    onClick={() => setViewingEvidence(`http://localhost:8080${inc.evidencePath}`)}
                                                    className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded flex items-center justify-center border border-blue-500/20"
                                                >
                                                    📷 Ver Foto
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleResolveIncident(inc.id)}
                                                className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded flex items-center justify-center font-bold border border-green-500/20"
                                            >
                                                ✅ Resolver
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {incidents.filter((inc: any) => !inc.resolved).length === 0 && <p className="text-slate-500 dark:text-slate-400">No hay incidentes activos.</p>}
                            </div>
                        </div>
                    )}


                    {activeTab === 'reports' && (
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Generación de Reportes</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Inventory Report Card */}
                                <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-white/10 p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="p-3 rounded-lg bg-blue-500/20 text-blue-300 mr-4 border border-blue-500/30">
                                            <LayoutGrid className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reporte de Inventario</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Listado de equipos y estados</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Filtrar por Estado</label>
                                            <select
                                                id="report-inventory-status"
                                                className="w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="ALL" className="bg-white dark:bg-slate-900">Todo el Inventario</option>
                                                <option value="AVAILABLE" className="bg-white dark:bg-slate-900">Disponibles</option>
                                                <option value="IN_USE" className="bg-white dark:bg-slate-900">En Uso</option>
                                                <option value="EN_REPARACION" className="bg-white dark:bg-slate-900">En Reparación</option>
                                                <option value="MAINTENANCE_REQUIRED" className="bg-white dark:bg-slate-900">Mantenimiento</option>
                                                <option value="INACTIVE" className="bg-white dark:bg-slate-900">Inactivos</option>
                                            </select>
                                        </div>
                                        <div className="flex space-x-3 pt-2">
                                            <button
                                                onClick={() => {
                                                    const status = (document.getElementById('report-inventory-status') as HTMLSelectElement).value;
                                                    handleDownloadReport(`/reports/inventory/pdf?status=${status}`, 'inventory_report.pdf');
                                                }}
                                                className="flex-1 bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
                                            >
                                                PDF
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const status = (document.getElementById('report-inventory-status') as HTMLSelectElement).value;
                                                    handleDownloadReport(`/reports/inventory/excel?status=${status}`, 'inventory_report.xlsx');
                                                }}
                                                className="flex-1 bg-green-500/10 text-green-300 border border-green-500/20 hover:bg-green-500/20 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
                                            >
                                                Excel
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Reservations Report Card */}
                                <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-white/10 p-6 md:col-span-2">
                                    <div className="flex items-center mb-4">
                                        <div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-300 mr-4 border border-indigo-500/30">
                                            <ClipboardCheck className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reporte de Reservas</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Historial de préstamos y reservas</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Estado</label>
                                                <select id="res-status" className="w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                                    <option value="" className="bg-slate-900">Todos</option>
                                                    <option value="ACTIVE" className="bg-slate-900">Activa</option>
                                                    <option value="PENDING" className="bg-slate-900">Pendiente</option>
                                                    <option value="APPROVED" className="bg-slate-900">Aprobada</option>
                                                    <option value="REJECTED" className="bg-slate-900">Rechazada</option>
                                                    <option value="COMPLETED" className="bg-slate-900">Completada</option>
                                                    <option value="CANCELLED" className="bg-slate-900">Cancelada</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Fecha Inicio</label>
                                                <input type="datetime-local" id="res-start" className="w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 [color-scheme:dark]" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Fecha Fin</label>
                                                <input type="datetime-local" id="res-end" className="w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 [color-scheme:dark]" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Usuario (Opcional)</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        list="users-list"
                                                        id="res-user"
                                                        placeholder="Buscar por nombre o matrícula..."
                                                        className="w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                        onChange={(e) => {
                                                            // Clear student ID / professor name if input is cleared
                                                            if (!e.target.value) {
                                                                document.getElementById('res-user-id')?.setAttribute('value', '');
                                                                document.getElementById('res-user-role')?.setAttribute('value', '');
                                                            }
                                                        }}
                                                    />
                                                    <datalist id="users-list">
                                                        {users.map((u: any) => (
                                                            <option key={u.id} value={`${u.fullName} (${u.matricula})`} data-id={u.id} data-role={u.role.name} />
                                                        ))}
                                                    </datalist>
                                                    {/* Hidden inputs to store selected user data */}
                                                    <input type="hidden" id="res-user-id" />
                                                    <input type="hidden" id="res-user-role" />
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-1">Deja vacío para incluir a todos.</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <button
                                                onClick={() => {
                                                    const status = (document.getElementById('res-status') as HTMLSelectElement).value;
                                                    const start = (document.getElementById('res-start') as HTMLInputElement).value;
                                                    const end = (document.getElementById('res-end') as HTMLInputElement).value;
                                                    const userRaw = (document.getElementById('res-user') as HTMLInputElement).value;

                                                    const params = new URLSearchParams();
                                                    if (status) params.append('status', status);
                                                    if (start) params.append('start', start);
                                                    if (end) params.append('end', end);

                                                    // Search text logic
                                                    if (userRaw) {
                                                        const selectedUser = users.find((u: any) => `${u.fullName} (${u.matricula})` === userRaw);

                                                        if (selectedUser) {
                                                            // Logic: If Student role -> studentId; else (Admin/prof) -> professor name
                                                            // We check role safely.
                                                            const roleName = selectedUser.role ? (typeof selectedUser.role === 'string' ? selectedUser.role : selectedUser.role.name) : '';

                                                            if (roleName === 'ROLE_STUDENT' || roleName === 'student') {
                                                                params.append('studentId', selectedUser.id);
                                                            } else {
                                                                params.append('professor', selectedUser.fullName);
                                                            }
                                                        } else {
                                                            // Fallback: simple text search for professor name
                                                            params.append('professor', userRaw);
                                                        }
                                                    }

                                                    handleDownloadReport(`/reports/reservations/pdf?${params.toString()}`, 'reservations_report.pdf');
                                                }}
                                                className="bg-indigo-600 text-slate-900 dark:text-white hover:bg-indigo-500 px-6 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20"
                                            >
                                                <ClipboardCheck className="w-4 h-4 mr-2" />
                                                Generar Reporte PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            {/* Evidence Modal */}
            {viewingEvidence && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]" onClick={() => setViewingEvidence(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
                        <img src={viewingEvidence} alt="Evidencia" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-slate-200 dark:border-white/10" />
                        <button
                            onClick={() => setViewingEvidence(null)}
                            className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white rounded-full transition-colors"
                        >
                            <LogOut className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
                    <div className="relative max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl">
                        <button
                            onClick={() => setShowScanner(false)}
                            className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                            <QrCode className="mr-2 h-6 w-6 text-blue-500" />
                            Escanear Código QR
                        </h3>
                        <div className="rounded-xl overflow-hidden border-2 border-slate-700 aspect-square bg-black relative">
                            <Scanner
                                onScan={(result) => handleScan(result)}
                                onError={(error) => console.log(error)}
                                components={{

                                    torch: false
                                }}
                                styles={{
                                    container: { width: '100%', height: '100%' }
                                }}
                            />
                            {/* Overlay guide */}
                            <div className="absolute inset-0 border-2 border-blue-500/50 m-12 rounded-lg pointer-events-none animate-pulse"></div>
                        </div>
                        <p className="text-center text-slate-500 dark:text-slate-400 mt-4 text-sm">
                            Apunta la cámara al código QR del estudiante.
                        </p>
                    </div>
                </div>
            )}

            {/* Quick Action Modal (Scanned Result) */}
            {scannedReservation && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Acción Rápida</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Reserva #{scannedReservation.id}</p>
                            </div>
                            <button onClick={() => setScannedReservation(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-xl p-4 mb-6 space-y-3 border border-slate-200 dark:border-white/10">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Estudiante:</span>
                                <span className="text-slate-900 dark:text-white font-medium">{scannedReservation.user?.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Equipo:</span>
                                <span className="text-slate-900 dark:text-white font-medium">{scannedReservation.laptop?.model}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Estado:</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${scannedReservation.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                    scannedReservation.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-slate-500/20 text-slate-500 dark:text-slate-400'
                                    }`}>
                                    {scannedReservation.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {scannedReservation.status === 'APPROVED' && (
                                <button
                                    onClick={() => {
                                        // Trigger Handover
                                        if (window.confirm('¿Entregar equipo al estudiante?')) {
                                            api.post(`/reservations/${scannedReservation.id}/handover`)
                                                .then(() => {
                                                    toast.success('Equipo entregado exitosamente');
                                                    setScannedReservation(null);
                                                    fetchData(); // Refresh list
                                                })
                                                .catch(() => toast.error('Error al entregar equipo'));
                                        }
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-500 text-slate-900 dark:text-white py-4 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-green-600/20"
                                >
                                    <ClipboardCheck className="mr-2 h-5 w-5" />
                                    Entregar Equipo
                                </button>
                            )}

                            {scannedReservation.status === 'ACTIVE' && (
                                <button
                                    onClick={() => {
                                        // Trigger Return using existing modal or direct API?
                                        // Integrating with existing "Return Modal" (rating/incidents) is complex here.
                                        // For quick action, let's assume standard return OK.
                                        if (window.confirm('¿Recibir equipo sin novedades?')) {
                                            api.post(`/reservations/${scannedReservation.id}/return`)
                                                .then(() => {
                                                    toast.success('Equipo recibido exitosamente');
                                                    setScannedReservation(null);
                                                    fetchData();
                                                })
                                                .catch(() => toast.error('Error al recibir equipo'));
                                        }
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white py-4 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-blue-600/20"
                                >
                                    <LogOut className="mr-2 h-5 w-5" />
                                    Recibir Equipo
                                </button>
                            )}

                            {/* Fallback for other statuses */}
                            {(scannedReservation.status !== 'APPROVED' && scannedReservation.status !== 'ACTIVE') && (
                                <div className="text-center p-4 bg-yellow-500/10 text-yellow-200 rounded-xl border border-yellow-500/20">
                                    Esta reserva no requiere acciones de entrega/recepción en este momento.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
