import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        // First do a quick local expiry check (saves a network round-trip if already expired)
        try {
            const decoded = jwtDecode(token);
            if (decoded.exp * 1000 < Date.now()) {
                logout();
                setLoading(false);
                return;
            }
        } catch {
            logout();
            setLoading(false);
            return;
        }
        // Then validate the token against the live backend to catch stale tokens
        // (e.g. backend restarted and H2 in-memory DB was wiped)
        api.get('/auth/me')
            .then((res) => {
                const decoded = jwtDecode(token);
                setUser({
                    username: decoded.sub,
                    roles: decoded.roles || [],
                    userId: decoded.userId || null,
                });
            })
            .catch(() => {
                // Token is invalid server-side — clear it and force re-login
                logout();
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const login = async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        const { token } = response.data.data;
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser({
            username: decoded.sub,
            roles: decoded.roles || [],
            userId: decoded.userId || null,
        });
        return response.data;
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);
        const { token } = response.data.data;
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser({
            username: decoded.sub,
            roles: decoded.roles || [],
            userId: decoded.userId || null,
        });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.roles?.includes('ROLE_ADMIN'),
        isEmployee: user?.roles?.includes('ROLE_EMPLOYEE'),
        isCustomer: user?.roles?.includes('ROLE_CUSTOMER'),
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};