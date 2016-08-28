function l(what) {return document.getElementById(what);}
function choose(arr) {return arr[Math.floor(Math.random()*arr.length)];}
function asset(what) {return "url(" + C.assetsDir + what + ")";}
function soundasset(what) {return C.soundDir + what + "?raw=true";}

C = {};
C.assetsDir = "https://raw.githubusercontent.com/stripedypaper/stripedypaper.github.io/master/cube/img/"
C.soundDir = "https://github.com/stripedypaper/stripedypaper.github.io/blob/master/cube/sound/";

Assets = {};
Assets.cursor = asset("cursor.png");
Assets.cursorPointer = asset("cursor_mouseover.png");
Assets.cursorGrab = asset("cursor_grab.png");
Assets.cursorMouseover = asset("Cursor.1.1.png");
Assets.redCube = asset("2432268.png");
Assets.redCubeRaw = asset("2432268raw.png");
Assets.blackCube = asset("2433623.png");
Assets.blackCubeRaw = asset("2433623raw.png");
Assets.bonusCube = asset("05062500.png");
Assets.bonusCubeRaw = asset("05062500raw.png");
Assets.bonusScroll = asset("2048314.png");
Assets.bonusScrollRaw = asset("2048314raw.png");
Assets.inventory = asset("inventory.png");
Assets.equipment = asset("equippanel.png");
Assets.cubeWindowRed = asset("cube_red.png");
Assets.cubeWindowBlack = asset("cube_black2.png");
Assets.cubeWindowBonus = asset("cube_bonus.png");
Assets.background = asset("bg1.png");
Assets.tooltip_small = asset("tooltip_small.png");
Assets.tooltip_big = asset("tooltip_big.png");
Assets.tooltipCover = asset("Item.ItemIcon.cover.png");
Assets.tooltip_equip_small = asset("tooltip_equip.small.png");
Assets.tooltip_equip_big = asset("tooltip_equip_big.png");
Assets.tooltipPot0 = asset("Item.ItemIcon.1.png");
Assets.tooltipPot1 = asset("Item.ItemIcon.2.png");
Assets.tooltipPot2 = asset("Item.ItemIcon.3.png");
Assets.tooltipPot3 = asset("Item.ItemIcon.4.png");
Assets.tooltipPotIcon0 = asset("AdditionalOptionTooltip.rare.png");
Assets.tooltipPotIcon1 = asset("AdditionalOptionTooltip.epic.png");
Assets.tooltipPotIcon2 = asset("AdditionalOptionTooltip.unique.png");
Assets.tooltipPotIcon3 = asset("AdditionalOptionTooltip.legendary.png");
Assets.redCubeEffect1 = asset("cube_red_use1.png");
Assets.redCubeEffect2 = asset("cube_red_use2.png");
Assets.blackCubeEffect1 = asset("cube_black_use1.png");
Assets.blackCubeEffect2 = asset("cube_black_use2.png");
Assets.cubeButton1_0 = asset("Cube_Red.BtOnemore.normal.0.png");
Assets.cubeButton1_1 = asset("Cube_Red.BtOnemore.mouseOver.0.png");
Assets.cubeButton1_2 = asset("Cube_Red.BtOnemore.pressed.0.png");
Assets.cubeButton2_0 = asset("Cube_Red.BtOk.normal.0.png");
Assets.cubeButton2_1 = asset("Cube_Red.BtOk.mouseOver.0.png");
Assets.cubeButton2_2 = asset("Cube_Red.BtOk.pressed.0.png");
Assets.blackCubeButton1_0 = asset("Cube_Black.Before.normal.0.png");
Assets.blackCubeButton1_1 = asset("Cube_Black.Before.mouseOver.0.png");
Assets.blackCubeButton1_2 = asset("Cube_Black.Before.pressed.0.png");
Assets.blackCubeButton2_0 = asset("Cube_Black.After.normal.0.png");
Assets.blackCubeButton2_1 = asset("Cube_Black.After.mouseOver.0.png");
Assets.blackCubeButton2_2 = asset("Cube_Black.After.pressed.0.png");
Assets.equipList = asset("list1-1.png");
Assets.blank = asset("blank.png");

// hat
Assets._1002603 = asset("1002603.png");
Assets._1002357 = asset("1002357.png");
Assets._1003797 = asset("1003797.png");
Assets._1003798 = asset("1003798.png");
Assets._1003799 = asset("1003799.png");
Assets._1003800 = asset("1003800.png");
Assets._1003801 = asset("1003801.png");
Assets._1003976 = asset("1003976.png");
Assets._1004422 = asset("1004422.png");
Assets._1004423 = asset("1004423.png");
Assets._1004424 = asset("1004424.png");
Assets._1004425 = asset("1004425.png");
Assets._1004426 = asset("1004426.png");

// face
Assets._1012058 = asset("1012058.png");
Assets._1012076 = asset("1012076.png");
Assets._1012106 = asset("1012106.png");
Assets._1012189 = asset("1012189.png");
Assets._1012191 = asset("1012191.png");
Assets._1012478 = asset("1012478.png");
Assets._1012438 = asset("1012438.png");

// eye
Assets._1022060 = asset("1022060.png");
Assets._1022082 = asset("1022082.png");
Assets._1022231 = asset("1022231.png");
Assets._1022211 = asset("1022211.png");

// earring
Assets._1032003 = asset("1032003.png");
Assets._1032013 = asset("1032013.png");
Assets._1032022 = asset("1032022.png");
Assets._1032183 = asset("1032183.png");
Assets._1032222 = asset("1032222.png");
Assets._1032223= asset("1032223.png");

// top
Assets._1040002 = asset("1040002.png");
Assets._1041113 = asset("1041113.png");
Assets._1042254 = asset("1042254.png");
Assets._1042255 = asset("1042255.png");
Assets._1042256 = asset("1042256.png");
Assets._1042257 = asset("1042257.png");
Assets._1042258 = asset("1042258.png");

// overall
Assets._1050018 = asset("1050018.png");
Assets._1051017 = asset("1051017.png");
Assets._1052198 = asset("1052198.png");
Assets._1052527 = asset("1052527.png");
Assets._1052669 = asset("1052669.png");
Assets._1052882 = asset("1052882.png");
Assets._1052887 = asset("1052887.png");
Assets._1052888 = asset("1052888.png");
Assets._1052889 = asset("1052889.png");
Assets._1052890 = asset("1052890.png");

// pants
Assets._1062001 = asset("1062001.png");
Assets._1060132 = asset("1060132.png");
Assets._1061154 = asset("1061154.png");
Assets._1062165 = asset("1062165.png");
Assets._1062166 = asset("1062166.png");
Assets._1062167 = asset("1062167.png");
Assets._1062168 = asset("1062168.png");
Assets._1062169 = asset("1062169.png");

// shoes
Assets._1072005 = asset("1072005.png");
Assets._1072018 = asset("1072018.png");
Assets._1072238 = asset("1072238.png");
Assets._1072743 = asset("1072743.png");
Assets._1072870 = asset("1072870.png");
Assets._1073030 = asset("1073030.png");

// gloves
Assets._1082002 = asset("1082002.png");
Assets._1082173 = asset("1082173.png");
Assets._1082222 = asset("1082222.png");
Assets._1082488 = asset("1082488.png");
Assets._1082489 = asset("1082489.png");
Assets._1082543 = asset("1082543.png");
Assets._1082556 = asset("1082556.png");
Assets._1082636 = asset("1082636.png");

// shield
Assets._1092008 = asset("1092008.png");
Assets._1092049 = asset("1092049.png");
Assets._1092079 = asset("1092079.png");
Assets._1098003 = asset("1098003.png");
Assets._1099004 = asset("1099004.png");
Assets._1092113 = asset("1092113.png");

// cape
Assets._1102053 = asset("1102053.png");
Assets._1102041 = asset("1102041.png");
Assets._1102206 = asset("1102206.png");
Assets._1102481 = asset("1102481.png");
Assets._1102623 = asset("1102623.png");
Assets._1102775 = asset("1102775.png");

// pendant
Assets._1122007 = asset("1122007.png");
Assets._1122266 = asset("1122266.png");
Assets._1122267 = asset("1122267.png");

// belt
Assets._1132016 = asset("1132016.png");
Assets._1132215 = asset("1132215.png");
Assets._1132245 = asset("1132245.png");
Assets._1132246 = asset("1132246.png");
Assets._1132174 = asset("1132174.png");

// shoulder
Assets._1152124 = asset("1152124.png");
Assets._1152170 = asset("1152170.png");
Assets._1152108 = asset("1152108.png");
Assets._1152174 = asset("1152174.png");

// emblem
Assets._1190301 = asset("1190301.png");
Assets._1190401 = asset("1190401.png");
Assets._1190001 = asset("1190001.png");
Assets._1190101 = asset("1190101.png");
Assets._1190201 = asset("1190201.png");
Assets._1190521 = asset("1190521.png");
Assets._1190601 = asset("1190601.png");
Assets._1190701 = asset("1190701.png");
Assets._1190801 = asset("1190801.png");
Assets._1191001 = asset("1191001.png");

// weapon
Assets._1212063 = asset("1212063.png");
Assets._1222058 = asset("1222058.png");
Assets._1232057 = asset("1232057.png");
Assets._1242060 = asset("1242060.png");
Assets._1252015 = asset("1252015.png");
Assets._1302275 = asset("1302275.png");
Assets._1312153 = asset("1312153.png");
Assets._1322203 = asset("1322203.png");
Assets._1332225 = asset("1332225.png");
Assets._1362090 = asset("1362090.png");
Assets._1372177 = asset("1372177.png");
Assets._1382208 = asset("1382208.png");
Assets._1402196 = asset("1402196.png");
Assets._1412135 = asset("1412135.png");
Assets._1422140 = asset("1422140.png");
Assets._1432167 = asset("1432167.png");
Assets._1442223 = asset("1442223.png");
Assets._1452205 = asset("1452205.png");
Assets._1462193 = asset("1462193.png");
Assets._1472214 = asset("1472214.png");
Assets._1482168 = asset("1482168.png");
Assets._1492179 = asset("1492179.png");
Assets._1522094 = asset("1522094.png");
Assets._1532098 = asset("1532098.png");
Assets._1542063 = asset("1542063.png");
Assets._1552061 = asset("1552061.png");
Assets._1212089 = asset("1212089.png");
Assets._1222084 = asset("1222084.png");
Assets._1232084 = asset("1232084.png");
Assets._1242090 = asset("1242090.png");
Assets._1252033 = asset("1252033.png");
Assets._1302297 = asset("1302297.png");
Assets._1312173 = asset("1312173.png");
Assets._1322223 = asset("1322223.png");
Assets._1332247 = asset("1332247.png");
Assets._1342090 = asset("1342090.png");
Assets._1362109 = asset("1362109.png");
Assets._1372195 = asset("1372195.png");
Assets._1382231 = asset("1382231.png");
Assets._1402220 = asset("1402220.png");
Assets._1412152 = asset("1412152.png");
Assets._1422158 = asset("1422158.png");
Assets._1432187 = asset("1432187.png");
Assets._1442242 = asset("1442242.png");
Assets._1452226 = asset("1452226.png");
Assets._1462213 = asset("1462213.png");
Assets._1472235 = asset("1472235.png");
Assets._1482189 = asset("1482189.png");
Assets._1492199 = asset("1492199.png");
Assets._1522113 = asset("1522113.png");
Assets._1532118 = asset("1532118.png");
Assets._1542072 = asset("1542072.png");
Assets._1552072 = asset("1552072.png");

Assets._1262016 = asset("1262016.png");
Assets._1262029 = asset("1262029.png");
Assets._1582016 = asset("1582016.png");
Assets._1582025 = asset("1582025.png");
Assets._1572007 = asset("1572007.png");
Assets._1562007 = asset("1562007.png");

// secondary
Assets._1342082 = asset("1342082.png");
Assets._1352003 = asset("1352003.png");
Assets._1352103 = asset("1352103.png");
Assets._1352202 = asset("1352202.png");
Assets._1352212 = asset("1352212.png");
Assets._1352222 = asset("1352222.png");
Assets._1352232 = asset("1352232.png");
Assets._1352242 = asset("1352242.png");
Assets._1352252 = asset("1352252.png");
Assets._1352262 = asset("1352262.png");
Assets._1352272 = asset("1352272.png");
Assets._1352282 = asset("1352282.png");
Assets._1352292 = asset("1352292.png");
Assets._1352403 = asset("1352403.png");
Assets._1352503 = asset("1352503.png");
Assets._1352604 = asset("1352604.png");
Assets._1352703 = asset("1352703.png");
Assets._1352803 = asset("1352803.png");
Assets._1352813 = asset("1352813.png");
Assets._1352823 = asset("1352823.png");
Assets._1352902 = asset("1352902.png");
Assets._1352912 = asset("1352912.png");
Assets._1352922 = asset("1352922.png");
Assets._1352932 = asset("1352932.png");
Assets._1352942 = asset("1352942.png");
Assets._1352952 = asset("1352952.png");
Assets._1352962 = asset("1352962.png");
Assets._1352972 = asset("1352972.png");
Assets._1353103 = asset("1353103.png");
Assets._1353203 = asset("1353203.png");
Assets._1353403 = asset("1353403.png");
Assets._1353004 = asset("1353004.png");

// heart
Assets._1672003 = asset("1672003.png");
Assets._1672007 = asset("1672007.png");
Assets._1672034 = asset("1672034.png");
Assets._1672040 = asset("1672040.png");
Assets._1672069 = asset("01672069.png");

// ring
Assets._1113075 = asset("1113075.png");
Assets._1113074 = asset("1113074.png");
Assets._1113073 = asset("1113073.png");
Assets._1113072 = asset("1113072.png");
Assets._1113020 = asset("1113020.png");
Assets._1113132 = asset("1113132.png");
Assets._1113269 = asset("1113269.png");
Assets._1112951 = asset("1112951.png");
Assets._1112952 = asset("1112952.png");
Assets._1112579 = asset("1112579.png");
Assets._1113185 = asset("1113185.png");

// badge
Assets._1182060 = asset("01182060.png");

Sounds = {};
Sounds.click = new Audio(soundasset("mouseclick.mp3"));
Sounds.mouseover = new Audio(soundasset("mouseover.mp3"));
Sounds.drag = new Audio(soundasset("dragstart2.mp3"));
Sounds.dragend = new Audio(soundasset("dragend.mp3"));
Sounds.success = new Audio(soundasset("success.mp3"));
Sounds.successAlt = new Audio(soundasset("success.mp3"));

C.inventoryX = 50;
C.inventoryY = 50;
C.inventoryOrigX = 10;
C.inventoryOrigY = 36;
C.inventorySpaceX = 36;
C.inventorySpaceY = 35;
C.equipmentX = 230;
C.equipmentY = 50;
C.equipmentOrigX = 22;
C.equipmentOrigY = 42;
C.equipmentSpaceX = 41;
C.equipmentSpaceY = 41;
C.tooltipImageX = 38;
C.tooltipImageY = 57;
C.equiptooltipImageX = 46;
C.equiptooltipImageY = 97;
C.cubeItemX = 86;
C.cubeItemY = 101;

C.noCube = {id:"noCube"};
C.redCube = {id:"redCube", name:"Red Cube", icon:Assets.redCube, iconRaw:Assets.redCubeRaw, offsetX: -3, offsetY: -1};
C.blackCube = {id:"blackCube", name:"Black Cube", icon:Assets.blackCube, iconRaw:Assets.blackCubeRaw, offsetX: -2, offsetY: -1};
C.bonusCube = {id:"bonusCube", name:"Bonus Potential Cube", icon:Assets.bonusCube, iconRaw:Assets.bonusCubeRaw, offsetX: -1, offsetY: 0};
C.bonusScroll = {id:"bonusScroll", name:"Miraculous Bonus Potential Scroll", icon:Assets.bonusScroll, iconRaw:Assets.bonusScrollRaw, offsetX: -1, offsetY: 4};

C.redCube.desc = "A beautifully crafted cube that randomly reconfigures the Potential on a piece of equipment.<br><b>Only usable on items from Rare to Legendary.<br>Max Result: Legendary</b>";
C.blackCube.desc = "An elegant cube that randomly configures the Potential on a piece of equipment. The Black Cube offers you the chance to decide whether or not to <b>apply the new Potential to your item</b>. However, it does not influence Bonus Potentials.<br><b>Only usable on items from Rare to Legendary.<br>Max Result: Legendary</b> Black Cubes have a higher chance to raise your Potential rank than Red Cubes do.";
C.bonusCube.desc = "A powerful cube that reconfigures a piece of equipment's Bonus Potential. Does not affect existing regular Potentials.<br><b>Only usable on items from Rare to Legendary<br>Max Result: Legendary<b>";
C.bonusScroll.desc = "Adds 3 lines of Rare Bonus Potential to ALL equipped items.<br>Double-click or click and drag it onto an equipped item to use it. Item is consumed upon use. <br><b>Success Rate: 100%.</b>";

C.rare = 0;
C.epic = 1;
C.unique = 2;
C.legendary = 3;

C.rarities = ["Rare", "Epic", "Unique", "Legendary"];
C.rarityColors = ["#66FFFF", "#9966FF", "#FFCC00", "#CCFF00"];
C.rarityOutlineColors = ["#55AAFF", "#CC66FF", "#FFCC00", "#00FF00"];

C.lineTierRate = [1, 0.15, 0.05];
C.noTierRate = [0, 0, 0, 0];
C.redCubeTierRate = [0.1, 0.05, 0.025, 0];
C.blackCubeTierRate = [0.2, 0.1, 0.05, 0];
C.bonusCubeTierRate = C.blackCubeTierRate;

C.category = {};
C.category.hat = 0;
C.category.top = 1;
C.category.bottom = 2;
C.category.overall = 3;
C.category.shoulder = 4;
C.category.face = 5;
C.category.eye = 6;
C.category.earring = 7;
C.category.pendant = 8;
C.category.pendant2 = 9;
C.category.ring = 10;
C.category.ring2 = 11;
C.category.ring3 = 12;
C.category.ring4 = 13;
C.category.shoes = 14;
C.category.gloves = 15;
C.category.cape = 16;
C.category.belt = 17;
C.category.heart = 18;
C.category.badge = 19;
C.category.weapon = 20;
C.category.secondary = 21;
C.category.shield = 22;
C.category.emblem = 23;

C.categories = ["Hat", "Top", "Bottom", "Overall", "Shoulder Decoration", "Face Accessory", "Eye Accessory", "Earring", "Pendant", "Pendant", "Ring", "Ring", "Ring", "Ring", "Shoes", "Glove", "Cape", "Belt", "Mechanical Heart", "Badge", "Weapon", "Secondary Weapon", "Shield", "Emblem"];

C.categoryGridX = [2, 2, 2, 2, 3, 2, 2, 3, 1, 1, 0, 0, 0, 0, 2, 3, 4, 1, 4, 4, 1, 4, 4, 4];
C.categoryGridY = [0, 3, 4, 3, 3, 1, 2, 2, 2, 1, 0, 1, 2, 3, 5, 4, 4, 4, 5, 1, 3, 3, 3, 0];

C.optionTypes = ["10", "11", "20", "40", "51", "52", "53", "54", "55"];
C.optionArr =
[
//  1     3     5     7     9    11    13    15    17    19    21    23
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1], //10
[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], //11
[1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0], //20
[0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //40
[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //51
[0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //52
[0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //53
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], //54
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]  //55
];

C.emptyTop = {id:"emptyTop", name:"emptyTop", category:C.category.top, reqLevel:200, icon:Assets.blank, offsetX: 0, offsetY: 0};
C.emptyBottom = {id:"emptyBottom", name:"emptyBottom", category:C.category.bottom, reqLevel:200, icon:Assets.blank, offsetX: 0, offsetY: 0};

C._1002603 = {id:"_1002603", name:"White Maple Bandana", category:C.category.hat, reqLevel:0, icon:Assets._1002603, offsetX: -4, offsetY: 0};
C._1002357 = {id:"_1002357", name:"Zakum Helmet", category:C.category.hat, reqLevel:50, icon:Assets._1002357, offsetX: -5, offsetY: -3};
C._1003797 = {id:"_1003797", name:"Royal Warrior Helm", category:C.category.hat, reqLevel:150, icon:Assets._1003797, offsetX: -5, offsetY: -1};
C._1003798 = {id:"_1003798", name:"Royal Dunwitch Hat", category:C.category.hat, reqLevel:150, icon:Assets._1003798, offsetX: -4, offsetY: 0};
C._1003799 = {id:"_1003799", name:"Royal Ranger Beret", category:C.category.hat, reqLevel:150, icon:Assets._1003799, offsetX: -3, offsetY: -3};
C._1003800 = {id:"_1003800", name:"Royal Assassin Hood", category:C.category.hat, reqLevel:150, icon:Assets._1003800, offsetX: -3, offsetY: -3};
C._1003801 = {id:"_1003801", name:"Royal Wanderer Hat", category:C.category.hat, reqLevel:150, icon:Assets._1003801, offsetX: -2, offsetY: 0};
C._1003976 = {id:"_1003976", name:"Sweetwater Hat", category:C.category.hat, reqLevel:160, icon:Assets._1003976, offsetX: -4, offsetY: 0};
C._1004422 = {id:"_1004422", name:"AbsoLab Knight Helm", category:C.category.hat, reqLevel:160, icon:Assets._1004422, offsetX: -5, offsetY: 0};
C._1004423 = {id:"_1004423", name:"AbsoLab Mage Crown", category:C.category.hat, reqLevel:160, icon:Assets._1004423, offsetX: -5, offsetY: 0};
C._1004424 = {id:"_1004424", name:"AbsoLab Archer Hood", category:C.category.hat, reqLevel:160, icon:Assets._1004424, offsetX: -4, offsetY: 0};
C._1004425 = {id:"_1004425", name:"AbsoLab Bandit Cap", category:C.category.hat, reqLevel:160, icon:Assets._1004425, offsetX: -2, offsetY: -4};
C._1004426 = {id:"_1004426", name:"AbsoLab Pirate Fedora", category:C.category.hat, reqLevel:160, icon:Assets._1004426, offsetX: -5, offsetY: 2};

C._1012058 = {id:"_1012058", name:"Branch Nose", category:C.category.face, reqLevel:40, icon:Assets._1012058, offsetX: -2, offsetY: 0};
C._1012076 = {id:"_1012076", name:"Smiling Mask", category:C.category.face, reqLevel:25, icon:Assets._1012076, offsetX: -2, offsetY: 0};
C._1012106 = {id:"_1012106", name:"Rat Mouth", category:C.category.face, reqLevel:25, icon:Assets._1012106, offsetX: -3, offsetY: 4};
C._1012189 = {id:"_1012189", name:"Blue Mask", category:C.category.face, reqLevel:55, icon:Assets._1012189, offsetX: -2, offsetY: 0};
C._1012191 = {id:"_1012191", name:"Reverse Dual Blade Mask", category:C.category.face, reqLevel:100, icon:Assets._1012191, offsetX: -2, offsetY: 0};
C._1012478 = {id:"_1012478", name:"Condensed Power Crystal", category:C.category.face, reqLevel:110, icon:Assets._1012478, offsetX: 0, offsetY: 0};
C._1012438 = {id:"_1012438", name:"Sweetwater Tattoo", category:C.category.face, reqLevel:160, icon:Assets._1012438, offsetX: -2, offsetY: 0};

C._1022060 = {id:"_1022060", name:"White Raccoon Mask", category:C.category.eye, reqLevel:45, icon:Assets._1022060, offsetX: -4, offsetY: 3};
C._1022082 = {id:"_1022082", name:"Spectrum Goggles", category:C.category.eye, reqLevel:70, icon:Assets._1022082, offsetX: -4, offsetY: 3};
C._1022231 = {id:"_1022231", name:"Aquatic Eye Accessory", category:C.category.eye, reqLevel:100, icon:Assets._1022231, offsetX: 0, offsetY: 0};
C._1022211 = {id:"_1022211", name:"Sweetwater Glasses", category:C.category.eye, reqLevel:160, icon:Assets._1022211, offsetX: -4, offsetY: -1};

C._1032003 = {id:"_1032003", name:"Amethyst Earrings", category:C.category.earring, reqLevel:15, icon:Assets._1032003, offsetX: -2, offsetY: 2};
C._1032013 = {id:"_1032013", name:"Red-Hearted Earrings", category:C.category.earring, reqLevel:50, icon:Assets._1032013, offsetX: -2, offsetY: 2};
C._1032022 = {id:"_1032022", name:"Half Earrings", category:C.category.earring, reqLevel:75, icon:Assets._1032022, offsetX: -2, offsetY: 0};
C._1032183 = {id:"_1032183", name:"Meister Earring", category:C.category.earring, reqLevel:130, icon:Assets._1032183, offsetX: -4, offsetY: -1};
C._1032222 = {id:"_1032222", name:"Reinforced Gollux Earrings", category:C.category.earring, reqLevel:140, icon:Assets._1032222, offsetX: -7, offsetY: -3};
C._1032223 = {id:"_1032223", name:"Superior Gollux Earrings", category:C.category.earring, reqLevel:150, icon:Assets._1032223, offsetX: -7, offsetY: -3};

C._1040002 = {id:"_1040002", name:"White Undershirt", category:C.category.top, reqLevel:0, icon:Assets._1040002, offsetX: -3, offsetY: 0};
C._1041113 = {id:"_1041113", name:"Pink Frill Pajama Top", category:C.category.top, reqLevel:0, icon:Assets._1041113, offsetX: -1, offsetY: 0};
C._1042255 = {id:"_1042255", name:"Eagle Eye Dunwitch Robe", category:C.category.top, reqLevel:150, icon:Assets._1042255, offsetX: -3, offsetY: 0};
C._1042256 = {id:"_1042256", name:"Eagle Eye Ranger Cowl", category:C.category.top, reqLevel:150, icon:Assets._1042256, offsetX: -3, offsetY: 0};
C._1042257 = {id:"_1042257", name:"Eagle Eye Assassin Shirt", category:C.category.top, reqLevel:150, icon:Assets._1042257, offsetX: -4, offsetY: 0};
C._1042258 = {id:"_1042258", name:"Eagle Eye Wanderer Coat", category:C.category.top, reqLevel:150, icon:Assets._1042258, offsetX: -3, offsetY: -1};
C._1042254 = {id:"_1042254", name:"Eagle Eye Warrior Armor", category:C.category.top, reqLevel:150, icon:Assets._1042254, offsetX: -2, offsetY: 2};

C._1050018 = {id:"_1050018", name:"Blue Sauna Robe", category:C.category.overall, reqLevel:30, icon:Assets._1050018, offsetX: -3, offsetY: 0};
C._1051017 = {id:"_1051017", name:"Red Sauna Robe", category:C.category.overall, reqLevel:30, icon:Assets._1051017, offsetX: -3, offsetY: 0};
C._1052198 = {id:"_1052198", name:"Chaos Pink Bean Suit", category:C.category.overall, reqLevel:135, icon:Assets._1052198, offsetX: -2, offsetY: 0};
C._1052527 = {id:"_1052527", name:"Black Bean Suit", category:C.category.overall, reqLevel:135, icon:Assets._1052527, offsetX: -1, offsetY: 0};
C._1052669 = {id:"_1052669", name:"Sweetwater Suit", category:C.category.overall, reqLevel:160, icon:Assets._1052669, offsetX: -2, offsetY: -1};
C._1052882 = {id:"_1052882", name:"AbsoLab Knight Suit", category:C.category.overall, reqLevel:160, icon:Assets._1052882, offsetX: -1, offsetY: -2};
C._1052887 = {id:"_1052887", name:"AbsoLab Mage Suit", category:C.category.overall, reqLevel:160, icon:Assets._1052887, offsetX: -2, offsetY: -2};
C._1052888 = {id:"_1052888", name:"AbsoLab Archer Suit", category:C.category.overall, reqLevel:160, icon:Assets._1052888, offsetX: -3, offsetY: -2};
C._1052889 = {id:"_1052889", name:"AbsoLab Bandit Suit", category:C.category.overall, reqLevel:160, icon:Assets._1052889, offsetX: -2, offsetY: -2};
C._1052890 = {id:"_1052890", name:"AbsoLab Pirate Suit", category:C.category.overall, reqLevel:160, icon:Assets._1052890, offsetX: -1, offsetY: -2};

C._1062001 = {id:"_1062001", name:"Sandblasted Jeans", category:C.category.bottom, reqLevel:16, icon:Assets._1062001, offsetX: -1, offsetY: 0};
C._1060132 = {id:"_1060132", name:"Stirgeman Power Pants", category:C.category.bottom, reqLevel:70, icon:Assets._1060132, offsetX: -1, offsetY: 0};
C._1061154 = {id:"_1061154", name:"Stirgeman Power Skirt", category:C.category.bottom, reqLevel:70, icon:Assets._1061154, offsetX: -1, offsetY: 2};
C._1062165 = {id:"_1062165", name:"Trixter Warrior Pants", category:C.category.bottom, reqLevel:150, icon:Assets._1062165, offsetX: -1, offsetY: 0};
C._1062166 = {id:"_1062166", name:"Trixter Dunwitch Pants", category:C.category.bottom, reqLevel:150, icon:Assets._1062166, offsetX: -1, offsetY: 0};
C._1062167 = {id:"_1062167", name:"Trixter Ranger Pants", category:C.category.bottom, reqLevel:150, icon:Assets._1062167, offsetX: -2, offsetY: 0};
C._1062168 = {id:"_1062168", name:"Trixter Assassin Pants", category:C.category.bottom, reqLevel:150, icon:Assets._1062168, offsetX: -1, offsetY: -2};
C._1062169 = {id:"_1062169", name:"Trixter Wanderer Pants", category:C.category.bottom, reqLevel:150, icon:Assets._1062169, offsetX: -2, offsetY: -2};

C._1072005 = {id:"_1072005", name:"Leather Sandals", category:C.category.shoes, reqLevel:0, icon:Assets._1072005, offsetX: -2, offsetY: 0};
C._1072018 = {id:"_1072018", name:"Blue Sneakers", category:C.category.shoes, reqLevel:31, icon:Assets._1072018, offsetX: -2, offsetY: 0};
C._1072238 = {id:"_1072238", name:"Violet Snowshoes", category:C.category.shoes, reqLevel:80, icon:Assets._1072238, offsetX: -2, offsetY: -1};
C._1072743 = {id:"_1072743", name:"Tyrant Hyades Boots", category:C.category.shoes, reqLevel:150, icon:Assets._1072743, offsetX: 0, offsetY: -2};
C._1072743_2 = {id:"_1072743_2", name:"Tyrant Hermes Boots", category:C.category.shoes, reqLevel:150, icon:Assets._1072743, offsetX: 0, offsetY: -2};
C._1072743_3 = {id:"_1072743_3", name:"Tyrant Charon Boots", category:C.category.shoes, reqLevel:150, icon:Assets._1072743, offsetX: 0, offsetY: -2};
C._1072743_4 = {id:"_1072743_4", name:"Tyrant Lycaon Boots", category:C.category.shoes, reqLevel:150, icon:Assets._1072743, offsetX: 0, offsetY: -2};
C._1072743_5 = {id:"_1072743_5", name:"Tyrant Altair Boots", category:C.category.shoes, reqLevel:150, icon:Assets._1072743, offsetX: 0, offsetY: -2};
C._1072870 = {id:"_1072870", name:"Sweetwater Shoes", category:C.category.shoes, reqLevel:160, icon:Assets._1072870, offsetX: -4, offsetY: 0};
C._1073030 = {id:"_1073030", name:"Absolab Knight Shoes", category:C.category.shoes, reqLevel:160, icon:Assets._1073030, offsetX: -2, offsetY: -2};
C._1073030_2 = {id:"_1073030_2", name:"Absolab Mage Shoes", category:C.category.shoes, reqLevel:160, icon:Assets._1073030, offsetX: -2, offsetY: -2};
C._1073030_3 = {id:"_1073030_3", name:"Absolab Archer Shoes", category:C.category.shoes, reqLevel:160, icon:Assets._1073030, offsetX: -2, offsetY: -2};
C._1073030_4 = {id:"_1073030_4", name:"Absolab Bandit Shoes", category:C.category.shoes, reqLevel:160, icon:Assets._1073030, offsetX: -2, offsetY: -2};
C._1073030_5 = {id:"_1073030_5", name:"Absolab Pirate Shoes", category:C.category.shoes, reqLevel:160, icon:Assets._1073030, offsetX: -2, offsetY: -2};

C._1082002 = {id:"_1082002", name:"Work Gloves", category:C.category.gloves, reqLevel:10, icon:Assets._1082002, offsetX: -2, offsetY: 0};
C._1082173 = {id:"_1082173", name:"Stormcaster Gloves", category:C.category.gloves, reqLevel:50, icon:Assets._1082173, offsetX: -2, offsetY: -1};
C._1082222 = {id:"_1082222", name:"Strong Machine Gloves", category:C.category.gloves, reqLevel:80, icon:Assets._1082222, offsetX: -1, offsetY: -2};
C._1082488 = {id:"_1082488", name:"Dimension Gloves", category:C.category.gloves, reqLevel:140, icon:Assets._1082488, offsetX: -4, offsetY: -2};
C._1082489 = {id:"_1082489", name:"High Dimension Gloves", category:C.category.gloves, reqLevel:140, icon:Assets._1082489, offsetX: -4, offsetY: -2};
C._1082543 = {id:"_1082543", name:"Tyrant Hyades Gloves", category:C.category.gloves, reqLevel:150, icon:Assets._1082543, offsetX: -4, offsetY: -2};
C._1082543_2 = {id:"_1082543_2", name:"Tyrant Hermes Gloves", category:C.category.gloves, reqLevel:150, icon:Assets._1082543, offsetX: -4, offsetY: -2};
C._1082543_3 = {id:"_1082543_3", name:"Tyrant Charon Gloves", category:C.category.gloves, reqLevel:150, icon:Assets._1082543, offsetX: -4, offsetY: -2};
C._1082543_4 = {id:"_1082543_4", name:"Tyrant Lycaon Gloves", category:C.category.gloves, reqLevel:150, icon:Assets._1082543, offsetX: -4, offsetY: -2};
C._1082543_5 = {id:"_1082543_5", name:"Tyrant Altair Gloves", category:C.category.gloves, reqLevel:150, icon:Assets._1082543, offsetX: -4, offsetY: -2};
C._1082556 = {id:"_1082556", name:"Sweetwater Gloves", category:C.category.gloves, reqLevel:160, icon:Assets._1082556, offsetX: -2, offsetY: 0};
C._1082636 = {id:"_1082636", name:"Absolab Knight Gloves", category:C.category.gloves, reqLevel:160, icon:Assets._1082636, offsetX: -4, offsetY: -1};
C._1082636_2 = {id:"_1082636_2", name:"Absolab Mage Gloves", category:C.category.gloves, reqLevel:160, icon:Assets._1082636, offsetX: -4, offsetY: -1};
C._1082636_3 = {id:"_1082636_3", name:"Absolab Archer Gloves", category:C.category.gloves, reqLevel:160, icon:Assets._1082636, offsetX: -4, offsetY: -1};
C._1082636_4 = {id:"_1082636_4", name:"Absolab Bandit Gloves", category:C.category.gloves, reqLevel:160, icon:Assets._1082636, offsetX: -4, offsetY: -1};
C._1082636_5 = {id:"_1082636_5", name:"Absolab Pirate Gloves", category:C.category.gloves, reqLevel:160, icon:Assets._1082636, offsetX: -4, offsetY: -1};

C._1102053 = {id:"_1102053", name:"Old Raggedy Cape", category:C.category.cape, reqLevel:25, icon:Assets._1102053, offsetX: -3, offsetY: -1};
C._1102041 = {id:"_1102041", name:"Pink Adventurer Cape", category:C.category.cape, reqLevel:50, icon:Assets._1102041, offsetX: -3, offsetY: -2};
C._1102206 = {id:"_1102206", name:"Blackfist Cloak", category:C.category.cape, reqLevel:100, icon:Assets._1102206, offsetX: -2, offsetY: 0};
C._1102481 = {id:"_1102481", name:"Tyrant Hyades Cape", category:C.category.cape, reqLevel:150, icon:Assets._1102481, offsetX: -4, offsetY: -2};
C._1102481_2 = {id:"_1102481_2", name:"Tyrant Hermes Cape", category:C.category.cape, reqLevel:150, icon:Assets._1102481, offsetX: -4, offsetY: -2};
C._1102481_3 = {id:"_1102481_3", name:"Tyrant Charon Cape", category:C.category.cape, reqLevel:150, icon:Assets._1102481, offsetX: -4, offsetY: -2};
C._1102481_4 = {id:"_1102481_4", name:"Tyrant Lycaon Cape", category:C.category.cape, reqLevel:150, icon:Assets._1102481, offsetX: -4, offsetY: -2};
C._1102481_5 = {id:"_1102481_5", name:"Tyrant Altair Cape", category:C.category.cape, reqLevel:150, icon:Assets._1102481, offsetX: -4, offsetY: -2};
C._1102623 = {id:"_1102623", name:"Sweetwater Cape", category:C.category.cape, reqLevel:160, icon:Assets._1102623, offsetX: -2, offsetY: 0};
C._1102775 = {id:"_1102775", name:"Absolab Knight Cape", category:C.category.cape, reqLevel:160, icon:Assets._1102775, offsetX: -5, offsetY: -3};
C._1102775_2 = {id:"_1102775_2", name:"Absolab Mage Cape", category:C.category.cape, reqLevel:160, icon:Assets._1102775, offsetX: -5, offsetY: -3};
C._1102775_3 = {id:"_1102775_3", name:"Absolab Archer Cape", category:C.category.cape, reqLevel:160, icon:Assets._1102775, offsetX: -5, offsetY: -3};
C._1102775_4 = {id:"_1102775_4", name:"Absolab Bandit Cape", category:C.category.cape, reqLevel:160, icon:Assets._1102775, offsetX: -5, offsetY: -3};
C._1102775_5 = {id:"_1102775_5", name:"Absolab Pirate Cape", category:C.category.cape, reqLevel:160, icon:Assets._1102775, offsetX: -5, offsetY: -3};

C._1122007 = {id:"_1122007", name:"Spiegelmann's Necklace", category:C.category.pendant, reqLevel:0, icon:Assets._1122007, offsetX: -3, offsetY: 0};
C._1122266 = {id:"_1122266", name:"Reinforced Engraved Gollux Pendant", category:C.category.pendant, reqLevel:0, icon:Assets._1122266, offsetX: -5, offsetY: -2};
C._1122267 = {id:"_1122267", name:"Superior Engraved Gollux Pendant", category:C.category.pendant, reqLevel:150, icon:Assets._1122267, offsetX: -5, offsetY: -2};
C._1122267_2 = {id:"_1122267", name:"Superior Engraved Gollux Pendant", category:C.category.pendant2, reqLevel:150, icon:Assets._1122267, offsetX: -5, offsetY: -2};

C._1132016 = {id:"_1132016", name:"Witch's Deep Purple Belt", category:C.category.belt, reqLevel:85, icon:Assets._1132016, offsetX: -3, offsetY: 0};
C._1132215 = {id:"_1132215", name:"Tinkerer's Black Belt", category:C.category.belt, reqLevel:100, icon:Assets._1132215, offsetX: -7, offsetY: -3};
C._1132245 = {id:"_1132245", name:"Reinforced Engraved Gollux Belt", category:C.category.belt, reqLevel:140, icon:Assets._1132245, offsetX: -8, offsetY: -3};
C._1132246 = {id:"_1132246", name:"Superior Engraved Gollux Belt", category:C.category.belt, reqLevel:150, icon:Assets._1132246, offsetX: -8, offsetY: -3};
C._1132174 = {id:"_1132174", name:"Tyrant Hyades Belt", category:C.category.belt, reqLevel:150, icon:Assets._1132174, offsetX: -5, offsetY: 1};
C._1132174_2 = {id:"_1132174_2", name:"Tyrant Hermes Belt", category:C.category.belt, reqLevel:150, icon:Assets._1132174, offsetX: -5, offsetY: 1};
C._1132174_3 = {id:"_1132174_3", name:"Tyrant Charon Belt", category:C.category.belt, reqLevel:150, icon:Assets._1132174, offsetX: -5, offsetY: 1};
C._1132174_4 = {id:"_1132174_4", name:"Tyrant Lycaon Belt", category:C.category.belt, reqLevel:150, icon:Assets._1132174, offsetX: -5, offsetY: 1};
C._1132174_5 = {id:"_1132174_5", name:"Tyrant Altair Belt", category:C.category.belt, reqLevel:150, icon:Assets._1132174, offsetX: -5, offsetY: 1};

C._1212063 = {id:"_1212063", name:"Fafnir Mana Cradle", category:C.category.weapon, reqLevel:150, icon:Assets._1212063, offsetX: -7, offsetY: -6};
C._1222058 = {id:"_1222058", name:"Fafnir Angelic Shooter", category:C.category.weapon, reqLevel:150, icon:Assets._1222058, offsetX: -4, offsetY: -1};
C._1232057 = {id:"_1232057", name:"Fafnir Death Bringer", category:C.category.weapon, reqLevel:150, icon:Assets._1232057, offsetX: -13, offsetY: -8};
C._1242060 = {id:"_1242060", name:"Fafnir Split Edge", category:C.category.weapon, reqLevel:150, icon:Assets._1242060, offsetX: -6, offsetY: -7};
C._1252015 = {id:"_1252015", name:"Fafnir Scepter", category:C.category.weapon, reqLevel:150, icon:Assets._1252015, offsetX: -5, offsetY: -1};
C._1302275 = {id:"_1302275", name:"Fafnir Mistilteinn", category:C.category.weapon, reqLevel:150, icon:Assets._1302275, offsetX: -4, offsetY: -4};
C._1312153 = {id:"_1312153", name:"Fafnir Twin Clever", category:C.category.weapon, reqLevel:150, icon:Assets._1312153, offsetX: -6, offsetY: -4};
C._1322203 = {id:"_1322203", name:"Fafnir Guardian Hammer", category:C.category.weapon, reqLevel:150, icon:Assets._1322203, offsetX: -6, offsetY: -4};
C._1332225 = {id:"_1332225", name:"Fafnir Damascus", category:C.category.weapon, reqLevel:150, icon:Assets._1332225, offsetX: -5, offsetY: -2};
C._1362090 = {id:"_1362090", name:"Fafnir Claire Ciel", category:C.category.weapon, reqLevel:150, icon:Assets._1362090, offsetX: -7, offsetY: -6};
C._1372177 = {id:"_1372177", name:"Fafnir Mana Taker", category:C.category.weapon, reqLevel:150, icon:Assets._1372177, offsetX: -5, offsetY: -3};
C._1382208 = {id:"_1382208", name:"Fafnir Mana Crown", category:C.category.weapon, reqLevel:150, icon:Assets._1382208, offsetX: -7, offsetY: -5};
C._1402196 = {id:"_1402196", name:"Fafnir Penitent Tears", category:C.category.weapon, reqLevel:150, icon:Assets._1402196, offsetX: -9, offsetY: -9};
C._1412135 = {id:"_1412135", name:"Fafnir Battle Cleaver", category:C.category.weapon, reqLevel:150, icon:Assets._1412135, offsetX: -9, offsetY: -9};
C._1422140 = {id:"_1422140", name:"Fafnir Lightning Striker", category:C.category.weapon, reqLevel:150, icon:Assets._1422140, offsetX: -7, offsetY: -7};
C._1432167 = {id:"_1432167", name:"Fafnir Brionak", category:C.category.weapon, reqLevel:150, icon:Assets._1432167, offsetX: -7, offsetY: -5};
C._1442223 = {id:"_1442223", name:"Fafnir Moon Glaive", category:C.category.weapon, reqLevel:150, icon:Assets._1442223, offsetX: -7, offsetY: -5};
C._1452205 = {id:"_1452205", name:"Fafnir Wind Chaser", category:C.category.weapon, reqLevel:150, icon:Assets._1452205, offsetX: -7, offsetY: -5};
C._1462193 = {id:"_1462193", name:"Fafnir Windwing Shooter", category:C.category.weapon, reqLevel:150, icon:Assets._1462193, offsetX: -7, offsetY: -5};
C._1472214 = {id:"_1472214", name:"Fafnir Risk Holder", category:C.category.weapon, reqLevel:150, icon:Assets._1472214, offsetX: -2, offsetY: -3};
C._1482168 = {id:"_1482168", name:"Fafnir Perry Talon", category:C.category.weapon, reqLevel:150, icon:Assets._1482168, offsetX: -5, offsetY: -2};
C._1492179 = {id:"_1492179", name:"Fafnir Zeliska", category:C.category.weapon, reqLevel:150, icon:Assets._1492179, offsetX: -6, offsetY: -1};
C._1522094 = {id:"_1522094", name:"Fafnir Dual Windwing", category:C.category.weapon, reqLevel:150, icon:Assets._1522094, offsetX: -4, offsetY: -4};
C._1532098 = {id:"_1532098", name:"Fafnir Lost Cannon", category:C.category.weapon, reqLevel:150, icon:Assets._1532098, offsetX: -6, offsetY: -4};
C._1542063 = {id:"_1542063", name:"Fafnir Raven Ring", category:C.category.weapon, reqLevel:150, icon:Assets._1542063, offsetX: -5, offsetY: -1};
C._1552061 = {id:"_1552061", name:"Fafnir Indigo Flash", category:C.category.weapon, reqLevel:150, icon:Assets._1552061, offsetX: -4, offsetY: 0};
C._1262016 = {id:"_1262016", name:"Fafnir Psy-limiter", category:C.category.weapon, reqLevel:150, icon:Assets._1262016, offsetX: -5, offsetY: -3};
C._1582016 = {id:"_1582016", name:"Fafnir Big Mountain", category:C.category.weapon, reqLevel:150, icon:Assets._1582016, offsetX: -5, offsetY: -2};
C._1212089 = {id:"_1212089", name:"Sweetwater Shining Rod", category:C.category.weapon, reqLevel:160, icon:Assets._1212089, offsetX: -8, offsetY: -7};
C._1222084 = {id:"_1222084", name:"Sweetwater Soul Shooter", category:C.category.weapon, reqLevel:160, icon:Assets._1222084, offsetX: -4, offsetY: 0};
C._1232084 = {id:"_1232084", name:"Sweetwater Demon Sword", category:C.category.weapon, reqLevel:160, icon:Assets._1232084, offsetX: -10, offsetY: -8};
C._1242090 = {id:"_1242090", name:"Sweetwater Chain Sword", category:C.category.weapon, reqLevel:160, icon:Assets._1242090, offsetX: -6, offsetY: -6};
C._1252033 = {id:"_1252033", name:"Sweetwater Tigress Scepter", category:C.category.weapon, reqLevel:160, icon:Assets._1252033, offsetX: -4, offsetY: -2};
C._1302297 = {id:"_1302297", name:"Sweetwater Sword", category:C.category.weapon, reqLevel:160, icon:Assets._1302297, offsetX: -5, offsetY: -6};
C._1312173 = {id:"_1312173", name:"Sweetwater Axe", category:C.category.weapon, reqLevel:160, icon:Assets._1312173, offsetX: -3, offsetY: -3};
C._1322223 = {id:"_1322223", name:"Sweetwater Mace", category:C.category.weapon, reqLevel:160, icon:Assets._1322223, offsetX: -3, offsetY: 0};
C._1332247 = {id:"_1332247", name:"Sweetwater Knife", category:C.category.weapon, reqLevel:160, icon:Assets._1332247, offsetX: -4, offsetY: -1};
C._1362109 = {id:"_1362109", name:"Sweetwater Cane", category:C.category.weapon, reqLevel:160, icon:Assets._1362109, offsetX: -2, offsetY: -2};
C._1372195 = {id:"_1372195", name:"Sweetwater Wand", category:C.category.weapon, reqLevel:160, icon:Assets._1372195, offsetX: -4, offsetY: -3};
C._1382231 = {id:"_1382231", name:"Sweetwater Staff", category:C.category.weapon, reqLevel:160, icon:Assets._1382231, offsetX: -5, offsetY: -4};
C._1402220 = {id:"_1402220", name:"Sweetwater Two-Handed Sword", category:C.category.weapon, reqLevel:160, icon:Assets._1402220, offsetX: -6, offsetY: -9};
C._1412152 = {id:"_1412152", name:"Sweetwater Two-Handed Axe", category:C.category.weapon, reqLevel:160, icon:Assets._1412152, offsetX: -3, offsetY: -3};
C._1422158 = {id:"_1422158", name:"Sweetwater Maul", category:C.category.weapon, reqLevel:160, icon:Assets._1422158, offsetX: -5, offsetY: -4};
C._1432187 = {id:"_1432187", name:"Sweetwater Spear", category:C.category.weapon, reqLevel:160, icon:Assets._1432187, offsetX: -5, offsetY: -3};
C._1442242 = {id:"_1442242", name:"Sweetwater Polearm", category:C.category.weapon, reqLevel:160, icon:Assets._1442242, offsetX: -5, offsetY: -4};
C._1452226 = {id:"_1452226", name:"Sweetwater Bow", category:C.category.weapon, reqLevel:160, icon:Assets._1452226, offsetX: -8, offsetY: -6};
C._1462213 = {id:"_1462213", name:"Sweetwater Crossbow", category:C.category.weapon, reqLevel:160, icon:Assets._1462213, offsetX: -5, offsetY: -3};
C._1472235 = {id:"_1472235", name:"Sweetwater Steer", category:C.category.weapon, reqLevel:160, icon:Assets._1472235, offsetX: -1, offsetY: 0};
C._1482189 = {id:"_1482189", name:"Sweetwater Grip", category:C.category.weapon, reqLevel:160, icon:Assets._1482189, offsetX: -2, offsetY: -1};
C._1492199 = {id:"_1492199", name:"Sweetwater Shooter", category:C.category.weapon, reqLevel:160, icon:Assets._1492199, offsetX: -4, offsetY: 0};
C._1522113 = {id:"_1522113", name:"Sweetwater Twin Angels", category:C.category.weapon, reqLevel:160, icon:Assets._1522113, offsetX: -4, offsetY: -3};
C._1532118 = {id:"_1532118", name:"Sweetwater Hand Cannon", category:C.category.weapon, reqLevel:160, icon:Assets._1532118, offsetX: -6, offsetY: -5};
C._1542072 = {id:"_1542072", name:"Sweetwater Katana", category:C.category.weapon, reqLevel:160, icon:Assets._1542072, offsetX: -4, offsetY: -2};
C._1552072 = {id:"_1552072", name:"Sweetwater Wind", category:C.category.weapon, reqLevel:160, icon:Assets._1552072, offsetX: -4, offsetY: 1};
C._1262029 = {id:"_1262029", name:"Sweetwater Psy-limiter", category:C.category.weapon, reqLevel:160, icon:Assets._1262029, offsetX: -3, offsetY: -2};
C._1582025 = {id:"_1582025", name:"Sweetwater Gauntlet Buster", category:C.category.weapon, reqLevel:160, icon:Assets._1582025, offsetX: -4, offsetY: -4};
C._1572007 = {id:"_1572007", name:"Lazuli Type 7", category:C.category.weapon, reqLevel:170, icon:Assets._1572007, offsetX: -5, offsetY: -4};

C._1342082 = {id:"_1342082", name:"Fafnir Rapid Edge", category:C.category.secondary, reqLevel:150, icon:Assets._1342082, offsetX: -6, offsetY: -2};
C._1342090 = {id:"_1342090", name:"Sweetwater Katara", category:C.category.secondary, reqLevel:160, icon:Assets._1342090, offsetX: -5, offsetY: -2};
C._1352003 = {id:"_1352003", name:"Infinite Magic Arrows", category:C.category.secondary, reqLevel:100, icon:Assets._1352003, offsetX: -8, offsetY: -8};
C._1352103 = {id:"_1352103", name:"Carte Finale", category:C.category.secondary, reqLevel:100, icon:Assets._1352103, offsetX: -5, offsetY: -5};
C._1352202 = {id:"_1352202", name:"Virtues Medallion", category:C.category.secondary, reqLevel:100, icon:Assets._1352202, offsetX: -6, offsetY: -5};
C._1352212 = {id:"_1352212", name:"Sacred Rosary", category:C.category.secondary, reqLevel:100, icon:Assets._1352212, offsetX: -6, offsetY: -4};
C._1352222 = {id:"_1352222", name:"Berserk Chain", category:C.category.secondary, reqLevel:100, icon:Assets._1352222, offsetX: -7, offsetY: -4};
C._1352232 = {id:"_1352232", name:"Rusty Book &lt;Epode&gt;", category:C.category.secondary, reqLevel:100, icon:Assets._1352232, offsetX: -7, offsetY: -5};
C._1352242 = {id:"_1352242", name:"Metallic Blue Book &lt;Epode&gt;", category:C.category.secondary, reqLevel:100, icon:Assets._1352242, offsetX: -7, offsetY: -4};
C._1352252 = {id:"_1352252", name:"White Gold Book &lt;Epode&gt;", category:C.category.secondary, reqLevel:100, icon:Assets._1352252, offsetX: -7, offsetY: -5};
C._1352262 = {id:"_1352262", name:"Blasted Feather", category:C.category.secondary, reqLevel:100, icon:Assets._1352262, offsetX: -6, offsetY: -5};
C._1352272 = {id:"_1352272", name:"True Shot", category:C.category.secondary, reqLevel:100, icon:Assets._1352272, offsetX: -4, offsetY: -4};
C._1352282 = {id:"_1352282", name:"Slashing Shadow", category:C.category.secondary, reqLevel:100, icon:Assets._1352282, offsetX: -4, offsetY: -4};
C._1352292 = {id:"_1352292", name:"Death Sender Charm", category:C.category.secondary, reqLevel:100, icon:Assets._1352292, offsetX: -4, offsetY: -4};
C._1352403 = {id:"_1352403", name:"Karma Orb", category:C.category.secondary, reqLevel:100, icon:Assets._1352403, offsetX: -5, offsetY: -4};
C._1352503 = {id:"_1352503", name:"Nova Truth Essence", category:C.category.secondary, reqLevel:100, icon:Assets._1352503, offsetX: -4, offsetY: -3};
C._1352604 = {id:"_1352604", name:"Green Soul Ring", category:C.category.secondary, reqLevel:100, icon:Assets._1352604, offsetX: 0, offsetY: -3};
C._1352703 = {id:"_1352703", name:"Eternal Magnum", category:C.category.secondary, reqLevel:100, icon:Assets._1352703, offsetX: -9, offsetY: -8};
C._1352803 = {id:"_1352803", name:"Fire Phoenix Blade", category:C.category.secondary, reqLevel:100, icon:Assets._1352803, offsetX: -2, offsetY: 0};
C._1352813 = {id:"_1352813", name:"Mother Nature Whisper", category:C.category.secondary, reqLevel:100, icon:Assets._1352813, offsetX: -4, offsetY: -2};
C._1352823 = {id:"_1352823", name:"Arcturus Fist", category:C.category.secondary, reqLevel:100, icon:Assets._1352823, offsetX: -4, offsetY: -2};
C._1352902 = {id:"_1352902", name:"Wrist Armor", category:C.category.secondary, reqLevel:100, icon:Assets._1352902, offsetX: -5, offsetY: -3};
C._1352912 = {id:"_1352912", name:"Falcon Eye", category:C.category.secondary, reqLevel:100, icon:Assets._1352912, offsetX: -6, offsetY: -5};
C._1352922 = {id:"_1352922", name:"Center Fire Bomb", category:C.category.secondary, reqLevel:100, icon:Assets._1352922, offsetX: -8, offsetY: -5};
C._1352932 = {id:"_1352932", name:"Dragon Mass", category:C.category.secondary, reqLevel:100, icon:Assets._1352932, offsetX: -6, offsetY: -6};
C._1352942 = {id:"_1352942", name:"Dragon Master&apos;s Legacy", category:C.category.secondary, reqLevel:100, icon:Assets._1352942, offsetX: -4, offsetY: -5};
C._1352952 = {id:"_1352952", name:"Maximizer Ball", category:C.category.secondary, reqLevel:100, icon:Assets._1352952, offsetX: -6, offsetY: -4};
C._1352962 = {id:"_1352962", name:"Wild Heron", category:C.category.secondary, reqLevel:100, icon:Assets._1352962, offsetX: -7, offsetY: -5};
C._1352972 = {id:"_1352972", name:"Ereve Brilliance", category:C.category.secondary, reqLevel:100, icon:Assets._1352972, offsetX: -5, offsetY: -4};
C._1353103 = {id:"_1353103", name:"Golden Fox Marble", category:C.category.secondary, reqLevel:100, icon:Assets._1353103, offsetX: -6, offsetY: -2};
C._1353203 = {id:"_1353203", name:"Queen Chess Piece", category:C.category.secondary, reqLevel:100, icon:Assets._1353203, offsetX: -7, offsetY: -3};
C._1353403 = {id:"_1353403", name:"Masterwork Charges", category:C.category.secondary, reqLevel:100, icon:Assets._1353403, offsetX: -4, offsetY: -3};
C._1353004 = {id:"_1353004", name:"Octa Core Controller", category:C.category.secondary, reqLevel:100, icon:Assets._1353004, offsetX: -2, offsetY: 0};
C._1562007 = {id:"_1562007", name:"Lapis Type 7", category:C.category.secondary, reqLevel:170, icon:Assets._1562007, offsetX: -5, offsetY: -4};
C._1552061_2 = {id:"_1552061_2", name:"Fafnir Indigo Flash", category:C.category.secondary, reqLevel:150, icon:Assets._1552061, offsetX: -4, offsetY: 0};
C._1552072_2 = {id:"_1552072_2", name:"Sweetwater Wind", category:C.category.secondary, reqLevel:160, icon:Assets._1552072, offsetX: -4, offsetY: 1};

C._1182060 = {id:"_1182060", name:"Ghost Ship Exorcist", category:C.category.badge, reqLevel:150, icon:Assets._1182060, offsetX: -2, offsetY: -1};

C._1672003 = {id:"_1672003", name:"Gold Heart", category:C.category.heart, reqLevel:30, icon:Assets._1672003, offsetX: -3, offsetY: -2};
C._1672007 = {id:"_1672007", name:"Lidium Heart", category:C.category.heart, reqLevel:30, icon:Assets._1672007, offsetX: -3, offsetY: -2};
C._1672034 = {id:"_1672034", name:"Electronic Heart Ω-Series", category:C.category.heart, reqLevel:30, icon:Assets._1672034, offsetX: -5, offsetY: -2};
C._1672007_2 = {id:"_1672007_2", name:"Superior Lidium Heart", category:C.category.heart, reqLevel:80, icon:Assets._1672007, offsetX: -3, offsetY: -2};
C._1672040 = {id:"_1672040", name:"Titanium Heart", category:C.category.heart, reqLevel:100, icon:Assets._1672040, offsetX: -3, offsetY: -1};
C._1672069 = {id:"_1672069", name:"Outlaw Heart", category:C.category.heart, reqLevel:150, icon:Assets._1672069, offsetX: -1, offsetY: 0};

C._1092008 = {id:"_1092008", name:"Pan Lid", category:C.category.shield, reqLevel:10, icon:Assets._1092008, offsetX: -1, offsetY: 2};
C._1092049 = {id:"_1092049", name:"Dragon Khanjar", category:C.category.shield, reqLevel:120, icon:Assets._1092049, offsetX: -5, offsetY: -2};
C._1092079 = {id:"_1092079", name:"VIP Magician Shield", category:C.category.shield, reqLevel:127, icon:Assets._1092079, offsetX: -5, offsetY: -5};
C._1098003 = {id:"_1098003", name:"Soul Shield of Justice", category:C.category.shield, reqLevel:100, icon:Assets._1098003, offsetX: -7, offsetY: -6};
C._1099004 = {id:"_1099004", name:"Force Shield of Extremes", category:C.category.shield, reqLevel:100, icon:Assets._1099004, offsetX: -4, offsetY: -4};
C._1092113 = {id:"_1092113", name:"Terminus Defender", category:C.category.shield, reqLevel:160, icon:Assets._1092113, offsetX: -3, offsetY: -2};

C._1152124 = {id:"_1152124", name:"Tinkerer's Black Shoulder Accessory", category:C.category.shoulder, reqLevel:100, icon:Assets._1152124, offsetX: -6, offsetY: 0};
C._1152170 = {id:"_1152170", name:"Royal Black Metal Shoulder", category:C.category.shoulder, reqLevel:120, icon:Assets._1152170, offsetX: -3, offsetY: -3};
C._1152108 = {id:"_1152108", name:"Meister Shoulder", category:C.category.shoulder, reqLevel:140, icon:Assets._1152108, offsetX: -6, offsetY: -2};
C._1152174 = {id:"_1152174", name:"Absolab Knight Shoulder", category:C.category.shoulder, reqLevel:160, icon:Assets._1152174, offsetX: -5, offsetY: -3};
C._1152174_2 = {id:"_1152174_2", name:"Absolab Mage Shoulder", category:C.category.shoulder, reqLevel:160, icon:Assets._1152174, offsetX: -5, offsetY: -3};
C._1152174_3 = {id:"_1152174_3", name:"Absolab Archer Shoulder", category:C.category.shoulder, reqLevel:160, icon:Assets._1152174, offsetX: -5, offsetY: -3};
C._1152174_4 = {id:"_1152174_4", name:"Absolab Bandit Shoulder", category:C.category.shoulder, reqLevel:160, icon:Assets._1152174, offsetX: -5, offsetY: -3};
C._1152174_5 = {id:"_1152174_5", name:"Absolab Pirate Shoulder", category:C.category.shoulder, reqLevel:160, icon:Assets._1152174, offsetX: -5, offsetY: -3};

C._1190301 = {id:"_1190301", name:"Gold Maple Leaf Emblem", category:C.category.emblem, reqLevel:100, icon:Assets._1190301, offsetX: -3, offsetY: -1};
C._1190401 = {id:"_1190401", name:"Boss Arena Emblem", category:C.category.emblem, reqLevel:60, icon:Assets._1190401, offsetX: -4, offsetY: -2};
C._1190001 = {id:"_1190001", name:"Dragon Emblem", category:C.category.emblem, reqLevel:100, icon:Assets._1190001, offsetX: -3, offsetY: -1};
C._1190101 = {id:"_1190101", name:"Angel Emblem", category:C.category.emblem, reqLevel:100, icon:Assets._1190101, offsetX: -3, offsetY: -1};
C._1190201 = {id:"_1190201", name:"Hybrid Heart", category:C.category.emblem, reqLevel:100, icon:Assets._1190201, offsetX: -2, offsetY: -2};
C._1190521 = {id:"_1190521", name:"Gold Heroes Emblem", category:C.category.emblem, reqLevel:100, icon:Assets._1190521, offsetX: -3, offsetY: -1};
C._1190601 = {id:"_1190601", name:"Gold Resistance Emblem", category:C.category.emblem, reqLevel:100, icon:Assets._1190601, offsetX: -3, offsetY: -1};
C._1190701 = {id:"_1190701", name:"Gold Demon Emblem", category:C.category.emblem, reqLevel:100, icon:Assets._1190701, offsetX: -3, offsetY: -1};
C._1190801 = {id:"_1190801", name:"Gold Cygnus Emblem", category:C.category.emblem, reqLevel:100, icon:Assets._1190801, offsetX: -3, offsetY: -1};
C._1191001 = {id:"_1191001", name:"Gold Kinesis Emblem", category:C.category.emblem, reqLevel:100, icon:Assets._1191001, offsetX: -3, offsetY: -1};

C._1113020 = {id:"_1113020", name:"Lightning God Ring", category:C.category.ring3, reqLevel:100, icon:Assets._1113020, offsetX: -6, offsetY: -4};
C._1113074 = {id:"_1113074", name:"Reinforced Gollux Ring", category:C.category.ring2, reqLevel:140, icon:Assets._1113074, offsetX: -4, offsetY: -4};
C._1113075 = {id:"_1113075", name:"Superior Gollux Ring", category:C.category.ring, reqLevel:150, icon:Assets._1113075, offsetX: -4, offsetY: -4};
C._1113072 = {id:"_1113072", name:"Cracked Gollux Ring", category:C.category.ring4, reqLevel:120, icon:Assets._1113072, offsetX: -4, offsetY: -4};
C._1113073 = {id:"_1113073", name:"Solid Gollux Ring", category:C.category.ring3, reqLevel:130, icon:Assets._1113073, offsetX: -4, offsetY: -4};
C._1112951 = {id:"_1112951", name:"Magnus's Rage", category:C.category.ring4, reqLevel:100, icon:Assets._1112951, offsetX: -4, offsetY: -2};
C._1112952 = {id:"_1112952", name:"Hilla's Rage", category:C.category.ring4, reqLevel:100, icon:Assets._1112952, offsetX: -4, offsetY: -2};
C._1113269 = {id:"_1113269", name:"Breath of Divinity", category:C.category.ring3, reqLevel:150, icon:Assets._1113269, offsetX: -3, offsetY: -3};
C._1113132 = {id:"_1113132", name:"Forest Guardian", category:C.category.ring4, reqLevel:100, icon:Assets._1113132, offsetX: -4, offsetY: -4};
C._1113185 = {id:"_1113185", name:"Blackgate Ring", category:C.category.ring4, reqLevel:120, icon:Assets._1113185, offsetX: -4, offsetY: -2};
C._1112579 = {id:"_1112579", name:"Almighty Ring", category:C.category.ring4, reqLevel:30, icon:Assets._1112579, offsetX: -3, offsetY: -1};

C.categoryItemPool = [0, 1, 2, 1, 4, 5, 6, 7, 8, 8, 10, 10, 10, 10, 14, 15, 16, 17, 18, 19, 20, 21, 21, 23];

C.itemPools = [
/* 0 */ [C._1002603,C._1002357,C._1003797,C._1003798,C._1003799,C._1003800,C._1003801,C._1003976,C._1004422,C._1004423,C._1004424,C._1004425,C._1004426],
/* 1 */ [C._1040002,C._1041113,C._1042254,C._1042255,C._1042256,C._1042257,C._1042258, C._1050018,C._1051017,C._1052198,C._1052527,C._1052669,C._1052882,C._1052887,C._1052888,C._1052889,C._1052890],
/* 2 */ [C._1062001,C._1060132,C._1061154,C._1062165,C._1062166,C._1062167,C._1062168,C._1062169],
/* 3 */ [null],
/* 4 */ [C._1152124,C._1152170,C._1152108,C._1152174,C._1152174_2,C._1152174_3,C._1152174_4,C._1152174_5],
/* 5 */ [C._1012076,C._1012106,C._1012058,C._1012189,C._1012191,C._1012478,C._1012438],
/* 6 */ [C._1022060,C._1022082,C._1022231,C._1022211],
/* 7 */ [C._1032003,C._1032013,C._1032022,C._1032183,C._1032222,C._1032223],
/* 8 */ [C._1122007,C._1122266,C._1122267],
/* 9 */ [null],
/* 10 */ [C._1113075,C._1113074,C._1113073,C._1113072,C._1113020,C._1113132,C._1113269,C._1112951,C._1112952,C._1112579,C._1113185],
/* 11 */ [null],
/* 12 */ [null],
/* 13 */ [null],
/* 14 */ [C._1072005,C._1072018,C._1072238,C._1072743,C._1072743_2,C._1072743_3,C._1072743_4,C._1072743_5,C._1072870,C._1073030,C._1073030_2,C._1073030_3,C._1073030_4,C._1073030_5],
/* 15 */ [C._1082002,C._1082173,C._1082222,C._1082488,C._1082489,C._1082543,C._1082543_2,C._1082543_3,C._1082543_4,C._1082543_5,C._1082556,C._1082636,C._1082636_2,C._1082636_3,C._1082636_4,C._1082636_5],
/* 16 */ [C._1102053,C._1102041,C._1102206,C._1102481,C._1102481_2,C._1102481_3,C._1102481_4,C._1102481_5,C._1102623,C._1102775,C._1102775_2,C._1102775_3,C._1102775_4,C._1102775_5],
/* 17 */ [C._1132016,C._1132215,C._1132245,C._1132246,C._1132174,C._1132174_2,C._1132174_3,C._1132174_4,C._1132174_5],
/* 18 */ [C._1672003,C._1672007,C._1672034,C._1672007_2,C._1672040,C._1672069],
/* 19 */ [C._1182060],
/* 20 */ [C._1212063,C._1222058,C._1232057,C._1242060,C._1252015,C._1302275,C._1312153,C._1322203,C._1332225,C._1362090,C._1372177,C._1382208,C._1402196,C._1412135,C._1422140,C._1432167,C._1442223,C._1452205,C._1462193,C._1472214,C._1482168,C._1492179,C._1522094,C._1532098,C._1542063,C._1552061,C._1262016,C._1582016,C._1212089,C._1222084,C._1232084,C._1242090,C._1252033,C._1302297,C._1312173,C._1322223,C._1332247,C._1362109,C._1372195,C._1382231,C._1402220,C._1412152,C._1422158,C._1432187,C._1442242,C._1452226,C._1462213,C._1472235,C._1482189,C._1492199,C._1522113,C._1532118,C._1542072,C._1552072,C._1262029,C._1582025,C._1572007],
/* 21 */ [C._1092008,C._1098003,C._1099004,C._1352003,C._1352103,C._1352202,C._1352212,C._1352222,C._1352232,C._1352242,C._1352252,C._1352262,C._1352272,C._1352282,C._1352292,C._1352403,C._1352503,C._1352604,C._1352703,C._1352803,C._1352813,C._1352823,C._1352902,C._1352912,C._1352922,C._1353004,C._1352932,C._1352942,C._1352952,C._1352962,C._1352972,C._1353103,C._1353203,C._1353403, C._1092049,C._1092079,C._1342082,C._1552061_2,C._1342090,C._1552072_2,C._1092113,C._1562007],
/* 22 */ [null],
/* 23 */ [C._1190301,C._1190401,C._1190001,C._1190101,C._1190201,C._1190521,C._1190601,C._1190701,C._1190801,C._1191001]
];

Game = {};
Game.isDragging = false;
Game.dragID = null;
Game.mouseX = 0;
Game.mouseY = 0;
Game.P = {pot:[], bpot:[]};
Game.E = []; //equips
Game.disableCube = false;
Game.lastCubed = null;
Game.lastCube = null;
Game.usedBonusScroll = false;
Game.equipListCategory = null;

Game.unequipTop = null;
Game.unequipBottom = null;
Game.usingOverall = false;

Game.init = function() {
  Game.parseP();
  Game.preloadImages();

  document.onclick = function(e) {
    
  }
  document.onmousemove = function(e) {
    var eventDoc, doc, body, pageX, pageY;
    event = event || window.event; // IE-ism

    // (This is to support old IE)
    if (event.pageX == null && event.clientX != null) {
      eventDoc = (event.target && event.target.ownerDocument) || document;
      doc = eventDoc.documentElement;
      body = eventDoc.body;
      event.pageX = event.clientX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY +
        (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
        (doc && doc.clientTop  || body && body.clientTop  || 0 );
    }
    
    Game.mouseX = event.pageX;
    Game.mouseY = event.pageY;
    if (Game.isDragging) Game.dragUpdate();
  }
  
  // images
  
  document.body.style.cursor = Assets.cursor + "0 3, auto";
  l('background').style.backgroundImage = Assets.background;
  
  var inventory = l('inventory');
  inventory.style.backgroundImage = Assets.inventory;
  inventory.style.left = 0 + "px";
  inventory.style.top = 50 + "px";
  
  var equipment = l('equipment');
  equipment.style.backgroundImage = Assets.equipment;
  equipment.style.left = 180 + "px";
  equipment.style.top = 50 + "px";
  
  var cubeWindow = l('cubeWindow');
  cubeWindow.style.backgroundImage = Assets.cubeWindowRed;
  cubeWindow.style.left = 430 + "px";
  cubeWindow.style.top = 50 + "px";
  cubeWindow.style.display = 'none';
  
  var equipList = l('equipList');
  equipList.style.backgroundImage = Assets.equipList;
  equipList.style.left = 430 + "px";
  equipList.style.top = 50 + "px";
  equipList.style.display = 'none';
  
  var tooltip = l('tooltip');
  tooltip.style.backgroundImage = Assets.tooltip_small;
  l('tooltipcover').style.backgroundImage = Assets.tooltipCover;
  
  var equiptooltip = l('equiptooltip');
  equiptooltip.style.backgroundImage = Assets.tooltip_equip_small;
  l('equiptooltipcover').style.backgroundImage = Assets.tooltipCover;
  l('equiptooltippot').style.backgroundImage = Assets.tooltipPot0;
  
  l('equiptooltipcube1').style.backgroundImage = Assets.redCubeRaw;
  l('equiptooltipcube2').style.backgroundImage = Assets.blackCubeRaw;
  l('equiptooltipcube3').style.backgroundImage = Assets.bonusCubeRaw;
  
  var clickscreen = l('clickscreen');
  clickscreen.onclick = function() {
    //console.log("back click");
    Game.stopDragging();
    Game.equipListCategory = null;
    l('equipList').style.display = 'none';
  }
  clickscreen.onmousemove = function() {
    var tooltip = l('tooltip');
    tooltip.style.display = 'none';
    var tooltip = l('equiptooltip');
    tooltip.style.display = 'none';
  };
  
  // game logic
  
  Game.addInventoryItem(C.redCube, 0, 0);
  Game.addInventoryItem(C.blackCube, 0, 1);
  Game.addInventoryItem(C.bonusScroll, 1, 0);
  
  var equips = [C._1182060, C._1672040, C._1012438, C._1022211, C._1032223, C._1113073, C._1113074, C._1113075, C._1113072, C._1122267, C._1122267_2, C._1152108];
  
  var hero1h = [C._1302275, C._1092113, C._1003797, C._1042254, C._1062165, C._1072743, C._1082543, C._1102481, C._1132174, C._1190301];
  var aran = [C._1442223, C._1352932, C._1003797, C._1042254, C._1062165, C._1072743, C._1082543, C._1102481, C._1132174, C._1190521];
  var bishop = [C._1372177, C._1092079, C._1003798, C._1042255, C._1062166, C._1072743_2, C._1082543_2, C._1102481_2, C._1132174_2, C._1190301];
  var luminous = [C._1212063, C._1352403, C._1003798, C._1042255, C._1062166, C._1072743_2, C._1082543_2, C._1102481_2, C._1132174_2, C._1190521];
  var marksman = [C._1462193, C._1352272, C._1003799, C._1042256, C._1062167, C._1072743_3, C._1082543_3, C._1102481_3, C._1132174_3, C._1190301];
  var wildhunter = [C._1462193, C._1352962, C._1003799, C._1042256, C._1062167, C._1072743_3, C._1082543_3, C._1102481_3, C._1132174_3, C._1190601];
  var cannoneer = [C._1532098, C._1352922, C._1003801, C._1042258, C._1062169, C._1072743_5, C._1082543_5, C._1102481_5, C._1132174_5, C._1190301];
  var phantom = [C._1362090, C._1352103, C._1003800, C._1042257, C._1062168, C._1072743_4, C._1082543_4, C._1102481_4, C._1132174_4, C._1190521];
  var xenon = [C._1242060, C._1353004, C._1003801, C._1042258, C._1062169, C._1072743_5, C._1082543_5, C._1102481_5, C._1132174_5, C._1190201];
  var presets = [hero1h, aran, bishop, luminous, marksman, wildhunter, cannoneer, phantom, xenon];
  
  equips = equips.concat(choose(presets));
  
  //var equips = [C._1182060, C._1672069, C._1003797, C._1012438, C._1022211, C._1032223, C.emptyTop, C._1062165, C._1072743, C._1082543, C._1092113, C._1102481, C._1113020, C._1113074, C._1113075, C._1113132, C._1122267, C._1122267_2, C._1132174, C._1152124, C._1190301, C._1302275];
  
  for (var i = 0; i < equips.length; i++) {
    var newEquip = {info:equips[i], pot:null, bpot:null};
    newEquip.pot = Game.getP(C.rare, C.noTierRate, false, newEquip.info.reqLevel, newEquip.info.category);
    newEquip.count = {red:0, black:0, bonus:0};
    Game.E.push(newEquip);
    Game.addEquipmentItem(newEquip); //todo
  }
  
  l('cubeButtonOK').onclick = function() {
    Game.playSound(Sounds.click);
    if (!Game.disableCube) l('cubeWindow').style.display = 'none';
  };
  
  var mouseover = function() {Game.playSound(Sounds.mouseover);};
  l('cubeButtonAgain').onmouseenter = mouseover;
  l('cubeButtonOK').onmouseenter = mouseover;
  l('cubeButtonBefore').onmouseenter = mouseover;
  l('cubeButtonAfter').onmouseenter = mouseover;
  
  // cube item slot
  
  var img = document.createElement("div");
  
  img.className = "item icon";
  img.id = "cubeItem";
  img.style.backgroundImage = Assets.outlawHeart;
  img.style.display = 'none';
  img.style.left = C.cubeItemX + "px";
  img.style.top = C.cubeItemY + "px";
  img.style.zIndex = "110";
  l('cubeWindow').appendChild(img);
  
  var button = document.createElement("div");
  button.className = "button";
  button.id = "cubeItemButton";
  button.style.left = C.cubeItemX - 3 + "px";
  button.style.top =  C.cubeItemY - 3 + "px";
  l('cubeWindow').appendChild(button);
}

Game.update = function() {
  if (Game.isDragging == true) {
  }
}

Game.startDragging = function(id = null) {
  Game.isDragging = true;
  Game.dragUpdate();
  l('dragged').style.display = 'block';
  document.body.style.cursor = Assets.cursorGrab + "5 2, auto";
  Game.dragID = id;
  var tooltip = l('tooltip');
  tooltip.style.display = 'none';
}

Game.stopDragging = function() {
  if (Game.isDragging) Game.playSound(Sounds.dragend);
  Game.isDragging = false;
  l('dragged').style.display = 'none';
  document.body.style.cursor = Assets.cursor + "0 3, auto";
  Game.dragID = null;
}

Game.dragUpdate = function() {
  var elem = l('dragged');
  elem.style.left = (Game.mouseX - 18) + "px";
  elem.style.top = (Game.mouseY - 18) + "px";
}

Game.addInventoryItem = function(info, row, col) {
  var img = document.createElement("div");
  img.className = "item icon";
  img.id = "inventoryitem" + row + col;
  img.style.backgroundImage = info.icon;
  img.style.display = 'block';
  img.style.left = C.inventoryOrigX + C.inventorySpaceX * col + info.offsetX + "px";
  img.style.top = C.inventoryOrigY + C.inventorySpaceY * row + info.offsetY + "px";
  l('inventory').appendChild(img);
  
  var button = document.createElement("div");
  button.className = "button";
  button.id = "inventorybutton" + row + col;
  button.style.left = C.inventoryOrigX + C.inventorySpaceX * col + "px";
  button.style.top =  C.inventoryOrigY + C.inventorySpaceY * row + "px";
  button.style.cursor = Assets.cursorPointer + "6 7, pointer";
  button.onclick = function() {
    var dragged = l('dragged');
    dragged.style.backgroundImage = info.iconRaw;
    if (!Game.isDragging) {
      Game.startDragging(info.id);
      Game.playSound(Sounds.drag);
      equipList.style.display = 'none';
      Game.equipListCategory = null;
    }
    else Game.stopDragging();
  };
  button.ondblclick = function() {
    if (info.id == C.bonusScroll.id) {
      Game.consumeBonusScroll();
    }
  };
  button.onmouseenter = function() {
    l('tooltiptitle').innerHTML = info.name;
    l('tooltipdescription').innerHTML = info.desc;
    var tti = l('tooltipimage');
    tti.style.backgroundImage = Assets[info.id];
    tti.style.left = C.tooltipImageX + info.offsetX * 2 + "px";
    tti.style.top = C.tooltipImageY + info.offsetY * 2 + "px";
    var tooltip = l('tooltip');
    if (info.id == C.blackCube.id) tooltip.style.backgroundImage = Assets.tooltip_big;
    else tooltip.style.backgroundImage = Assets.tooltip_small;
  }
  button.onmousemove = function() {
    if (!Game.isDragging) {
      var tooltip = l('tooltip');
      tooltip.style.display = 'block';
      tooltip.style.left = Game.mouseX + "px";
      tooltip.style.top = Game.mouseY + 23 + "px";
    }
  };
  l('inventory').appendChild(button);
}

Game.addEquipmentItem = function(obj, col = -1, row = -1) { 
  var img = document.createElement("div");
  if (col == -1) col = C.categoryGridX[obj.info.category];
  if (row == -1) row = C.categoryGridY[obj.info.category];
  
  img.className = "item icon";
  img.style.backgroundImage = obj.info.icon;
  img.style.display = 'block';
  img.style.left = C.equipmentOrigX + C.equipmentSpaceX * col + obj.info.offsetX + "px";
  img.style.top = C.equipmentOrigY + C.equipmentSpaceY * row + obj.info.offsetY + "px";
  l('equipment').appendChild(img);
  
  var outline = document.createElement("div");
  outline.className = "itemoutline";
  outline.id = "itemoutline" + obj.info.category;
  outline.style.borderColor = C.rarityOutlineColors[obj.pot.rarity];
  outline.style.left = C.equipmentOrigX + C.equipmentSpaceX * col - 7 + "px";
  outline.style.top =  C.equipmentOrigY + C.equipmentSpaceY * row - 6 + "px";
  l('equipment').appendChild(outline);
  
  var button = document.createElement("div");
  button.className = "button";
  button.id = "equipbutton" + obj.info.category;
  button.style.left = C.equipmentOrigX + C.equipmentSpaceX * col - 3 + "px";
  button.style.top =  C.equipmentOrigY + C.equipmentSpaceY * row - 3 + "px";
  button.onclick = function() {
    if (obj.info.id == "emptyTop" || obj.info.id == "emptyBottom") return;
    if (Game.isDragging && !Game.disableCube) {
      if (Game.dragID == C.redCube.id)
        Game.cube(obj);
      else if (Game.dragID == C.blackCube.id)
        Game.cubeBlack(obj);
      else if (Game.dragID == C.bonusCube.id)
        Game.cubeBonus(obj);
      else if (Game.dragID == C.bonusScroll.id)
        Game.consumeBonusScroll();
      
      l('equipList').style.display = 'none';
      Game.equipListCategory = null;
      button.onmouseenter();
      Game.stopDragging();
    }
  };
  button.onmouseenter = function() {
    if (obj.info.id == "emptyTop" || obj.info.id == "emptyBottom") return;
    l('equiptooltiptitle').innerHTML = obj.info.name;
    l('equiptooltiptoptext').innerHTML = "(" + C.rarities[Math.max(obj.pot.rarity, obj.bpot ? obj.bpot.rarity : 0)] + " Item)"
    l('equiptooltiplevel').innerHTML = obj.info.reqLevel;
    l('equiptooltipcategory').innerHTML = "CATEGORY: " + C.categories[obj.info.category];
    
    l('equiptooltipcubetext1').innerHTML = obj.count.red;
    l('equiptooltipcubetext2').innerHTML = obj.count.black;
    l('equiptooltipcubetext3').innerHTML = obj.count.bonus
    
    l('equiptooltipnpotheading').style.color = C.rarityColors[obj.pot.rarity];
    l('equiptooltipnpotlines').innerHTML = obj.pot.lines.join("<br>");
    l('equiptooltipnpotimg').style.backgroundImage = Assets["tooltipPotIcon" + obj.pot.rarity];;
    
    if (Game.usedBonusScroll) {
      l('equiptooltipbpotheading').style.color = C.rarityColors[obj.bpot.rarity];
      l('equiptooltipbpotlines').innerHTML = obj.bpot.lines.join("<br>");
      l('equiptooltipbpotimg').style.backgroundImage = Assets["tooltipPotIcon" + obj.bpot.rarity];
    }
    
    l('equiptooltippot').style.backgroundImage = Assets["tooltipPot" + Math.max(obj.pot.rarity, obj.bpot ? obj.bpot.rarity : 0)];
    
    var tti = l('equiptooltipimage');
    tti.style.backgroundImage = obj.info.icon;
    tti.style.left = C.equiptooltipImageX + (obj.info.offsetX + 1) * 2 + 5 + "px";
    tti.style.top = C.equiptooltipImageY + (obj.info.offsetY + 2) * 2 + 5 + "px";
  }
  button.onmousemove = function() {
    if (obj.info.id == "emptyTop" || obj.info.id == "emptyBottom") return;
    if (1) {
      var tooltip = l('equiptooltip');
      tooltip.style.display = 'block';
      tooltip.style.left = Math.min(window.innerWidth - 261, Game.mouseX) + "px";
      tooltip.style.top = Math.min(window.innerHeight - Game.getToolTipHeight(), Game.mouseY + 23) + "px";
    }
  };
  l('equipment').appendChild(button);
    
  // right click button
  
  var itemPoolCat = C.categoryItemPool[obj.info.category];
  var itemPool = C.itemPools[itemPoolCat];
  var replaceThisItem = function(j, j2, j3) {
    return function() {
      if (j.name != obj.info.name) {
        l('equipment').removeChild(img);
        l('equipment').removeChild(outline);
        l('equipment').removeChild(button);

        var newEquip = {info:j, pot:null, bpot:null};
        //console.log(j);
        newEquip.pot = Game.getP(C.rare, C.noTierRate, false, newEquip.info.reqLevel, newEquip.info.category);

        if (Game.usedBonusScroll)
          newEquip.bpot = Game.getP(C.rare, C.noTierRate, true, newEquip.info.reqLevel, newEquip.info.category);
          
        newEquip.count = {red:0, black:0, bonus:0};

        if (itemPoolCat == C.category.ring || itemPoolCat == C.category.pendant)
          newEquip.info.category = obj.info.category; //hack for ring/pendant

        Game.E[Game.E.indexOf(obj)] = newEquip;
        Game.addEquipmentItem(newEquip, j2, j3);

        equipList.style.display = 'none';
        Game.equipListCategory = null;
        
        if (newEquip.info.id == "emptyTop" || newEquip.info.id == "emptyBottom") return;
        if (newEquip.info.category == C.category.overall) {
          Game.unequipBottom();
        }
  
        if (newEquip.info.category == C.category.bottom && Game.usingOverall) {
          Game.unequipTop();
        }
      }
    }
  };

  button.addEventListener( "contextmenu", function(e) {
    if (!Game.isDragging) {
      e.preventDefault();
      Game.openedEquipList = true;
      var equipList = l('equipList');
      if (obj.info.category == Game.equipListCategory) {
        equipList.style.display = 'none';
        Game.equipListCategory = null;
      }
      else {
        equipList.style.display = 'block';
        l('equiptip').style.display = 'none';
        Game.equipListCategory = obj.info.category;
        l('cubeWindow').style.display = 'none';
        
        var equipListText = l('equipListText');
        equipListText.innerHTML = "";
        //console.log(itemPool);
        for (var i = 0; i < itemPool.length; i++) {
          var newdiv = document.createElement("div");
          newdiv.className = "equipListItem noselect";
          newdiv.innerHTML = itemPool[i].name;
          
          newdiv.onclick = replaceThisItem(itemPool[i], col, row);
          equipListText.appendChild(newdiv);
        }
      }
    }
  });

  // hack kludge mania
  
  if (obj.info.category == C.category.overall || obj.info.category == C.category.top) {
    Game.usingOverall = obj.info.category == C.category.overall;
    Game.unequipTop = replaceThisItem(C.emptyTop, col, row);
  }

  if (obj.info.category == C.category.bottom) {
    Game.unequipBottom = replaceThisItem(C.emptyBottom, col, row);
  }
}

Game.getPLine = function(tier, isBonus, level, category) {
  var valid = [];
  var list = isBonus ? Game.P.bpot : Game.P.pot;
  var leveltier = Math.max(0, Math.floor((level - 1) / 10));
  
  for (var i = 0; i < list.length; i++) {
    var o = list[i];
    if (o.tier == tier &&
      (!o.optionType || C.optionArr[C.optionTypes.indexOf(o.optionType)][category]) &&
      (!o.reqLevel || level >= o.reqLevel)) {
      // exceptions
      var subid = parseInt(o.id.substring(3));
      var emblembl = [601, 602, 603, 551];
      if (category == C.category.emblem && emblembl.indexOf(subid) > -1) continue;
      var shieldbl = [201, 202, 206, 207];
      if ((category == C.category.shield || category == C.category.secondary) && shieldbl.indexOf(subid) > -1) continue;
      
      if (!isBonus){
        var tier2bl = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 351, 352, 353, 81];
        if (tier >= 2 && o.id[2] != 1 && tier2bl.indexOf(subid) > -1) continue;
        valid.push(o.level[leveltier]);
        //console.log(o.level, leveltier);
      }
      else {
        for (var w = 0; w < o.weight; w++) {
          valid.push(o.level[leveltier]);
        }
      }
    }
  }
  
  //console.log(valid);
  return choose(valid);
}

Game.getP = function(rarity, tierRate, isBonus, level, category) {
  var res = {};
  
  if (Math.random() < tierRate[rarity]) {
    res.tieredUp = true;
    res.rarity = rarity + 1;
  }
  else {
    res.tieredUp = false;
    res.rarity = rarity;
  }
  
  res.lines = [];
  for (var i = 0; i < C.lineTierRate.length; i++) {
    var newLine;
    if (Math.random() < C.lineTierRate[i])
      newLine = Game.getPLine(res.rarity + 1, isBonus, level, category);
    else
      newLine = Game.getPLine(res.rarity, isBonus, level, category);
    
    newLine = newLine.replace("<", "&lt;").replace(">", "&gt;").replace("\\n", " ");
    res.lines.push(newLine);
  }  
  
  return res;
}

Game.parseP = function() {
  for (var i = 0; i < P.imgdir.imgdir.length; i++) {
    var node = P.imgdir.imgdir[i];
    var tier = node["-name"][1];
    var bonus = node["-name"][2] == 2;
    
    var obj = {};
    obj.id = node["-name"];
    obj.tier = tier;
    obj.bonus = bonus;
    
    if(node.imgdir[0].int)
      if (Array.isArray(node.imgdir[0].int)) {
        for (var j = 0; j < node.imgdir[0].int.length; j++)
          obj[node.imgdir[0].int[j]["-name"]] = node.imgdir[0].int[j]["-value"];
      }
      else {
        obj[node.imgdir[0].int["-name"]] = node.imgdir[0].int["-value"];
      }
    
    // skip
    if(obj.optionBlock) continue;
    
    if(node.imgdir[0].string) //always an object
      obj.string = node.imgdir[0].string["-value"];
    
    obj.level = [];
    for (var k = 0; k < node.imgdir[1].imgdir.length; k++) {
      var int = node.imgdir[1].imgdir[k].int;
      var res = obj.string;
      if(Array.isArray(int)) {
        for (var l = 0; l < int.length; l++)
          res = res.replace("#" + int[l]["-name"], int[l]["-value"]);
      }
      else {
        res = res.replace("#" + int["-name"], int["-value"]);
      }
      obj.level.push(res);
    }
    
    if (!bonus) {
      Game.P.pot.push(obj);
    }
    else {
      Game.P.bpot.push(obj);
    }
  }
}

alt = true;
Game.cube = function(obj) {
  if (Game.openedEquipList) l('equiptip').style.display = 'none';
  else {
    Game.openedEquipList = true;
    l('equiptip').style.display = 'block';
  }
  // hack for success sound cutting itself off
  Game.playSound(alt ? Sounds.success : Sounds.successAlt);
  alt = !alt;
    
  obj.pot = Game.getP(obj.pot.rarity, C.redCubeTierRate, false, obj.info.reqLevel, obj.info.category);
  obj.count.red = obj.count.red + 1;
  Game.disableCube = true;
  Game.lastCubed = obj;

  if(obj.pot.tieredUp) l('cubeAnimation').className = "anim2 cubeAnimation";
  else l('cubeAnimation').className = "anim1 cubeAnimation";
  
  l('cubeWindow').style.display = 'block';
  l('cubeWindow').style.backgroundImage = Assets.cubeWindowRed;
  l('cubeButtonAgain').style.display = 'none';
  l('cubeButtonAgain').className = "cubeButtonAgain button2 cubeButtonAgainRed";
  l('cubeButtonOK').className = "cubeButtonOK button2 cubeButtonOKRed";
  l('cubePot2').style.display = 'none';
  l('cubeLines2').style.display = 'none';
  l('cubeButtonBefore').style.display = 'none';
  l('cubeButtonAfter').style.display = 'none';
  
  l('itemoutline' + obj.info.category).style.borderColor = C.rarityOutlineColors[Math.max(obj.pot.rarity, obj.bpot ? obj.bpot.rarity : 0)];
  l('cubeLines').innerHTML = obj.pot.lines.join("<br>");
  l('cubePot').innerHTML = C.rarities[obj.pot.rarity];
  l('cubeItem').style.backgroundImage = obj.info.icon;
  l('cubeItem').style.display = 'block';
  l('cubeItem').style.left = C.cubeItemX + obj.info.offsetX + "px";
  l('cubeItem').style.top = C.cubeItemY + obj.info.offsetY + "px";
  l('cubeItemButton').onmouseenter = l('equipbutton' + obj.info.category).onmouseenter;
  l('cubeItemButton').onmousemove = l('equipbutton' + obj.info.category).onmousemove;

  setTimeout(function(){
    l('cubeAnimation').className = "cubeAnimation";
    l('cubeButtonAgain').style.display = 'block';
    Game.disableCube = false;
  }, 1090)
  
  l('cubeButtonAgain').onclick = function() {
    Game.playSound(Sounds.click);
    if (!Game.disableCube) Game.cube(Game.lastCubed);
  };
}

Game.cubeBlack = function(obj) {
  if (Game.openedEquipList) l('equiptip').style.display = 'none';
  else {
    Game.openedEquipList = true;
    l('equiptip').style.display = 'block';
  }
  Game.playSound(alt ? Sounds.success : Sounds.successAlt);
  alt = !alt;
  
  var newPot = Game.getP(obj.pot.rarity, C.blackCubeTierRate, false, obj.info.reqLevel, obj.info.category);
  obj.count.black = obj.count.black + 1;
  Game.disableCube = true;
  Game.lastCubed = obj;

  if(newPot.tieredUp) l('cubeAnimation').className = "anim4 cubeAnimation";
  else l('cubeAnimation').className = "anim3 cubeAnimation";
  
  l('cubeWindow').style.display = 'block';
  l('cubeWindow').style.backgroundImage = Assets.cubeWindowBlack;
  l('cubeButtonAgain').style.display = 'none';
  l('cubeButtonAgain').className = "cubeButtonAgain button2 cubeButtonAgainBlack";
  l('cubeButtonOK').className = "cubeButtonOK button2 cubeButtonOKBlack";
  l('cubePot2').style.display = 'block';
  l('cubeLines2').style.display = 'block';
  l('cubeButtonBefore').style.display = 'block';
  l('cubeButtonAfter').style.display = 'block';
  l('cubeButtonBefore').style.pointerEvents = 'auto';
  l('cubeButtonAfter').style.pointerEvents = 'auto';
  
  l('cubeLines').innerHTML = obj.pot.lines.join("<br>");
  l('cubePot').innerHTML = C.rarities[obj.pot.rarity];
  l('cubeLines2').innerHTML = newPot.lines.join("<br>");
  l('cubePot2').innerHTML = C.rarities[newPot.rarity];
  l('cubeItem').style.backgroundImage = obj.info.icon;
  l('cubeItem').style.display = 'block';
  l('cubeItem').style.left = C.cubeItemX + obj.info.offsetX + "px";
  l('cubeItem').style.top = C.cubeItemY + obj.info.offsetY + "px";
  l('cubeItemButton').onmouseenter = l('equipbutton' + obj.info.category).onmouseenter;
  l('cubeItemButton').onmousemove = l('equipbutton' + obj.info.category).onmousemove;
  
  l('cubeButtonBefore').onclick = function() {
    Game.playSound(Sounds.click);
    l('cubeButtonAfter').style.display = 'none';
    l('cubeButtonBefore').style.pointerEvents = "none";
  };
  
  l('cubeButtonAfter').onclick = function() {
    Game.playSound(Sounds.click);
    l('cubeButtonBefore').style.display = 'none';
    l('cubeButtonAfter').style.pointerEvents = "none";
    obj.pot = newPot;
    l('itemoutline' + obj.info.category).style.borderColor = C.rarityOutlineColors[Math.max(obj.pot.rarity, obj.bpot ? obj.bpot.rarity : 0)];
  };
  
  setTimeout(function(){
    l('cubeAnimation').className = "cubeAnimation";
    l('cubeButtonAgain').style.display = 'block';
    Game.disableCube = false;
  }, 1090)
  
  l('cubeButtonAgain').onclick = function() {
    Game.playSound(Sounds.click);
    if (!Game.disableCube) Game.cubeBlack(Game.lastCubed);
  };
}

Game.cubeBonus = function(obj) {
  if (Game.openedEquipList) l('equiptip').style.display = 'none';
  else {
    Game.openedEquipList = true;
    l('equiptip').style.display = 'block';
  }
  Game.playSound(alt ? Sounds.success : Sounds.successAlt);
  alt = !alt;
    
  obj.bpot = Game.getP(obj.bpot.rarity, C.bonusCubeTierRate, true, obj.info.reqLevel, obj.info.category);
  obj.count.bonus = obj.count.bonus + 1;
  Game.disableCube = true;
  Game.lastCubed = obj;

  if(obj.bpot.tieredUp) l('cubeAnimation').className = "anim2 cubeAnimation";
  else l('cubeAnimation').className = "anim1 cubeAnimation";
  
  l('cubeWindow').style.display = 'block';
  l('cubeWindow').style.backgroundImage = Assets.cubeWindowBonus;
  l('cubeButtonAgain').style.display = 'none';
  l('cubeButtonAgain').className = "cubeButtonAgain button2 cubeButtonAgainRed";
  l('cubeButtonOK').className = "cubeButtonOK button2 cubeButtonOKRed";
  l('cubePot2').style.display = 'none';
  l('cubeLines2').style.display = 'none';
  l('cubeButtonBefore').style.display = 'none';
  l('cubeButtonAfter').style.display = 'none';
  
  l('itemoutline' + obj.info.category).style.borderColor = C.rarityOutlineColors[Math.max(obj.pot.rarity, obj.bpot ? obj.bpot.rarity : 0)];
  l('cubeLines').innerHTML = obj.bpot.lines.join("<br>");
  l('cubePot').innerHTML = C.rarities[obj.bpot.rarity];
  l('cubeItem').style.backgroundImage = obj.info.icon;
  l('cubeItem').style.display = 'block';
  l('cubeItem').style.left = C.cubeItemX + obj.info.offsetX + "px";
  l('cubeItem').style.top = C.cubeItemY + obj.info.offsetY + "px";
  l('cubeItemButton').onmouseenter = l('equipbutton' + obj.info.category).onmouseenter;
  l('cubeItemButton').onmousemove = l('equipbutton' + obj.info.category).onmousemove;

  setTimeout(function(){
    l('cubeAnimation').className = "cubeAnimation";
    l('cubeButtonAgain').style.display = 'block';
    Game.disableCube = false;
  }, 1090)
  
  l('cubeButtonAgain').onclick = function() {
    Game.playSound(Sounds.click);
    if (!Game.disableCube) Game.cubeBonus(Game.lastCubed);
  };
}

Game.preloadImages = function() {
  for (var obj in Assets) {
    var url = Assets[obj];
    //url = url.substring(4, url.length - 1);
    if (obj[0] != "_") {
      //console.log(obj);
      var img = document.createElement("div");
      img.className = "preloaddiv";
      img.style.backgroundImage = url;
      l('preload').appendChild(img);
    }
  }
}

Game.playSound = function(sound) {
  sound.currentTime = 0;
  sound.volume = 0.1;
  sound.play();
}

Game.consumeBonusScroll = function() {
  Game.playSound(alt ? Sounds.success : Sounds.successAlt);
  alt = !alt;
  
  for (var i = 0; i < Game.E.length; i++) {
    Game.E[i].bpot = Game.getP(C.rare, C.noTierRate, true, Game.E[i].info.reqLevel, Game.E[i].info.category);
  }
  
  Game.usedBonusScroll = true;
  Game.addInventoryItem(C.bonusCube, 0, 2);
  
  l('inventoryitem10').style.display = 'none';
  l('inventorybutton10').style.display = 'none';
  l('equiptooltip').style.backgroundImage = Assets.tooltip_equip_big;
  l('equiptooltipbpot').style.display = 'block';
}

Game.getToolTipHeight = function() {
  return Game.usedBonusScroll ? 356 : 280;
}

//Game.init();
//console.log(Game.getPLine(4, false, 150, C.category.hat));
//Game.getP(C.rare, C.blackCube.id, 150, C.category.hat);
//Game.getPLine(4, true, 150, C.category.gloves);
