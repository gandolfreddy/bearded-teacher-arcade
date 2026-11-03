import {normalizeAccount,validateAppearance,validPosition,profileFor,SPAWN} from './island-model.mjs';
export const STORAGE_KEY='bta.island.profiles.v1';
export class IslandStore{
  constructor(storage){this.storage=storage;}
  read(){
    let raw;try{raw=this.storage.getItem(STORAGE_KEY);}catch{throw new Error('此瀏覽器無法讀取本機資料，請允許網站儲存資料後重試。');}
    if(raw===null)return [];
    try{
      if(raw.length>2_000_000)throw new Error();const data=JSON.parse(raw);
      if(data.version!==1||!Array.isArray(data.profiles)||data.profiles.length>500)throw new Error();
      const accounts=new Set();return data.profiles.map(p=>{
        if(!p||normalizeAccount(p.account)!==p.account||accounts.has(p.account)||!Number.isInteger(p.revision)||p.revision<0||typeof p.createdAt!=='string'||typeof p.updatedAt!=='string')throw new Error();
        accounts.add(p.account);return {account:p.account,appearance:validateAppearance(p.appearance),position:validPosition(p.position)?{...p.position}:{...SPAWN},createdAt:p.createdAt,updatedAt:p.updatedAt,revision:p.revision};
      });
    }catch{throw new Error('本機角色資料格式有問題，尚未覆寫原始資料。請先備份瀏覽器資料再處理。');}
  }
  write(profiles){try{this.storage.setItem(STORAGE_KEY,JSON.stringify({version:1,profiles}));}catch{throw new Error('儲存失敗：瀏覽器空間不足或禁止儲存。資料尚未儲存，請重試。');}}
  login(account){const name=normalizeAccount(account),profile=this.read().find(p=>p.account===name);if(!profile)throw new Error('找不到這個帳號，請先註冊角色。');return structuredClone(profile);}
  register(account,appearance){const p=profileFor(account,appearance),profiles=this.read();if(profiles.some(v=>v.account===p.account))throw new Error('這個帳號已經存在，請改用登入。');if(profiles.length>=500)throw new Error('此瀏覽器的角色數量已達上限。');this.write([...profiles,p]);return structuredClone(p);}
  save(profile){
    const account=normalizeAccount(profile.account),appearance=validateAppearance(profile.appearance);if(!validPosition(profile.position))throw new Error('角色位置無效，尚未儲存。');
    const profiles=this.read(),index=profiles.findIndex(p=>p.account===account);
    if(index<0||profiles[index].revision!==profile.revision)throw new Error('這個角色已在其他分頁更新。請重新登入，取得最新資料。');
    const next={...profiles[index],appearance,position:{...profile.position},updatedAt:new Date().toISOString(),revision:profile.revision+1};profiles[index]=next;this.write(profiles);return structuredClone(next);
  }
}
