import {expect} from '@playwright/test';
import {profileFor,DEFAULT_APPEARANCE} from '../../assets/js/island-model.mjs';
import {STORAGE_KEY} from '../../assets/js/island-store.mjs';
const fixture=profileFor('browser_test',DEFAULT_APPEARANCE,'2026-11-03T00:00:00.000Z');
export async function signInTestAccount(page){
  if(page.url().includes('/games/'))return;
  await expect(page.locator('#account-gate')).toBeVisible();await expect(page.locator('#account-status')).toContainText('地圖準備好了');
  await page.locator('#account-name').fill('browser_test');await page.locator('#account-submit').click();await expect(page.locator('#account-gate')).toBeHidden();
}
export async function enableTestAccount(page){
  await page.addInitScript(({key,fixture})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,profiles:[fixture]}));},{key:STORAGE_KEY,fixture});
  for(const method of ['goto','reload','goBack','goForward']){
    const original=page[method].bind(page);
    page[method]=async(...args)=>{
      if(method==='goto'){const url=new URL(args[0]);if(!url.pathname.includes('/games/'))url.searchParams.set('view','collection');args[0]=url.href;}
      const response=await original(...args);
      if(!page.url().includes('/games/')&&await page.locator('#account-gate').isVisible())await signInTestAccount(page);
      return response;
    };
  }
}
