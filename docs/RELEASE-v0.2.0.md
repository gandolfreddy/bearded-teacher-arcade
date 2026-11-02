# v0.2.0：兩款遊戲與免費 CI/CD

日期：2026-11-03；狀態：本機驗收通過，正式遊戲的遠端 CI／上線驗收待續記。

## 需求與範圍

使用者確認已推送遠端，要求加入免費額度內的 GitHub Actions，核對後繼續開發。本輪先核對公開儲存庫 gandolfreddy/bearded-teacher-arcade、main 及來源提交 7226610，加入 CI/CD，再完成 T03／T04 的兩款遊戲。

## 已完成

- 星星貪食蛇：12×12 棋盤、方向鍵／WASD／畫面方向鍵、食物與得分、禁止反向與單 tick 多重轉向、碰牆／碰身體結束、滿格勝利、暫停與重玩。
- 翻牌配對：洗牌後 12 張卡／6 組、鍵盤方向選牌與 Enter／空白鍵翻牌、觸控翻牌、不配對延遲蓋回且鎖第三張、配對鎖定、步數／計時、完成訊息、暫停與重玩。
- 大廳正式清單只列兩款遊戲；兩個舊操作示範保留為回歸測試替身，不當作正式遊戲。HTML 入口仍全部位於 games/。
- 共用 GameHost 統一啟動、暫停、計時、訊息與卸載；遊戲核心規則獨立於畫面，可直接測試。兩款遊戲沒有音訊、帳號、網路服務或持久存檔。
- 自行製作 SVG 縮圖，保留既有大鬍子老師視覺與響應式外框。

## 本機驗證

Node.js v22.17.0、npm 11.21.1、Playwright 1.64.1、獨立 Chrome headless。

- npm run check：所有 mjs 語法、清單與入口存在檢查通過。
- npm test：18／18 核心規則測試通過。新增正常吃食物、禁止反向、碰撞、移入尾格、滿格、洗牌配對完整性、等待鎖定與勝利規則。
- 外框 Playwright：17／17 通過。使用 tests/fixtures/catalog.json 提供舊操作示範的清單，測試替身不取代真實清單驗收。
- 正式遊戲 Playwright：12／12 通過。使用實際 games.json，驗證正式大廳、貪食蛇轉向／碰牆／重玩、失焦暫停後不移動或計時、翻牌鍵盤、延遲鎖定／暫停／恢復、整場 6 組配對成功、兩款獨立開啟及歷史頁恢復。
- 1280×720、1024×768、768×1024、390×844：兩款觸控模擬可操作、橫直尺寸互換後可繼續操作、無水平溢出、方向與卡片按鈕至少 44×44 CSS 像素。
- npm run build：只打包網站到 dist/，不含開發文件、測試或依賴。

[外框報告](evidence/v0.2.0/browser-report.json)、[正式遊戲報告](evidence/v0.2.0/games-browser-report.json)、[受驗檔案 SHA256](evidence/v0.2.0/source-sha256.json)。

已檢視 [正式大廳](evidence/v0.2.0/games-lobby-desktop.png) 與 [平板尺寸配對頁](evidence/v0.2.0/memory-tablet.png) 截圖。單代理自我覆核，非獨立覆核。

首次正式遊戲觸控尺寸測試失敗：測試時鐘在 runFor 後仍隨真實時間前進，版面查核期間小蛇已多移動幾格。修正測試為 pauseAt 固定時鐘，只在明確推進時移動，再重跑 12 項全數通過。原始失敗報告保留在被忽略的 test-results/games-browser-report.initial.json。這是測試時序修正，不用放寬遊戲規則掩蓋差異。

## CI/CD 與版本

CI/CD 提交 cca747f 已推送，Pages 設為 workflow、維持公開。第一輪遠端 CI 與 deploy 均 success：
https://github.com/gandolfreddy/bearded-teacher-arcade/actions/runs/41501025257

實際讀回 site-version.json 為 0.1.1／cca747f6476b1a782e7dc6e88a141a774d44053e，證明該輪已部署。部署產物 12,719 bytes，保留 1 天；公開儲存庫標準 ubuntu-latest，未使用大型執行器、排程、持久快取或付費服務。來源與限制見 CICD.md。

v0.2.0 的遠端結果及實際發布 SHA 需待本輪推送後另行查核；不把 v0.1.1 成功當作新遊戲已發布。

## 未驗與後續

平板實機、Safari／其他瀏覽器引擎、完整多指／pointercancel 裝置矩陣、長時間效能與復原演練仍未完成。沒有音訊，未聲稱音訊測試通過；沒有存檔，未聲稱跨裝置／持久資料驗收。暫停目前驗焦點離開與訊息路徑，不代表各作業系統休眠／鎖屏皆已實測。

下一步是依使用者實際平板環境完成驗收，再決定分類／收藏／本機最高分或更多遊戲。期限／負責人未指定。本輪不新增或修改 Notes 正式 SOP。
