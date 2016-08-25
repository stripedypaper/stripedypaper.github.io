function l(what) {return document.getElementById(what);}
function choose(arr) {return arr[Math.floor(Math.random()*arr.length)];}
function asset(what) {return "url(" + C.assetsDir + what + ")";}
function soundasset(what) {return C.soundDir + what + "?raw=true";}

C = {};
C.assetsDir = "https://raw.githubusercontent.com/stripedypaper/cube/master/html/img/"
C.soundDir = "https://github.com/stripedypaper/cube/blob/master/html/sound/";

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
Assets.background = asset("bg1.png");
Assets.tooltip_small = asset("tooltip_small.png");
Assets.tooltip_big = asset("tooltip_big.png");
Assets.tooltipCover = asset("Item.ItemIcon.cover.png");
Assets.tooltip_equip_small = asset("tooltip_equip.small.png");
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
Assets.cubeButton1_0 = asset("Cube_Red.BtOnemore.normal.0.png");
Assets.cubeButton1_1 = asset("Cube_Red.BtOnemore.mouseOver.0.png");
Assets.cubeButton1_2 = asset("Cube_Red.BtOnemore.pressed.0.png");
Assets.cubeButton2_0 = asset("Cube_Red.BtOk.normal.0.png");
Assets.cubeButton2_1 = asset("Cube_Red.BtOk.mouseOver.0.png");
Assets.cubeButton2_2 = asset("Cube_Red.BtOk.pressed.0.png");

Assets.ghostShipBadge = asset("01182060.png");
Assets.outlawHeart = asset("01672069.png");
Assets.craWHat = asset("1003797.png");
Assets.swTattoo = asset("1012438.png");
Assets.swGlasses = asset("1022211.png");
Assets.sGolluxEarrings= asset("1032223.png");
Assets.craWTop = asset("1042254.png");
Assets.craWBottom = asset("1062165.png");
Assets.tyrantShoes = asset("1072743.png");
Assets.tyrantGloves = asset("1082543.png");
Assets.terminusDefender = asset("1092113.png");
Assets.tyrantCape = asset("1102481.png");
Assets.magnusRage = asset("1112951.png");
Assets.lightningGodRing = asset("1113020.png");
Assets.rGolluxRing = asset("1113074.png");
Assets.sGolluxRing = asset("1113075.png");
Assets.forestGuardian = asset("1113132.png");
Assets.breathOfDivinity = asset("1113269.png");
Assets.sGolluxPendant = asset("1122267.png");
Assets.tyrantBelt = asset("1132174.png");
Assets.blackTinkerShoulder = asset("1152124.png");
Assets.goldMapleLeafEmblem = asset("1190301.png");
Assets.fafnirMistilteinn = asset("1302275.png");

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
C.cubeItemY = 100;

C.noCube = {id:"noCube"};
C.redCube = {id:"redCube", name:"Red Cube", icon:Assets.redCube, iconRaw:Assets.redCubeRaw, offsetX: -3, offsetY: -1};
C.blackCube = {id:"blackCube", name:"Black Cube", icon:Assets.blackCube, iconRaw:Assets.blackCubeRaw, offsetX: -2, offsetY: -1};
C.bonusCube = {id:"bonusCube", name:"Bonus Potential Cube", icon:Assets.bonusCube, iconRaw:Assets.bonusCubeRaw, offsetX: -1, offsetY: 0};
C.bonusScroll = {id:"bonusScroll", name:"Bonus Potential Scroll", icon:Assets.bonusScroll, iconRaw:Assets.bonusScrollRaw, offsetX: -1, offsetY: 4};

C.redCube.desc = "A beautifully crafted cube that randomly reconfigures the Potential on a piece of equipment.<br><b>Only usable on items from Rare to Legendary.<br>Max Result: Legendary</b>";
C.blackCube.desc = "An elegant cube that randomly configures the Potential on a piece of equipment. The Black Cube offers you the chance to decide whether or not to <b>apply the new Potential to your item</b>. However, it does not influence Bonus Potentials.<br><b>Only usable on items from Rare to Legendary.<br>Max Result: Legendary</b> Black Cubes have a higher chance to raise your Potential rank than Red Cubes do.";
C.bonusCube.desc = "A powerful cube that reconfigures a piece of equipment's Bonus Potential. Does not affect existing regular Potentials.<br><b>Only usable on items from Rare to Legendary<br>Max Result: Legendary<b>";
C.bonusScroll.desc = "Adds 3 lines of Bonus Potential to a regular piece of equipment with Potential but no Bonus Potentials.<br>Does not deduct from the available upgrade count. <br><b>Success Rate: 100%.</b>";

C.rare = 0;
C.epic = 1;
C.unique = 2;
C.legendary = 3;

C.rarities = ["Rare", "Epic", "Unique", "Legendary"];
C.rarityColors = ["#66FFFF", "#9966FF", "#FFCC00", "#CCFF00"];
C.rarityOutlineColors = ["#55AAFF", "#CC66FF", "#FFCC00", "#00FF00"];

C.lineTierRate = [1, 0.15, 0.05];
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
[1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0], //20
[0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //40
[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //51
[0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //52
[0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //53
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], //54
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]  //55
];

C.ghostShipBadge = {id:"ghostShipBadge", name:"Ghost Ship Exorcist", category:C.category.badge, reqLevel:150, icon:Assets.ghostShipBadge, offsetX: -2, offsetY: 0};
C.outlawHeart = {id:"outlawHeart", name:"Outlaw Heart", category:C.category.heart, reqLevel:150, icon:Assets.outlawHeart, offsetX: -1, offsetY: 0};
C.craWHat = {id:"craWHat", name:"Royal Warrior Helm", category:C.category.hat, reqLevel:150, icon:Assets.craWHat, offsetX: -4, offsetY: -1};
C.swTattoo = {id:"swTattoo", name:"Sweetwater Tattoo", category:C.category.face, reqLevel:160, icon:Assets.swTattoo, offsetX: -1, offsetY: 0};
C.swGlasses = {id:"swGlasses", name:"Sweetwater Glasses", category:C.category.eye, reqLevel:160, icon:Assets.swGlasses, offsetX: -3, offsetY: 0};
C.sGolluxEarrings= {id:"sGolluxEarrings", name:"Superior Gollux Earrings", category:C.category.earring, reqLevel:150, icon:Assets.sGolluxEarrings, offsetX: -7, offsetY: -3};
C.craWTop = {id:"craWTop", name:"Eagle Eye Warrior Armor", category:C.category.top, reqLevel:150, icon:Assets.craWTop, offsetX: -2, offsetY: 2};
C.craWBottom = {id:"craWBottom", name:"Trixter Warrior Pants", category:C.category.bottom, reqLevel:150, icon:Assets.craWBottom, offsetX: -1, offsetY: 0};
C.tyrantShoes = {id:"tyrantShoes", name:"Tyrant Boots", category:C.category.shoes, reqLevel:150, icon:Assets.tyrantShoes, offsetX: 0, offsetY: -2};
C.tyrantGloves = {id:"tyrantGloves", name:"Tyrant Gloves", category:C.category.gloves, reqLevel:150, icon:Assets.tyrantGloves, offsetX: -4, offsetY: -2};
C.terminusDefender = {id:"terminusDefender", name:"Terminus Defender", category:C.category.shield, reqLevel:160, icon:Assets.terminusDefender, offsetX: -2, offsetY: -2};
C.tyrantCape = {id:"tyrantCape", name:"Tyrant Cape", category:C.category.cape, reqLevel:150, icon:Assets.tyrantCape, offsetX: -3, offsetY: -2};
C.lightningGodRing = {id:"lightningGodRing", name:"Lightning God Ring", category:C.category.ring3, reqLevel:80, icon:Assets.lightningGodRing, offsetX: -6, offsetY: -4};
C.rGolluxRing = {id:"rGolluxRing", name:"Reinforced Gollux Ring", category:C.category.ring2, reqLevel:140, icon:Assets.rGolluxRing, offsetX: -4, offsetY: -4};
C.sGolluxRing = {id:"sGolluxRing", name:"Superior Gollux Ring", category:C.category.ring, reqLevel:150, icon:Assets.sGolluxRing, offsetX: -4, offsetY: -4};
C.forestGuardian = {id:"forestGuardian", name:"Forest Guardian", category:C.category.ring4, reqLevel:100, icon:Assets.forestGuardian, offsetX: -4, offsetY: -4};
C.sGolluxPendant = {id:"sGolluxPendant", name:"Superior Gollux Pendant", category:C.category.pendant, reqLevel:150, icon:Assets.sGolluxPendant, offsetX: -5, offsetY: -2};
C.sGolluxPendant2 = {id:"sGolluxPendant", name:"Superior Gollux Pendant", category:C.category.pendant2, reqLevel:150, icon:Assets.sGolluxPendant, offsetX: -5, offsetY: -2};
C.tyrantBelt = {id:"tyrantBelt", name:"Tyrant Belt", category:C.category.belt, reqLevel:150, icon:Assets.tyrantBelt, offsetX: -5, offsetY: 1};
C.blackTinkerShoulder = {id:"blackTinkerShoulder", name:"Tinkerer's Black Shoulder Accessory", category:C.category.shoulder, reqLevel:100, icon:Assets.blackTinkerShoulder, offsetX: -6, offsetY: 0};
C.goldMapleLeafEmblem = {id:"goldMapleLeafEmblem", name:"Gold Maple Leaf Emblem", category:C.category.emblem, reqLevel:100, icon:Assets.goldMapleLeafEmblem, offsetX: -3, offsetY: -1};
C.fafnirMistilteinn = {id:"fafnirMistilteinn", name:"Fafnir Mistilteinn", category:C.category.weapon, reqLevel:150, icon:Assets.fafnirMistilteinn, offsetX: -4, offsetY: -4};

C.magnusRage = {id:"magnusRage", name:"Magnus's Rage", category:C.category.ring4, reqLevel:100, icon:Assets.magnusRage, offsetX: 0, offsetY: 0};
C.breathOfDivinity = {id:"breathOfDivinity", name:"Breath of Divinity", category:C.category.ring3, reqLevel:150, icon:Assets.breathOfDivinity, offsetX: 0, offsetY: 0};

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
  
  var tooltip = l('tooltip');
  tooltip.style.backgroundImage = Assets.tooltip_small;
  l('tooltipcover').style.backgroundImage = Assets.tooltipCover;
  
  var equiptooltip = l('equiptooltip');
  equiptooltip.style.backgroundImage = Assets.tooltip_equip_small;
  l('equiptooltipcover').style.backgroundImage = Assets.tooltipCover;
  l('equiptooltippot').style.backgroundImage = Assets.tooltipPot0;
  
  var clickscreen = l('clickscreen');
  clickscreen.onclick = function() {
    //console.log("back click");
    Game.stopDragging();
  }
  clickscreen.onmousemove = function() {
    var tooltip = l('tooltip');
    tooltip.style.display = 'none';
    var tooltip = l('equiptooltip');
    tooltip.style.display = 'none';
  };
  
  // game logic
  
  Game.addInventoryItem(C.redCube, 0, 0);
  //Game.addInventoryItem(C.blackCube, 0, 1);
  //Game.addInventoryItem(C.bonusCube, 0, 2);
  //Game.addInventoryItem(C.bonusScroll, 0, 3);
  
  var equips = [C.ghostShipBadge, C.outlawHeart, C.craWHat, C.swTattoo, C.swGlasses, C.sGolluxEarrings, C.craWTop, C.craWBottom, C.tyrantShoes, C.tyrantGloves, C.terminusDefender, C.tyrantCape, C.lightningGodRing, C.rGolluxRing, C.sGolluxRing, C.forestGuardian, C.sGolluxPendant, C.sGolluxPendant2, C.tyrantBelt, C.blackTinkerShoulder, C.goldMapleLeafEmblem, C.fafnirMistilteinn];
  
  for (var i = 0; i < equips.length; i++) {
    var newEquip = {info:equips[i], pot:null, bpot:null};
    newEquip.pot = Game.getP(C.unique, C.noCube.id, newEquip.info.reqLevel, newEquip.info.category);
    Game.E.push(newEquip);
    Game.addEquipmentItem(newEquip); //todo
  }
  
  l('cubeButtonAgain').onclick = function() {
    Game.playSound(Sounds.click);
    if (!Game.disableCube) Game.cube(Game.lastCubed);
  };
  l('cubeButtonOK').onclick = function() {
    Game.playSound(Sounds.click);
    if (!Game.disableCube) l('cubeWindow').style.display = 'none';
  };
  
  // cube item slot
  
  var img = document.createElement("div");
  
  img.className = "item icon";
  img.id = "cubeItem";
  img.style.backgroundImage = Assets.outlawHeart;
  img.style.display = 'none';
  img.style.left = C.cubeItemX + "px";
  img.style.top = C.cubeItemY + "px";
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
  img.style.backgroundImage = info.icon;
  img.style.display = 'block';
  img.style.left = C.inventoryOrigX + C.inventorySpaceX * col + info.offsetX + "px";
  img.style.top = C.inventoryOrigY + C.inventorySpaceY * row + info.offsetY + "px";
  l('inventory').appendChild(img);
  
  var button = document.createElement("div");
  button.className = "button";
  button.style.left = C.inventoryOrigX + C.inventorySpaceX * col + "px";
  button.style.top =  C.inventoryOrigY + C.inventorySpaceY * row + "px";
  button.style.cursor = Assets.cursorPointer + "6 7, pointer";
  button.onclick = function() {
    var dragged = l('dragged');
    dragged.style.backgroundImage = info.iconRaw;
    if (!Game.isDragging) {
      Game.startDragging(info.id);
      Game.playSound(Sounds.drag);
    }
    else Game.stopDragging();
  };/*
  button.ondblclick = function() {
    if (!Game.isDragging) Game.startDragging(info.id);
    else Game.stopDragging();
  };*/
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

Game.addEquipmentItem = function(obj) { 
  var img = document.createElement("div");
  var col = C.categoryGridX[obj.info.category];
  var row = C.categoryGridY[obj.info.category];
  
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
    if (Game.isDragging && !Game.disableCube && Game.dragID == C.redCube.id) {
      Game.cube(obj);
      button.onmouseenter();
      Game.stopDragging();
    }
  };
  button.onmouseenter = function() {
    l('equiptooltiptitle').innerHTML = obj.info.name;
    l('equiptooltiptoptext').innerHTML = "(" + C.rarities[obj.pot.rarity] + " Item)"
    l('equiptooltiplevel').innerHTML = obj.info.reqLevel;
    l('equiptooltipcategory').innerHTML = "CATEGORY: " + C.categories[obj.info.category];
    l('equiptooltipnpotheading').style.color = C.rarityColors[obj.pot.rarity];
    l('equiptooltipnpotlines').innerHTML = obj.pot.lines.join("<br>");
    l('equiptooltipnpotimg').style.backgroundImage = Assets["tooltipPotIcon" + obj.pot.rarity];
    l('equiptooltippot').style.backgroundImage = Assets["tooltipPot" + obj.pot.rarity];
    
    var tti = l('equiptooltipimage');
    tti.style.backgroundImage = Assets[obj.info.id];
    tti.style.left = C.equiptooltipImageX + obj.info.offsetX * 2 + "px";
    tti.style.top = C.equiptooltipImageY + obj.info.offsetY * 2 + "px";
  }
  button.onmousemove = function() {
    if (1) {
      var tooltip = l('equiptooltip');
      tooltip.style.display = 'block';
      tooltip.style.left = Math.min(window.innerWidth - 261, Game.mouseX) + "px";
      tooltip.style.top = Math.min(window.innerHeight - 280, Game.mouseY + 23) + "px";
    }
  };
  l('equipment').appendChild(button);
}

Game.getPLine = function(tier, isBonus, level, category) {
  var valid = [];
  var list = isBonus ? Game.P.bpot : Game.P.pot;
  var leveltier = Math.floor((level - 1) / 10);
  
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
      if (category == C.category.shield && shieldbl.indexOf(subid) > -1) continue;
      var tier2bl = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 351, 352, 353, 81];
      if (tier >= 2 && o.id[2] != 1 && tier2bl.indexOf(subid) > -1) continue;
      
      valid.push(o.level[leveltier]);
      //console.log(valid);
    }
  }
  
  return choose(valid);
}

Game.getP = function(rarity, cubeid, level, category) {
  var res = {};
  var tierRate = 0;
  
  if (cubeid == C.noCube.id) tierRate = [0, 0, 0, 0];
  else if (cubeid == C.redCube.id) tierRate = C.redCubeTierRate[rarity];
  else tierRate = C.blackCubeTierRate[rarity];
  
  if (Math.random() < tierRate) {
    res.tieredUp = true;
    res.rarity = rarity + 1;
  }
  else {
    res.tierUp = false;
    res.rarity = rarity;
  }
  
  res.lines = [];
  for (var i = 0; i < C.lineTierRate.length; i++) {
    var newLine;
    if (Math.random() < C.lineTierRate[i]) newLine = Game.getPLine(res.rarity + 1, false, level, category);
    else newLine = Game.getPLine(res.rarity, false, level, category);
    newLine = newLine.replace("<", "&lt;").replace(">", "&gt;");
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
  // hack for success sound cutting itself off
  Game.playSound(alt ? Sounds.success : Sounds.successAlt);
  alt = !alt;
    
  obj.pot = Game.getP(obj.pot.rarity, C.redCube.id, obj.info.reqLevel, obj.info.category);
  Game.disableCube = true;
  Game.lastCubed = obj;

  if(obj.pot.tieredUp) l('cubeAnimation').className = "anim2 cubeAnimation";
  else l('cubeAnimation').className = "anim1 cubeAnimation";

  l('itemoutline' + obj.info.category).style.borderColor = C.rarityOutlineColors[obj.pot.rarity];
  l('cubeWindow').style.display = 'block';
  l('cubeLines').innerHTML = obj.pot.lines.join("<br>");
  l('cubePot').innerHTML = C.rarities[obj.pot.rarity];
  l('cubeItem').style.backgroundImage = obj.info.icon;
  l('cubeItem').style.display = 'block';
  l('cubeItem').style.left = C.cubeItemX + obj.info.offsetX + "px";
  l('cubeItem').style.top = C.cubeItemY + obj.info.offsetY + "px";
  l('cubeItemButton').onmouseenter = l('equipbutton' + obj.info.category).onmouseenter;
  l('cubeItemButton').onmousemove = l('equipbutton' + obj.info.category).onmousemove;
  l('cubeButtonAgain').style.display = 'none';

  setTimeout(function(){
    l('cubeAnimation').className = "cubeAnimation";
    l('cubeButtonAgain').style.display = 'block';
    Game.disableCube = false;
  }, 1090)
}

Game.preloadImages = function() {
  for (var obj in Assets) {
    var url = Assets[obj];
    //url = url.substring(4, url.length - 1);
    var img = document.createElement("div");
    img.className = "preloaddiv";
    img.style.backgroundImage = url;
    l('preload').appendChild(img);
  }
}

Game.playSound = function(sound) {
  sound.currentTime = 0;
  sound.volume = 0.5;
  sound.play();
}

Game.init();
//console.log(Game.getPLine(4, false, 150, C.category.hat));
//Game.getP(C.rare, C.blackCube.id, 150, C.category.hat);