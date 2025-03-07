'use client';

import React, { useEffect, useState } from 'react';
import styles from './SettingsForm.module.css';
import { hasDefaultApiKey, getDefaultConfig } from '../services/aiService'; // 确保路径正确

// 定义设置的类型
interface Settings {
    ai: {
        provider: 'openai' | 'gemini';
        apiKey: string;
        apiUrl: string;
        modelName: string;
    };
    englishLevel: string;
    voice: string;
    speed: number;
}

// 其余代码保持不变...

const SettingsForm = () => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [message, setMessage] = useState('');
    const [openAISpeechSettings, setOpenAISpeechSettings] = useState<OpenAISpeechSettings>({
        apiUrl: '',
        apiKey: ''
    });
    const [usingDefaultConfig, setUsingDefaultConfig] = useState(false);

    // 加载设置
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 检查是否有默认API密钥配置
        if (hasDefaultApiKey()) {
            const defaultConfig = getDefaultConfig();
            setSettings(prevSettings => ({
                ...prevSettings,
                ai: {
                    provider: defaultConfig.provider,
                    apiKey: defaultConfig.apiKey,
                    apiUrl: defaultConfig.apiUrl,
                    modelName: defaultConfig.modelName,
                },
                englishLevel: defaultConfig.englishLevel,
            }));
            setUsingDefaultConfig(true);
            setMessage('使用系统默认配置');
            setTimeout(() => setMessage(''), 3000);
        } else {
            // 如果没有默认配置，则尝试从localStorage加载
            const savedSettings = localStorage.getItem('userSettings');
            if (savedSettings) {
                try {
                    const parsed = JSON.parse(savedSettings);
                    setSettings({
                        ...defaultSettings,
                        ...parsed,
                        ai: {
                            ...defaultSettings.ai,
                            ...(parsed.ai || {}),
                        }
                    });
                } catch (error) {
                    console.error('Error loading settings:', error);
                    setSettings(defaultSettings);
                }
            }
        }

        // 加载OpenAI语音设置
        const savedOpenAISpeechSettings = localStorage.getItem('openAISpeechSettings');
        if (savedOpenAISpeechSettings) {
            try {
                setOpenAISpeechSettings(JSON.parse(savedOpenAISpeechSettings));
            } catch (error) {
                console.error('Error parsing OpenAI speech settings:', error);
            }
        }
    }, []);

    // 保存设置
    const saveSettings = () => {
        try {
            localStorage.setItem('userSettings', JSON.stringify(settings));
            setMessage('设置已保存');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage('保存设置失败');
        }
    };

    // 其余代码保持不变...

    return (
        <div className={styles.form}>
            {usingDefaultConfig && (
                <div className={styles.notification}>
                    使用系统默认配置中，如需自定义可修改以下设置
                </div>
            )}
            
            {/* 其余表单内容保持不变 */}
            {/* ... */}
        </div>
    );
};

export default SettingsForm;
