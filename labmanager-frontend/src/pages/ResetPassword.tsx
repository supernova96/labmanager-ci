import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Lock, ArrowLeft } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ResetPassword: React.FC = () => {
    const { register, handleSubmit } = useForm();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const token = searchParams.get('token');

    const onSubmit = async (data: any) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                token: token,
                newPassword: data.newPassword
            });
            toast.success('¡Contraseña actualizada!');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al restablecer contraseña. El token puede haber expirado.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Token Inválido</h1>
                    <p>No se encontró un token de recuperación.</p>
                    <Link to="/login" className="text-blue-400 mt-4 block hover:underline">Ir al Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <ToastContainer position="top-center" />
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Nueva Contraseña</h1>
                    <p className="text-gray-300">Ingresa tu nueva contraseña a continuación.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                        <input
                            {...register('newPassword')}
                            type="password"
                            placeholder="Nueva Contraseña"
                            className="w-full bg-gray-700/50 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none placeholder-gray-400"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                        <input
                            {...register('confirmPassword')}
                            type="password"
                            placeholder="Confirmar Contraseña"
                            className="w-full bg-gray-700/50 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none placeholder-gray-400"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Guardando...' : 'Cambiar Contraseña'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Cancelar
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
