// src/shared/model/typography.js
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 저장 키
const STORAGE_KEYS = {
    mode: 'dinuri:fontMode',      // 'normal' | 'large' | 'xlarge'
    autoTts: 'dinuri:autoTts',    // 'true' | 'false'
};

// 글자 크기 배율
const SCALE_MAP = {
    normal: 1.0,
    large: 1.2,
    xlarge: 1.4,
};

const TypographyContext = createContext({
    mode: 'normal',
    scale: 1.0,
    setMode: () => {},
    autoTts: true,
    setAutoTts: () => {},
});

export function TypographyProvider({ children }) {
    const [mode, setModeState] = useState('normal');
    const [autoTts, setAutoTtsState] = useState(true);

    // 초기 로드: 저장된 설정 복원
    useEffect(() => {
        (async () => {
            try {
                const [savedMode, savedAutoTts] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.mode),
                    AsyncStorage.getItem(STORAGE_KEYS.autoTts),
                ]);
                if (savedMode && (savedMode in SCALE_MAP)) setModeState(savedMode);
                if (savedAutoTts === 'true' || savedAutoTts === 'false') {
                    setAutoTtsState(savedAutoTts === 'true');
                }
            } catch {
                // 무시: 기본값 유지
            }
        })();
    }, []);

    // setter: 영구 저장 포함
    const setMode = useCallback(async (next) => {
        setModeState(next);
        try { await AsyncStorage.setItem(STORAGE_KEYS.mode, next); } catch {}
    }, []);

    const setAutoTts = useCallback(async (next) => {
        setAutoTtsState(next);
        try { await AsyncStorage.setItem(STORAGE_KEYS.autoTts, String(next)); } catch {}
    }, []);

    const scale = useMemo(() => SCALE_MAP[mode] ?? 1.0, [mode]);

    const value = useMemo(() => ({
        mode,
        scale,
        setMode,
        autoTts,
        setAutoTts,
    }), [mode, scale, setMode, autoTts, setAutoTts]);

    return (
        <TypographyContext.Provider value={value}>
            {children}
        </TypographyContext.Provider>
    );
}

export function useTypography() {
    return useContext(TypographyContext);
}
