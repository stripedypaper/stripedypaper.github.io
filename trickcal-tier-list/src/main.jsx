import React from 'react';
import ReactDOM from 'react-dom/client';
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import './styles.css';
import { App } from './App.jsx';

const theme = createTheme({
  primaryColor: 'orange',
  fontFamily:
    '"Segoe UI Variable", "Avenir Next", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif',
  headings: {
    fontFamily:
      '"Segoe UI Variable", "Avenir Next", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif',
    fontWeight: '700'
  },
  defaultRadius: 'lg'
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="bottom-right" zIndex={1000} />
      <App />
    </MantineProvider>
  </React.StrictMode>
);
