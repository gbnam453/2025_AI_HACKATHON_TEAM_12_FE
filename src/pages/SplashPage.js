// src/pages/SplashPage.js
import React, { useEffect } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Camera } from 'react-native-vision-camera';

export default function SplashPage() {
    const navigation = useNavigation();

    useEffect(() => {
        (async () => {
            const status = await Camera.getCameraPermissionStatus();
            if (status !== 'authorized') {
                const result = await Camera.requestCameraPermission();
                if (result === 'denied' || result === 'restricted') {
                    Alert.alert('카메라 권한 필요', '설정 > 카메라에서 허용 후 다시 시도하세요.');
                }
            }
            setTimeout(() => navigation.replace('MainPage'), 1500);
        })();
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Image
                source={require('../shared/assets/images/Icon_dinuri.png')}
                style={styles.logo}
                resizeMode="contain"
                accessible
                accessibilityLabel="디누리 로고"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#0EA5E9' },
    logo: { width: 180, height: 180 },
});
