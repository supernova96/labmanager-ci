import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lock, User, Hash, Mail } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThemeToggle from '../components/ThemeToggle';


const Register: React.FC = () => {
    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: any) => {
        // Client-side Validation
        if (!/^\d+$/.test(data.matricula)) {
            toast.error('La matrícula debe contener solo números.');
            return;
        }
        if (!data.email.includes('@')) {
            toast.error('Ingresa un correo válido.');
            return;
        }
        if (data.password.includes(' ')) {
            toast.error('La contraseña no puede contener espacios.');
            return;
        }
        if (data.password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/signup', {
                matricula: data.matricula,
                email: data.email,
                fullName: data.fullName,
                password: data.password,
                role: ["student"]
            });
            toast.success('¡Cuenta creada! Por favor inicia sesión.');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al registrar. Verifica si la matrícula es válida.');
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
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"></div>
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Únete a LabManager</h1>
                    <p className="text-slate-500 dark:text-gray-300">Crea tu cuenta de estudiante</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="relative">
                        <Hash className="absolute left-3 top-3 text-slate-400 dark:text-gray-400 h-5 w-5" />
                        <input
                            {...register('matricula')}
                            placeholder="Matrícula"
                            className="w-full bg-slate-100 dark:bg-gray-700/50 text-slate-900 dark:text-white pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all outline-none placeholder-slate-400 dark:placeholder-gray-400"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400 dark:text-gray-400 h-5 w-5" />
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="Correo Electrónico"
                            className="w-full bg-slate-100 dark:bg-gray-700/50 text-slate-900 dark:text-white pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all outline-none placeholder-slate-400 dark:placeholder-gray-400"
                            required
                        />
                    </div>

                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400 dark:text-gray-400 h-5 w-5" />
                        <input
                            {...register('fullName')}
                            placeholder="Nombre Completo"
                            className="w-full bg-slate-100 dark:bg-gray-700/50 text-slate-900 dark:text-white pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all outline-none placeholder-slate-400 dark:placeholder-gray-400"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400 dark:text-gray-400 h-5 w-5" />
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="Contraseña"
                            className="w-full bg-slate-100 dark:bg-gray-700/50 text-slate-900 dark:text-white pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all outline-none placeholder-slate-400 dark:placeholder-gray-400"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verificando...' : 'Crear Cuenta'}
                    </button>
                </form>

                <div className="mt-8 text-center text-slate-500 dark:text-gray-400">
                    <p>¿Ya tienes cuenta? <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 font-medium hover:underline">Inicia Sesión</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
