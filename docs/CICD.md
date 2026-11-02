# 免費範圍內的 CI/CD

日期：2026-11-03。目標：gandolfreddy/bearded-teacher-arcade，公開儲存庫、main 分支。使用者明確要求加入 GitHub Actions CI/CD 並繼續開發。

## 費用與觸發

官方規則：公開儲存庫的標準 GitHub-hosted runner 執行免費；私有儲存庫依方案有免費額度與超額計費。本案只採標準 ubuntu-latest，且 test 工作設公開儲存庫條件；若改成私有，工作直接略過，不自行啟用付費執行器。未購買服務、未修改帳務設定、未使用大型執行器。

沒有排程，僅 main 原始碼變更、指向 main 的 pull request 與手動執行。文件／圖片驗證證據的更新不觸發，避免只改工作紀錄也執行完整測試。PR 不部署；main push 測試通過才部署。更新同分支會取消舊工作，避免重複消耗；部署本身序列執行。

每次僅一個測試工作（上限 10 分鐘）與一個部署工作（上限 5 分鐘）。不建立 npm／瀏覽器持久快取，不上傳測試截圖／錄影。Pages 產物只保留 1 天，內容限網站，不含 node_modules、tests、tools 或 docs。這些設定減少儲存用量，不代表可無限上傳產物；若未來大量加入影音需再檢查容量，未查核帳號其他專案的合併用量。

## 驗證與發布

npm ci → 語法／清單檢查 → 核心測試 → 單一 Chromium headless 瀏覽器測試 → dist/ 打包 → Pages 產物 → 部署。

使用 GitHub 官方 actions，固定至 2026-11-03 查核的 commit SHA。預設 token 僅 contents: read，只有部署工作具有 pages: write 與 id-token: write；checkout 不保留憑證。無額外 PAT、雲端帳號或 API 金鑰。

本機相同檢查：npm run check、npm test、npm run test:browser:ci、npm run build。測試工具自動啟停本輪預覽服務。預設本機使用已安裝 Chrome；CI 使用 Playwright 安裝的 Chromium headless shell，BTA_BROWSER=chromium。

build 產生 site-version.json，含版本與提交 SHA，供上線後比對。建置僅複製 index.html、games.json、.nojekyll、assets/、games/。此設定不將儲存庫內的開發文件直接發布成網站。

## 狀態及復原

本輪 v0.1.1 本機 11 項核心及 17 項 Playwright 案例通過；遠端執行結果與實際 Pages 版本需另查，不能把本機通過或 queued 狀態當成遠端成功。最新進度見 STATUS.md。

如果發現已發布缺陷，保留目前提交，建立復原提交回復有問題的變更，再 push main 讓同一流程重新驗證與部署；不強制改寫歷史。本案目前沒有玩家持久資料，未做復原演練。

## 來源

2026-11-03 查核：
- https://docs.github.com/en/actions/concepts/billing-and-usage
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site
- actions/checkout v6、setup-node v6、configure-pages v5、upload-pages-artifact v4、deploy-pages v4 的官方 tags。

## 最終驗收接續

v0.2.1 遠端 run 41503730869 的 test／deploy 與整輪均 success；正式站 site-version.json 與發布提交 869e655 一致，獨立 Playwright smoke 通過。本輪部署產物 19,098 bytes、保留 1 天。詳見 RELEASE-v0.2.1.md 與其 evidence。只更新 docs／README 的最後證據提交不另觸發 CI。
