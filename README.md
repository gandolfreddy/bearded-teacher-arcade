# 大鬍子老師遊戲廣場 · 遊戲島

Bearded Teacher Arcade · v0.5.0 · 2026-11-03

**網址：https://gandolfreddy.github.io/bearded-teacher-arcade/**

以 2.5D 像素全景島探索六款小遊戲。每次開啟網站先登入／註冊；註冊可選頭髮、性別、表情與衣著。點按地圖或右上角小地圖讓角色移動，走到遊戲小屋門口，再按「進入遊戲」。也可用遊戲導覽或原遊戲清單。v0.5.0 已完成本機、遠端與正式站驗收，發布程式提交 7734de5；驗收範圍見 [目前進度](docs/STATUS.md)。

## 帳號與資料

帳號只輸入名稱、不用密碼；知道名稱的人都能在同一瀏覽器使用該角色。這是使用者已選擇的本機角色識別方式，不提供身分驗證。

本版依使用者後續指示採 localStorage，儲存帳號、外觀與島上位置。資料限定目前瀏覽器與網站來源，不會跨裝置同步，清除網站資料會移除角色；Firebase 與多人在線延後。移動停止後合併儲存，失敗會顯示「尚未儲存」並可重試。格式損毀不默默覆寫；舊分頁版本衝突需重新登入，localStorage 無跨分頁交易保證。

## 怎麼玩

島上以點按移動為主；方向鍵可微調，Enter 進入附近遊戲。「遊戲導覽」提供可用鍵盤選擇的目的地。無法穿過海水、樹與小屋。每個本機帳號有自己的外觀與位置，這版只顯示自己的角色。

| 遊戲 | 鍵盤 | 觸控 |
|---|---|---|
| 星星貪食蛇 | 方向鍵／WASD | 畫面方向鍵 |
| 翻牌配對 | 方向鍵選牌，Enter／空白鍵翻牌 | 點按卡片 |
| 俄羅斯方塊 | ← → ↓ 移動，↑／X／Z 旋轉，Space 硬降，C／Shift Hold | 方向／旋轉／落到底／Hold |
| 星星小徑 | ← →／A D 移動，Space／↑／W 跳躍 | 左右與跳躍 |
| 直線賽車 | ← →／A D 換道，Space／↓／S 減速 | 換道／減速 |
| 迷你撞球 | ← → 轉向，↑ ↓ 調力道，Space／Enter 擊球 | 瞄準／力道／擊球 |

六款遊戲仍位於 games/，用 iframe 切換並在返回時卸載；遊戲分數不存檔，沒有音訊。既有獨立遊戲 HTML 保留操作方式，網站入口的角色登入在 index.html 實施。美術直接套用 Kenney Tiny Town／Tiny Dungeon CC0 原始 PNG，加上地圖組裝與人物外觀修改，來源與原授權見 [素材清單](assets/images/island/CREDITS.md)。

## 本機預覽

需已安裝 Node.js：

```powershell
Set-Location -LiteralPath 'C:\Users\loveh\Desktop\Data\Side_projects\Web_dev_projects\bearded-teacher-arcade'
npm run dev
```

開啟 http://127.0.0.1:5193/bearded-teacher-arcade/，停止按 Ctrl+C。預覽只綁定本機 127.0.0.1，平板可使用上方正式 Pages 網址。網站執行無第三方前端套件，不以 file:// 為支援入口。

## 開發驗證與打包

```powershell
npm ci
npm run check
npm test
npm run test:browser:ci
npm run build
```

瀏覽器測試會自動啟停本輪預覽，須先停止佔用 5193 的本專案服務；不自行結束其他程式。預設使用已安裝 Google Chrome 的獨立 Playwright session，不沿用你的日常分頁或登入資料。@playwright/test 版本由 package-lock.json 鎖定；CI 安裝單一 Chromium headless shell。

check 檢查 mjs 語法、清單及入口。核心測試含遊戲規則；瀏覽器測試分成外框替身回歸及實際正式遊戲驗收。結果與截圖寫入被 Git 忽略的 test-results/，本版已驗證證據另存 docs/evidence/v0.5.0/。

build 只複製網站到 dist/，包含 site-version.json 供發布版本核對，不包含開發文件、測試、依賴或 Git 資料。

## 目錄與擴充

```text
index.html                  # 遊戲島、帳號介面、遊戲清單與外框
games.json                  # 正式遊戲清單
assets/                     # 島嶼／角色／本機儲存、樣式與 CC0 素材
games/                      # 所有遊戲 HTML 入口
  snake.html
  memory.html
  tetris.html
  star-trail.html
  road-racer.html
  mini-pool.html
  direction-lab.html        # 舊操作測試頁，正式清單不列出
  touch-lab.html
  assets/                   # 遊戲規則、共用生命週期與個別程式
tests/                      # 規則測試、外框／正式遊戲瀏覽器案例
tools/                      # 預覽、檢查與打包
.github/workflows/pages.yml # 測試成功才部署
docs/                       # 規劃、整合契約、歷史與證據
```

遊戲入口一律 games/<id>.html，以 hash #game=<id> 切換，並卸載舊 iframe。新增遊戲需更新 games.json、提供入口與素材、遵守 [整合契約](docs/GAME_SPEC.md)。不需為每款遊戲修改外框邏輯。名稱仍可調整。

## CI/CD 與費用

公開儲存庫使用標準 ubuntu-latest；main 原始碼 push 與 PR 才測試，無排程。PR 不部署，main 測試通過後發布 GitHub Pages。只有部署工作有 Pages／OIDC 寫入權限，官方 actions 固定 SHA。

不使用大型執行器、持久 npm／瀏覽器快取或額外付費服務。只上傳小型網站部署產物且保留 1 天。儲存庫若改成私有，test 工作會直接略過，避免消耗私有方案額度；不自行改帳務設定。完整條件與官方來源見 [CI/CD 說明](docs/CICD.md)。

## 文件與畫面

- [本版遊戲島需求與驗收](docs/ISLAND-v0.5.0.md)
- [v0.4.1 球陣修正](docs/RELEASE-v0.4.1.md)
- [v0.4.0 新增遊戲](docs/FEATURE-v0.4.0.md)
- [v0.2.1 修正紀錄](docs/RELEASE-v0.2.1.md)
- [兩款遊戲與 CI/CD 成果](docs/RELEASE-v0.2.0.md)
- [目前進度](docs/STATUS.md)
- [需求與任務](docs/PLAN.md)
- [遊戲整合契約](docs/GAME_SPEC.md)
- [遊戲島全景](docs/evidence/v0.5.0/island-desktop.png)
- [角色建立](docs/evidence/v0.5.0/island-register.png)
- [賽車終點](docs/evidence/v0.4.0/road-racer-finish.png)
- [迷你撞球](docs/evidence/v0.4.0/mini-pool.png)

平板實機與 Safari 等其他引擎尚未驗收；尺寸／觸控模擬不等同實機。角色資料僅儲存在目前瀏覽器 localStorage；無雲端資料庫。

## 版本與復原

以 Git 提交與 site-version.json 定位程式版本。需要復原時建立回復變更的新提交，再推送 main，讓同一流程重驗及重新部署；不強制改寫歷史。也可用 git worktree add --detach 在新目錄檢查舊版本。程式復原不自動代表玩家資料復原；目前角色資料位於瀏覽器 localStorage，程式復原不會自動備份或還原角色；復原演練未執行。
