$.count = 5;
$.exited = false;
addEvent(() => !$.exited, (id, game) => {
    $.count--;

    if ($.count == 0) {
        game.next("gameover");
    }
})