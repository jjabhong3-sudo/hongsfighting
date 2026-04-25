// ============================================================
// 인앱 알림 모달 (window.confirm 대체)
// ============================================================

'use client';

import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'success' | 'info';
}

export default function AlertModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  type = 'warning',
}: AlertModalProps) {
  if (!isOpen) return null;

  const iconMap = {
    warning: '⚠️',
    success: '✅',
    info: 'ℹ️',
  };

  const colorMap = {
    warning: 'bg-orange-500',
    success: 'bg-green-500',
    info: 'bg-blue-500',
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-white w-80 rounded-2xl p-5 shadow-xl">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">{iconMap[type]}</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 whitespace-pre-line">{message}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-2.5 font-medium text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 text-white rounded-lg py-2.5 font-medium text-sm ${colorMap[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
