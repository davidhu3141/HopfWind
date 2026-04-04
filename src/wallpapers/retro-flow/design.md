Design
======

retro flow 預計設計成讓各種視覺效果可以輪播


舊功能調整
-----------

- 拔掉 Flow Before Bars 與 flow direction 功能
- 2d offset 要連帶影響 pass 的 center
- 添加 lightness by sound 功能
- Hue By Sound 要允許負值
- Hue Initial 不允許負值 也不用負值行為了


能量機制
-------

定義能量為 audio sample 加總

- 低頻的能量: sum audio[0]~audio[3]
- 中頻的能量: sum audio[4]~audio[45]
- 高頻的能量: sum audio[46]~audio[63]
- (以上 index 也要與 index+64 一起計算)

有些與 EQ 相關的效果會用到


能量 settings
------------

- bool: 計入低頻能量
- bool: 計入中頻能量
- bool: 計入高頻能量


輪播機制
-------

可以輪播的視覺效果有以下幾種
- bars geometry type
- flow pass type
- warp pass type

輪播切換時會隨機選一種來切換

#### interpolation

多種 bars geometry 之間會設計成可以互相 interpolate

- interpolate 方式即四邊形各個頂點分別 interpolate
- mix 程度使用 barycentric coordinate 表示

flow pass, warp pass 一樣可以有 interpolate 功能
- 這些是向量場，interpolate 計算方式很直觀
- mix 程度使用 barycentric coordinate 表示，但 shader 最多只支援 vec4，超過 4 個再想辦法



輪播 settings
-------------

- 使用 combobox 決定輪播切換方式是下列哪一種
    - 固定時間觸發視覺效果切換
    - 當能量大於近 1000 筆紀錄的 x 百分位時切換
        - 這個設定值 x 應該用 "觸發的難易度" 相關詞彙取名，而不需要讓使用者理解百分位數
        - range x = 60~100
- number: 設定值 x
- number: interpolate 時長(秒)

#### (note) combo 的撰寫方式

- 可能需要參考文件
    - https://docs.wallpaperengine.io/en/web/customization/properties.html#combo-property
- `project (sample 3).json` 有個 `"type" : "combo"` 的寫法可以參考


顏色輪播
-------

之後再想



bars geometry types
-------------------

### Just bars

目前設定 vertex 的寫法很醜，幫我改掉

#### 幾何描述

基本上就是一排水平排開的長方形，位置與寬度就由 bar_distance 與 bar_width 決定，高度 h 依照 audiosample 決定。
一樣要採用 mirroredIndex。

定義 isUp = 
    shapeC || (shapeA && index<64) || (shapeC && index>=64)
定義 isDown = 
    shapeD || (shapeB && index<64) || (shapeA && index>=64)
定義 p = 
- `0`  (if isUp)
- `-h` (if isDown || shapeE)
定義 q = 
- `h`  (if isUp || shapeE)
- `0`  (if isDown)

四個頂點如下
- (x,y) = (index - 63.5 - bar_width/2, p) * bar_distance
- (x,y) = (index - 63.5 + bar_width/2, p) * bar_distance
- (x,y) = (index - 63.5 + bar_width/2, q) * bar_distance
- (x,y) = (index - 63.5 - bar_width/2, q) * bar_distance

#### 設定

- combo: shape
    - shapeA: single-sided, up, down
    - shapeB: single-sided, down, up
    - shapeC: single-sided, up, up
    - shapeD: single-sided, down, down
    - shapeE: two-sided
- number: bar distance
- number: bar width
    - 是 bar distance 的相對值 (理解為百分比)
    - range: 0~150 (%)


### Circle

#### 幾何描述

基本上就是圍著半徑 r 的圓周排列的梯形，高度 h 依照 audiosample 決定。
要採用 mirroredIndex。
定義 d = 2*pi / 128
定義 p = 
    - `0` (if `single-sided`)
    - `-1` (if `two-sided`)
梯形頂點為
- (r, theta) = (r+p*h, pi/2 + theta_shift + d *  index)
- (r, theta) = (r+p*h, pi/2 + theta_shift + d * (index+1))
- (r, theta) = (r + h, pi/2 + theta_shift + d * (index+1))
- (r, theta) = (r + h, pi/2 + theta_shift + d *  index)

#### 設定

- combo: shape
    - single-sided
    - two-sided
- number: radius r
- number: bar width
    - 是相對值 (理解為百分比)
    - range: 0~150 (%)
- number: theta_shift 
    - range: 0~359
    - 實際使用要轉為弳度


### Slab

跟 Just bars 類似，但是厚度 thickness 固定，高度 h 只決定整個 slab 離中心多遠。
這樣在 h 很小甚至 0 的時候，slab 仍然可見，不會因為 thickness 大於 h 而退化。

定義 isUp = 
    shapeC || (shapeA && index<64) || (shapeC && index>=64)
定義 isDown = 
    shapeD || (shapeB && index<64) || (shapeA && index>=64)
定義 p = 
- `h`  (if isUp)
- `-h-thickness` (if isDown)
定義 q = 
- `h+thickness`  (if isUp)
- `-h`  (if isDown)

四個頂點如下
- (x,y) = (index - 63.5 - bar_width/2, p) * bar_distance
- (x,y) = (index - 63.5 + bar_width/2, p) * bar_distance
- (x,y) = (index - 63.5 + bar_width/2, q) * bar_distance
- (x,y) = (index - 63.5 - bar_width/2, q) * bar_distance

shapeE 的話就是同時繪製 shapeC 與 shapeD，但 shapeD 的形狀不參與 interpolation，不用了就直接隱藏

### Circle-Slab

跟 Circle 類似，但是 thickness 固定，高度 h 只決定整個扁梯形離基準半徑 r 多遠。
這樣在 h 很小甚至 0 的時候也仍然有可見厚度。

定義 d = 2*pi / 128
若為 outward slab，梯形頂點為
- (r, theta) = (r+h, pi/2 + theta_shift + d *  index)
- (r, theta) = (r+h, pi/2 + theta_shift + d * (index+1))
- (r, theta) = (r+h+thickness, pi/2 + theta_shift + d * (index+1))
- (r, theta) = (r+h+thickness, pi/2 + theta_shift + d *  index)

若為 inward slab，梯形頂點為
- (r, theta) = (r-h-thickness, pi/2 + theta_shift + d *  index)
- (r, theta) = (r-h-thickness, pi/2 + theta_shift + d * (index+1))
- (r, theta) = (r-h, pi/2 + theta_shift + d * (index+1))
- (r, theta) = (r-h, pi/2 + theta_shift + d *  index)

single-sided 只畫 outward slab，two-sided 則同時畫 outward 與 inward slab。


bars geometry settings
----------------------

- 整體幾何旋轉頻率
    - 0 ~ 1 (Hz)
- bool: 反方向轉
- number: size by energy 
    - 依照能量調整 size 的程度
    - range: -10~10 (%)
    - 實際套用到幾何上要先乘以一個 k 值來做某些補償，先試試看 k=10
- bool: Just bars 參與輪播
- bool: Circle 參與輪播


flow pass 輪播
--------------

目前已經有兩種在 interpolate 了，你整理成方便添加新種類即可


warp pass 輪播
--------------

目前只有一種，你來設計另一種。
