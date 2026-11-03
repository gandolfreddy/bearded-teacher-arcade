# 目前進度與驗證紀錄

更新：2026-11-03；版本 v0.5.0；狀態：本機、遠端與正式站驗收完成。

首頁改為 2.5D 像素全景遊戲島；點按移動、右上小地圖、六間遊戲小屋。每次開啟網站先登入／註冊，角色可選頭髮、性別、表情與衣著。使用者後續明確改採 localStorage，無 Firebase／雲端設定，也無多人在線功能；帳號不設密碼，資料限定此瀏覽器，清除網站資料會移除角色。

50 項規則及 75 項獨立 Playwright 案例通過。完整需求、變更、驗證與限制見 [本版紀錄](ISLAND-v0.5.0.md)；本機證據位於 evidence/v0.5.0/。本版遠端與正式站結果獨立記錄如下。

未驗：平板實機、Safari、完整 bfcache 裝置矩陣、長時間效能與休眠；本機儲存不提供跨裝置同步或多分頁原子交易。裝置驗收期限與負責人未指定。單代理；無新增依賴、付費服務、音訊或正式 SOP。沿用免費公開標準 Linux CI／Pages。

## 遠端與正式站

發布程式提交 7734de5ab2ed67c314daf4675faa128eb2d4bb14（v0.5.0）。[GitHub Actions 41608049742](https://github.com/gandolfreddy/bearded-teacher-arcade/actions/runs/41608049742) 的 test／deploy 均 completed/success，Pages deployment 7514592199 成功。遠端完整 50 項規則、75 項瀏覽器案例及 build 通過；單一網站產物 60,379 bytes，保留 1 天，沿用公開標準 Linux 免費 CI/CD。

正式站 site-version.json 已核對 0.5.0 與完整提交一致。獨立 Playwright 六款遊戲限定 smoke 通過，另在正式站執行全部 14 項島嶼案例通過：真實表單註冊／登入、外觀與位置儲存、重新載入登入、走到小屋進入／返回、小地圖／鍵盤／觸控、損毀／儲存失敗重試及跨分頁更新；儲存失敗以故障注入模擬，沒有修改使用者日常瀏覽器。不同 context 驗證無跨瀏覽器共享，不宣稱雲端同步。完整六款遊戲通關與玩法為本機／CI 範圍，正式站遊戲操作僅 smoke。

證據：evidence/v0.5.0/ 中 source-sha256.json（70 個來源檔讀回無差異）、五套本機瀏覽器報告、截圖、ci-report.json、deployment-report.json、artifacts-report.json、live-report.json、live-island-browser-report.json 與正式站截圖。原始 CC0 PNG 與下載素材 SHA256 比對相同，授權文字隨素材發布。後續驗收文件提交與網站程式提交分開定位，不重新部署。
