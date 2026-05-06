import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'primary': '#000666',
        'primary-container': '#1a237e',
        'on-primary': '#ffffff',
        'on-primary-container': '#8690ee',
        'primary-fixed': '#e0e0ff',
        'primary-fixed-dim': '#bdc2ff',
        'secondary': '#006b5f',
        'secondary-container': '#8df5e4',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#007165',
        'secondary-fixed-dim': '#70d8c8',
        'background': '#f8f9fa',
        'surface': '#f8f9fa',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f4f5',
        'surface-container': '#edeeef',
        'surface-container-high': '#e7e8e9',
        'surface-bright': '#f8f9fa',
        'on-surface': '#191c1d',
        'on-surface-variant': '#454652',
        'outline': '#767683',
        'outline-variant': '#c6c5d4',
        'error': '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'label-caps': ['12px', { lineHeight: '16px', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-lg': ['30px', { lineHeight: '38px', fontWeight: '700' }],
        'display-course-code': ['14px', { lineHeight: '20px', fontWeight: '700', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '12px',
        md: '24px',
        lg: '48px',
        gutter: '24px',
        margin: '32px',
      },
    },
  },
  plugins: [],
};

export default config;