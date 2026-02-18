import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ReaderSettings {
    fontSize: number; // 1 (100%), 1.1 (110%), 1.25 (125%)
    compactMode: boolean;
    theme: 'light' | 'dark' | 'system';
}

interface ReaderContextType extends ReaderSettings {
    setFontSize: (size: number) => void;
    toggleCompactMode: () => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export const useReader = () => {
    const context = useContext(ReaderContext);
    if (!context) {
        throw new Error('useReader must be used within a ReaderProvider');
    }
    return context;
};

export const ReaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [fontSize, setFontSizeState] = useState<number>(1);
    const [compactMode, setCompactMode] = useState<boolean>(false);
    const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

    // Load settings on mount
    useEffect(() => {
        const saved = localStorage.getItem('readerSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.fontSize) setFontSizeState(parsed.fontSize);
                if (typeof parsed.compactMode === 'boolean') setCompactMode(parsed.compactMode);
                if (parsed.theme) setThemeState(parsed.theme);
            } catch (e) {
                console.error('Failed to parse reader settings', e);
            }
        }
    }, []);

    // Persist settings
    useEffect(() => {
        const settings: ReaderSettings = { fontSize, compactMode, theme };
        localStorage.setItem('readerSettings', JSON.stringify(settings));

        // Apply font size to root
        document.documentElement.style.fontSize = `${16 * fontSize}px`;

        // Apply compact mode class
        if (compactMode) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
    }, [fontSize, compactMode, theme]);

    const setFontSize = (size: number) => setFontSizeState(size);
    const toggleCompactMode = () => setCompactMode(prev => !prev);
    const setTheme = (t: 'light' | 'dark' | 'system') => setThemeState(t);

    return (
        <ReaderContext.Provider value={{
            fontSize,
            compactMode,
            theme,
            setFontSize,
            toggleCompactMode,
            setTheme
        }}>
            {children}
        </ReaderContext.Provider>
    );
};
