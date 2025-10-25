import React, { createContext, useContext, useMemo, useState } from 'react';

const TypographyContext = createContext({ mode: 'normal', setMode: () => {}, scale: 1 });

const SCALE_MAP = {
    normal: 1,     // 보통
    large: 1.15,   // 크게
    xlarge: 1.3,   // 더 크게
};

export function TypographyProvider({ children }) {
    const [mode, setMode] = useState('normal');
    const scale = SCALE_MAP[mode] ?? 1;
    const value = useMemo(() => ({ mode, setMode, scale }), [mode]);
    return <TypographyContext.Provider value={value}>{children}</TypographyContext.Provider>;
}

export function useTypography() {
    return useContext(TypographyContext);
}
