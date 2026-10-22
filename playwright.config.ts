import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'tests/e2e',fullyParallel:true,workers:2,retries:0,reporter:'list',use:{baseURL:process.env.BASE_URL,trace:'off'},projects:[{name:'pixel-chrome',use:{...devices['Pixel 7']}},{name:'iphone-webkit',use:{...devices['iPhone 13']}}]});
