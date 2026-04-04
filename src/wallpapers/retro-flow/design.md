Design
======

retro flow 預計設計成讓各種視覺效果可以輪播


目前功能調整
-----------

- 拔掉 Flow Before Bars 功能
- 2d offset 要連帶影響 pass 的 center
- 添加 lightness by sound 功能
- Hue By Sound 要允許負值
- Hue Initial 不允許負值 也不用負值行為了
- 添加文字框用來在某些情況下顯示三秒警告訊息


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

... 要不要綁定 flow 跟 warp? 先不要

多種 bars geometry 之間會設計成可以互相 interpolate (mix 程度使用 barycentric coordinate)
- interpolate 方式即四邊形各個頂點分別 interpolate
flow pass, warp pass 可以有 interpolate 功能。這些是向量場，可以直接 interpolate



輪播 settings
-------------

- 使用 combobox 決定輪播切換方式是下列哪一種
    - 固定時間觸發視覺效果切換
    - 當能量大於近 100 筆紀錄的 x 百分位時切換
        - 這個設定值 x 應該用 "觸發的難易度" 相關詞彙取名，而不需要讓使用者理解百分位數
        - range x = 60~100
- number: 設定值 x


#### (note) combo 的撰寫方式

- 可能需要參考文件
    - https://docs.wallpaperengine.io/en/web/customization/properties.html#combo-property
- `project (sample 3).json` 有個 `"type" : "combo"` 的寫法可以參考



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
- `-1` (if isDown || shapeE)
定義 q = 
- `1`  (if isUp || shapeE)
- `0`  (if isDown)

四個頂點如下
- (x,y) = (index - 63.5 - bar_width/2, p*h) * bar_distance
- (x,y) = (index - 63.5 + bar_width/2, p*h) * bar_distance
- (x,y) = (index - 63.5 + bar_width/2, q*h) * bar_distance
- (x,y) = (index - 63.5 - bar_width/2, q*h) * bar_distance

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
- number: bar distance by energy 
    - 依照能量調整 bar distance 的程度
    - range: -10~10 (%)
    - 實際套用到幾何上要先乘以一個 k 值來做某些補償，先試試看 k=10


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
- number: radius by energy 
    - 依照能量調整 radius 的程度
    - range: -10~10 (%)
    - 實際套用到幾何上要先乘以一個 k 值來做某些補償，先試試看 k=10


### Slab

### Circle-Slab


bars geometry settings
----------------------

- 旋轉週期
    - 1秒 ~ 60秒
- bool: 反方向轉

- bool: 輪播納入 Just bars
- bool: 輪播納入 Circle

