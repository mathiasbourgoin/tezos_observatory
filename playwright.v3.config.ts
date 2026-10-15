import base from './playwright.config';
export default {...base,testMatch:['**/*.spec.ts','**/v3Release.ts'],workers:2,use:{...base.use,baseURL:'http://127.0.0.1:5188'},webServer:{command:'npm run build && npm exec vite preview -- --host 127.0.0.1 --port 5188 --strictPort',port:5188}};
