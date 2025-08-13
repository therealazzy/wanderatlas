// src/context/AuthContext.jsx
import { createContext, useEffect, useState, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [session, setSession] = useState(null);

    //SIGN UP
    const signUp = async ({ email, username, password }) => {
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    username: username,
                    full_name: username
                }
            }
        });

        if (error) {
            console.error('Sign-up error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    };

    //LOGIN
    const login = async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            console.error('Login error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    };

    //SIGN OUT
    const signOut = async () => {
        try {
            console.log('Starting signOut...');
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Sign-out error:', error);
                throw error;
            }
            console.log('SignOut completed successfully');
        } catch (error) {
            console.error('Sign-out error:', error);
            throw error;
        }
    };

    //LISTEN TO SESSION CHANGES
    useEffect(() => {
        let isMounted = true; 

        // Get current session on first load
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted) setSession(session);
        });

        // Listen for changes (login, logout, refresh)
        const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
            if (isMounted) {
                console.log('Auth state change:', event, session ? 'session exists' : 'no session');
                setSession(session);
            }
        });

        // Cleanup on unmount
        return () => {
            isMounted = false;
            if (subscription?.subscription) {
                subscription.subscription.unsubscribe();
            }
        };
    }, []);

    return (
        <AuthContext.Provider value={{ session, signUp, login, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const UserAuth = () => {
    return useContext(AuthContext);
};