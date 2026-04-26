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
    warning: 'var(--accent-red)',
    success: 'var(--accent-green)',
    info: 'var(--accent-blue)',
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fadeIn"
      style={{ backgroundColor: 'var(--bg-overlay)' }}>
      <div className="w-80 rounded-2xl p-5 shadow-xl animate-scaleIn"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
        }}
      >
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">{iconMap[type]}</div>
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg py-2.5 font-medium text-sm transition-colors"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--card-border)',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-white rounded-lg py-2.5 font-medium text-sm"
            style={{ backgroundColor: colorMap[type] }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
