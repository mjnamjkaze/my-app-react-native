
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
    sampleRateMs: number;
    voiceThresholds: number[];
    voiceTemplate: string;
}

const SETTINGS_KEY = 'app_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
    sampleRateMs: 300000, // 5 minutes as requested by user (though very slow for a speedometer)
    voiceThresholds: [50, 60, 90, 120],
    voiceTemplate: '{speed}',
};

export const saveSettings = async (settings: AppSettings) => {
    try {
        const jsonGithub = JSON.stringify(settings);
        await AsyncStorage.setItem(SETTINGS_KEY, jsonGithub);
    } catch (e) {
        console.error('Failed to save settings', e);
    }
};

export const loadSettings = async (): Promise<AppSettings> => {
    try {
        const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
        if (jsonValue != null) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(jsonValue) };
        }
        return DEFAULT_SETTINGS;
    } catch (e) {
        console.error('Failed to load settings', e);
        return DEFAULT_SETTINGS;
    }
};
