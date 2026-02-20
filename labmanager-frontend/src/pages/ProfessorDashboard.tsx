import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, Layers, Clock, CheckCircle, Star, X, Calendar, Menu } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast, ToastContainer } from 'react-toastify';

const ProfessorDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'class' | 'history' | 'report'>('class');

    // Report State
    const [reportType, setReportType] = useState('DESKTOP');
    const [reportLocation, setReportLocation] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [incidentTime, setIncidentTime] = useState('');
    const [evidence, setEvidence] = useState<File | null>(null);
    const [blockedDates, setBlockedDates] = useState<string[]>([]);

    // Bulk Reservation State
    const [quantity, setQuantity] = useState(20);
    const [software, setSoftware] = useState('Any');
    const [date, setDate] = useState<Date>(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('11:00');
    const [subject, setSubject] = useState('');

    // History State
    const [myReservations, setMyReservations] = useState<any[]>([]);
    const [selectedLaptopId, setSelectedLaptopId] = useState<number | null>(null);

    // Rating State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingReservation, setRatingReservation] = useState<any>(null);
    const [ratingStars, setRatingStars] = useState(5);
    const [ratingFeedback, setRatingFeedback] = useState('');

    // Mobile Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        // Fetch blocked dates
        api.get('/admin/blocked-dates')
            .then(res => setBlockedDates(res.data.map((bd: any) => bd.date)))
            .catch(console.error);

        if (activeTab === 'history' || activeTab === 'report') {
            api.get('/reservations/my')
                .then(res => setMyReservations(res.data))
                .catch(() => toast.error('Failed to load history'));
        }
    }, [activeTab]);

    const handleBulkReserve = async () => {
        if (!subject) return toast.error('La materia es obligatoria');

        const dateStr = format(date, 'yyyy-MM-dd');

        // 1. Check Weekend
        const day = date.getDay();
        if (day === 0 || day === 6) {
            return toast.warning('Reservas disponibles solo de Lunes a Viernes.');
        }

        // 2. Check Blocked Dates
        if (blockedDates.includes(dateStr)) {
            return toast.error('La fecha seleccionada es un día inhábil.');
        }

        // 3. Check Time (7 AM - 9 PM)
        const [startH] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);

        if (startH < 7 || endH > 21 || (endH === 21 && endM > 0)) {
            return toast.warning('Horario permitido: 7:00 AM - 9:00 PM');
        }

        try {
            const start = new Date(date);
            const [sh, sm] = startTime.split(':');
            start.setHours(parseInt(sh), parseInt(sm));

            const end = new Date(date);
            const [eh, em] = endTime.split(':');
            end.setHours(parseInt(eh), parseInt(em));

            await api.post('/reservations', {
                quantity,
                start: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
                end: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
                subject,
                professor: user?.fullName // Should be auto-handled by backend too
            });

            toast.success(`¡Solicitud de ${quantity} equipos enviada!`);
            setActiveTab('history');

        } catch (e: any) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Error al solicitar equipos');
        }
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('reportType', reportType);

            let finalDescription = reportDescription;
            if (incidentTime) {
                const formattedTime = new Date(incidentTime).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
                finalDescription = `[Ocurrido: ${formattedTime}] ${reportDescription}`;
            }
            formData.append('description', finalDescription);

            formData.append('severity', 'MEDIUM');
            formData.append('location', reportLocation || '');
            if (reportType === 'LAPTOP' && selectedLaptopId) {
                formData.append('laptopId', selectedLaptopId.toString());
            }

            if (evidence) {
                formData.append('image', evidence);
            }

            await api.post('/incidents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Reporte enviado correctamente');
            setReportDescription('');
            setReportLocation('');
            setEvidence(null);
            setSelectedLaptopId(null);
            setActiveTab('history');
        } catch (error) {
            toast.error('Error al enviar el reporte');
        }
    };

    const handleOpenRating = (res: any) => {
        setRatingReservation(res);
        setRatingStars(5);
        setRatingFeedback('');
        setShowRatingModal(true);
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
            // Refresh history
            api.get('/reservations/my')
                .then(res => setMyReservations(res.data));
        } catch (e) {
            toast.error('Error al enviar calificación');
        }
    };

    const addToCalendar = (reservation: any) => {
        const startTime = new Date(reservation.startTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const endTime = new Date(reservation.endTime).toISOString().replace(/-|:|\.\d\d\d/g, "");

        const summary = `Préstamo Docente LabManager: ${reservation.quantity} equipos - ${reservation.subject}`;
        const description = `Recordatorio para devolver los equipos de la materia ${reservation.subject}.`;
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
        link.setAttribute('download', `reserva-clase-${reservation.id}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen">
            <ToastContainer theme="dark" />
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
                            <span className="text-xl font-bold text-slate-900 dark:text-white">Professor<span className="text-indigo-500">Portal</span></span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <span className="text-sm text-slate-500 dark:text-slate-600 dark:text-slate-300">Bienvenido, Dr. <span className="font-semibold text-slate-800 dark:text-slate-900 dark:text-white">{user?.fullName}</span></span>
                            <button onClick={logout} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-red-400 transition-colors border border-transparent hover:border-white/5">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex h-[calc(100vh-64px)]">
                <aside className="w-64 bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-xl border-r border-slate-200 dark:border-white/10 hidden lg:block">
                    <div className="p-4 space-y-2">
                        <button onClick={() => setActiveTab('class')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'class'
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white border border-transparent'
                            }`}>
                            <Layers className="h-5 w-5 mr-3" /> Reserva de Clase
                        </button>
                        <button onClick={() => setActiveTab('history')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'history'
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white border border-transparent'
                            }`}>
                            <Clock className="h-5 w-5 mr-3" /> Historial de Solicitudes
                        </button>
                        <button onClick={() => setActiveTab('report')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'report'
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white border border-transparent'
                            }`}>
                            <div className="flex items-center"><span className="h-5 w-5 mr-3">⚠️</span> Reportar Falla</div>
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
                        <button onClick={() => { setActiveTab('class'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'class'
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white border border-transparent'
                            }`}>
                            <Layers className="h-5 w-5 mr-3" /> Reserva de Clase
                        </button>
                        <button onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'history'
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white border border-transparent'
                            }`}>
                            <Clock className="h-5 w-5 mr-3" /> Historial de Solicitudes
                        </button>
                        <button onClick={() => { setActiveTab('report'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'report'
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:text-slate-900 dark:text-white border border-transparent'
                            }`}>
                            <div className="flex items-center"><span className="h-5 w-5 mr-3">⚠️</span> Reportar Falla</div>
                        </button>
                    </div>
                </aside>

                <main className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'class' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-8 animate-fadeIn">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Solicitar Equipos para Clase</h1>
                                <p className="text-slate-500 dark:text-slate-400 mb-8">Solicite múltiples equipos para sus alumnos. Requiere aprobación del Administrador.</p>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Cantidad Necesaria</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="50"
                                                value={quantity}
                                                onChange={e => setQuantity(parseInt(e.target.value))}
                                                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Software Principal</label>
                                            <select
                                                value={software}
                                                onChange={e => setSoftware(e.target.value)}
                                                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="Any" className="bg-slate-900">Cualquiera</option>
                                                <option value="Android Studio" className="bg-slate-900">Android Studio</option>
                                                <option value="Visual Studio Code" className="bg-slate-900">Visual Studio Code</option>
                                                <option value="Docker Desktop" className="bg-slate-900">Docker Desktop</option>
                                                <option value="Python" className="bg-slate-900">Python</option>
                                                <option value="Node.js" className="bg-slate-900">Node.js</option>
                                                <option value="Xcode" className="bg-slate-900">Xcode</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Clase / Materia</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Intro to Computer Science"
                                            value={subject}
                                            onChange={e => setSubject(e.target.value)}
                                            className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 placeholder-slate-600"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Fecha</label>
                                            <input
                                                type="date"
                                                value={format(date, 'yyyy-MM-dd')}
                                                onChange={e => setDate(new Date(e.target.value + 'T00:00:00'))}
                                                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 [color-scheme:dark]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Hora Inicio</label>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={e => setStartTime(e.target.value)}
                                                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 [color-scheme:dark]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Hora Fin</label>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>

                                    <button onClick={handleBulkReserve} className="w-full flex items-center justify-center py-4 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white rounded-xl transition-all font-bold shadow-lg shadow-indigo-600/20 active:scale-95 text-lg">
                                        <CheckCircle className="h-6 w-6 mr-2" /> Enviar Solicitud de Grupo
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Historial de Solicitudes</h2>
                            <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Clase</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Equipos</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Fecha</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Estado</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {myReservations.map((res: any) => (
                                            <tr key={res.id} className="hover:bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{res.subject || 'Sin Materia'}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">ID: {res.reservationCode}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-200 font-mono">{res.laptop.model}</div>
                                                    <div className="text-xs text-slate-500">{res.laptop.serialNumber}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-900 dark:text-white capitalize">{format(new Date(res.startTime), 'MMM dd', { locale: es })}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(res.startTime), 'HH:mm')}-{format(new Date(res.endTime), 'HH:mm')}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {(() => {
                                                        const statusConfig: any = {
                                                            'PENDING': { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
                                                            'APPROVED': { label: 'Aprobada', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                                                            'ACTIVE': { label: 'En Uso', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                                                            'COMPLETED': { label: 'Finalizada', color: 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30' },
                                                            'CANCELLED': { label: 'Cancelada', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
                                                            'REJECTED': { label: 'Rechazada', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
                                                            'OVERDUE': { label: 'Vencida', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' }
                                                        };
                                                        const config = statusConfig[res.status] || statusConfig['REJECTED'];
                                                        return (
                                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-lg border ${config.color}`}>
                                                                {config.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {(res.status === 'APPROVED' || res.status === 'ACTIVE') && (
                                                        <button
                                                            onClick={() => addToCalendar(res)}
                                                            className="mb-2 w-full text-xs flex items-center justify-center text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 py-1.5 px-2 rounded-lg transition-colors border border-blue-500/20"
                                                        >
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            Agregar a Calendario
                                                        </button>
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
                                                    No hay solicitudes históricas.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {activeTab === 'report' && (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-8 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                    <span className="mr-2">⚠️</span> Reportar Falla de Equipo
                                </h2>

                                <form onSubmit={handleReportSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Tipo de Reporte</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setReportType('DESKTOP')}
                                                className={`p-4 rounded-xl border transition-all ${reportType === 'DESKTOP'
                                                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-lg shadow-blue-500/10'
                                                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="font-bold text-lg mb-1">🖥️ PC Escritorio</div>
                                                <div className="text-xs opacity-70">Equipo fijo</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setReportType('LAPTOP')}
                                                className={`p-4 rounded-xl border transition-all ${reportType === 'LAPTOP'
                                                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-lg shadow-blue-500/10'
                                                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="font-bold text-lg mb-1">💻 Laptop</div>
                                                <div className="text-xs opacity-70">Prestada</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setReportType('ROOM')}
                                                className={`p-4 rounded-xl border transition-all col-span-2 ${reportType === 'ROOM'
                                                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-lg shadow-blue-500/10'
                                                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="font-bold text-lg mb-1">🧹 Limpieza / Salón</div>
                                                <div className="text-xs opacity-70">Reportar salón sucio</div>
                                            </button>
                                        </div>
                                    </div>

                                    {['DESKTOP', 'ROOM'].includes(reportType) && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                                                    {reportType === 'ROOM' ? 'Salón / Aula' : 'Ubicación y Equipo'}
                                                </label>
                                                <input
                                                    required={['DESKTOP', 'ROOM'].includes(reportType)}
                                                    type="text"
                                                    value={reportLocation}
                                                    onChange={(e) => setReportLocation(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-slate-500"
                                                    placeholder={reportType === 'ROOM' ? "Ej. A-204" : "Ej. Laboratorio 4, Máquina 12"}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {reportType === 'LAPTOP' && (
                                        <>
                                            <div className="space-y-4 animate-fadeIn">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Seleccionar Equipo</label>
                                                    {myReservations.filter((r: any) => ['APPROVED', 'PENDING', 'ACTIVE'].includes(r.status)).length > 0 ? (
                                                        <select
                                                            required={reportType === 'LAPTOP'}
                                                            value={selectedLaptopId || ''}
                                                            onChange={(e) => setSelectedLaptopId(Number(e.target.value))}
                                                            className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                        >
                                                            <option value="">-- Seleccionar Laptop --</option>
                                                            {myReservations.filter((r: any) => ['APPROVED', 'PENDING', 'ACTIVE'].includes(r.status)).map((res: any) => (
                                                                <option key={res.id} value={res.laptop.id}>
                                                                    {res.laptop.model} - {res.laptop.serialNumber} (Reservado: {format(new Date(res.startTime), 'MMM dd HH:mm', { locale: es })})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div className="p-4 bg-yellow-500/10 text-yellow-200 rounded-xl border border-yellow-500/20 text-sm">
                                                            ⚠️ No tienes equipos asignados actualmente para reportar.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </ >
                                    )}

                                    {reportType === 'ROOM' && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Hora de Entrada / Hallazgo</label>
                                                <input
                                                    type="datetime-local"
                                                    value={incidentTime}
                                                    onChange={(e) => setIncidentTime(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Evidencia (Foto)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setEvidence(e.target.files?.[0] || null)}
                                            className="w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 cursor-pointer"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Descripción de la Falla</label>
                                        <textarea
                                            required
                                            value={reportDescription}
                                            onChange={(e) => setReportDescription(e.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-slate-500"
                                            placeholder="Describe el problema (ej. Pantalla azul, No enciende, Teclado falla...)"
                                        />
                                    </div>




                                    <button
                                        type="submit"
                                        className="w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-900 dark:text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg shadow-red-500/30 transition-all active:scale-95"
                                    >
                                        Enviar Reporte de Falla
                                    </button>
                                </form>
                            </div >
                        </div >
                    )
                    }
                </main >
            </div >

            {/* Rating Modal */}
            {
                showRatingModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl max-w-sm w-full p-6">
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
                                    placeholder="Ej: La laptop se sentía lenta..."
                                    className="block w-full rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500 min-h-[80px]"
                                />
                            </div>

                            <button
                                onClick={handleSubmitRating}
                                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-slate-900 dark:text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-[0.98]"
                            >
                                Enviar Calificación
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProfessorDashboard;
