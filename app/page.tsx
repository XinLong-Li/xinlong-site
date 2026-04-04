'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Root() {
  const router = useRouter();
  const [suggestedLang, setSuggestedLang] = useState<'zh' | 'en'>('en');

  useEffect(() => {
    // Detect browser language for suggestion
    const browserLang = navigator.language.toLowerCase();
    const detected = browserLang.startsWith('zh') ? 'zh' : 'en';
    setSuggestedLang(detected);
  }, []);

  const handleLanguageSelect = (lang: 'zh' | 'en') => {
    localStorage.setItem('preferredLanguage', lang);
    router.push(`/${lang}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 20px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', fontWeight: 700 }}>Xinlong Li</h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '48px', opacity: 0.7 }}>
          Embedded Software Engineer / Robot Motion Control
        </p>

        <p style={{ marginBottom: '32px', fontSize: '1rem' }}>
          Select your language / 选择语言
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleLanguageSelect('en')}
            style={{
              padding: '16px 40px',
              fontSize: '1.1rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: suggestedLang === 'en' ? 'var(--primary, #0066ff)' : '#f0f0f0',
              color: suggestedLang === 'en' ? '#fff' : '#000',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (suggestedLang !== 'en') {
                e.currentTarget.style.backgroundColor = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (suggestedLang !== 'en') {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }
            }}
          >
            English
          </button>

          <button
            onClick={() => handleLanguageSelect('zh')}
            style={{
              padding: '16px 40px',
              fontSize: '1.1rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: suggestedLang === 'zh' ? 'var(--primary, #0066ff)' : '#f0f0f0',
              color: suggestedLang === 'zh' ? '#fff' : '#000',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (suggestedLang !== 'zh') {
                e.currentTarget.style.backgroundColor = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (suggestedLang !== 'zh') {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }
            }}
          >
            中文
          </button>
        </div>

        <p style={{ marginTop: '48px', fontSize: '0.85rem', opacity: 0.6 }}>
          {suggestedLang === 'zh' ? '系统检测到你使用中文' : 'Detected your language preference'}
        </p>
      </div>
    </div>
  );
}
