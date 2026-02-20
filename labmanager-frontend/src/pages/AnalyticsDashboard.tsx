import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Server } from 'lucide-react';
import api from '../services/api';



const AnalyticsDashboard: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/analytics/dashboard');
                setData(res.data);
            } catch (error) {
                console.error("Error fetching analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-8 text-center">Cargando inteligencia de negocios...</div>;
    if (!data) return <div className="p-8 text-center">No hay datos disponibles.</div>;

    // Transform Data for Charts
    const dailyData = Object.keys(data.reservationsByDay).map(date => ({
        date,
        count: data.reservationsByDay[date]
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const activeIncidentData = data.activeIncidentsBySeverity ? Object.keys(data.activeIncidentsBySeverity).map(severity => ({
        name: severity,
        value: data.activeIncidentsBySeverity[severity]
    })) : [];

    const resolvedIncidentData = data.resolvedIncidentsBySeverity ? Object.keys(data.resolvedIncidentsBySeverity).map(severity => ({
        name: severity,
        value: data.resolvedIncidentsBySeverity[severity]
    })) : [];

    const softwareData = Object.keys(data.popularSoftware).map(name => ({
        name,
        count: data.popularSoftware[name]
    })).sort((a, b) => b.count - a.count);

    return (
        <div className="space-y-6 animate-fade-in pl-2">
            <h1 className="text-2xl font-bold text-white mb-6">Tablero de Inteligencia de Negocios (BI)</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Reservas Totales</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.totalReservations}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                            <Activity className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Tasa de Uso</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.utilizationRate.toFixed(1)}%</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                            <Server className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Incidentes Activos</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.activeIncidents}</h3>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-red-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Incidentes Históricos</p>
                            <h3 className="text-3xl font-bold text-slate-700 mt-2">{data.historicalIncidents}</h3>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
                            <Activity className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Software Top 1</p>
                            <h3 className="text-xl font-bold text-slate-900 mt-2 truncate">
                                {softwareData.length > 0 ? softwareData[0].name : 'N/A'}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Reservations Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Actividad Semanal</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short' })} />
                                <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: '#F1F5F9' }}
                                />
                                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Incidents by Type Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Incidentes por Tipo de Equipo</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.incidentsByType ? Object.keys(data.incidentsByType).map(key => ({ name: key, value: data.incidentsByType[key] })) : []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.incidentsByType && Object.keys(data.incidentsByType).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry === 'DESKTOP' ? '#8884d8' : '#82ca9d'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center mt-4 space-x-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-[#82ca9d] mr-2"></div>
                            <span className="text-sm text-slate-600">Laptops</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-[#8884d8] mr-2"></div>
                            <span className="text-sm text-slate-600">Escritorio</span>
                        </div>
                    </div>
                </div>

                {/* Popular Software Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Software Más Utilizado</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={softwareData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" stroke="#64748B" fontSize={12} allowDecimals={false} />
                                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: '#F1F5F9' }}
                                />
                                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Incidents Pie Charts (Side by Side) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Active Incidents */}
                        <div className="w-full md:w-1/2">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Incidentes Activos (Pendientes)</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={activeIncidentData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {activeIncidentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.name === 'CRITICAL' ? '#EF4444' : entry.name === 'HIGH' ? '#F97316' : '#EAB308'} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-sm text-slate-500">Requieren atención inmediata</p>
                            </div>
                        </div>

                        {/* Resolved Incidents */}
                        <div className="w-full md:w-1/2 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Histórico (Resueltos)</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={resolvedIncidentData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {resolvedIncidentData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill="#10B981" opacity={0.6 + (index * 0.1)} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-sm text-slate-500">Total acumulado de fallas atendidas</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
