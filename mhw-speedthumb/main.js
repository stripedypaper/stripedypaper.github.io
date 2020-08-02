angular.module('app', [])
.controller('MyController', function($scope) {
    var vm = this;

    vm.weapons = Object.freeze({
        'Greatsword': 'weapon_icons/great-sword.png',
        'Dual Blades': 'weapon_icons/dual-blades.png',
        'Long Sword': 'weapon_icons/long-sword.png',
        'Sword and Shield': 'weapon_icons/sword-and-shield.png',
        'Hammer': 'weapon_icons/hammer.png',
        'Hunting Horn': 'weapon_icons/hunting-horn.png',
        'Lance': 'weapon_icons/lance.png',
        'Gunlance': 'weapon_icons/gunlance.png',
        'Switch Axe': 'weapon_icons/switch-axe.png',
        'Charge Blade': 'weapon_icons/charge-blade.png',
        'Insect Glaive': 'weapon_icons/insect-glaive.png',
        'Light Bowgun': 'weapon_icons/light-bowgun.png',
        'Heavy Bowgun': 'weapon_icons/heavy-bowgun.png',
        'Bow': 'weapon_icons/bow.png'
    });
    vm.weaponElements = Object.freeze({
        'None': null,
        'Fire': 'weapon_element_icons/Status_Effect-Fireblight_MHW_Icon.png',
        'Water': 'weapon_element_icons/Status_Effect-Waterblight_MHW_Icon.png',
        'Ice': 'weapon_element_icons/Status_Effect-Iceblight_MHW_Icon.png',
        'Thunder': 'weapon_element_icons/Status_Effect-Thunderblight_MHW_Icon.png',
        'Dragon': 'weapon_element_icons/Status_Effect-Dragonblight_MHW_Icon.png',
        'Poison': 'weapon_element_icons/Status_Effect-Poison_MHW_Icon.png',
        'Paralysis': 'weapon_element_icons/Status_Effect-Paralysis_MHW_Icon.png',
        'Sleep': 'weapon_element_icons/Status_Effect-Sleep_MHW_Icon.png',
        'Blast': 'weapon_element_icons/Status_Effect-Blastblight_MHW_Icon.png',
        'Stun': 'weapon_element_icons/mhw-stun-status-effect.png'
    });
    vm.monsters = Object.freeze({
        'None': null,
        'Acidic Glavenus': 'monster_icons/MHWI-Acidic_Glavenus_Icon.png',
        'Alatreon': 'monster_icons/MHWI-Alatreon_Icon.png',
        'Ancient Leshen': 'monster_icons/MHW-Ancient_Leshen_Icon.png',
        'Anjanath': 'monster_icons/MHW-Anjanath_Icon.png',
        'Azure Rathalos': 'monster_icons/MHW-Azure_Rathalos_Icon.png',
        'Banbaro': 'monster_icons/MHWI-Banbaro_Icon.png',
        'Barioth': 'monster_icons/MHWI-Barioth_Icon.png',
        'Bazelgeuse': 'monster_icons/MHW-Bazelgeuse_Icon.png',
        'Behemoth': 'monster_icons/MHW-Behemoth_Icon.png',
        'Beotodus': 'monster_icons/MHWI-Beotodus_Icon.png',
        'Black Diablos': 'monster_icons/MHW-Black_Diablos_Icon.png',
        'Blackveil Vaal Hazak': 'monster_icons/MHWI-Blackveil_Vaal_Hazak_Icon.png',
        'Brachydios': 'monster_icons/MHWI-Brachydios_Icon.png',
        'Brute Tigrex': 'monster_icons/MHWI-Brute_Tigrex_Icon.png',
        'Coral Pukei-Pukei': 'monster_icons/MHWI-Coral_Pukei-Pukei_Icon.png',
        'Deviljho': 'monster_icons/MHW-Deviljho_Icon.png',
        'Diablos': 'monster_icons/MHW-Diablos_Icon.png',
        'Dodogama': 'monster_icons/MHW-Dodogama_Icon.png',
        'Ebony Odogaron': 'monster_icons/MHWI-Ebony_Odogaron_Icon.png',
        'Frostfang Barioth': 'monster_icons/MHWI-Frostfang_Barioth_Icon.png',
        'Fulgur Anjanath': 'monster_icons/MHWI-Fulgur_Anjanath_Icon.png',
        'Furious Rajang': 'monster_icons/MHWI-Furious_Rajang_Icon.png',
        'Glavenus': 'monster_icons/MHWI-Glavenus_Icon.png',
        'Gold Rathian': 'monster_icons/MHWI-Gold_Rathian_Icon.png',
        'Great Girros': 'monster_icons/MHW-Great_Girros_Icon.png',
        'Great Jagras': 'monster_icons/MHW-Great_Jagras_Icon.png',
        'Jyuratodus': 'monster_icons/MHW-Jyuratodus_Icon.png',
        'Kirin': 'monster_icons/MHW-Kirin_Icon.png',
        'Kulu-Ya-Ku': 'monster_icons/MHW-Kulu-Ya-Ku_Icon.png',
        'Kulve Taroth': 'monster_icons/MHW-Kulve_Taroth_Icon.png',
        'Kushala Daora': 'monster_icons/MHW-Kushala_Daora_Icon.png',
        'Lavasioth': 'monster_icons/MHW-Lavasioth_Icon.png',
        'Legiana': 'monster_icons/MHW-Legiana_Icon.png',
        'Leshen': 'monster_icons/MHW-Leshen_Icon.png',
        'Lunastra': 'monster_icons/MHW-Lunastra_Icon.png',
        'Namielle': 'monster_icons/MHWI-Namielle_Icon.png',
        'Nargacuga': 'monster_icons/MHWI-Nargacuga_Icon.png',
        'Nergigante': 'monster_icons/MHW-Nergigante_Icon.png',
        'Nightshade Paolumu': 'monster_icons/MHWI-Nightshade_Paolumu_Icon.png',
        'Odogaron': 'monster_icons/MHW-Odogaron_Icon.png',
        'Paolumu': 'monster_icons/MHW-Paolumu_Icon.png',
        'Pink Rathian': 'monster_icons/MHW-Pink_Rathian_Icon.png',
        'Pukei-Pukei': 'monster_icons/MHW-Pukei-Pukei_Icon.png',
        'Radobaan': 'monster_icons/MHW-Radobaan_Icon.png',
        'Raging Brachydios': 'monster_icons/MHWI-Raging_Brachydios_Icon.png',
        'Rajang': 'monster_icons/MHWI-Rajang_Icon.png',
        'Rathalos': 'monster_icons/MHW-Rathalos_Icon.png',
        'Rathian': 'monster_icons/MHW-Rathian_Icon.png',
        'Ruiner Nergigante': 'monster_icons/MHWI-Ruiner_Nergigante_Icon.png',
        'Safi\'jiiva': 'monster_icons/MHWI-Safi\'jiiva_Icon.png',
        'Savage Deviljho': 'monster_icons/MHWI-Savage_Deviljho_Icon.png',
        'Scarred Yian Garuga': 'monster_icons/MHWI-Scarred_Yian_Garuga_Icon.png',
        'Seething Bazelgeuse': 'monster_icons/MHWI-Seething_Bazelgeuse_Icon.png',
        'Shara Ishvalda': 'monster_icons/MHWI-Shara_Ishvalda_Icon.png',
        'Shrieking Legiana': 'monster_icons/MHWI-Shrieking_Legiana_Icon.png',
        'Silver Rathalos': 'monster_icons/MHWI-Silver_Rathalos_Icon.png',
        'Stygian Zinogre': 'monster_icons/MHWI-Stygian_Zinogre_Icon.png',
        'Teostra': 'monster_icons/MHW-Teostra_Icon.png',
        'Tigrex': 'monster_icons/MHWI-Tigrex_Icon.png',
        'Tobi-Kadachi': 'monster_icons/MHW-Tobi-Kadachi_Icon.png',
        'Tzitzi-Ya-Ku': 'monster_icons/MHW-Tzitzi-Ya-Ku_Icon.png',
        'Uragaan': 'monster_icons/MHW-Uragaan_Icon.png',
        'Vaal Hazak': 'monster_icons/MHW-Vaal_Hazak_Icon.png',
        'Velkhana': 'monster_icons/MHWI-Velkhana_Icon.png',
        'Viper Tobi-Kadachi': 'monster_icons/MHWI-Viper_Tobi-Kadachi_Icon.png',
        'Xeno\'jiiva': 'monster_icons/MHW-Xeno\'jiiva_Icon.png',
        'Yian Garuga': 'monster_icons/MHWI-Yian_Garuga_Icon.png',
        'Zinogre': 'monster_icons/MHWI-Zinogre_Icon.png',
        'Zorah Magdaros': 'monster_icons/MHW-Zorah_Magdaros_Icon.png',
        '???': 'monster_icons/q.png'
    });
    vm.fonts = Object.freeze({
        "Heebo": 'heebo',
        "Heebo (Light)": 'heebo-light',
        "Heebo (Bold)": 'heebo-bold',
        "Barlow": 'oswald',
        "Barlow (Light)": 'oswald-light',
        "Barlow (Bold)": 'oswald-bold',
        "Raleway": 'raleway',
        "Raleway (Bold)": 'raleway-bold',
        "Asap": 'asap',
        "Asap (Bold)": 'asap-bold'
    });
    vm.clawTextOffset = Object.freeze({
        "Heebo": 'heebo-cto',
        "Heebo (Light)": 'heebo-cto',
        "Heebo (Bold)": 'heebo-cto',
        "Barlow": 'oswald-cto',
        "Barlow (Light)": 'oswald-cto',
        "Barlow (Bold)": 'oswald-cto',
        "Raleway": 'raleway-cto',
        "Raleway (Bold)": 'raleway-cto',
        "Asap": 'asap-cto',
        "Asap (Bold)": 'asap-cto'
    });
    vm.layouts = Object.freeze({
        'v': 'Vertical',
        'vr': 'Vertical Reverse',
        'h': 'Horizontal',
        'h2' : 'Horizontal Alt',
        'hr' :'Horizontal Reverse',
        'h2r' :'Horizontal Alt Reverse'
    });

    vm.selectedWeapon = _.assign({}, _.times(5, _.constant(_.keys(vm.weapons)[0])));
    vm.selectedWeaponElement = _.assign({}, _.times(4, _.constant("None")));
    vm.selectedMonster = _.assign({}, _.times(5, _.constant(_.keys(vm.monsters)[20])));
    vm.selectedRunCategory = '1';
    vm.selectedBgType = '1';
    vm.selectedTimeColorType = '1';
    vm.selectedCatColor = '1';
    vm.selectedClawColor = '0';
    vm.selectedOutlineType = '2';
    vm.selectedOutlineColor = '2';
    vm.selectedBgFit = '0';
    vm.selectedFont = _.keys(vm.fonts)[2];
    vm.selectedLayout = _.keys(vm.layouts)[0];
    vm.timeText = "1'23\"45";
    vm.bgColor = "#271326";
    vm.bgColor2 = "#337";
    vm.timeColor = "#FFF";
    vm.timeColor2 = "#8A99A8";
    vm.catColor = "#FEFE78";
    vm.catColor2 = "#F4CF3E";
    vm.clawColor = "#FFF";
    vm.clawColor2 = "#8A99A8";
    vm.outlineCustomColor = "#FFF";

    vm.numMonsters = 1;
    vm.numWeapons = 1;

    initializeHuebee('bgColor', '.bg-color-input');
    initializeHuebee('bgColor2', '.bg-color-input2');
    initializeHuebee('timeColor', '.time-color-input');
    initializeHuebee('timeColor2', '.time-color-input2');
    initializeHuebee('catColor', '.cat-color-input');
    initializeHuebee('catColor2', '.cat-color-input2');
    initializeHuebee('clawColor', '.claw-color-input');
    initializeHuebee('clawColor2', '.claw-color-input2');

    var huebO = new Huebee('.outline-color-input');
    huebO.on('change', function(color, hue, sat, lum) {
        vm.outlineCustomColor = color;
        vm.outlineChange();
        $scope.$digest();
    });

    var uploadedSrc = null;

    vm.prev = function(selected, optionList) {
        var curIndex = _.findIndex(_.keys(optionList), function(o) {
            return o == vm[selected];
        });
        vm[selected] = _.keys(optionList)[Math.max(0, curIndex - 1)];
    };
    vm.next = function(selected, optionList) {
        var curIndex = _.findIndex(_.keys(optionList), function(o) {
            return o == vm[selected];
        });
        vm[selected] = _.keys(optionList)[Math.min(_.keys(optionList).length - 1, curIndex + 1)];
    };

    vm.prev2 = function(selected, key, optionList) {
        var curIndex = _.findIndex(_.keys(optionList), function(o) {
            return o == vm[selected][key];
        });
        vm[selected][key] = _.keys(optionList)[Math.max(0, curIndex - 1)];
    }
    vm.next2 = function(selected, key, optionList) {
        var curIndex = _.findIndex(_.keys(optionList), function(o) {
            return o == vm[selected][key];
        });
        vm[selected][key] = _.keys(optionList)[Math.min(_.keys(optionList).length - 1, curIndex + 1)];
    }

    vm.getBgStyle = function() {
        if (vm.selectedBgType == '0') {
            return {"background": vm.bgColor};
        }
        else if (vm.selectedBgType == '1') {
            return {"background": "linear-gradient(to bottom, " + vm.bgColor + ", " + vm.bgColor2 + ")"};
        }
        else if (vm.selectedBgType == '2') {
            return {"background": "linear-gradient(to right, " + vm.bgColor + ", " + vm.bgColor2 + ")"};
        }
        else if (vm.selectedBgType == '3' && uploadedSrc) {
            var result = {"background": "url(\"" + uploadedSrc + "\")"};
            if (vm.selectedBgFit === '0') {
                result["background-size"] = "cover";
                result["background-repeat"] = "round";
            }
            else if (vm.selectedBgFit === '1') {
                result["background-size"] = "cover";
                result["background-repeat"] = "unset";
                result["background-position-x"] = vm.bgSlider + "%";
                result["background-position-y"] = vm.bgSlider + "%";
            }
            else {
                result["background-size"] = "unset";
                result["background-repeat"] = "unset";
                result["background-position-x"] = vm.bgSlider + "%";
                result["background-position-y"] = vm.bgSlider2 + "%";
            }
            return result;
        }
        else {
            return {};
        }
    }

    vm.getColorStyle = function(typeVar, colorVar, colorVar2) {
        if (typeVar == '0') {
            return {"color": colorVar};
        }
        else if (typeVar == '1') {
            return {"background-image": "linear-gradient(to bottom, " + colorVar + " 20%, " + colorVar2 + " 80%)", color: "transparent"};
        }
    }

    vm.outlineChange = function() {
        var cssText = "";
        if (vm.selectedOutlineType == '0') {
            cssText = "--stroke-color: initial";
        }
        else if (vm.selectedOutlineType == '1') {
            cssText = "--stroke-color: #fff";
        }
        else if (vm.selectedOutlineType == '2') {
            cssText = "--stroke-color: #33CC66";
        }
        else if (vm.selectedOutlineType == '3') {
            cssText = "--stroke-color: #CC00FF";
        }
        else if (vm.selectedOutlineType == '4') {
            cssText = "--stroke-color: #FF6633";
        }
        else if (vm.selectedOutlineType == '5') {
            cssText = "--stroke-color: " + vm.outlineCustomColor;
        }

        if (cssText) {
            _.each(document.getElementsByClassName('monster-image'), function(e) {
                e.style.cssText = cssText;
            });
        }
    }

    vm.download = function() {
        domtoimage.toBlob(document.getElementById('canvas-inside'))
        .then(function(blob) {
            window.saveAs(blob, 'thumbnail.png');
        });
    }

    vm.inc = function(varName, limit) {
        if (varName == 'numWeapons' && vm.numWeapons == 1) {
            vm.selectedRunCategory = '0';
        }

        if (vm[varName] < limit)
            vm[varName]++;
    }

    vm.dec = function(varName, limit) {
        if (vm[varName] > limit)
            vm[varName]--;
    }

    function initializeHuebee(vmVar, inputClass) {
        var hueb = new Huebee(inputClass);
        hueb.on('change', function(color, hue, sat, lum) {
            vm[vmVar] = color;
            $scope.$digest();
        });
    }

    // image upload
    $("#file").change(function(e) {
        var image, file;
        var _URL = window.URL || window.webkitURL;
        if ((file = this.files[0])) {
            image = new Image();
            image.onload = function() {
                    uploadedSrc = this.src;
                    console.info('uploaded image', uploadedSrc);
                    $scope.$digest();
                    e.preventDefault();
                }
            };
            image.src = _URL.createObjectURL(file);
    });
});
