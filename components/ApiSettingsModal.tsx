'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEndpoint(localStorage.getItem('ask_jev_api_endpoint') || '');
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
        endpoint.trim()
          ? '已保存远程 API 配置！提问时将优先调用该服务。'
          : '已清空远程配置，系统将采用内置高拟真推演引擎。'
      );
      setTimeout(() => {
        onClose();
        setStatusMsg('');
      }, 1200);
    }
  };

  const handleTest = async () => {
    if (!endpoint.trim()) {
      setIsSuccess(false);
      setStatusMsg('请先填写 Endpoint 地址！');
      return;
    }
    setStatusMsg('正在探测接口连通性...');
    setIsSuccess(false);

    try {
      const res = await fetch(endpoint.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {}),
        },
        body: JSON.stringify({ question: 'PING', mode: 'yes_no' }),
      });
      if (res.ok) {
        setIsSuccess(true);
        setStatusMsg(`连接正常！(HTTP ${res.status})`);
      } else {
        setIsSuccess(false);
        setStatusMsg(`服务返回异常状态码：${res.status}`);
      }
    } catch (err: any) {
      setIsSuccess(false);
      setStatusMsg(`无法连接至该接口：${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-retroWin-gray border-3 border-black shadow-brutal w-full max-w-md rounded">
        {/* Titlebar */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-600 text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs">
          <span>TypeSafe Jev 模型接口设置</span>
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
            当项目部署在 Vercel 时，建议直接在 Vercel 环境变量中配置 <code className="bg-gray-200 px-1 py-0.5 rounded">TYPESAFE_JEV_ENDPOINT</code>。也可在此处临时覆盖测试：
          </p>

          <div className="mb-3">
            <label className="block font-bold mb-1">API Endpoint 地址 (POST)：</label>
            <input
              type="text"
              className="w-full bg-white border-2 border-black p-1.5 font-mono text-xs outline-none"
              placeholder="https://your-domain.com/api/jev"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="block font-bold mb-1">API Key (可选 Bearer Token)：</label>
            <input
              type="password"
              className="w-full bg-white border-2 border-black p-1.5 font-mono text-xs outline-none"
              placeholder="typesafe_sk_..."
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
              onClick={handleTest}
              className="bg-white border-2 border-black px-3 py-1 text-xs font-bold shadow-brutal-sm active:translate-y-0.5"
            >
              测试连通性
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
