import { AppSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/constants/settings';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const router = useRouter();
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    // Local state for inputs
    const [sampleRateInput, setSampleRateInput] = useState('');
    const [thresholdsInput, setThresholdsInput] = useState('');
    const [templateInput, setTemplateInput] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const s = await loadSettings();
        setSettings(s);
        setSampleRateInput((s.sampleRateMs / 60000).toString()); // Convert ms to minutes for display
        setThresholdsInput(s.voiceThresholds.join(', '));
        setTemplateInput(s.voiceTemplate);
        setLoading(false);
    };

    const handleSave = async () => {
        // Validate Sample Rate
        const minutes = parseFloat(sampleRateInput);
        if (isNaN(minutes) || minutes <= 0) {
            Alert.alert('Lỗi', 'Thời gian lấy mẫu không hợp lệ');
            return;
        }
        const ms = Math.floor(minutes * 60000);

        // Validate Thresholds
        const thres = thresholdsInput.split(',')
            .map(t => parseInt(t.trim()))
            .filter(t => !isNaN(t))
            .sort((a, b) => a - b);

        if (thres.length === 0) {
            Alert.alert('Lỗi', 'Nhập ít nhất một mốc tốc độ.');
            return;
        }

        // Validate Template
        if (!templateInput.includes('{speed}')) {
            Alert.alert('Lỗi', 'Mẫu đọc phải chứa "{speed}"');
            return;
        }

        const newSettings: AppSettings = {
            sampleRateMs: ms,
            voiceThresholds: thres,
            voiceTemplate: templateInput,
        };

        await saveSettings(newSettings);
        setSettings(newSettings);
        Alert.alert('Thành công', 'Đã lưu cài đặt', [
            { text: 'OK', onPress: () => router.back() }
        ]);
    };

    if (loading) return <View style={styles.container} />;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Cài đặt', headerTintColor: 'white', headerStyle: { backgroundColor: 'black' } }} />
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={styles.scroll}>

                <View style={styles.section}>
                    <Text style={styles.label}>Tần suất lấy mẫu (phút):</Text>
                    <Text style={styles.helper}>Mặc định: 5 phút. Nhập số thập phân cho giây (VD: 0.016 ≈ 1 giây)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={sampleRateInput}
                        onChangeText={setSampleRateInput}
                        placeholder="5"
                        placeholderTextColor="#666"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Các mốc báo (km/h):</Text>
                    <Text style={styles.helper}>Phân cách bằng dấu phẩy</Text>
                    <TextInput
                        style={styles.input}
                        value={thresholdsInput}
                        onChangeText={setThresholdsInput}
                        placeholder="50, 60, 90, 120"
                        placeholderTextColor="#666"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Mẫu câu đọc:</Text>
                    <Text style={styles.helper}>Sử dụng "{`{speed}`}" để thay thế số tốc độ</Text>
                    <TextInput
                        style={styles.input}
                        value={templateInput}
                        onChangeText={setTemplateInput}
                        placeholder="{speed}"
                        placeholderTextColor="#666"
                    />
                    <Text style={styles.preview}>VD: "{templateInput.replace('{speed}', '60')}"</Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>LƯU CÀI ĐẶT</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c1c1e',
    },
    scroll: {
        padding: 20,
    },
    section: {
        marginBottom: 25,
    },
    label: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    helper: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    input: {
        backgroundColor: '#2c2c2e',
        color: 'white',
        padding: 15,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#3a3a3c',
    },
    preview: {
        color: '#4CD964',
        marginTop: 8,
        fontSize: 14,
    },
    button: {
        backgroundColor: '#0A84FF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
