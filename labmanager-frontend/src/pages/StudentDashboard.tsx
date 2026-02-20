import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Search, LogOut, AlertTriangle, History, Star, X, Calendar, Menu } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { QRCodeCanvas } from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast, ToastContainer } from 'react-toastify';



const StudentDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [selectedSoftware, setSelectedSoftware] = useState<string[]>([]);
    const [date, setDate] = useState<Date>(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('11:00');
    const [subject, setSubject] = useState('');
    const [professor, setProfessor] = useState('');
    const [availableLaptops, setAvailableLaptops] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedLaptop, setSelectedLaptop] = useState<any>(null);
    const [blockedDates, setBlockedDates] = useState<string[]>([]); // Array of 'YYYY-MM-DD' strings

    // Rating State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingReservation, setRatingReservation] = useState<any>(null);
    const [ratingStars, setRatingStars] = useState(5);
    const [ratingFeedback, setRatingFeedback] = useState('');

    // My Reservations State
    const [myReservations, setMyReservations] = useState<any[]>([]);

    // Incident Reporting
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [selectedReservationForIncident, setSelectedReservationForIncident] = useState<any>(null);
    const { register: registerIncident, handleSubmit: handleSubmitIncident, reset: resetIncident } = useForm();

    // QR Code State


    // Mobile Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');

    const fetchMyReservations = () => {
        api.get('/reservations/my')
            .then(res => setMyReservations(res.data))
            .catch(() => toast.error('Failed to load history'));
    };

    const fetchBlockedDates = () => {
        api.get('/admin/blocked-dates')
            .then(res => {
                setBlockedDates(res.data.map((bd: any) => bd.date));
            })
            .catch(() => console.error('Error fetching blocked dates'));
    };

    useEffect(() => {
        fetchBlockedDates();
        if (activeTab === 'history') {
            fetchMyReservations();
        }
    }, [activeTab]);

    const handleSearch = async () => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // 1. Check Weekend
        const day = date.getDay();
        if (day === 0 || day === 6) {
            toast.warning('Reservas disponibles solo de Lunes a Viernes.');
            return;
        }

        // 2. Check Blocked Dates
        if (blockedDates.includes(dateStr)) {
            toast.error('La fecha seleccionada es un día inhábil.');
            return;
        }

        // 3. Check Time (7 AM - 9 PM)
        const [startH] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);

        if (startH < 7 || endH > 21 || (endH === 21 && endM > 0)) {
            toast.warning('Horario permitido: 7:00 AM - 9:00 PM');
            return;
        }

        try {
            const start = new Date(date);
            const [sh, sm] = startTime.split(':');
            start.setHours(parseInt(sh), parseInt(sm));

            const end = new Date(date);
            const [eh, em] = endTime.split(':');
            end.setHours(parseInt(eh), parseInt(em));

            const res = await api.get('/laptops/search', {
                params: {
                    software: selectedSoftware.length > 0 ? selectedSoftware.join(',') : 'Any',
                    start: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
                    end: format(end, "yyyy-MM-dd'T'HH:mm:ss")
                }
            });
            setAvailableLaptops(res.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error searching laptops');
        }
    };

    const handleReserve = async () => {
        if (!subject || !professor) {
            toast.error('Please fill in Subject and Professor');
            return;
        }
        try {
            const start = new Date(date);
            const [sh, sm] = startTime.split(':');
            start.setHours(parseInt(sh), parseInt(sm));

            const end = new Date(date);
            const [eh, em] = endTime.split(':');
            end.setHours(parseInt(eh), parseInt(em));

            await api.post('/reservations', {
                laptopId: selectedLaptop.id,
                start: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
                end: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
                subject,
                professor
            });

            toast.success('¡Reserva solicitada! Pendiente de aprobación.');
            setShowModal(false);
            setSubject('');
            setProfessor('');
            setActiveTab('history');
        } catch (error) {
            toast.error('Error al crear la reserva');
        }
    };

    const onReportIncident = async (data: any) => {
        try {
            const formData = new FormData();
            formData.append('description', data.description);
            formData.append('severity', data.severity);
            formData.append('laptopId', selectedReservationForIncident.laptop.id);
            formData.append('reportType', 'LAPTOP');

            if (data.image && data.image[0]) {
                formData.append('image', data.image[0]);
            }

            await api.post('/incidents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Incidente reportado.');
            setShowIncidentModal(false);
            resetIncident();
        } catch (e) {
            toast.error('Error al reportar incidente');
        }
    };



    const handleOpenRating = (res: any) => {
        setRatingReservation(res);
        setRatingStars(5);
        setRatingFeedback('');
        setShowRatingModal(true);
    };

    const addToCalendar = (reservation: any) => {
        const startTime = new Date(reservation.startTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const endTime = new Date(reservation.endTime).toISOString().replace(/-|:|\.\d\d\d/g, "");

        const summary = `Préstamo LabManager: ${reservation.laptop.model}`;
        const description = `Recordatorio para devolver el equipo: ${reservation.laptop.model} (Serie: ${reservation.laptop.serialNumber})`;
        const location = 'Universidad';

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LabManager//Reservation//ES
BEGIN:VEVENT
UID:${reservation.id}@labmanager.com
DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, "")}
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `reserva-${reservation.id}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    const handleSubmitRating = async () => {
        if (!ratingReservation) return;
        try {
            await api.post(`/reservations/${ratingReservation.id}/feedback`, {
                rating: ratingStars,
                feedback: ratingFeedback
            });
            toast.success('¡Gracias por tu calificación!');
            setShowRatingModal(false);
            fetchMyReservations();
        } catch (e) {
            toast.error('Error al enviar calificación');
        }
    };

    return (
        <div className="min-h-screen">
            <ToastContainer theme="dark" />
            {/* Navbar with User Info */}
            <nav className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-xl border-b border-slate-200 dark:border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-white/10 mr-2"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">Student<span className="text-blue-500">Portal</span></span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <span className="text-sm text-slate-500 dark:text-slate-600 dark:text-slate-300 hidden sm:inline">Bienvenido, <span className="font-semibold text-slate-800 dark:text-slate-900 dark:text-white">{user?.fullName}</span></span>
                            <button onClick={logout} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-red-400 transition-colors border border-transparent hover:border-white/5">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {user?.isSanctioned && (
                <div className="bg-red-500/10 border-b border-red-500/20 text-red-200 px-4 py-3 backdrop-blur-md relative z-10">
                    <div className="max-w-7xl mx-auto flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 mr-3 text-red-500" />
                        <span className="font-medium text-sm">ATENCIÓN: Tu cuenta tiene una sanción activa. No puedes realizar nuevas reservas.</span>
                    </div>
                </div>
            )}

            <div className="flex h-[calc(100vh-64px)]">
                {/* Sidebar */}
                <aside className="w-64 bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-xl border-r border-slate-200 dark:border-white/10 hidden lg:block">
                    <div className="p-4 space-y-2">
                        <button onClick={() => setActiveTab('search')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'search'
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white border border-transparent'
                            }`}>
                            <Search className="h-5 w-5 mr-3" /> Buscar Equipo
                        </button>
                        <button onClick={() => setActiveTab('history')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'history'
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white border border-transparent'
                            }`}>
                            <History className="h-5 w-5 mr-3" /> Mi Historial
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
                    <div className="p-4 space-y-2 h-full overflow-y-auto">
                        <button onClick={() => { setActiveTab('search'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'search'
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white border border-transparent'
                            }`}>
                            <Search className="h-5 w-5 mr-3" /> Buscar Equipo
                        </button>
                        <button onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'history'
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white border border-transparent'
                            }`}>
                            <History className="h-5 w-5 mr-3" /> Mi Historial
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'search' ? (
                        <div className="max-w-7xl mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Search Filters */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-6 sticky top-8">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                            <Search className="w-5 h-5 mr-2 text-blue-400" />
                                            Filtros de Búsqueda
                                        </h2>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Software Requerido</label>
                                                <div className="space-y-2 bg-slate-900/50 p-3 rounded-xl border border-white/5 h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                                                    {['Android Studio', 'Visual Studio Code', 'Docker Desktop', 'Python', 'Node.js', 'Xcode', 'IntelliJ IDEA', 'PostgreSQL', 'Unity Hub'].map((sw) => (
                                                        <label key={sw} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-lg transition-colors group">
                                                            <div className="relative flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedSoftware.includes(sw)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedSoftware([...selectedSoftware, sw]);
                                                                        } else {
                                                                            setSelectedSoftware(selectedSoftware.filter(s => s !== sw));
                                                                        }
                                                                    }}
                                                                    className="peer h-4 w-4 rounded border-slate-500 bg-slate-800 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                                                                />
                                                            </div>
                                                            <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:text-white transition-colors">{sw}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Fecha</label>
                                                <input
                                                    type="date"
                                                    value={format(date, 'yyyy-MM-dd')}
                                                    // min={format(new Date(), 'yyyy-MM-dd')} // Optional: Prevent past dates
                                                    onChange={(e) => {
                                                        const d = new Date(e.target.value + 'T00:00:00'); // Valid Date Fix
                                                        setDate(d);
                                                    }}
                                                    className="w-full rounded-xl bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 [color-scheme:dark]"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Horario: Lunes a Viernes, 7 AM - 9 PM</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Inicio</label>
                                                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-xl bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 [color-scheme:dark]" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Fin</label>
                                                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full rounded-xl bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 [color-scheme:dark]" />
                                                </div>
                                            </div>
                                            <button onClick={handleSearch} className="w-full text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                                                Buscar Equipos
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Results Grid */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex justify-between items-center bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md px-6 py-4 rounded-xl border border-slate-200 dark:border-white/10">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Resultados Disponibles</h2>
                                        <span className="px-3 py-1 bg-white/10 rounded-lg text-sm font-mono text-slate-600 dark:text-slate-300">{availableLaptops.length} equipos</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {availableLaptops.map((laptop) => (
                                            <div key={laptop.id} className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-xl p-5 border border-slate-200 dark:border-white/10 shadow-lg hover:bg-white/10 transition-all group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors">{laptop.model}</h3>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{laptop.serialNumber}</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] font-bold uppercase tracking-wider rounded-lg">Disponible</span>
                                                </div>
                                                <div className="mb-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {laptop.installedSoftware?.map((s: any) => (
                                                            <span key={s.id} className="text-[10px] bg-blue-500/10 text-blue-200 border border-blue-500/20 px-2 py-0.5 rounded-md">
                                                                {s.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                {user?.isSanctioned ? (
                                                    <button disabled className="w-full py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg cursor-not-allowed font-medium text-sm flex justify-center items-center">
                                                        <span className="mr-2">🚫</span> Cuenta Sancionada
                                                    </button>
                                                ) : (
                                                    <button onClick={() => { setSelectedLaptop(laptop); setShowModal(true); }} className="w-full py-2 bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:bg-blue-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:border-blue-500/50 rounded-lg transition-all font-medium text-sm">
                                                        Reservar
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Historial de Reservas</h2>
                            <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Detalles</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Fechas</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Estado</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {myReservations.map((res: any) => (
                                            <tr key={res.id} className="hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{res.laptop.model}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{res.laptop.serialNumber}</div>
                                                    <div className="text-xs text-blue-300 mt-1">{res.subject} <span className="text-slate-500">({res.professor})</span></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-900 dark:text-slate-200 capitalize">{format(new Date(res.startTime), 'MMM dd, yyyy', { locale: es })}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(res.startTime), 'HH:mm')} - {format(new Date(res.endTime), 'HH:mm')}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-lg
                                                        ${res.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                                            res.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                                                res.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                                                    res.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border border-slate-500/30'}`}>
                                                        {(() => {
                                                            if (res.status === 'ACTIVE') return 'Activa';
                                                            if (res.status === 'PENDING') return 'Pendiente';
                                                            if (res.status === 'APPROVED') return 'Aprobada';
                                                            if (res.status === 'REJECTED') return 'Rechazada';
                                                            if (res.status === 'COMPLETED') return 'Completada';
                                                            if (res.status === 'CANCELLED') return 'Cancelada';
                                                            return res.status;
                                                        })()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {res.status === 'APPROVED' && (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex flex-col items-center group relative p-2 bg-white rounded-lg shadow-inner w-fit">
                                                                <QRCodeCanvas value={`RES-${res.id}`} size={64} />
                                                                <span className="text-[10px] text-slate-900 font-mono mt-1 font-bold">Reserva confirmada</span>
                                                            </div>
                                                            <button
                                                                onClick={() => addToCalendar(res)}
                                                                className="text-xs flex items-center justify-center text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 py-1.5 px-2 rounded-lg transition-colors border border-blue-500/20"
                                                            >
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                Agregar a Calendario
                                                            </button>
                                                        </div>
                                                    )}
                                                    {res.status === 'ACTIVE' && (
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                onClick={() => { setSelectedReservationForIncident(res); setShowIncidentModal(true); }}
                                                                className="text-amber-400 hover:text-amber-300 flex items-center bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors border border-amber-500/20"
                                                            >
                                                                <AlertTriangle className="h-4 w-4 mr-1.5" /> Reportar Incidente
                                                            </button>
                                                            <button
                                                                onClick={() => addToCalendar(res)}
                                                                className="text-xs flex items-center justify-center text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 py-1.5 px-2 rounded-lg transition-colors border border-blue-500/20"
                                                            >
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                Agregar a Calendario
                                                            </button>
                                                        </div>
                                                    )}
                                                    {res.status === 'COMPLETED' && !res.rating && (
                                                        <button
                                                            onClick={() => handleOpenRating(res)}
                                                            className="text-yellow-400 hover:text-yellow-300 flex items-center bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1.5 rounded-lg transition-colors border border-yellow-500/20"
                                                        >
                                                            <Star className="h-4 w-4 mr-1.5" /> Calificar
                                                        </button>
                                                    )}
                                                    {res.status === 'COMPLETED' && res.rating && (
                                                        <div className="flex text-yellow-500">
                                                            {[...Array(res.rating)].map((_, i) => (
                                                                <Star key={i} className="h-4 w-4 fill-current" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {myReservations.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                    No tienes reservas en tu historial.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>


                {/* Reservation Modal */}
                {
                    showModal && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Confirmar Reserva</h3>

                                <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-xl p-4 mb-6 border border-slate-200 dark:border-white/10">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Equipo Seleccionado</p>
                                    <p className="font-bold text-slate-900 dark:text-white text-lg">{selectedLaptop?.model}</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedLaptop?.serialNumber}</p>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Materia / Clase (*)</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-slate-600"
                                            placeholder="Ej. Programación Orientada a Objetos"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Profesor (*)</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-slate-600"
                                            placeholder="Nombre del Docente"
                                            value={professor}
                                            onChange={(e) => setProfessor(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <button onClick={() => setShowModal(false)} className="flex-1 bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:bg-white/10 text-slate-600 dark:text-slate-300 py-3 rounded-xl transition-colors border border-slate-200 dark:border-white/10">
                                        Cancelar
                                    </button>
                                    <button onClick={handleReserve} className="flex-1 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all">
                                        Confirmar Reserva
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Incident Modal */}
                {
                    showIncidentModal && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reportar Incidente</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Describe el problema con el equipo.</p>

                                <form onSubmit={handleSubmitIncident(onReportIncident)}>
                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Descripción</label>
                                            <textarea
                                                {...registerIncident('description')}
                                                required
                                                className="w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 h-24"
                                                placeholder="Detalla qué está fallando..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Evidencia (Opcional)</label>
                                            <input
                                                type="file"
                                                {...registerIncident('image')}
                                                accept="image/*"
                                                className="w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none file:text-slate-900 dark:text-white hover:file:bg-white/10 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Gravedad</label>
                                            <select
                                                {...registerIncident('severity')}
                                                className="w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500"
                                            >
                                                <option value="LOW" className="bg-white dark:bg-slate-900">Baja (Rasguños, Software)</option>
                                                <option value="MEDIUM" className="bg-white dark:bg-slate-900">Media (Teclado/Mouse fallanda)</option>
                                                <option value="HIGH" className="bg-white dark:bg-slate-900">Alta (No enciende, Pantalla rota)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowIncidentModal(false)}
                                            className="flex-1 bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:bg-white/10 text-slate-600 dark:text-slate-300 py-3 rounded-xl transition-colors border border-slate-200 dark:border-white/10"
                                        >
                                            Cancelar
                                        </button>
                                        <button type="submit" className="flex-1 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all">
                                            Enviar Reporte
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Rating Modal */}
                {
                    showRatingModal && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl max-w-sm w-full p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Calificar Equipo</h3>
                                    <button onClick={() => setShowRatingModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="text-center mb-6">
                                    <p className="text-slate-600 dark:text-slate-300 mb-2">¿Qué tal funcionó el equipo?</p>
                                    <div className="flex justify-center space-x-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setRatingStars(star)}
                                                className={`transition-all ${ratingStars >= star ? 'text-yellow-400 scale-110' : 'text-slate-600 hover:text-yellow-400'}`}
                                            >
                                                <Star className={`h-8 w-8 ${ratingStars >= star ? 'fill-current' : ''}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Comentarios (Opcional)</label>
                                    <textarea
                                        value={ratingFeedback}
                                        onChange={(e) => setRatingFeedback(e.target.value)}
                                        placeholder="Ej: El trackpad fallaba un poco..."
                                        className="block w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmitRating}
                                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-slate-900 dark:text-white font-bold rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-all active:scale-[0.98]"
                                >
                                    Enviar Calificación
                                </button>
                            </div>
                        </div>
                    )
                }


            </div>
        </div>
    );
};

export default StudentDashboard;
