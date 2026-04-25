// ============================================================
// 하단 탭 바 (메인/월간/설정)
// ============================================================

'use client';

import React from 'react';

export type TabType = 'main' | 'monthly' | 'settings';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'main', label: '메인', icon: '🏠' },
  { key: 'monthly', label: '월간', icon: '📅' },
  { key: 'settings', label: '설정', icon: '⚙️' },
];

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600'
                : 'text-gray-400'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-xs mt-0.5 font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
