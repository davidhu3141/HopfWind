# Wallpapers for Wallpaper Engine 開發框架重構

目的：重寫這個專案

- 以改善架構與程式碼重用
    - 但架構不要太重
- 改善舊有問題
- 適應新開發流程
- 添加 web 版展示用專案


## 新開發流程

這個專案會用來開發多個 wallpaper

預計重構後開發流程應該是

- Wallpaper engine (WPE) 開啟新專案
    - WPE 會自己生成 project.json
- 有腳本是用來 build 與 update json properties
    - 指令類似 build <some_wallpaper>
        - 其他 wallpaper 的 code 有辦法不被包進去嗎
    - 以及一個 build web
        - web 專案是個前端專案，用來展示所有 wallpapers
- 因此每個 wallpaper 要有自己的 config 資料夾，裡面含有
    - wallpaper id (for this proj)
    - properties
        - 寫到 build destination 的 project.json 中
        - web 專案則是要顯示 properties 的控制器
    - build destination path
        - 我自己填就好，也是要先用 WPE 開啟新專案才知道


## 程式碼

- 結構不多沒關係，也不用考慮向下相容，要的是簡單與一目瞭然
- src/class 裡面不需要的就不用留了

### 要解決以前問題

- 有些使用者反映初始化錯誤或生命週期怪怪
    - 初始化容錯、properties 更新容錯、錯誤訊息、retry
    - 可看文件有沒有提到生命週期
- 沒有適配所有螢幕寬度或解析度
    - 尤其是 three js 功能
- shader pass 不要用自己寫的 Pass.js，應該 Three.js 本來就有這個功能

### 期望功能

- 改用 vite 而非 webpack
- 有的可以抽出來讓各個 wallpaper 引用 例如
    - 時鐘功能
    - 3d 初始化
    - shader pass
    - 背景圖片
    - canvas 對應 pixelated 參數
- web 版要有的功能
    - 選擇桌布
    - 調整桌布 properties
    - 選擇音檔
    - 音檔控制器
        - 開始 暫停 重來 seek
    - 音檔播放時要輸出頻譜資訊，以模擬 WPE 的頻譜，大概就好
        - 使用 Web Audio API
            - getFloatFrequencyData
        - when `0<=k<=30`
            - let start = Math.round(23.57*k)
            - audio[k] = (freq(start) + freq(start+2) + ... + freq(k+22)) / 12
        - when `31<=k<=63`
            - let start = Math.round(772 * Math.pow(1.093, k-31))
            - let end = Math.round(772 * Math.pow(1.093, k-31))
            - let step = (end - start) / 30
            - audio[k] = (sum_i freq(Math.round(start+i*step))) / 30
        - freq(x) 就從 getFloatFrequencyData 的結果取相近的就好
        - 在 requestAnimationFrame 做頻譜計算
    - WEB 主體使用 react js，但 wallpaper 不使用 react 以減小 WPE 耗能與體積

WPE wallpaperPropertyListener 與 wallpaperRegisterAudioListener 的生命週期注意事項可以參考
- https://docs.wallpaperengine.io/en/web/customization/properties.html
- https://docs.wallpaperengine.io/en/web/audio/visualizer.html

