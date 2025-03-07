'use client';

import { useEffect } from 'react';
import { hasDefaultApiKey, getDefaultConfig } from '../services/aiService';

export function ConfigInitializer() {
  useEffect(() => {
    if (hasDefaultApiKey()) {
      console.log('👉 发现环境变量API配置，自动初始化中...');
      const defaultConfig = getDefaultConfig();
      
      // 保存环境变量配置到localStorage
      localStorage.setItem('userSettings', JSON.stringify({
        ai: {
          provider: defaultConfig.provider,
          apiKey: defaultConfig.apiKey,
          apiUrl: defaultConfig.apiUrl,
          modelName: defaultConfig.modelName,
        },
        englishLevel: defaultConfig.englishLevel,
        voice: 'en-US-JennyNeural', // 默认语音设置
        speed: 1.0 // 默认速度
      }));
      
      console.log('✅ 环境变量配置已自动保存到localStorage');
    }
  }, []);
  
  return null; // 这个组件不渲染任何内容
}
