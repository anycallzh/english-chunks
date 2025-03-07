import { useRouter } from 'next/navigation';
import { hasDefaultApiKey, getDefaultConfig } from './aiService'; // 确保正确导入

interface AISettings {
    provider: 'openai' | 'gemini';
    apiKey: string;
    apiUrl: string;
    modelName: string;
}

export const checkAndRedirectAPISettings = (
    aiSettings: AISettings | undefined,
    router: ReturnType<typeof useRouter>
): boolean => {
    // 首先检查是否可以从环境变量获取配置
    if (!aiSettings || 
        !aiSettings.apiKey || 
        !aiSettings.apiUrl || 
        !aiSettings.modelName) {
        
        // 检查环境变量是否有默认配置
        if (hasDefaultApiKey()) {
            // 如果有环境变量配置，自动保存到localStorage
            const defaultConfig = getDefaultConfig();
            if (typeof window !== 'undefined') {
                try {
                    // 保存环境变量配置
                    localStorage.setItem('userSettings', JSON.stringify({
                        ai: {
                            provider: defaultConfig.provider,
                            apiKey: defaultConfig.apiKey, 
                            apiUrl: defaultConfig.apiUrl,
                            modelName: defaultConfig.modelName,
                        },
                        englishLevel: defaultConfig.englishLevel,
                        voice: defaultConfig.voice || 'en-US-GuyNeural', // 使用环境变量或默认GuyNeural
                        speed: 1.0
                    }));
                    console.log('✅ 已自动应用环境变量配置');
                    // 配置已保存，不需要跳转
                    return true;
                } catch (e) {
                    console.error('保存配置时出错:', e);
                }
            }
        }
        
        // 如果没有环境变量配置或保存失败，则跳转到设置页面
        router.push('/settings');
        alert('请先配置API设置（API Key、API URL和模型名称）');
        return false;
    }
    return true;
};
