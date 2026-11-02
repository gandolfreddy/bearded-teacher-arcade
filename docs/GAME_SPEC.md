# 遊戲收錄與整合契約

版本：專案整合規格 v0.4.0；日期：2026-11-03；狀態：六款遊戲已整合，各版驗收界線見對應紀錄。

## 一、入口與內容清單

所有遊戲入口為 games/ 下的 HTML；id 使用小寫英數字與連字號且唯一，不以可變動的中文顯示名稱當路由識別碼。
games.json 格式範例如下；正式遊戲內容以根目錄清單為準：

```json
{
  "schemaVersion": 1,
  "games": [
    {
      "id": "snake",
      "title": "貪食蛇",
      "description": "控制方向、收集食物並避開身體。",
      "entry": "./games/snake.html",
      "thumbnail": "./assets/images/snake.webp",
      "category": "反應",
      "inputs": ["keyboard", "touch"],
      "instructions": {
        "keyboard": "方向鍵或 WASD 移動。",
        "touch": "點按畫面方向按鈕移動。"
      }
    }
  ]
}
```

schemaVersion、id、title、description、entry、inputs、instructions 為必要；thumbnail、category、kind 可選，缺縮圖使用文字／色塊備援。
驗證 entry 解析後維持同源且位於本專案 games/ 下，以 .html 結尾；拒絕外部 URL、目錄穿越及任意查詢路徑。重複 id 視為清單錯誤並指出原因。只渲染清單資料，不以 innerHTML 插入未處理文字。

## 二、遊戲基本要求

1. 可獨立開啟；lang 使用 zh-Hant，設定 viewport，不禁止整站縮放。
2. 首發遊戲同時支援鍵盤及觸控；操作說明與清單一致。必要動作不依賴 hover。
3. 指標事件統一轉成遊戲動作；處理 pointerup、pointercancel、失焦及方向變化。拖曳依遊戲需求使用指標捕捉與正確座標換算。
4. touch-action 在遊戲文件內的必要互動區設定；不全站抑制瀏覽器手勢。
5. 切換失焦清除按鍵；背景暫停；使用者明確恢復後才繼續。翻牌等非連續遊戲也要定義計時暫停。
6. 音訊經玩家動作啟動；音量／靜音為各遊戲內控制，統一控制列於後續功能。
7. 卸載前停止動畫、計時器及音訊，移除監聽並釋放自行建立的資源；父頁仍以移除 iframe 為切換的基本保障。
8. 不使用彈出視窗或跳轉父頁；不需在網站內填入 API 金鑰。收錄第三方素材需有來源與授權說明。

## 三、最小通訊協定

同源 postMessage，固定 envelope：

```json
{ "channel": "bta", "version": 1, "gameId": "snake", "type": "ready" }
```

| 方向 | type | 意義 |
|---|---|---|
| 遊戲 → 外框 | ready | 遊戲處理器與畫面已初始化；可以顯示開始操作 |
| 遊戲 → 外框 | error | 帶可讀 message；顯示重試與返回，不暴露內部敏感資訊 |
| 外框 → 遊戲 | pause | 暫停並清除輸入狀態 |
| 外框 → 遊戲 | focus | 玩家開始／繼續後，將焦點移至可操作的遊戲容器 |

事件送出時 targetOrigin 使用明確 origin；接收同時檢查 origin、source（目前 iframe.contentWindow／window.parent）、channel、version、gameId 及 type。舊 iframe 的訊息不得改動新遊戲狀態。父頁先建立監聽再開始載入。
同源 iframe 內鍵盤事件不會自動當作父頁快捷鍵；返回大廳保留可點擊／鍵盤到達的外框按鈕，必要的遊戲內返回另訂訊息，不攔截整個瀏覽器的系統快捷鍵。
重玩第一版直接重建 iframe；resume 由遊戲內明確繼續動作負責，不在聚焦時自動恢復。基本契約暫不加入分數與存檔交換，避免未用功能先增加耦合。

## 四、新增遊戲程序

放入 games/<id>.html 與必要素材 → 新增清單項目 → 驗證路徑、id 與授權 → 獨立開啟測試 → 外框載入／重玩／返回 → 鍵盤與觸控、失焦／暫停、方向變化 → 部署子路徑驗證 → 記錄實際結果。
這是專案整合規格提案，不是已正式納入 Notes 的新 SOP。

## 五、v0.1.0 實作補充

清單的 kind 可使用 demo 標示操作測試頁；正式遊戲省略或使用 game。網站外框程式實際採 assets/js/app.mjs 與 core.mjs。無縮圖或站外縮圖均保留預設圖案；載入失敗的縮圖回退。所有 DOM 文字透過 textContent 插入。遊戲內回大廳連結僅於獨立開啟時顯示，嵌入時使用外框返回，避免巢狀載入大廳。

焦點進入 iframe 不當作離開網站；暫停由遊戲本身 blur／visibilitychange 與外框 visibilitychange 負責。父頁在 pagehide 卸載後，若從瀏覽器前後頁快取恢復，pageshow 重新載入清單與目前路由。

## 六、v0.2.0 接續

games.json 正式列出 snake 與 memory；兩款均為 kind=game 並實作必要通訊。GameHost 共用生命週期，獨立核心規則位於 games/assets/models.mjs。舊操作示範清單放在 tests/fixtures/catalog.json，僅回歸測試攔截使用；正式大廳不列出。直接開啟的遊戲可用自己的開始／暫停／重新開始，不需外框。沒有音訊或持久成績儲存。

## 七、v0.2.1 載入契約補充

外框在收到目前遊戲 ready 前隱藏 iframe。遊戲 HTML 的開始鈕初始 disabled，由初始化程式完成事件綁定後啟用；就緒訊息不只變更標籤，也控制實際可操作時機。獨立模式同樣適用。

## 八、v0.3.0 長按／多指輸入

新增 tetris 與 star-trail。GameHost 可選 onPause 在暫停、重玩、結束及卸載時呼叫，舊遊戲省略時沿用預設。bindGameInput 以鍵盤 code／pointerId 分別追蹤輸入來源；keyup、pointerup、pointercancel、lostpointercapture 各自釋放，失焦全部清除。多指與同動作多鍵不可互相誤解除。暫停後需玩家明確繼續且重新操作，不沿用仍按住的舊狀態。

## 九、v0.4.0 瞄準與直線賽車

新增 road-racer 與 mini-pool。賽車沿用獨立按鍵／指標來源，放開或取消減速即恢復，碰撞或終點後停止。撞球以 1/240 秒物理步進，方向角度採整數度、力道 10～100%；僅停球且已開始時可擊球。觸控座標依 Canvas 顯示尺寸換算到 640×360，拖曳取消恢復原角度，放開不直接擊球。暫停清除按鍵／拖曳，停止物理步進與計時；恢復須明確操作。擊球控制同時由介面停用與核心狀態防止重複送出。
