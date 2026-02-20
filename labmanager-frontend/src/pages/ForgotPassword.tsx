import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPassword: React.FC = () => {
    const { register, handleSubmit } = useForm();
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', data);
            // Always show success message for security reasons (or the specific one from backend)
            setEmailSent(true);
            toast.success('Si el correo existe, se ha enviado un enlace de recuperación.');
        } catch (error: any) {
            toast.error('Ocurrió un error al procesar tu solicitud.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <ToastContainer position="top-center" />
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Recuperar Contraseña</h1>
                    <p className="text-gray-300">Ingresa tu correo para recibir un enlace de recuperación.</p>
                </div>

                {!emailSent ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="Correo Electrónico"
                                className="w-full bg-gray-700/50 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none placeholder-gray-400"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enviando...' : 'Enviar Enlace'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center text-green-400 bg-green-900/30 p-4 rounded-xl border border-green-500/30">
                        <p>¡Correo enviado!</p>
                        <p className="text-sm text-gray-300 mt-2">Revisa tu bandeja de entrada (y spam) para continuar.</p>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Volver al Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
