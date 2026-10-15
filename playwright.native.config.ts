import base from './playwright.v3.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:'**/nativeSurfaces.ts',workers:1,use:{...base.use,headless:false}});
