import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Lock, User } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThemeToggle from '../components/ThemeToggle';


const Login: React.FC = () => {
    const { register, handleSubmit } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/signin', data);
            login(response.data);
            toast.success('¡Bienvenido!');
            if (response.data.roles.includes('ROLE_ADMIN')) {
                navigate('/admin');
            } else if (response.data.roles.includes('ROLE_PROFFESOR')) {
                navigate('/professor');
            } else {
                navigate('/student');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <ToastContainer position="top-center" />

            {/* Theme Toggle Positioned */}
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="bg-white dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden transition-all duration-300">
                {/* Decorative glow */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">LabManager</h1>
                    <p className="text-slate-500 dark:text-gray-300">Sistema de Reserva de Laptops</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400 dark:text-gray-400 h-5 w-5" />
                        <input
                            {...register('matricula')}
                            placeholder="Matrícula"
                            className="w-full bg-slate-100 dark:bg-gray-700/50 text-slate-900 dark:text-white pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none placeholder-slate-400 dark:placeholder-gray-400"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400 dark:text-gray-400 h-5 w-5" />
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="Contraseña"
                            className="w-full bg-slate-100 dark:bg-gray-700/50 text-slate-900 dark:text-white pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none placeholder-slate-400 dark:placeholder-gray-400"
                            required
                        />
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Autenticando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-8 text-center text-slate-500 dark:text-gray-400">
                    <p>¿No tienes cuenta? <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium hover:underline">Regístrate aquí</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
