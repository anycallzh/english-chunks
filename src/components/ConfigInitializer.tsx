'use client';

import { useEffect } from 'react';
import { hasDefaultApiKey, getDefaultConfig } from '../services/aiService';

export function ConfigInitializer() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (hasDefaultApiKey()) {
        console.log('👉 发现环境变量API配置，自动初始化中...');
        const defaultConfig = getDefaultConfig();
        
        try {
          // 检查localStorage中是否已有配置
          const savedSettings = localStorage.getItem('userSettings');
          const parsedSettings = savedSettings ? JSON.parse(savedSettings) : null;
          
          // 如果没有配置或API Key为空，则自动保存环境变量配置
          if (!parsedSettings || !parsedSettings.ai?.apiKey) {
            localStorage.setItem('userSettings', JSON.stringify({
              ai: {
                provider: defaultConfig.provider,
                apiKey: defaultConfig.apiKey,
                apiUrl: defaultConfig.apiUrl,
                modelName: defaultConfig.modelName,
              },
              englishLevel: defaultConfig.englishLevel,
              voice: defaultConfig.voice || 'en-US-GuyNeural', // 使用环境变量或默认值
              speed: 1.0 // 默认速度
            }));
            
            console.log('✅ 环境变量配置已自动保存到localStorage');
          }
        } catch (error) {
          console.error('保存配置时发生错误:', error);
        }
      }
    }
  }, []);
  
  return null; // 这个组件不渲染任何内容
}
