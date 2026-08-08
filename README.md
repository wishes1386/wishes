# 報名統計系統

一個可直接放上網路的報名表單與後台報表工具：

- 報名頁：活動標題、名稱抬頭、活動說明、活動開始與截止時間都可以在後台自訂；後台時間未填寫時預設為下班時間 17:30；參加選項為單選。
- 報名頁右側會顯示此活動的 QR Code，內容會自動依目前網頁網址產生；把資料夾放到雲端硬碟或其他網址後，QR Code 會跟著對應新位置。
- 後台：帳號 `admin`、密碼 `Wishadmin`（可用環境變數 `ADMIN_PASSWORD` 覆蓋）。
- 名冊：匯入中華電信會員清冊 CSV，自動或手動對應欄位。
- 報表：活動選項報表、已報名／未報名人員清冊、截止總覽預覽，並可一鍵匯出 CSV。
- 報名重複送出不會重複建檔，會直接更新原本的報名內容。

## 本機執行

```bash
node server.js
```

然後開啟 `http://localhost:3000`。

## 靜態版（Google Drive／靜態網頁）

`public/static.html` 是單一 HTML 檔的建置產物，包含報名頁、後台、QR Code、資料檢查與 CSV 匯入，不需要 Node 伺服器；對外發送時請把它改名為 `index.html`（資料夾「表單報名」內已直接放好 `index.html`）。

靜態版的資料會存在開啟者自己的瀏覽器 localStorage；正式多人共用的集中式報名仍建議使用 `node server.js` 的主版本。

## 分享給會員

詳細步驟請見「分享給會員步驟.txt」。Google Drive 本身不提供 HTML 網頁直接開啟，建議把「index.html」拖到 Netlify Drop 取得正式網址後，貼到後台「QR Code 網址」欄位，再將網址或 QR Code 發給會員。

## 放在網路上

這是零套件依賴的 Node.js 應用，任何能跑 Node 18+ 的平台都可以部署：

1. 上傳整個資料夾。
2. 啟動指令設為 `node server.js`（或 `npm start`）。
3. 設定環境變數：
   - `PORT`：伺服器埠號（平台通常會自動帶入）。
   - `ADMIN_PASSWORD`：後台密碼，未設定時預設為 `Wishadmin`。
   - `DATA_DIR`：資料檔目錄。平台若提供持久化磁碟，掛載到這個目錄，報名資料就不會因重啟消失。
   - `COOKIE_SECURE=1`：使用 HTTPS 正式上線時建議開啟。

以 Render 為例：New Web Service → 上傳這個專案或接 GitHub 儲存庫 → Build Command 留空 → Start Command 填 `node server.js` → 在 Disks 新增一個掛載點到 `/data`，並設定 `DATA_DIR=/data`。

## CSV 匯入說明

後台「名冊匯入」會先顯示檔案預覽，再讓您確認欄位對應：

- 會員編號（必填）
- 姓名
- 手機
- 部門
- Email

系統會自動辨識常見的欄位名稱，例如「會員編號」「員工編號」「姓名」「手機」「部門」等；也可以手動下拉調整。支援 UTF-8 含 BOM、引號包夾逗號等常見 CSV 格式。

## 資料儲存

預設儲存在專案內的 `data/state.json`。若要完全重置，可使用後台「重置範例資料」或「清空全部資料」。
