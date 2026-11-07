import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const root = process.cwd();
  return {
    resolve: {
      alias: {
        '@': root,
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(root, 'index.html'),
          verify: path.resolve(root, 'pages/verify.html'),
          selfie: path.resolve(root, 'pages/selfie.html'),
          success: path.resolve(root, 'pages/success.html'),
          gallery: path.resolve(root, 'pages/gallery.html'),
          adminLogin: path.resolve(root, 'pages/admin-login.html'),
          adminDashboard: path.resolve(root, 'pages/admin-dashboard.html'),
          members: path.resolve(root, 'pages/members.html'),
          accessLogs: path.resolve(root, 'pages/access-logs.html'),
          mediaManager: path.resolve(root, 'pages/media-manager.html'),
          settings: path.resolve(root, 'pages/settings.html'),
        },
      },
    },
  };
});
