import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Search, RotateCw, AlertOctagon, Info, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SystemLog {
    id: number;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    category: string;
    message: string;
    username: string;
}

const LogsTable: React.FC = () => {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/logs');
            setLogs(response.data);
            setFilteredLogs(response.data);
        } catch (error) {
            console.error("Error fetching logs", error);
            toast.error("No se pudieron cargar los logs del sistema");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = logs.filter(log =>
            log.message.toLowerCase().includes(lowerTerm) ||
            log.username.toLowerCase().includes(lowerTerm) ||
            log.category.toLowerCase().includes(lowerTerm)
        );
        setFilteredLogs(filtered);
    }, [searchTerm, logs]);

    const getLevelBadge = (level: string) => {
        switch (level) {
            case 'INFO':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><Info size={12} className="mr-1" /> INFO</span>;
            case 'WARN':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><AlertTriangle size={12} className="mr-1" /> WARN</span>;
            case 'ERROR':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertOctagon size={12} className="mr-1" /> ERROR</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{level}</span>;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Bitácora del Sistema
                </h3>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar logs..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Recargar"
                    >
                        <RotateCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensaje</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getLevelBadge(log.level)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                                        {log.category}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {log.username}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 break-words max-w-md">
                                        {log.message}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-gray-50 bg-opacity-50">
                                    <Info className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                    <p>No se encontraron registros</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LogsTable;
