
HopfWind
========

### todo

- 先做新的再做舊的
    - 舊的新增 craziness or say volitility
- 先釐清怎麼 deploy
- 需要自動更新 proj.json？還是不要
- 先都不要管 mock

目前想想 分發的邏輯不太對
應該是
    決定主題
    先用 wpe 建立不同專案
    用 wpe 編輯 proj.json 就好
        這個專案就單純生成 js 並 deploy

桌面要在畫面才能debug

npx webpack

修理好舊的
    - make settings work
    - make exagerness setting / entire magnitude
    - simplify goto party
    - write description
製作新的
    - set var into shader?



----------------------

Bring my Wallpaper Engine project "HopfWind" to the web

### 使用說明

#### 執行這 3 個指令

- `npm install three`
- `webpack`
- 打開 index.html，選個音樂檔案

#### 或是 4 個步驟

- `npm install three`
- 在 `main.js` 的 15~19 行任選一行
    - 目前是選在 `WindTorus`
- `webpack`
- 打開 index.html，選個音樂檔案

### Notes

Steam / Wallpaper Engine setting related files:

- describe.txt
- project.json
- preview.gif

目前方針應該是: Mock 作為替代品。vis 的風格還是以 WPE 為主，數量也就限制在 128 好了。但是 index 仍可以用 n
