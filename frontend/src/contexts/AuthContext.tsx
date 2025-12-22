import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api';

interface AuthContextType {
    user: any;
    token: string | null;
    loginFn: (token: string) => void;
    logoutFn: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            getMe()
                .then(res => setUser(res.data))
                .catch(() => {
                    setToken(null);
                    sessionStorage.removeItem('token');
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const loginFn = (newToken: string) => {
        sessionStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logoutFn = () => {
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loginFn, logoutFn, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
