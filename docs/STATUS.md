# 目前進度與驗證紀錄

更新：2026-11-03；程式版本 v0.4.1；狀態：本機、遠端 CI／部署與正式站驗收完成。

迷你撞球改為六球 1／2／3 排三角形開球陣，左側白球，預設向右 0 度、力道 85%；重玩回復球陣。大廳仍為六款，入口均在 games/。

41 項規則測試與 16 項受影響 Playwright 案例通過，包含三角形排球／開球散開、七桿一般操作清台、重玩、暫停、觸控取消與四種尺寸。詳細記錄見 [v0.4.1](RELEASE-v0.4.1.md)。v0.4.0 遠端成功不視為本版發布證據。

平板實機、Safari、長時間效能與休眠未驗；裝置驗收期限／負責人未指定。單代理，未新增依賴、付費服務、音訊或持久資料，無新增正式 SOP。

發布程式提交 5df3981e930d80b6bf957ad4623b2299a14858f7；[CI 41603497285](https://github.com/gandolfreddy/bearded-teacher-arcade/actions/runs/41603497285) 的 test／deploy 均 completed/success，Pages deployment 7513945488 成功。遠端執行完整 41 項規則及 61 項瀏覽器案例。本機執行 41 項規則及受影響 16 項瀏覽器案例。正式站 site-version.json 已核對 0.4.1 與完整提交一致，六款限定 smoke 通過，包含左側白球、一般開球與等待停球；完整清台為本機／CI 的驗證範圍。證據見 evidence/v0.4.1/ 的 ci-report、deployment-report、artifacts-report、live-report 與 source-sha256.json。文件收尾提交與發布程式分開，不重新部署。
