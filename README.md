# RetroFlow Build

這份說明是給 `retro-flow` 的 WPE 專案輸出流程。

## 1. 設定輸出路徑

在 `wallpaper-configs/retro-flow/` 底下建立 `config.json`。

可以直接參考 [config.example.json](C:\Users\david\workspace\HopfWind\wallpaper-configs\retro-flow\config.example.json)：

```json
{
    "buildDestination": "C:/Program Files (x86)/Steam/steamapps/common/wallpaper_engine/projects/myprojects/retro-flow"
}
```

`buildDestination` 應該指到你在 Wallpaper Engine 裡建立好的 `retro-flow` 專案資料夾。

這個資料夾裡至少要有：

- `project.json`

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

這個指令也會讀同一份 `config.json`，並更新：

- `project.general.properties`
- `project.general.supportsaudioprocessing`

如果要手動指定路徑：

```bash
npm run sync:project -- retro-flow "C:/.../your/project/path"
```

## 4. 完整流程

平常更新 `retro-flow` 之後，通常就是跑這兩個：

```bash
npm run build:wallpaper -- retro-flow
npm run sync:project -- retro-flow
```

## 5. 補充

- `build:wallpaper` 只負責輸出網頁檔案
- `sync:project` 只負責更新 `project.json`
- 兩個都要跑，WPE 專案才會完整對齊目前程式碼
- 如果 `config.json` 沒設或路徑錯了，script 會失敗
