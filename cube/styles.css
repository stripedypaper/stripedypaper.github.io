/*
layers
-10: text?
...
8: inventory images
9: transparent drag images
10: click absorbing screen (lowest clickable layer)
100: buttons
*/

/* reset CSS */
html, body, div, span, applet, object, iframe,
h1, h2, h3, h4, h5, h6, p, blockquote, pre,
a, abbr, acronym, address, big, cite, code,
del, dfn, em, img, ins, kbd, q, s, samp,
small, strike, strong, sub, sup, tt, var,
b, u, i, center,
dl, dt, dd, ol, ul, li,
fieldset, form, label, legend,
table, caption, tbody, tfoot, thead, tr, th, td,
article, aside, canvas, details, embed, 
figure, figcaption, footer, header, hgroup, 
menu, nav, output, ruby, section, summary,
time, mark, audio, video {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 100%;
  font: inherit;
  vertical-align: baseline;
}

body
{
  overflow:hidden;
}

.backgroundcontainer
{
  width:100%;
  height:100%;
  position:absolute;
  left:0px;
  top:0px;
  overflow:hidden;
  z-index:-100;
}

.background
{
  min-width:1500px;
  min-height:920px;
  width:100%;
  height:100%;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  z-index:-100;
  overflow:hidden;
}

.text
{
  z-index:-10;
}

.clickscreen
{
  width:100%;
  height:100%;
  position:absolute;
  left:0px;
  top:0px;
  z-index:10;
}

.button
{
  width:33px;
  height:33px;
  z-index:200;
  position:absolute;
  //border: 1px solid red;
}

.equipbutton
{
  width:38px;
  height:38px;
  position:absolute;
  background-color:yellow;
}

.icon
{
  width:50px;
  height:50px;
  position:absolute;
}

.item
{
  background-repeat: no-repeat;
  z-index:8;
}

.item.dragged
{
  pointer-events:none;
  display:none;
  opacity:0.7;
  cursor:inherit;
  z-index:101;
}

.equiptip
{
  color:white;
  font-family: 'Source Sans Pro',sans-serif;
  font-size: 0.8em;
  font-weight:300;
  position:absolute;
  top:-23px;
  width:100%;
  text-align:center;
  display:none;
}

.move {
    position:relative;
    -webkit-animation: backandforth 1s ease 0s;
    -webkit-animation-iteration-count:infinite;
    animation: backandforth 1s ease 0s;
    animation-iteration-count:infinite;
}

@-webkit-keyframes backandforth {0%{top:-23px;} 50%{top:-28px;} 100%{top:-23px;}}
@keyframes backandforth {0%{top:-23px;} 50%{top:-28px;} 100%{top:-23px;}}

.ui
{
  width:628px;
  height:360px;
  position: absolute;
  top:0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
}

.inventory
{
  width:161px;
  height:266px;
  position:absolute;
}

.equipment
{
  width:232px;
  height:307px;
  position:absolute;
}

.equipList
{
  width:230px;
  height:250px;
  position:absolute;
  z-index:200;
}

.equipListText
{
  font-family: 'Source Sans Pro',sans-serif;
  font-size: 0.75em;
  margin-top:22px;
  margin-left:10px;
  margin-right:10px;
  margin-bottom:10px;
  overflow-y:scroll;
  height:87%;
}

.equipListItem
{
  width:100%;
}

.equipListItem:hover
{
  background-color:#FFEE88;
}

.noselect {
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none;   /* Chrome/Safari/Opera */
  -khtml-user-select: none;    /* Konqueror */
  -moz-user-select: none;      /* Firefox */
  -ms-user-select: none;       /* Internet Explorer/Edge */
  user-select: none;           /* Non-prefixed version, currently
                                  not supported by any browser */
}

.equipListItem:active
{
  background-color:#FFCC00;
}

.cubeWindow
{
  width:196px;
  height:370px;
  position:absolute;
  background-repeat: no-repeat;
}

.tooltip
{
  width:290px;
  height:280px;
  position:absolute;
  background-repeat: no-repeat;
  z-index:1000;
  display:none;
}

.tooltiptext
{
  font-family: 'Source Sans Pro',sans-serif;
  color:white;
  position:absolute;
}

.tooltiptitle
{
  top:8px;
  left:18px;
  font-size:0.9em;
}

.tooltipdescription
{
  top:31px;
  left:97px;
  font-size:0.82em;
  font-weight:300;
  padding-right:10px;
}

.tooltipimage
{
  width:50px;
  height:50px;
  top:57px;
  left:38px;
  position:absolute;
  image-rendering: pixelated;
  background-repeat:no-repeat;
  transform:scale(2,2);
}

.tooltipcover
{
  position:absolute;
  width:100px;
  height:100px;
  top:36px;
  left:14px;
  background-repeat:no-repeat;
}

.equiptooltip
{
  pointer-events: none;
  width:261px;
  height:356px;
  position:absolute;
  background-repeat: no-repeat;
  z-index:1000;
  display:none;
}

.equiptooltipcover
{
  top:71px;
  left:16px;
}

.equiptooltippot
{
  top:68px;
  left:13px;
}

.equiptooltiptoptext
{
  position:static;
  text-align: center;
  vertical-align: middle;
  line-height: 80px;       /* the same as your div height */
}

.equiptooltiplevel
{
  position:absolute;
  color:#FFCC00;
  top:136px;
  left:150px;
  font-family: sans-serif;
  font-size: 8pt;
  font-weight: 300;
}

.equiptooltipcategory
{
  top:164px;
  left:13px;
}

.equiptooltipcube1
{
  top:70px;
  left:110px;
  background-repeat: no-repeat;
}

.equiptooltipcube2
{
  top:70px;
  left:160px;
  background-repeat: no-repeat;
}

.equiptooltipcube3
{
  top:70px;
  left:210px;
  background-repeat: no-repeat;
}

.equiptooltipcubetext1
{
  top:107px;
  left:104px;
  width:50px;
  text-align: center;
  font-family: sans-serif;
  font-size: 8pt;
  font-weight: 300;
}

.equiptooltipcubetext2
{
  top:107px;
  left:154px;
  width:50px;
  text-align: center;
  font-family: sans-serif;
  font-size: 8pt;
  font-weight: 300;
}

.equiptooltipcubetext3
{
  top:107px;
  left:204px;
  width:50px;
  text-align: center;
  font-family: sans-serif;
  font-size: 8pt;
  font-weight: 300;
}

.equiptooltipnpot
{
  position:absolute;
  top:193px;
  left:11px;
  width:100%;
}

.equiptooltipbpot
{
  position:absolute;
  top:270px;
  left:11px;
  width:100%;
  display:none;
}

.equiptooltipnpotimg
{
  position:absolute;
  top:2px;
  left:2px;
  width:20px;
  height:20px;
  background-repeat:no-repeat;
}

.equiptooltipnpotheading
{
  top:2px;
  left:18px;
  font-size: 0.75em;
}

.equiptooltipnpotlines
{
  top:19px;
  left:2px;
  width:220px;
  font-size: 0.75em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.border
{
  border: 1px solid red;
}

.itemoutline
{
  pointer-events: none;
  position:absolute;
  width:36px;
  height:36px;
  border:1px solid red;
}

.credit
{
  position:absolute;
  bottom:0;
  right:0;
  font-family:Helvetica,sans-serif;
  font-size:0.6em;
}

.cubeAnimation
{
  position:absolute;
  top:0px;
  left:0px;
}

.anim1
{
  pointer-events: none;
  width: 196px;
  height: 270px;
  background: url('https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/cube_red_use1.png');
  animation: play_1 1.1s steps(11) 1;
  z-index:110;
}

.anim2
{
  pointer-events: none;
  width: 196px;
  height: 270px;
  background: url('https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/cube_red_use2.png');
  animation: play_1 1.1s steps(11) 1;
  z-index:110;
}

.anim3
{
  pointer-events: none;
  width: 196px;
  height: 355px;
  background: url('https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/cube_black_use1.png');
  animation: play_1 1.1s steps(11) 1;
  z-index:110;
}

.anim4
{
  pointer-events: none;
  width: 196px;
  height: 355px;
  background: url('https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/cube_black_use2.png');
  animation: play_1 1.1s steps(11) 1;
  z-index:110;
}

@keyframes play_1 {
    100% { background-position: -2156px; }
}

.cubePot
{
  pointer-events:none;
  text-align: center;
  margin-top:140px;
  width:196px;
  left:0px;
  color:yellow;
  z-index:101;
}

.cubeLines
{
  pointer-events:none;
  top:185px;
  left:19px;
  width:160px;
  z-index:101;
}

.cubePot2
{
  pointer-events:none;
  text-align: center;
  margin-top:225px;
  width:196px;
  left:0px;
  color:yellow;
  z-index:101;
}

.cubeLines2
{
  pointer-events:none;
  top:270px;
  left:19px;
  width:160px;
  z-index:101;
}

.button2
{
  cursor: url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cursor.1.1.png"), pointer;
}

.cubeButtonAgain
{
  position:absolute;
  height:16px;
  width:133px;
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Red.BtOnemore.normal.0.png");
  z-index:100;
}

.cubeButtonAgainRed
{
  top:243px;
  left:10px;
}

.cubeButtonAgainBlack
{
  top:328px;
  left:10px;
}

.cubeButtonAgain:hover
{
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Red.BtOnemore.mouseOver.0.png");
}

.cubeButtonAgain:active
{
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Red.BtOnemore.pressed.0.png");
}

.cubeButtonOK
{
  position:absolute;
  height:16px;
  width:40px;
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Red.BtOk.normal.0.png");
  z-index:100;
}

.cubeButtonOK:hover
{
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Red.BtOk.mouseOver.0.png");
}

.cubeButtonOK:active
{
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Red.BtOk.pressed.0.png");
}

.cubeButtonOKRed
{
  top:243px;
  left:146px;
}

.cubeButtonOKBlack
{
  top:328px;
  left:146px;
}

.cubeButtonBefore
{
  position:absolute;
  height:82px;
  width:176px;
  top:153px;
  left:10px;
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Black.Before.normal.0.png");
  z-index:100;
}

.cubeButtonBefore:hover
{
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Black.Before.mouseOver.0.png");
}

.cubeButtonBefore:active
{
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Black.Before.pressed.0.png");
}

.cubeButtonAfter
{
  position:absolute;
  height:82px;
  width:176px;
  top:238px;
  left:10px;
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Black.After.normal.0.png");
  z-index:100;
}

.cubeButtonAfter:hover
{
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Black.After.mouseOver.0.png");
}

.cubeButtonAfter:active
{
  background-image:url("https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/Cube_Black.After.pressed.0.png");
}

.preload
{
  pointer-events:none;
  width:100%;
  position:absolute;
  top:-9999px;
  left:-9999px;
}

.preloaddiv
{
  display:inline-block;
  width:24px;
  height:24px;
}

.credit
{
  z-index:200;
  text-align:center;
  background-color:#FFECB3;
  padding:3px;
  box-shadow: 0px 0px 5px #888888;
}

b
{
  color:orange;
}
