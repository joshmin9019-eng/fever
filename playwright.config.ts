import { defineConfig, devices } from '@playwright/test';
const port=process.env.FEVER_E2E_PORT??'3107';
const baseURL=`http://127.0.0.1:${port}`;
export default defineConfig({testDir:'./tests',use:{baseURL,launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}},projects:[{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}},{name:'desktop',use:{...devices['Desktop Chrome']}}],webServer:{command:`PORT=${port} npm run dev`,url:baseURL,env:{NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:''},reuseExistingServer:false},reporter:'list'});
