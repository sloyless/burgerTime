import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#c2410c',
    colorLink: '#c2410c',
    colorLinkHover: '#9a3412',
    borderRadius: 10,
    fontFamily:
      'Roboto, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji',
    colorBgContainer: '#ffffff',
    colorBorder: '#e7e5e4',
  },
  components: {
    Form: {
      labelFontSize: 14,
      verticalLabelPadding: '0 0 6px',
    },
    Button: {
      fontWeight: 600,
    },
  },
};
