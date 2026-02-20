import React, { createContext, useState, useEffect, useContext } from 'react';

interface User {
    id: number;
    matricula: string;
    fullName: string;
    roles: string[];
    token: string;
    isSanctioned: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    // Idle Timer Logic (15 minutes)
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        const resetTimer = () => {
            if (timeout) clearTimeout(timeout);
            if (user) {
                // 15 minutes = 900000 ms
                timeout = setTimeout(() => {
                    console.log('Session timed out due to inactivity');
                    logout();
                    window.location.href = '/login';
                }, 900000);
            }
        };

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        const handleActivity = () => {
            resetTimer();
        };

        if (user) {
            events.forEach(event => window.addEventListener(event, handleActivity));
            resetTimer(); // Start timer initially
        }

        return () => {
            if (timeout) clearTimeout(timeout);
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [user]);

    const login = (userData: User) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    const isAdmin = user?.roles.includes('ROLE_ADMIN') || false;

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
