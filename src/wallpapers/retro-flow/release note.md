(initial submit 2026 0410, retroflow_v1)

I tried to make it as versatile as I could, and wish it to have some nostalgic old media player vibe. 

[Mechanism]
 
There are three types of visualization features that combine to the final visual. At first the bar geometries are rendered to the canvas, and then flow (smear effect), and then warp (lens effect). 

You can choose features in the Main Feature Cycle menu. The feature  that is applied in the next time interval is randomly selected.

If any type (bar/flow/warp) has zero candidate, some default choices would be chosen.

[Must try settings]

- Try to use circle bar + dualcore flow to make infinity symbol?
- Media information overlay in the Media menu.
- Cycle random color.
- Custom flow/warp

[Note]

When setting bar/flow/warp properties, try unchecking the other features of the same type in Main Feature Cycle menu so that it's easier to tweak. When tweaking, please mind the possibility of flashing or seizure.

FPS limit option is experimental.

Not sure whether canvas:pixelated option helps if people observe lag, because I didn't observe lag.

I guess not all flow types look good when combined with any warp type. Therefore I only chose one as default preset. The other flow types still look good with specific warp types tho.


(update 2026-04-11)

I noticed that the audio magnitude given to the wallpapers are rather large on some computer (or, rather small on my computer). Therefore I changed the 'overall magnitude' property to smaller default value ('7' -> '3') to prevent potential overwhite/overblink on such device, and make the 'overall magnitude' setting easier to be found. Hope that '3' is a good start for most of the users. The precision of the value was also refined to 0.001.

Another known issue is that when 'respect WPE FPS limit' is set (15 by default I think), the flow (and maybe the cycle progess) is being slow down. This would be worked-around by increasing flow velocity, and may be fixed in future update.


(update 2026-04-11-2, retroflow v1.1)

fix: WPE FPS limit no longer slows down flow, cycle, rotation, and idle countdown
fix: 'pixelated = x' no longer gives 2x pixelization on canvas.

props: 'overall magnitude' value further decrease to 1 because I'm more concerned that it's only my WPE that has unreasonably small audio value. 
props: 'pixelated' range/value (1..8 @ 2) -> (1..16 @ 4), 
props: rename group 'Media' -> 'Media Info'
props: move 'Colors' group before cycle settings
props: 'just bars shape' default 'up down' -> 'down up'


(update 2026-04-17, retroflow v1.2)

fix: 'Size by energy' now respects 'overall magnitude'.
props: 'overall magnitude' default value further decrease to 0.06