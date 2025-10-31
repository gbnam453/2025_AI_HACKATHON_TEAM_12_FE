// src/widgets/AppText.js
import React from 'react';
import { Text, Platform } from 'react-native';
import { useTypography } from '../entities/typography';

const ANDROID_TITLE_LINE_EXTRA = 2;
const ANDROID_TITLE_MARGIN_TOP  = -1;

export default function AppText({ size = 16, tight = false, style, children, ...rest }) {
    const { scale } = useTypography();
    const computed = Math.round(size * scale);

    const androidFix =
        Platform.OS === 'android'
            ? {
                includeFontPadding: false,
                textAlignVertical: 'center',
                ...(tight ? { lineHeight: computed + ANDROID_TITLE_LINE_EXTRA, marginTop: ANDROID_TITLE_MARGIN_TOP } : null),
            }
            : null;

    return (
        <Text allowFontScaling={false} style={[{ fontSize: computed }, androidFix, style]} {...rest}>
            {children}
        </Text>
    );
}
