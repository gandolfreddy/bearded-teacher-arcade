# 大鬍子老師遊戲廣場

Bearded Teacher Arcade · v0.3.0 · 2026-11-03

**網址：https://gandolfreddy.github.io/bearded-teacher-arcade/**

目前四款遊戲：星星貪食蛇、翻牌配對、俄羅斯方塊、鬍子老師的星星小徑。皆支援鍵盤與觸控、暫停／重玩／返回。v0.3.0 本機驗收通過；最新正式發布版本及未驗範圍見 [進度](docs/STATUS.md) 與網站 site-version.json。

## 怎麼玩

| 遊戲 | 鍵盤 | 觸控 |
|---|---|---|
| 星星貪食蛇 | 方向鍵／WASD 轉向 | 畫面方向鍵 |
| 翻牌配對 | 方向鍵選牌，Enter／空白鍵翻牌 | 點按卡片 |
| 俄羅斯方塊 | ← → ↓ 移動；↑／X 順轉、Z 逆轉；Space 硬降；C／Shift Hold | 方向、旋轉、落到底按鈕與 Hold 框 |
| 星星小徑 | ← →／A D 移動，Space／↑／W 跳躍 | 長按左右，另一指點跳躍 |

點選開始後才進行遊戲；失焦會暫停，回來後手動繼續。貪食蛇每顆星星 10 分，碰到邊界或自己就結束。翻牌配對需找出全部 6 組，記錄本輪次數及秒數。方塊提供每顆一次的 Hold、接下來三顆 Next 及落點預覽。小徑需跳過缺口、避開或踩掉小怪並走到終點，星星不必集滿。四款目前皆無音訊與持久存檔。

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

check 檢查 mjs 語法、清單及入口。核心測試含遊戲規則；瀏覽器測試分成外框替身回歸及實際正式遊戲驗收。結果與截圖寫入被 Git 忽略的 test-results/，本版已驗證證據另存 docs/evidence/v0.3.0/。

build 只複製網站到 dist/，包含 site-version.json 供發布版本核對，不包含開發文件、測試、依賴或 Git 資料。

## 目錄與擴充

```text
index.html                  # 網站大廳與外框
games.json                  # 正式遊戲清單
assets/                     # 網站樣式、程式與縮圖
games/                      # 所有遊戲 HTML 入口
  snake.html
  memory.html
  tetris.html
  star-trail.html
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

- [本版新增與驗收界線](docs/FEATURE-v0.3.0.md)
- [v0.2.1 修正紀錄](docs/RELEASE-v0.2.1.md)
- [兩款遊戲與 CI/CD 成果](docs/RELEASE-v0.2.0.md)
- [目前進度](docs/STATUS.md)
- [需求與任務](docs/PLAN.md)
- [遊戲整合契約](docs/GAME_SPEC.md)
- [正式大廳截圖](docs/evidence/v0.3.0/games-lobby-desktop.png)
- [Hold／Next 畫面](docs/evidence/v0.3.0/tetris-hold-next.png)
- [跳躍小徑畫面](docs/evidence/v0.3.0/star-trail-tablet.png)

平板實機與 Safari 等其他引擎尚未驗收；尺寸／觸控模擬不等同實機。沒有資料庫或玩家永久資料。

## 版本與復原

以 Git 提交與 site-version.json 定位程式版本。需要復原時建立回復變更的新提交，再推送 main，讓同一流程重驗及重新部署；不強制改寫歷史。也可用 git worktree add --detach 在新目錄檢查舊版本。程式復原不自動代表玩家資料復原；目前無玩家持久資料，復原演練未執行。
