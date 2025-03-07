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

interface OpenAISpeechSettings {
    apiUrl: string;
    apiKey: string;
}

// 默认设置
const defaultSettings: Settings = {
    ai: {
        provider: 'openai',
        apiKey: '',
        apiUrl: 'https://api-proxy.me/openai',
        modelName: 'gpt-4o',
    },
    englishLevel: 'elementary',
    voice: 'en-US-JennyNeural',
    speed: 1.0,
};

// 英语等级选项
const englishLevels = [
    { value: 'kindergarten', label: '英语幼儿园' },
    { value: 'elementary', label: '英语小学生' },
    { value: 'junior', label: '英语初中生' },
    { value: 'university', label: '英语大学生' },
    { value: 'postdoc', label: '英语博士后' },
];

// Edge TTS 音色列表
const voices = [
    'en-US-JennyNeural',
    'en-US-GuyNeural',
    'en-GB-SoniaNeural',
    'en-GB-RyanNeural',
    'en-AU-NatashaNeural',
    'en-AU-WilliamNeural',
    'en-CA-ClaraNeural',
    'en-CA-LiamNeural',
];

const SettingsForm = () => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [message, setMessage] = useState('');
    const [openAISpeechSettings, setOpenAISpeechSettings] = useState<OpenAISpeechSettings>({
        apiUrl: '',
        apiKey: ''
    });
    const [usingDefaultConfig, setUsingDefaultConfig] = useState(false);

    // 检查环境变量配置
    useEffect(() => {
        const checkEnvironmentVars = () => {
            console.log('Checking default API key configuration...');
            console.log('Has default API key:', hasDefaultApiKey());
            
            if (hasDefaultApiKey()) {
                console.log('使用默认环境变量配置');
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
                setMessage('使用系统默认配置中');
                setTimeout(() => setMessage(''), 5000);
            }
        };
        
        checkEnvironmentVars();
    }, []);
    
    // 加载本地设置
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        // 如果没有默认配置或用户选择不使用默认配置，则尝试从localStorage加载
        if (!usingDefaultConfig) {
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

        const savedOpenAISpeechSettings = localStorage.getItem('openAISpeechSettings');
        if (savedOpenAISpeechSettings) {
            try {
                setOpenAISpeechSettings(JSON.parse(savedOpenAISpeechSettings));
            } catch (error) {
                console.error('Error parsing OpenAI speech settings:', error);
            }
        }
    }, [usingDefaultConfig]);

    // 保存设置
    const saveSettings = () => {
        try {
            localStorage.setItem('userSettings', JSON.stringify(settings));
            setMessage('设置已保存');
            setTimeout(() => setMessage(''), 3000);
            
            // 如果保存的设置与默认配置不同，则不再使用默认配置
            if (hasDefaultApiKey()) {
                const defaultConfig = getDefaultConfig();
                if (
                    settings.ai.provider !== defaultConfig.provider ||
                    settings.ai.apiKey !== defaultConfig.apiKey ||
                    settings.ai.apiUrl !== defaultConfig.apiUrl ||
                    settings.ai.modelName !== defaultConfig.modelName ||
                    settings.englishLevel !== defaultConfig.englishLevel
                ) {
                    setUsingDefaultConfig(false);
                }
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage('保存设置失败');
        }
    };

    // 导出用户数据
    const exportData = () => {
        try {
            const data = {
                settings,
                // 这里可以添加其他需要导出的用户数据
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'user-data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting data:', error);
            setMessage('导出数据失败');
        }
    };

    // 恢复使用默认配置
    const resetToDefaultConfig = () => {
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
            setMessage('已恢复使用系统默认配置');
            setTimeout(() => setMessage(''), 3000);
        } else {
            setMessage('没有可用的系统默认配置');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleOpenAISpeechSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setOpenAISpeechSettings(prev => {
            const newSettings = {
                ...prev,
                [name]: value
            };
            localStorage.setItem('openAISpeechSettings', JSON.stringify(newSettings));
            return newSettings;
        });
    };

    return (
        <div className={styles.form}>
            {usingDefaultConfig && (
                <div className={styles.notification} style={{ 
                    backgroundColor: '#e6f7ff', 
                    padding: '10px', 
                    borderRadius: '5px',
                    marginBottom: '15px',
                    border: '1px solid #91d5ff'
                }}>
                    <b>使用系统默认配置中</b> - 您可以修改以下设置进行自定义配置
                </div>
            )}
            
            <section className={styles.section}>
                <h2>AI 设置</h2>
                <div className={styles.field}>
                    <label htmlFor="provider">AI 提供商</label>
                    <select
                        id="provider"
                        value={settings.ai.provider}
                        onChange={(e) => setSettings({
                            ...settings,
                            ai: { ...settings.ai, provider: e.target.value as 'openai' | 'gemini' }
                        })}
                    >
                        <option value="openai">OpenAI</option>
                        <option value="gemini">Gemini</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label htmlFor="apiKey">API Key</label>
                    <input
                        type="password"
                        id="apiKey"
                        value={settings.ai.apiKey}
                        onChange={(e) => setSettings({
                            ...settings,
                            ai: { ...settings.ai, apiKey: e.target.value }
                        })}
                        placeholder={`输入你的 ${settings.ai.provider === 'openai' ? 'OpenAI' : 'Gemini'} API Key`}
                    />
                </div>
                <div className={styles.field}>
                    <label htmlFor="apiUrl">API URL</label>
                    <input
                        type="text"
                        id="apiUrl"
                        value={settings.ai.apiUrl}
                        onChange={(e) => setSettings({
                            ...settings,
                            ai: { ...settings.ai, apiUrl: e.target.value }
                        })}
                        placeholder={`输入 ${settings.ai.provider === 'openai' ? 'OpenAI' : 'Gemini'} API 的URL`}
                    />
                </div>
                <div className={styles.field}>
                    <label htmlFor="modelName">模型名称</label>
                    <input
                        type="text"
                        id="modelName"
                        value={settings.ai.modelName}
                        onChange={(e) => setSettings({
                            ...settings,
                            ai: { ...settings.ai, modelName: e.target.value }
                        })}
                        placeholder="输入模型名称，如 gpt-3.5-turbo"
                    />
                </div>
            </section>

            <section className={styles.section}>
                <h2>英语等级</h2>
                <div className={styles.field}>
                    <select
                        value={settings.englishLevel}
                        onChange={(e) => setSettings({
                            ...settings,
                            englishLevel: e.target.value
                        })}
                    >
                        {englishLevels.map((level) => (
                            <option key={level.value} value={level.value}>
                                {level.label}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            <section className={styles.section}>
                <h2>语音设置</h2>
                <div className={styles.field}>
                    <label htmlFor="voice">发音音色</label>
                    <select
                        id="voice"
                        value={settings.voice}
                        onChange={(e) => setSettings({
                            ...settings,
                            voice: e.target.value
                        })}
                    >
                        {voices.map((voice) => (
                            <option key={voice} value={voice}>
                                {voice}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.field}>
                    <label htmlFor="speed">发音速度: {settings.speed}</label>
                    <input
                        type="range"
                        id="speed"
                        min="0.4"
                        max="1.0"
                        step="0.1"
                        value={settings.speed}
                        onChange={(e) => setSettings({
                            ...settings,
                            speed: parseFloat(e.target.value)
                        })}
                    />
                </div>
            </section>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>OpenAI 语音配置（可选）</h2>
                <div className={styles.field}>
                    <label htmlFor="openai-speech-api-url">API 地址：</label>
                    <input
                        type="text"
                        id="openai-speech-api-url"
                        name="apiUrl"
                        value={openAISpeechSettings.apiUrl}
                        onChange={handleOpenAISpeechSettingsChange}
                        placeholder="https://api.openai.com/v1/audio/speech"
                    />
                </div>
                <div className={styles.field}>
                    <label htmlFor="openai-speech-api-key">API Key：</label>
                    <input
                        type="password"
                        id="openai-speech-api-key"
                        name="apiKey"
                        value={openAISpeechSettings.apiKey}
                        onChange={handleOpenAISpeechSettingsChange}
                        placeholder="sk-..."
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <button onClick={saveSettings} className={styles.saveButton}>
                    保存设置
                </button>
                
                {hasDefaultApiKey() && (
                    <button 
                        onClick={resetToDefaultConfig} 
                        className={styles.resetButton}
                        style={{
                            backgroundColor: '#f0f2f5',
                            border: '1px solid #d9d9d9',
                            color: '#000',
                            marginLeft: '10px'
                        }}
                    >
                        恢复默认配置
                    </button>
                )}
                
                <button onClick={exportData} className={styles.exportButton}>
                    导出数据
                </button>
            </div>

            {message && (
                <div className={styles.message} style={{
                    padding: '10px',
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: '5px',
                    marginTop: '15px'
                }}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default SettingsForm;
