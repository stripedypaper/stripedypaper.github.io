var originX = 700; // dont change
var originY = 663; // dont change
var ltx = -700;    // use values from skill.wz common->lt
var lty = -175;    // use values from skill.wz common->lt
var rbx = 0;     // use values from skill.wz common->rb
var rby = 20;     // use values from skill.wz common->rb

function main() {
    $('.box').css('left', originX - rbx);
    $('.box').css('top', originY + lty);
    $('.box').css('width', rbx - ltx);
    $('.box').css('height', rby - lty);

    html2canvas(document.body, {
        allowTaint: true,
        logging: true,
        width: 1484,
        height: 1119,
        onrendered: function(canvas) {
            $('.bg').css('display', 'none');
            $('.box').css('display', 'none');
            var img = new Image();
            img.setAttribute('crossOrigin', 'anonymous');
            img.src = canvas.toDataURL();
            document.body.appendChild(img);
        }
    });
}

// rb -260, -215, 10, 20
// rb+ -330, -240, 70, 100
// rr -390, -600, 70, 20
// bsb -230, -300, 230, 55
// bsb -250, -300, 250, 55
// bsb -600, -400, 600, 300
// bsb -355, -195, 90, 0
// bsb -380, -210, 90, 0
// wr -690, -350, 520, 190
// bs -350, -350, 350, 250
// rush -500, -50, 0, 0
// shout -365, -285, 275, 115
// cf -450, -80, 5, 5
// cf* -700, -175, 0, 20
