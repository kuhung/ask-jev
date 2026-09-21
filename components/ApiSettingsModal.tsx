'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [endpoint, setEndpoint] = useState('https://api.typesafe.ai/v1/systemone');
  const [apiKey, setApiKey] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEndpoint = localStorage.getItem('ask_jev_api_endpoint');
      if (savedEndpoint) {
        setEndpoint(savedEndpoint);
      }
      setApiKey(localStorage.getItem('ask_jev_api_key') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ask_jev_api_endpoint', endpoint.trim());
      localStorage.setItem('ask_jev_api_key', apiKey.trim());
      setIsSuccess(true);
      setStatusMsg(
        apiKey.trim()
          ? '已保存配置！生产环境建议直接在 Vercel 后台配置 TYPESAFE_JEV_API_KEY。'
          : '已清空 Key，系统将采用内置高拟真推演引擎。'
      );
      setTimeout(() => {
        onClose();
        setStatusMsg('');
      }, 1500);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setIsSuccess(false);
      setStatusMsg('请先输入 TypeSafe API Key！');
      return;
    }

    setIsTesting(true);
    setStatusMsg('正在向 TypeSafe 官方接口发送测试评估...');
    setIsSuccess(false);

    try {
      // 发送符合 TypeSafe 官方规范的最小 Noul 请求
      const res = await fetch(endpoint.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          state: 'System connectivity verification ping',
          model: 'jev-latest',
          questions: {
            test_ping: {
              type: 'noul',
              instructions: 'Is this system online and active?',
            },
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setIsSuccess(true);
        setStatusMsg(`连接成功！TypeSafe Jev 模型已响应 (返回模型: ${json.model})`);
      } else {
        setIsSuccess(false);
        const errText = await res.text();
        setStatusMsg(`接口返回异常 (${res.status}): ${errText.slice(0, 100)}`);
      }
    } catch (err: any) {
      setIsSuccess(false);
      setStatusMsg(`网络连接失败：${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-retroWin-gray border-[3px] border-black shadow-brutal w-full max-w-md rounded">
        {/* Titlebar */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-600 text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs">
          <span>TypeSafe 官方 System One 接口设置</span>
          <button
            type="button"
            onClick={onClose}
            className="bg-retroWin-gray border border-black text-black w-4 h-4 flex items-center justify-center text-xs hover:bg-gray-300"
          >
            <X size={12} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 text-xs sm:text-sm leading-relaxed text-gray-900">
          <p className="mb-3 text-gray-700">
            依据 TypeSafe 官方文档（<a href="https://docs.typesafe.ai/api" target="_blank" rel="noreferrer" className="text-blue-800 underline inline-flex items-center gap-0.5">docs.typesafe.ai/api <ExternalLink size={11} /></a>），后端请求将直接与 <code className="bg-gray-200 px-1 py-0.5 rounded font-mono">jev-latest</code> 进行结构化决策交互。
          </p>

          <div className="mb-3">
            <label className="block font-bold mb-1">官方 System One Endpoint：</label>
            <input
              type="text"
              className="w-full bg-white border-2 border-black p-1.5 font-mono text-xs outline-none"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="block font-bold mb-1">TypeSafe API Key：</label>
            <input
              type="password"
              className="w-full bg-white border-2 border-black p-1.5 font-mono text-xs outline-none"
              placeholder="在此输入你的 TypeSafe 密钥..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          {statusMsg && (
            <div
              className={`mb-3 text-xs font-bold ${
                isSuccess ? 'text-emerald-700' : 'text-retroRed-600'
              }`}
            >
              {statusMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-300">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTest}
              className="bg-white border-2 border-black px-3 py-1 text-xs font-bold shadow-brutal-sm active:translate-y-0.5 disabled:opacity-50"
            >
              {isTesting ? '探测中...' : '测试官方连通性'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-retroRed-600 text-white border-2 border-black px-4 py-1 text-xs font-bold shadow-brutal-sm active:translate-y-0.5"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
