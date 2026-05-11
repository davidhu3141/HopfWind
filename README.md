
readme rewrite:

- 簡短為主, 使用英文
- 要說這專案是一種開發 WPE web 版桌布的框架 含有一些我已發布或實驗過的桌布
    - 大家來看專案應該是為了最受好評的 spectrum city (in this proj: spec-entity) 來的，這個桌布的效果重點是 shader 的 ping-pong 算法
- 要說此專案分成網頁版與 WPE (Wallpaper engine) 版
    - 所以有兩種殼 但共用桌布邏輯
- "設定輸出路徑" 那段可保留
- misc
    - 要說 spectrum city 在此專案中名為 spec-entity
    - 要說可以請 ai agent 參考 project.json 格式













# Build

這份說明是 WPE 專案輸出流程。要使用網頁版 (mock) 的話就 npm run dev 或 npm run build:web 就好

## 1. 設定輸出路徑

在 `wallpaper-configs/retro-flow/` 底下建立 `config.json`。

可以直接參考 wallpaper-configs\retro-flow\config.example.json：

以我的電腦為例是

```json
{
    "buildDestination": "C:/Program Files (x86)/Steam/steamapps/common/wallpaper_engine/projects/myprojects/retro-flow"
}
```

`buildDestination` 應該指到你在 Wallpaper Engine 裡建立好的 `retro-flow` 專案資料夾。

這個資料夾裡至少要有 `project.json`

## 2. Build wallpaper 檔案

在 repo 根目錄執行：

```bash
npm run build:wallpaper -- retro-flow
```

這個指令會：

- 讀取 `wallpaper-configs/retro-flow/config.json`
- 把 `index.html` 和 `dist/main.js` 輸出到 `buildDestination`

如果你不想用 `config.json`，也可以直接指定輸出路徑：

```bash
npm run build:wallpaper -- retro-flow "C:/.../your/project/path"
```

## 3. 同步 WPE 的 `project.json`

build 完之後，還要把目前 schema 寫進 WPE 專案的 `project.json`：

```bash
npm run sync:project -- retro-flow
```

這個指令會更新 `<buildDestination>/project.json` 的

- `project.general.properties`
- `project.general.supportsaudioprocessing`


## 4. 完整流程

平常更新 `retro-flow` (或其他 wallpaper) 的 code 之後，通常就是跑這兩個：

```bash
npm run build:wallpaper -- retro-flow
npm run sync:project -- retro-flow
```

以更新到 WPE 中

## 5. 補充

- `build:wallpaper` 只負責輸出網頁檔案
- `sync:project` 只負責更新 `project.json`
- 兩個都要跑，WPE 專案才會完整對齊目前程式碼
