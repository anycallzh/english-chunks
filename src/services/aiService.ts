'use client'; // 标记为客户端组件

import type { Chunk } from './chunkService';
import React, { useState } from 'react';

interface AIConfig {
    provider: 'openai' | 'gemini';
    apiKey: string;
    apiUrl: string;
    modelName: string;
    englishLevel: string;
    voice?: string;
}

interface SceneResponse {
    dialogue: string;
    chunks: Chunk[];
}

// 添加默认配置，获取环境变量
const DEFAULT_CONFIG: AIConfig = {
    provider: 'gemini',
    apiKey: process.env.NEXT_PUBLIC_API_KEY || '',
    apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-proxy.me/gemini',
    modelName: process.env.NEXT_PUBLIC_MODEL || 'gemini-pro',
    englishLevel: process.env.NEXT_PUBLIC_ENGLISH_LEVEL || 'junior',
    voice: process.env.NEXT_PUBLIC_VOICE || 'en-US-GuyNeural'
};

// 检查并记录环境变量是否存在到控制台，便于调试
console.log('环境变量加载情况:', {
    API_KEY: Boolean(process.env.NEXT_PUBLIC_API_KEY),
    API_BASE_URL: Boolean(process.env.NEXT_PUBLIC_API_BASE_URL),
    MODEL: Boolean(process.env.NEXT_PUBLIC_MODEL),
    ENGLISH_LEVEL: Boolean(process.env.NEXT_PUBLIC_ENGLISH_LEVEL),
    VOICE: Boolean(process.env.NEXT_PUBLIC_VOICE)
});

// 导出函数以检查是否有设置好的默认配置
export const hasDefaultApiKey = (): boolean => {
    return Boolean(DEFAULT_CONFIG.apiKey && DEFAULT_CONFIG.apiKey.length > 0);
};

// 导出默认配置以供前端组件使用
export const getDefaultConfig = (): AIConfig => {
    return { ...DEFAULT_CONFIG };
};

// 导出一个配置Hook，便于在React组件中使用
export const useAIConfig = () => {
    const [config, setConfig] = useState<AIConfig>({
        ...DEFAULT_CONFIG,
        // 如果环境变量没有API Key，则尝试从localStorage获取
        apiKey: DEFAULT_CONFIG.apiKey || 
                (typeof window !== 'undefined' ? 
                JSON.parse(localStorage.getItem('userSettings') || '{}')?.ai?.apiKey || '' : '')
    });
    
    return { config, setConfig };
};

const getEnglishLevelDescription = (level: string): string => {
    switch (level) {
        case 'kindergarten':
            return 'beginner level (age 3-6), using very simple vocabulary and basic expressions';
        case 'elementary':
            return 'elementary level (age 7-12), using simple vocabulary and common daily expressions';
        case 'junior':
            return 'intermediate level (age 13-15), using moderate vocabulary and some idioms';
        case 'university':
            return 'advanced level (university student), using rich vocabulary and natural expressions';
        case 'postdoc':
            return 'professional level (post-doctoral), using sophisticated vocabulary and professional expressions';
        default:
            return 'intermediate level, using moderate vocabulary and common expressions';
    }
};

const SYSTEM_PROMPT = (englishLevel: string) => `You are an English learning assistant. Your task is to:
1. Generate a natural dialogue based on the given scene
2. Extract useful English chunks from the dialogue
3. Return both in a structured format

Target English Level: ${getEnglishLevelDescription(englishLevel)}

Requirements:
- The dialogue should be realistic and include 3-4 speakers
- Each chunk should be a useful phrase or expression (not complete sentences)
- Each chunk must include pronunciation, Chinese meaning, and suitable scenes
- Format all speakers in the dialogue as "Speaker: Content"
- Adjust language difficulty according to the target English level
- For lower levels (kindergarten/elementary), focus on basic daily expressions
- For higher levels (university/postdoc), include more sophisticated expressions and idioms

Response Format:
{
    "dialogue": "string (the generated dialogue with speaker names)",
    "chunks": [
        {
            "chunk": "useful English phrase or expression",
            "pronunciation": "IPA phonetic symbols",
            "chinese_meaning": "中文含义",
            "suitable_scenes": ["场景1", "场景2"]
        }
    ]
}`;

const createRequestBody = (config: AIConfig, scene: string, stream = true) => {
    const prompt = `Generate an English learning dialogue and chunks for the following scene: ${scene}`;

    if (config.provider === 'openai') {
        return {
            model: config.modelName,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT(config.englishLevel) },
                { role: 'user', content: prompt }
            ],
            stream
        };
    } else {
        return {
            contents: [
                {
                    parts: [
                        { text: SYSTEM_PROMPT(config.englishLevel) + "\n\nUser: " + prompt }
                    ]
                }
            ]
        };
    }
};

const handleStreamResponse = async (
    response: Response,
    config: AIConfig,
    onProgress: (text: string) => void
): Promise<string> => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (!reader) {
        throw new Error('Failed to read response');
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                    const parsed = JSON.parse(data);
                    let content = '';
                    if (config.provider === 'openai' && parsed.choices?.[0]?.delta?.content) {
                        content = parsed.choices[0].delta.content;
                    } else if (config.provider === 'gemini' && parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                        content = parsed.candidates[0].content.parts[0].text;
                    }
                    fullText += content;
                    onProgress(fullText);
                } catch (e) {
                    console.error('Error parsing streaming response:', e);
                }
            }
        }
    }

    return fullText;
};

// 修改函数签名，使config参数可选
export const generateSceneContent = async (
    scene: string, 
    config?: Partial<AIConfig>,  // 使config成为可选参数
    onProgress: (dialogue: string) => void = () => {}  // 设置默认空函数
): Promise<SceneResponse> => {
    try {
        // 合并默认配置和用户提供的配置
        const finalConfig: AIConfig = { ...DEFAULT_CONFIG, ...config };
        
        let endpoint;
        let headers;
        let body;

        if (finalConfig.provider === 'openai') {
            endpoint = `${finalConfig.apiUrl}/v1/chat/completions`;
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalConfig.apiKey}`,
            };
            body = createRequestBody(finalConfig, scene, false);
        } else {
            endpoint = `${finalConfig.apiUrl}/v1beta/models/${finalConfig.modelName}:generateContent?key=${finalConfig.apiKey}`;
            headers = {
                'Content-Type': 'application/json'
            };
            body = createRequestBody(finalConfig, scene, false);
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to generate scene content');
        }

        const data = await response.json();
        let content = '';
        
        if (finalConfig.provider === 'openai') {
            content = data.choices[0]?.message?.content;
        } else {
            content = data.candidates[0]?.content?.parts[0]?.text;
        }

        if (!content) {
            throw new Error('No content in response');
        }

        try {
            // 清理响应内容，确保它是有效的JSON
            const cleanContent = content
                .replace(/^```json\s*/m, '')
                .replace(/\s*```\s*$/m, '')
                .trim();

            const result = JSON.parse(cleanContent) as SceneResponse;

            // 验证响应格式
            if (!result.dialogue || !Array.isArray(result.chunks)) {
                throw new Error('Invalid response format');
            }

            // 格式化对话为Markdown
            const formattedDialogue = result.dialogue
                .split('\n')
                .map(line => {
                    if (line.includes(':')) {
                        const [speaker, content] = line.split(':').map(part => part.trim());
                        return `**${speaker}**: ${content}`;
                    }
                    return line;
                })
                .join('\n\n');

            onProgress(formattedDialogue);

            return {
                dialogue: formattedDialogue,
                chunks: result.chunks.map(chunk => ({
                    chunk: chunk.chunk || '',
                    pronunciation: chunk.pronunciation || '',
                    chinese_meaning: chunk.chinese_meaning || '',
                    suitable_scenes: Array.isArray(chunk.suitable_scenes) ? chunk.suitable_scenes : [],
                }))
            };
        } catch (e) {
            console.error('Error parsing response:', e);
            console.error('Content was:', content);
            throw new Error('Failed to parse scene content');
        }
    } catch (error) {
        console.error('Error generating scene content:', error);
        throw error;
    }
};
// 添加到 aiService.ts 文件末尾
export const isConfigured = (): boolean => {
  // 检查环境变量
  if (hasDefaultApiKey()) {
    return true;
  }
  
  // 如果环境变量没有配置，则检查localStorage
  if (typeof window !== 'undefined') {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return Boolean(parsed?.ai?.apiKey);
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
    }
  }
  
  return false;
};

export const ensureConfiguration = () => {
  // 如果已经有环境变量配置但localStorage还没有，则自动保存
  if (hasDefaultApiKey() && typeof window !== 'undefined') {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      // 如果没有保存的设置，或者保存的设置没有API Key
      if (!savedSettings || !JSON.parse(savedSettings)?.ai?.apiKey) {
        const defaultConfig = getDefaultConfig();
        localStorage.setItem('userSettings', JSON.stringify({
          ai: {
            provider: defaultConfig.provider,
            apiKey: defaultConfig.apiKey,
            apiUrl: defaultConfig.apiUrl,
            modelName: defaultConfig.modelName,
          },
          englishLevel: defaultConfig.englishLevel,
          voice: 'en-US-JennyNeural',
          speed: 1.0
        }));
        console.log('配置已自动修复');
        return true;
      }
    } catch (error) {
      console.error('配置检查失败:', error);
    }
  }
  return false;
};
