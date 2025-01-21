import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from 'fs';
import path from 'path';

// Custom plugin to log to file
const logToFile = () => ({
  name: 'log-to-file',
  configureServer(server) {
    const logFile = path.join(__dirname, 'debug.log');
    
    // Clear log file on start
    fs.writeFileSync(logFile, '');
    
    // Log startup
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] Starting debug log\n`);
    
    // Override console methods
    const methods = ['log', 'info', 'warn', 'error'];
    methods.forEach(method => {
      const original = console[method];
      console[method] = (...args) => {
        original.apply(console, args);
        try {
          const timestamp = new Date().toISOString();
          const logLine = `[${timestamp}][${method}] ${args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg
          ).join(' ')}\n`;
          fs.appendFileSync(logFile, logLine);
        } catch (err) {
          original.apply(console, ['Error writing to log:', err]);
        }
      };
    });
  }
});

export default defineConfig({
  plugins: [react(), logToFile()],
  server: {
    open: true,
    port: 3000,
    host: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000
    },
    cors: true,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  },
  preview: {
    port: 5000
  },
  build: {
    outDir: "dist",
    sourcemap: true
  }
});
