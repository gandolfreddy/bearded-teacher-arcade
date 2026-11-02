# 目前進度與驗證紀錄

更新：2026-11-03；程式版本 v0.4.0／7cbc3ec；狀態：本機、遠端 CI／Pages 與正式站限定驗收完成。

新增直線賽車避障（三車道、按住減速、來車碰撞、1000 公尺終點）與迷你撞球（六球清台、觸控／數值瞄準、力道、球碰撞／反彈、白球犯規回位）。所有入口統一 games/，大廳共六款。

40 項規則與 60 項獨立 Playwright 案例通過；新遊戲正常操作完整過關、暫停、重玩、觸控取消及四種尺寸操作區有驗證。詳見 [本版紀錄](FEATURE-v0.4.0.md) 與 [受驗檔案](evidence/v0.4.0/source-sha256.json)。遠端 [run 41516591674](https://github.com/gandolfreddy/bearded-teacher-arcade/actions/runs/41516591674) 的 test／deploy 均完成且成功。Pages deployment 7502224781 成功；正式站 site-version.json 的版本 0.4.0 與完整 SHA 7cbc3ec9df1c339410c0e5febf768518501a670f 核對一致，六款 smoke 操作通過。證據分別儲存 ci-report.json、deployment-report.json、live-report.json；部署產物 35,080 bytes，保留 1 天。後續 docs-only 提交不代表重新部署程式。

未驗：平板實機、Safari／其他引擎、長時間效能、休眠。沿用免費公開標準 Linux CI/CD；無新增依賴、音訊或持久資料。單代理自我覆核，未委派，未宣稱切換模型；完整代號／推理強度與精確總耗時未取得。裝置驗收期限／負責人未指定。無新增或修改 Notes 正式 SOP。
