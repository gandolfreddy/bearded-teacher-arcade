# 大鬍子老師遊戲廣場

英文暫名：Bearded Teacher Arcade；專案名稱：`bearded-teacher-arcade`。  
目前版本：v0.1.0（網站骨架）；更新日期：2026-11-03。

網站大廳、搜尋、網址路由、單一 iframe 載入、返回／重玩及錯誤重試已實作。目前收錄「方向操控練習」與「觸控節奏練習」兩個操作測試頁，正式遊戲尚未加入。名稱仍可調整，不推定 GitHub 名稱或商標可用性。

## 本機啟動

網站執行本身無第三方套件依賴。已安裝 Node.js 時，在 PowerShell 執行：

```powershell
Set-Location -LiteralPath 'C:\Users\loveh\Desktop\Data\Side_projects\Web_dev_projects\bearded-teacher-arcade'
npm run dev
```

開啟 <http://127.0.0.1:5193/bearded-teacher-arcade/>。需保持這個終端工作階段執行；停止按 Ctrl+C。伺服器僅綁定 127.0.0.1，這個網址不能直接從其他平板連入。不要以 file:// 開啟 index.html。
如通訊埠已被使用，先檢查既有服務；可在本次 PowerShell 工作階段設定 `$env:PORT = '5194'` 後重新啟動，不自行關閉其他行程。

## 開發驗證

```powershell
npm ci
npm test
npm run dev
```

在另一個位於同一專案的 PowerShell 工作階段執行：

```powershell
npm run test:browser
```

瀏覽器測試採 Playwright 的獨立 Chrome session，需已安裝 Google Chrome；不使用你日常的瀏覽器分頁／登入資料。測試依賴 @playwright/test 由 package-lock.json 鎖定，只供開發，網站使用者不需安裝。結果與截圖寫入被 Git 忽略的 test-results/。

## 架構與新增遊戲

```text
index.html                    # 固定外框及大廳
assets/css/site.css           # 響應式版面
assets/js/app.mjs             # 清單、DOM、hash 路由
assets/js/core.mjs            # 清單驗證與遊戲工作階段
games.json                    # 遊戲清單
games/                        # 所有遊戲 HTML 入口
  direction-lab.html          # 鍵盤／方向控制測試頁
  touch-lab.html              # 點按控制測試頁
  assets/demo.css
  assets/demo.mjs
tools/serve.mjs               # 僅供本機預覽
tests/                        # 核心與 Playwright 測試
docs/                         # 規劃、契約與驗證證據
```

遊戲網址使用 `#game=<id>`；切換時卸載舊 iframe，同時只載入一款。遊戲 HTML 一律放在 games/，專用素材可放在 games/assets/<game-id>/。各遊戲可獨立以 HTTP 網址開啟。
新增遊戲需放入 HTML、更新 games.json，並實作 ready／error／pause／focus 契約；不需為每款遊戲修改外框邏輯。`kind: "demo"` 顯示操作示範標籤，正式遊戲可省略或使用 `kind: "game"`。

## 文件與畫面

- [需求、任務及驗收計畫](docs/PLAN.md)
- [遊戲整合契約](docs/GAME_SPEC.md)
- [目前進度](docs/STATUS.md)
- [驗證報告與已知限制](docs/VALIDATION.md)
- [桌機大廳截圖](docs/evidence/lobby-desktop.png)
- [平板尺寸大廳截圖](docs/evidence/lobby-tablet.png)
- [平板尺寸操作頁截圖](docs/evidence/player-tablet.png)

## GitHub Pages 與復原

本版未建立遠端或部署。預計發布根目錄靜態檔，保留 .nojekyll；網站使用相對路徑與 hash 路由，已在本機 /bearded-teacher-arcade/ 子路徑測試。這不代表正式 Pages 環境已驗收。發布前另確認擁有者、儲存庫、可見性與發布授權。

若需檢視已驗版本，先用 `git log --oneline` 找到 v0.1.0 的網站骨架提交，再於另一個目錄使用 `git worktree add --detach <新目錄> <提交識別碼>` 建立副本；不強制重設現有工作目錄。副本如需重跑瀏覽器測試，依鎖定檔執行 npm ci。這一版無玩家持久資料；未實測 worktree 復原程序，不以提交存在宣稱已完成復原演練。

## CI/CD（v0.1.1 接續）

已加入 [免費範圍內的 CI/CD](docs/CICD.md)：main 原始碼 push 與 PR 自動測試，只有 main 通過後部署 GitHub Pages。支援 `npm run check`、`npm run test:browser:ci` 自動啟停預覽與 `npm run build` 最小發布包。正式遠端結果見 docs/STATUS.md，不以本機測試取代遠端驗收。
