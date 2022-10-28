//=======================================================
// PixelControls.js
//=======================================================

/*:
 * @plugindesc New controls for pixel movement script.
 * @author Humboof
 *
 * @help This plugin does not provide plugin commands.
 *
 * This plugin adds WASD movement and skills that can 
 * activated with button presses.
 */

(function() {
	Input.keyMapper = {
        9: 'tab',       // tab
        13: 'ok',       // enter
        16: 'shift',    // shift
        17: 'control',  // control
        18: 'control',  // alt
        27: 'escape',   // escape
        32: 'ok',       // space
        33: 'pageup',   // pageup
        34: 'pagedown', // pagedown
        37: 'leftArrow',     // left arrow
        38: 'upArrow',       // up arrow
        39: 'rightArrow',    // right arrow
        40: 'downArrow',     // down arrow
        45: 'escape',   // insert
        65: 'left',
        68: 'right',
        69: 'E',
        81: 'Q',   // Q
        83: 'down',
        87: 'up', // W
        88: 'escape',   // X
        90: 'ok',       // Z
        96: 'escape',   // numpad 0
        98: 'downArrow',     // numpad 2
        100: 'leftArrow',    // numpad 4
        102: 'rightArrow',   // numpad 6
        104: 'upArrow',      // numpad 8
        120: 'debug'    // F9
    };

	Input._signX = function() {
	    var x = 0;

	    if (this.isPressed('left')) {
	        x--;
	    }

	    if (this.isPressed('right')) {
	        x++;
	    }

	    return x;
	};

	/**
	 * @static
	 * @method _signY
	 * @private
	 */
	Input._signY = function() {
	    var y = 0;

	    if (this.isPressed('up')) {
	        y--;
	    }
	    if (this.isPressed('down')) {
	        y++;
	    }
	    return y;
	};

    Input.skill = function(sceneActive) {
        if (this.isPressed('Q')) {
            $gameSwitches.setValue(2, true)      
        }

        if (this.isPressed('E')) {
            $gameSwitches.setValue(4, true)     
        }        
    };

    var inputUpdate = Input.update;

    Input.update = function() {
        inputUpdate.call(this);
    };

    Scene_Map.prototype.updateMain = function() {
        var active = this.isActive();
        $gameMap.update(active);
        $gamePlayer.update(active);
        $gameTimer.update(active);
        $gameScreen.update();
        Input.skill();
    };
})();