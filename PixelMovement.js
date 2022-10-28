//=======================================================
// PixelMovement.js
//=======================================================

/*:
 * @plugindesc Pixel-based movement system with z-depth.
 * @author Humboof
 *
 * This plugin replaces the default grid-based movement with
 * precise, pixel-based movement instead. This plugin also adds
 * full z-depth support, which allows you to have varying terrain
 * heights and create movement to traverse up or down the in tileset.
 */

(function() {
    Game_Player.prototype.initMembers = function() {
        Game_Character.prototype.initMembers.call(this);
        this._vehicleType = 'walk';
        this._vehicleGettingOn = false;
        this._vehicleGettingOff = false;
        this._dashing = false;
        this._needsMapReload = false;
        this._transferring = false;
        this._newMapId = 0;
        this._newX = 0;
        this._newY = 0;
        this._newDirection = 0;
        this._fadeType = 0;
        this._followers = new Game_Followers();
        this._encounterCount = 0;
        this._maskwidth = 20;
        this._maskheight = 20;
        this._maskyoffset = 8;
        this._tiles = [];
        this._collisionConcerns = [];
    };

    Game_CharacterBase.prototype.moveStraight = function(d) {
        this.setDirection(d);
        var speed = this.distancePerFrame();
        var checkw = 0;
        var checkh = 0;
        var checkw2 = 0;
        var checkh2 = 0;
        var dAnother = (d === 2 || d === 8 ? (Input.isPressed('left')? 4 : Input.isPressed('right')? 6 : 0) : (Input.isPressed('up')? 8 : Input.isPressed('down')? 2 : 0));
        var tileX = null;
        var tileY = null;
        var tileCoordinate = 0;
        this._tiles = [];

        for (j = 0; j < 2; j++) {
            tileY = Math.floor(this._realY + ((((48 - this._maskheight)/2) + this._maskyoffset)/48) + (j * this._maskheight / 48) + (d === 2 ? speed : d === 8 ? -speed : 0) + (dAnother === 2 ? speed : dAnother === 8 ? -speed : 0));

            for (i = 0; i < 2; i++) {
                tileX = Math.floor(this._realX + (((48 - this._maskwidth)/2)/48) + (i * this._maskwidth / 48) + (d === 6 ? speed : d === 4 ? -speed : 0) + (dAnother === 6 ? speed : dAnother === 4 ? -speed : 0));

                var newTile = {tileX, tileY};
                var stringNewTile = JSON.stringify(newTile);
                var stringOldTile = JSON.stringify(tileCoordinate);

                if (stringNewTile !== stringOldTile) {
                    tileCoordinate = newTile;
                    var tiles = JSON.stringify(this._tiles);
                    var found = tiles.includes(stringNewTile);

                    if (!found) {
                        this._tiles.push(tileCoordinate);
                    }
                }
            }
        }

        var collisionConcern = [];
        var eventCheck = false;
        var others = JSON.stringify($dataMap.occupiedTiles);

        for (i = 0; i < this._tiles.length; i++) {
            var thisX = this._tiles[i].tileX
            var thisY = this._tiles[i].tileY
            var stileX = JSON.stringify(this._tiles[i].tileX); 
            var stileY = JSON.stringify(this._tiles[i].tileY);
            var string = ',"tileX":' + stileX + ',"tileY":' + stileY;
            var eventIsThere = others.includes(string);

            if (eventIsThere) {
                var eventCheck = true;
                var lookup = {};
                var concern = $dataMap.occupiedTiles.filter(function(x){return x.tileX === thisX && x.tileY === thisY}).map(function(x){return x.id});

                if (collisionConcern.indexOf(concern) === -1) {
                    collisionConcern.push.apply(collisionConcern, concern);
                }
            }
        }

        this._collisionConcerns = collisionConcern;

        if (Input.isPressed('up') && Input.isPressed('right') || Input.isPressed('right') && Input.isPressed('down') || Input.isPressed('down') && Input.isPressed('left') || Input.isPressed('left') && Input.isPressed('up')) {
            if (Input.isPressed('up') && Input.isPressed('right') && Input.isPressed('left') || Input.isPressed('down') && Input.isPressed('left') && Input.isPressed('right')) {
                // Straight movement
            } 

            else {
                // Diagonal movement
                speed = this.distancePerFrame() * 0.70710678118;
                var d1 = (Input.isPressed('left')? 4 : 6)
                var d2 = (Input.isPressed('up')? 8 : 2)
                var eventsInYDirection2 = 0;

                if (d1 === d) {
                    for (i = 0; i < $gamePlayer._maskwidth; i++) {
                        x2 = $gameMap.roundXMask(this._realX, d2, speed, i);
                        y2 = $gameMap.roundYWithDirection(this._realY, d2, speed);

                        if (this.canPass(x2, y2, d2, speed) && $gameMap.tileId(x2,y2,5) === $gameMap.tileId($gameMap.roundXMask(this._realX, d2, 0, i), $gameMap.roundYWithDirection(this._realY, d2, 0),5) || $gameMap.isLadder(x2,y2) || this.canPass(x2, y2, d2, speed) && $gameMap.isLadder(Math.floor(this._realX+0.5), Math.floor(this._realY+0.5))) {
                            checkw2 += 1;
                        }

                        if (eventCheck) {
                            for (j = 0; j < this._collisionConcerns.length; j++) {
                                var col = this._collisionConcerns[j];
                                var xPrecise = this._realX + ((24 - ($gamePlayer._maskwidth / 2)) / 48) + (i * 0.0208333) + (d2 === 6 ? speed : d2 === 4 ? -speed : 0);
                                var yPrecise = this._realY + (d2 === 2 ? (speed + ((24 + ($gamePlayer._maskheight / 2) + $gamePlayer._maskyoffset) / 48)) : d2 === 8 ? (-speed + ((24 - ($gamePlayer._maskheight / 2) + $gamePlayer._maskyoffset) / 48)) : 0);
                                var eventLeftBound = $gameMap._events[this._collisionConcerns[j]]._realX + (((48 - $gameMap._events[this._collisionConcerns[j]]._maskwidth)/2)/48);
                                var eventRightBound = $gameMap._events[this._collisionConcerns[j]]._realX + (((48 - $gameMap._events[this._collisionConcerns[j]]._maskwidth)/2)/48) + ($gameMap._events[this._collisionConcerns[j]]._maskwidth / 48);
                                var eventTopBound = $gameMap._events[this._collisionConcerns[j]]._realY + ((((48 - $gameMap._events[this._collisionConcerns[j]]._maskheight)/2) + $gameMap._events[this._collisionConcerns[j]]._maskyoffset)/48);
                                var eventBottomBound = $gameMap._events[this._collisionConcerns[j]]._realY + ((((48 - $gameMap._events[this._collisionConcerns[j]]._maskheight)/2) + $gameMap._events[this._collisionConcerns[j]]._maskyoffset)/48) + ($gameMap._events[this._collisionConcerns[j]]._maskheight / 48);

                                if (xPrecise >= eventLeftBound && xPrecise <= eventRightBound && yPrecise >= eventTopBound && yPrecise <= eventBottomBound && $gameMap._events[col]._priorityType === 1) {
                                    eventsInYDirection2 += 1;
                                }
                            }
                        }
                    }

                    if (d2 === 2 || d2 === 8) {
                        if (checkw2 === $gamePlayer._maskwidth && eventsInYDirection2 === 0) {
                            this._realX = this.xDirection(this._realX, d2, speed);
                            this._realY = this.yDirection(this._realY, d2, speed);
                            this.increaseSteps();
                        } 

                        else if (eventsInYDirection2 === 0) {
                            var border = (((48-$gamePlayer._maskheight)/2) / 48);
                            var offset = $gamePlayer._maskyoffset / 48;
                            this._realY = (Math.round(this._realY + (d2 === 2 ? ($gamePlayer._maskheight / 48) - border  : d2 === 8 ? ((24 - ($gamePlayer._maskheight / 2)) / 48) : 0)) + (d2 === 2 ? border - offset : d2 === 8 ? -border - offset : 0));
                        }
                    }
                }

                var eventsInXDirection2 = 0;

                if (d2 === d) {
                    // Ligature
                    for (i = 0; i < $gamePlayer._maskheight; i++) {
                        x2 = $gameMap.roundXWithDirection(this._realX, d1, speed);
                        y2 = $gameMap.roundYMask(this._realY, d1, speed, i);

                        if (this.canPass(x2, y2, d1, speed) && $gameMap.tileId(x2,y2,5) === $gameMap.tileId($gameMap.roundXWithDirection(this._realX, d1, 0), $gameMap.roundYMask(this._realY, d1, 0,i),5) || $gameMap.isLadder(x2,y2) || this.canPass(x2, y2, d1, speed) && $gameMap.isLadder(Math.floor(this._realX+0.5),Math.floor(this._realY+0.5))) {
                            checkh2 += 1;
                        }

                        if (eventCheck) {
                            for (j = 0; j < this._collisionConcerns.length; j++) {
                                var col = this._collisionConcerns[j];
                                var xPrecise = this._realX + (d1 === 6 ? (speed + ((24 + ($gamePlayer._maskwidth / 2)) / 48)) : d1 === 4 ? (-speed + ((24 - ($gamePlayer._maskwidth / 2)) / 48)) : 0);
                                var yPrecise = this._realY + ((24 - ($gamePlayer._maskheight / 2) + $gamePlayer._maskyoffset) / 48) + (i * 0.0208333) + (d1 === 2 ? speed : d1 === 8 ? -speed : 0);
                                var eventLeftBound = $gameMap._events[col]._realX + (((48 - $gameMap._events[col]._maskwidth)/2)/48);
                                var eventRightBound = $gameMap._events[col]._realX + (((48 - $gameMap._events[col]._maskwidth)/2)/48) + ($gameMap._events[col]._maskwidth / 48);
                                var eventTopBound = $gameMap._events[col]._realY + ((((48 - $gameMap._events[col]._maskheight)/2) + $gameMap._events[col]._maskyoffset)/48);
                                var eventBottomBound = $gameMap._events[col]._realY + ((((48 - $gameMap._events[col]._maskheight)/2) + $gameMap._events[col]._maskyoffset)/48) + ($gameMap._events[col]._maskheight / 48);

                                if (xPrecise >= eventLeftBound && xPrecise <= eventRightBound && yPrecise >= eventTopBound && yPrecise <= eventBottomBound && $gameMap._events[col]._priorityType === 1) {
                                    eventsInXDirection2 += 1;
                                }
                            }
                        }
                    }
                    
                    if (d1 === 6 || d1 === 4) {
                        if (checkh2 === $gamePlayer._maskheight && eventsInXDirection2 === 0) {
                            this._realX = this.xDirection(this._realX, d1, speed);
                            this._realY = this.yDirection(this._realY, d1, speed);
                            this.increaseSteps();
                        } 

                        else if (eventsInXDirection2 === 0) {
                            var border = (((48-$gamePlayer._maskwidth)/2) / 48);
                            this._realX = (Math.round(this._realX + (d1 === 6 ? ($gamePlayer._maskwidth / 48) - border : d1 === 4 ? ((24 - ($gamePlayer._maskwidth / 2)) / 48) : 0)) + (d1 === 6 ? border : d1 === 4 ? -border : 0));
                        }
                    }
                }
            }
        }

        var eventsInYDirection = 0;

        for (i = 0; i < $gamePlayer._maskwidth; i++) {
            x2 = $gameMap.roundXMask(this._realX, d, speed, i);
            y2 = $gameMap.roundYWithDirection(this._realY, d, speed);

            if (this.canPass(x2, y2, d, speed) && $gameMap.tileId(x2,y2,5) === $gameMap.tileId($gameMap.roundXMask(this._realX, d, 0, i), $gameMap.roundYWithDirection(this._realY, d, 0),5) || $gameMap.isLadder(x2,y2) || this.canPass(x2, y2, d, speed) && $gameMap.isLadder(Math.floor(this._realX+0.5),Math.floor(this._realY+0.5))) {
                checkw += 1;
            }

            if (eventCheck) {
                for (j = 0; j < this._collisionConcerns.length; j++) {
                    var col = this._collisionConcerns[j];
                    var xPrecise = this._realX + ((24 - ($gamePlayer._maskwidth / 2)) / 48) + (i * 0.0208333) + (d === 6 ? speed : d === 4 ? -speed : 0);
                    var yPrecise = this._realY + (d === 2 ? (speed + ((24 + ($gamePlayer._maskheight / 2) + $gamePlayer._maskyoffset) / 48)) : d === 8 ? (-speed + ((24 - ($gamePlayer._maskheight / 2) + $gamePlayer._maskyoffset) / 48)) : 0);
                    var eventLeftBound = $gameMap._events[this._collisionConcerns[j]]._realX + (((48 - $gameMap._events[this._collisionConcerns[j]]._maskwidth)/2)/48);
                    var eventRightBound = $gameMap._events[this._collisionConcerns[j]]._realX + (((48 - $gameMap._events[this._collisionConcerns[j]]._maskwidth)/2)/48) + ($gameMap._events[this._collisionConcerns[j]]._maskwidth / 48);
                    var eventTopBound = $gameMap._events[this._collisionConcerns[j]]._realY + ((((48 - $gameMap._events[this._collisionConcerns[j]]._maskheight)/2) + $gameMap._events[this._collisionConcerns[j]]._maskyoffset)/48);
                    var eventBottomBound = $gameMap._events[this._collisionConcerns[j]]._realY + ((((48 - $gameMap._events[this._collisionConcerns[j]]._maskheight)/2) + $gameMap._events[this._collisionConcerns[j]]._maskyoffset)/48) + ($gameMap._events[this._collisionConcerns[j]]._maskheight / 48);

                    if (xPrecise >= eventLeftBound && xPrecise <= eventRightBound && yPrecise >= eventTopBound && yPrecise <= eventBottomBound && $gameMap._events[col]._priorityType === 1) {
                        eventsInYDirection += 1;
                    }
                }
            } 
        }

        // "w" + checkw
        var eventsInXDirection = 0;
        for (i = 0; i < $gamePlayer._maskheight; i++) {
            x2 = $gameMap.roundXWithDirection(this._realX, d, speed);
            y2 = $gameMap.roundYMask(this._realY, d, speed, i);

            if (this.canPass(x2, y2, d, speed) && $gameMap.tileId(x2,y2,5) === $gameMap.tileId($gameMap.roundXWithDirection(this._realX, d, 0), $gameMap.roundYMask(this._realY, d, 0, i),5) || $gameMap.isLadder(x2,y2) || this.canPass(x2, y2, d, speed) && $gameMap.isLadder(Math.floor(this._realX+0.5),Math.floor(this._realY+0.5))) {
                checkh += 1;
            }

            if (eventCheck) {
                for (j = 0; j < this._collisionConcerns.length; j++) {
                    var col = this._collisionConcerns[j];
                    var xPrecise = this._realX + (d === 6 ? (speed + ((24 + ($gamePlayer._maskwidth / 2)) / 48)) : d === 4 ? (-speed + ((24 - ($gamePlayer._maskwidth / 2)) / 48)) : 0);
                    var yPrecise = this._realY + ((24 - ($gamePlayer._maskheight / 2) + $gamePlayer._maskyoffset) / 48) + (i * 0.0208333) + (d === 2 ? speed : d === 8 ? -speed : 0);
                    var eventLeftBound = $gameMap._events[col]._realX + (((48 - $gameMap._events[col]._maskwidth)/2)/48);
                    var eventRightBound = $gameMap._events[col]._realX + (((48 - $gameMap._events[col]._maskwidth)/2)/48) + ($gameMap._events[col]._maskwidth / 48);
                    var eventTopBound = $gameMap._events[col]._realY + ((((48 - $gameMap._events[col]._maskheight)/2) + $gameMap._events[col]._maskyoffset)/48);
                    var eventBottomBound = $gameMap._events[col]._realY + ((((48 - $gameMap._events[col]._maskheight)/2) + $gameMap._events[col]._maskyoffset)/48) + ($gameMap._events[col]._maskheight / 48);

                    if (xPrecise >= eventLeftBound && xPrecise <= eventRightBound && yPrecise >= eventTopBound && yPrecise <= eventBottomBound && $gameMap._events[col]._priorityType === 1) {
                        eventsInXDirection += 1;
                    }
                }
            }
        }

        // "h" + checkh
        if (d === 6 || d === 4) {
            if (checkh === $gamePlayer._maskheight && eventsInXDirection === 0) {
                this._realX = this.xDirection(this._realX, d, speed);
                this._realY = this.yDirection(this._realY, d, speed);
                this.increaseSteps();
            } 

            else if (eventsInXDirection === 0) {
                var border = (((48-$gamePlayer._maskwidth)/2) / 48);
                this._realX = (Math.round(this._realX + (d === 6 ? ($gamePlayer._maskwidth / 48) - border : d === 4 ? ((24 - ($gamePlayer._maskwidth / 2)) / 48) : 0)) + (d === 6 ? border : d === 4 ? -border : 0));
            } 

            else {
                var border = (((48-$gamePlayer._maskwidth)/2) / 48);
                var otherBorder = (((48 - $gameMap._events[col]._maskwidth)/2)/48);
                var otherBorder2 = (((48 - $gameMap._events[col]._maskwidth)/2)/48) + ($gameMap._events[col]._maskwidth / 48);
            }
        }

        if (d === 2 || d === 8) {
            if (checkw === $gamePlayer._maskwidth && eventsInYDirection === 0) {
                this._realX = this.xDirection(this._realX, d, speed);
                this._realY = this.yDirection(this._realY, d, speed);
                this.increaseSteps();
            } 

            else if (eventsInYDirection === 0) {
                var border = (((48-$gamePlayer._maskheight)/2) / 48);
                var offset = $gamePlayer._maskyoffset / 48;
                this._realY = (Math.round(this._realY + (d === 2 ? ($gamePlayer._maskheight / 48) - border  : d === 8 ? ((24 - ($gamePlayer._maskheight / 2)) / 48) : 0)) + (d === 2 ? border - offset : d === 8 ? -border - offset : 0));
            } 

            else {}
        }
    };

    Game_Map.prototype.roundXWithDirection = function(x, d, s) {
        return Math.floor(x + (d === 6 ? (s + ((24 + ($gamePlayer._maskwidth / 2)) / 48)) : d === 4 ? (-s + ((24 - ($gamePlayer._maskwidth / 2)) / 48)) : 0));
    };

    Game_Map.prototype.roundYWithDirection = function(y, d, s) {
        return Math.floor(y + (d === 2 ? (s + ((24 + ($gamePlayer._maskheight / 2) + $gamePlayer._maskyoffset) / 48)) : d === 8 ? (-s + ((24 - ($gamePlayer._maskheight / 2) + $gamePlayer._maskyoffset) / 48)) : 0));
    };

    Game_Map.prototype.roundXMask = function(x, d, s, i) {
        return Math.floor(x + ((24 - ($gamePlayer._maskwidth / 2)) / 48) + (i * 0.0208333) + (d === 6 ? s : d === 4 ? -s : 0));
    };

    Game_Map.prototype.roundYMask = function(y, d, s, i) {
        return Math.floor(y + ((24 - ($gamePlayer._maskheight / 2) + $gamePlayer._maskyoffset) / 48) + (i * 0.0208333) + (d === 2 ? s : d === 8 ? -s : 0));
    };

    Game_CharacterBase.prototype.canPass = function(x, y, d, s) {
        var x2 = this.xDirection(x, d, s);
        var y2 = this.yDirection(y, d, s);

        if (this.isThrough() || this.isDebugThrough()) {
            return true;
        }

        if (!$gameMap.isPassable(x, y, d)) {
            return false;
        }

        return true;
    };

    Game_Map.prototype.isPassable = function(x, y, d) {
        return this.checkPassage(x, y, (1 << (d / 2 - 1)) && 0x0f);
    }; 

    Game_CharacterBase.prototype.isMapPassable = function(x, y, d, s) {
        var x2 = this.xDirection(x, d, s);
        var y2 = this.yDirection(y, d, s);
        var d2 = this.reverseDir(d);
        return $gameMap.isPassable(x, y, d) && $gameMap.isPassable(x2, y2, d2);
    };

    Game_CharacterBase.prototype.xDirection = function(x, d, s) {
        return (x + (d === 6 ? s : d === 4 ? -s : 0));
    };

    Game_CharacterBase.prototype.yDirection = function(y, d, s) {
        return (y + (d === 2 ? s : d === 8 ? -s : 0));
    };

    Game_Player.prototype.moveByInput = function() {
        var direction = this.getInputDirection();
        if (direction > 0) {
            this.executeMove(direction);
        }
    };

    Game_Map.prototype.roundXWithDirectionEvent = function(x, d, s, event) {
        return Math.floor(x + (d === 6 ? (s + ((24 + (event._maskwidth / 2)) / 48)) : d === 4 ? (-s + ((24 - (event._maskwidth / 2)) / 48)) : (0.5)));
    };

    Game_Map.prototype.roundYWithDirectionEvent = function(y, d, s, event) {
        return Math.floor(y + (d === 2 ? (s + ((24 + (event._maskheight / 2) + event._maskyoffset) / 48)) : d === 8 ? (-s + ((24 - (event._maskheight / 2) + event._maskyoffset) / 48)) : (0.5)));
    };

    Game_Map.prototype.roundXMaskEvent = function(x, d, s, i, event) {
        return Math.floor(x + ((24 - (event._maskwidth / 2)) / 48) + (i * 0.0208333) + (d === 6 ? s : d === 4 ? -s : 0));
    };

    Game_Map.prototype.roundYMaskEvent = function(y, d, s, i, event) {
        return Math.floor(y + ((24 - (event._maskheight / 2) + event._maskyoffset) / 48) + (i * 0.0208333) + (d === 2 ? s : d === 8 ? -s : 0));
    };

    Game_CharacterBase.prototype.updateMove = function() {
        if (this._eventId && !this._shadow) {
            if (this._flyingProjectile) {} 

            else {
                var eventCheck = false;
                this._collisionConcerns = [];

                for (u = 0; u < $dataMap.occupiedTiles.length; u++) {
                    for (i = 0; i < this._tiles.length; i++) {
                        if ($dataMap.occupiedTiles[u].tileX === this._tiles[i].tileX) {
                            if ($dataMap.occupiedTiles[u].tileY === this._tiles[i].tileY) {
                                if ($dataMap.occupiedTiles[u].id !== this._tiles[i].id) {
                                    eventCheck = true;
                                    this._collisionConcerns.push($dataMap.occupiedTiles[u].id);
                                }
                            }
                        }
                    }
                }

                var playerCheck = false;

                for (g = 0; g < $gamePlayer._tiles.length; g++) {
                    for (i = 0; i < this._tiles.length; i++) {
                        if ($gamePlayer._tiles[g].tileX === this._tiles[i].tileX) {
                            if ($gamePlayer._tiles[g].tileY === this._tiles[i].tileY) {
                                playerCheck = true;
                            }
                        }
                    }
                }

                var eventsInXDirection = 0;
                var eventsInYDirection = 0;
                var playerInXDirection = 0;
                var playerInYDirection = 0;

                if (this._x < this._realX) {
                    var dir = this.direction();
                    var speed = this.distancePerFrame();
                    var checkh = 0;

                    for (i = 0; i < this._maskheight; i++) {
                        x2 = $gameMap.roundXWithDirectionEvent(this._realX, dir, speed,this);
                        y2 = $gameMap.roundYMaskEvent(this._realY, dir, speed, i,this);

                        if (this.canPass(x2, y2, dir, speed) || $gameMap.isLadder(x2,y2)) {
                            checkh += 1;
                        } 
                        else {
                            this._x = this._realX;
                        }

                        if (eventCheck) {
                            for (j = 0; j < this._collisionConcerns.length; j++) {
                                var col = this._collisionConcerns[j];
                                var xPrecise = this._realX + (dir === 6 ? (speed + ((24 + (this._maskwidth / 2)) / 48)) : dir === 4 ? (-speed + ((24 - (this._maskwidth / 2)) / 48)) : 0);
                                var yPrecise = this._realY + ((24 - (this._maskheight / 2) + this._maskyoffset) / 48) + (i * 0.0208333) + (dir === 2 ? speed : dir === 8 ? -speed : 0);
                                var eventLeftBound = $gameMap._events[col]._realX + (((48 - $gameMap._events[col]._maskwidth)/2)/48);
                                var eventRightBound = $gameMap._events[col]._realX + (((48 - $gameMap._events[col]._maskwidth)/2)/48) + ($gameMap._events[col]._maskwidth / 48);
                                var eventTopBound = $gameMap._events[col]._realY + ((((48 - $gameMap._events[col]._maskheight)/2) + $gameMap._events[col]._maskyoffset)/48);
                                var eventBottomBound = $gameMap._events[col]._realY + ((((48 - $gameMap._events[col]._maskheight)/2) + $gameMap._events[col]._maskyoffset)/48) + ($gameMap._events[col]._maskheight / 48);

                                if (xPrecise >= eventLeftBound && xPrecise <= eventRightBound && yPrecise >= eventTopBound && yPrecise <= eventBottomBound && $gameMap._events[col]._priorityType === 1) {
                                    eventsInXDirection += 1;
                                }
                            }
                        }

                        if (playerCheck) {
                            var player = $gamePlayer;
                            var xPrecise = this._realX + (dir === 6 ? (speed + ((24 + (this._maskwidth / 2)) / 48)) : dir === 4 ? (-speed + ((24 - (this._maskwidth / 2)) / 48)) : 0);
                            var yPrecise = this._realY + ((24 - (this._maskheight / 2) + this._maskyoffset) / 48) + (i * 0.0208333) + (dir === 2 ? speed : dir === 8 ? -speed : 0);
                            var playerLeftBound = player._realX + (((48 - player._maskwidth)/2)/48);
                            var playerRightBound = player._realX + (((48 - player._maskwidth)/2)/48) + (player._maskwidth / 48);
                            var playerTopBound = player._realY + ((((48 - player._maskheight)/2) + player._maskyoffset)/48);
                            var playerBottomBound = player._realY + ((((48 - player._maskheight)/2) + player._maskyoffset)/48) + (player._maskheight / 48);

                            if (xPrecise >= playerLeftBound && xPrecise <= playerRightBound && yPrecise >= playerTopBound && yPrecise <= playerBottomBound) {
                                playerInXDirection += 1;
                            }
                        }
                    }

                    if (checkh === this._maskheight && eventsInXDirection === 0 && playerInXDirection === 0) {
                        this._realX = Math.max(this._realX - this.distancePerFrame(), this._x);
                    } 
                    else {
                        this._x = this._realX;
                    }
                }

                if (this._x > this._realX) {
                    var dir = this.direction();
                    var speed = this.distancePerFrame();
                    var checkh = 0;

                    for (i = 0; i < this._maskheight; i++) {
                        x2 = $gameMap.roundXWithDirectionEvent(this._realX, dir, speed,this);
                        y2 = $gameMap.roundYMaskEvent(this._realY, dir, speed, i,this);

                        if (this.canPass(x2, y2, dir, speed) || $gameMap.isLadder(x2,y2)) {
                            checkh += 1;
                        } 
                        else {
                            this._x = this._realX;
                        }

                        if (eventCheck) {
                            for (j = 0; j < this._collisionConcerns.length; j++) {
                                var col = this._collisionConcerns[j];
                                var xPrecise = this._realX + (dir === 6 ? (speed + ((24 + (this._maskwidth / 2)) / 48)) : dir === 4 ? (-speed + ((24 - (this._maskwidth / 2)) / 48)) : 0);
                                var yPrecise = this._realY + ((24 - (this._maskheight / 2) + this._maskyoffset) / 48) + (i * 0.0208333) + (dir === 2 ? speed : dir === 8 ? -speed : 0);
                                var eventLeftBound = $gameMap._events[col]._realX + (((48 - $gameMap._events[col]._maskwidth)/2)/48);
                                var eventRightBound = $gameMap._events[col]._realX + (((48 - $gameMap._events[col]._maskwidth)/2)/48) + ($gameMap._events[col]._maskwidth / 48);
                                var eventTopBound = $gameMap._events[col]._realY + ((((48 - $gameMap._events[col]._maskheight)/2) + $gameMap._events[col]._maskyoffset)/48);
                                var eventBottomBound = $gameMap._events[col]._realY + ((((48 - $gameMap._events[col]._maskheight)/2) + $gameMap._events[col]._maskyoffset)/48) + ($gameMap._events[col]._maskheight / 48);

                                if (xPrecise >= eventLeftBound && xPrecise <= eventRightBound && yPrecise >= eventTopBound && yPrecise <= eventBottomBound && $gameMap._events[col]._priorityType === 1) {
                                    eventsInXDirection += 1;
                                }
                            }
                        }

                        if (playerCheck) {
                            var player = $gamePlayer;
                            var xPrecise = this._realX + (dir === 6 ? (speed + ((24 + (this._maskwidth / 2)) / 48)) : dir === 4 ? (-speed + ((24 - (this._maskwidth / 2)) / 48)) : 0);
                            var yPrecise = this._realY + ((24 - (this._maskheight / 2) + this._maskyoffset) / 48) + (i * 0.0208333) + (dir === 2 ? speed : dir === 8 ? -speed : 0);
                            var playerLeftBound = player._realX + (((48 - player._maskwidth)/2)/48);
                            var playerRightBound = player._realX + (((48 - player._maskwidth)/2)/48) + (player._maskwidth / 48);
                            var playerTopBound = player._realY + ((((48 - player._maskheight)/2) + player._maskyoffset)/48);
                            var playerBottomBound = player._realY + ((((48 - player._maskheight)/2) + player._maskyoffset)/48) + (player._maskheight / 48);

                            if (xPrecise >= playerLeftBound && xPrecise <= playerRightBound && yPrecise >= playerTopBound && yPrecise <= playerBottomBound) {
                                playerInXDirection += 1;
                            }
                        }
                    }

                    if (checkh === this._maskheight && eventsInXDirection === 0 && playerInXDirection === 0) {
                        this._realX = Math.min(this._realX + this.distancePerFrame(), this._x);
                    } 
                    else {
                        this._x = this._realX;
                    }
                }

                if (this._y < this._realY) {
                    var dir = this.direction();
                    var speed = this.distancePerFrame();
                    var checkw = 0;

                    for (i = 0; i < this._maskwidth; i++) {
                        x2 = $gameMap.roundXMaskEvent(this._realX, dir, speed, i, this);
                        y2 = $gameMap.roundYWithDirectionEvent(this._realY, dir, speed, this);

                        if (this.canPass(x2, y2, dir, speed) || $gameMap.isLadder(x2,y2)) {
                            checkw += 1;
                        } 
                        else {
                            this._y = this._realY;
                        }

                        if (eventCheck) {
                            for (j = 0; j < this._collisionConcerns.length; j++) {
                                var col = this._collisionConcerns[j];
                                var xPrecise = this._realX + ((24 - (this._maskwidth / 2)) / 48) + (i * 0.0208333) + (dir === 6 ? speed : dir === 4 ? -speed : 0);
                                var yPrecise = this._realY + (dir === 2 ? (speed + ((24 + (this._maskheight / 2) + this._maskyoffset) / 48)) : dir === 8 ? (-speed + ((24 - (this._maskheight / 2) + this._maskyoffset) / 48)) : 0);
                                var eventLeftBound = $gameMap._events[this._collisionConcerns[j]]._realX + (((48 - $gameMap._events[this._collisionConcerns[j]]._maskwidth)/2)/48);
                                var eventRightBound = $gameMap._events[this._collisionConcerns[j]]._realX + (((48 - $gameMap._events[this._collisionConcerns[j]]._maskwidth)/2)/48) + ($gameMap._events[this._collisionConcerns[j]]._maskwidth / 48);
                                var eventTopBound = $gameMap._events[this._collisionConcerns[j]]._realY + ((((48 - $gameMap._events[this._collisionConcerns[j]]._maskheight)/2) + $gameMap._events[this._collisionConcerns[j]]._maskyoffset)/48);
                                var eventBottomBound = $gameMap._events[this._collisionConcerns[j]]._realY + ((((48 - $gameMap._events[this._collisionConcerns[j]]._maskheight)/2) + $gameMap._events[this._collisionConcerns[j]]._maskyoffset)/48) + ($gameMap._events[this._collisionConcerns[j]]._maskheight / 48);

                                if (xPrecise >= eventLeftBound && xPrecise <= eventRightBound && yPrecise >= eventTopBound && yPrecise <= eventBottomBound && $gameMap._events[col]._priorityType === 1) {
                                    eventsInYDirection += 1;
                                }
                            }
                        }

                        if (playerCheck) {
                            var player = $gamePlayer;
                            var xPrecise = this._realX + ((24 - (this._maskwidth / 2)) / 48) + (i * 0.0208333) + (dir === 6 ? speed : dir === 4 ? -speed : 0);
                            var yPrecise = this._realY + (dir === 2 ? (speed + ((24 + (this._maskheight / 2) + this._maskyoffset) / 48)) : dir === 8 ? (-speed + ((24 - (this._maskheight / 2) + this._maskyoffset) / 48)) : 0);
                            var playerLeftBound = player._realX + (((48 - player._maskwidth)/2)/48);
                            var playerRightBound = player._realX + (((48 - player._maskwidth)/2)/48) + (player._maskwidth / 48);
                            var playerTopBound = player._realY + ((((48 - player._maskheight)/2) + player._maskyoffset)/48);
                            var playerBottomBound = player._realY + ((((48 - player._maskheight)/2) + player._maskyoffset)/48) + (player._maskheight / 48);

                            if (xPrecise >= playerLeftBound && xPrecise <= playerRightBound && yPrecise >= playerTopBound && yPrecise <= playerBottomBound) {
                                playerInYDirection += 1;
                            }
                        }
                    }

                    if (checkw === this._maskwidth && eventsInYDirection === 0 && playerInYDirection === 0) {
                        this._realY = Math.max(this._realY - this.distancePerFrame(), this._y);
                    } 
                    else {
                        this._y = this._realY;
                    }
                }

                if (this._y > this._realY) {
                    var dir = this.direction();
                    var speed = this.distancePerFrame();
                    var checkw = 0;

                    for (i = 0; i < this._maskwidth; i++) {
                        x2 = $gameMap.roundXMaskEvent(this._realX, dir, speed, i, this);
                        y2 = $gameMap.roundYWithDirectionEvent(this._realY, dir, speed, this);

                        if (this.canPass(x2, y2, dir, speed) || $gameMap.isLadder(x2,y2)) {
                            checkw += 1;
                        } 
                        else {
                            this._y = this._realY;
                        }

                        if (eventCheck) {
                            for (j = 0; j < this._collisionConcerns.length; j++) {
                                var col = this._collisionConcerns[j];
                                var xPrecise = this._realX + ((24 - (this._maskwidth / 2)) / 48) + (i * 0.0208333) + (dir === 6 ? speed : dir === 4 ? -speed : 0);
                                var yPrecise = this._realY + (dir === 2 ? (speed + ((24 + (this._maskheight / 2) + this._maskyoffset) / 48)) : dir === 8 ? (-speed + ((24 - (this._maskheight / 2) + this._maskyoffset) / 48)) : 0);
                                var eventLeftBound = $gameMap._events[this._collisionConcerns[j]]._realX + (((48 - $gameMap._events[this._collisionConcerns[j]]._maskwidth)/2)/48);
                                var eventRightBound = $gameMap._events[this._collisionConcerns[j]]._realX + (((48 - $gameMap._events[this._collisionConcerns[j]]._maskwidth)/2)/48) + ($gameMap._events[this._collisionConcerns[j]]._maskwidth / 48);
                                var eventTopBound = $gameMap._events[this._collisionConcerns[j]]._realY + ((((48 - $gameMap._events[this._collisionConcerns[j]]._maskheight)/2) + $gameMap._events[this._collisionConcerns[j]]._maskyoffset)/48);
                                var eventBottomBound = $gameMap._events[this._collisionConcerns[j]]._realY + ((((48 - $gameMap._events[this._collisionConcerns[j]]._maskheight)/2) + $gameMap._events[this._collisionConcerns[j]]._maskyoffset)/48) + ($gameMap._events[this._collisionConcerns[j]]._maskheight / 48);

                                if (xPrecise >= eventLeftBound && xPrecise <= eventRightBound && yPrecise >= eventTopBound && yPrecise <= eventBottomBound && $gameMap._events[col]._priorityType === 1) {
                                    eventsInYDirection += 1;
                                }
                            }
                        }

                        if (playerCheck) {
                            var player = $gamePlayer;
                            var xPrecise = this._realX + ((24 - (this._maskwidth / 2)) / 48) + (i * 0.0208333) + (dir === 6 ? speed : dir === 4 ? -speed : 0);
                            var yPrecise = this._realY + (dir === 2 ? (speed + ((24 + (this._maskheight / 2) + this._maskyoffset) / 48)) : dir === 8 ? (-speed + ((24 - (this._maskheight / 2) + this._maskyoffset) / 48)) : 0);
                            var playerLeftBound = player._realX + (((48 - player._maskwidth)/2)/48);
                            var playerRightBound = player._realX + (((48 - player._maskwidth)/2)/48) + (player._maskwidth / 48);
                            var playerTopBound = player._realY + ((((48 - player._maskheight)/2) + player._maskyoffset)/48);
                            var playerBottomBound = player._realY + ((((48 - player._maskheight)/2) + player._maskyoffset)/48) + (player._maskheight / 48);

                            if (xPrecise >= playerLeftBound && xPrecise <= playerRightBound && yPrecise >= playerTopBound && yPrecise <= playerBottomBound) {
                                playerInYDirection += 1;
                            }
                        }
                    }

                    if (checkw === this._maskwidth && eventsInYDirection === 0 && playerInYDirection === 0) {
                        this._realY = Math.min(this._realY + this.distancePerFrame(), this._y);
                    } 
                    else {
                        this._y = this._realY;
                    }
                }

                if (!this.isMoving()) {
                    this.refreshBushDepth();
                }

                this.setOccupiedTiles();
            }
        }

        if (this._shadow && this._host) {
            this._realX = this._host._realX;

            if ($gameMap.tileId(Math.floor(this._realX + 0.5), Math.floor(this._realY + 0.5), 5) <= this._host._z) {
                if ($gameMap.tileId(Math.floor(this._realX + 0.5), Math.floor(this._realY + 0.5), 5) === 0) {
                    var key = [$gameMap._mapId,this._eventId,"A"];
                    $gameSelfSwitches.setValue(key, true);
                } 
                else {
                    var key = [$gameMap._mapId,this._eventId,"A"];
                    $gameSelfSwitches.setValue(key, false);
                }

                if ($gameMap.tileId(Math.floor(this._realX + 0.5), Math.floor(this._realY + 0.5), 5) === 0) {
                    this._realY = this._host._realY + (this._host._z-this._zPrevious);
                } 
                else {
                    this._realY = this._host._realY + (this._host._z-$gameMap.tileId(Math.floor(this._realX + 0.5), Math.floor(this._realY + 0.5), 5));
                }
                
                if ($gameMap.tileId(Math.floor(this._realX + 0.5), Math.floor(this._realY + 0.5), 5) !== 0) {
                    this._zPrevious = $gameMap.tileId(Math.floor(this._realX + 0.5), Math.floor(this._realY + 0.5), 5);
                }
            }
        } 

        if (this._shadow && !this._host._exists) {
            this.erase();
        }
    };

    //=================================================================

    Game_Event.prototype.initialize = function(mapId, eventId) {
        Game_Character.prototype.initialize.call(this);
        this._mapId = mapId;
        this._eventId = eventId;
        this.locate(this.event().x, this.event().y);
        this.refresh();
        this._flyingProjectile = false;
        if ($dataMap.events[eventId].meta.maskW && $dataMap.events[eventId].meta.maskH) {
            this._maskwidth = parseInt($dataMap.events[eventId].meta.maskW);
            this._maskheight = parseInt($dataMap.events[eventId].meta.maskH);
        } else {
            this._maskwidth = 0;
            this._maskheight = 0;
        }
        if ($dataMap.events[eventId].meta.off) {
            this._maskyoffset = parseInt($dataMap.events[eventId].meta.off);
        } else {
            this._maskyoffset = 0;
        }

        this.setOccupiedTiles();
        this._time = 0;
    };

    Game_Event.prototype.setOccupiedTiles = function() {
        var dir = this.direction();
        var speed = this.distancePerFrame();
        var tileX = null;
        var tileY = null;
        var tileCoordinate = 0;
        for (i = $dataMap.occupiedTiles.length-1; i>-1; i--) {
            if ($dataMap.occupiedTiles[i].id === this._eventId) {
                $dataMap.occupiedTiles.splice(i,1);
            }
        }
        var id = this._eventId;
        this._tiles = [];
        for (j = 0; j < 7; j++){
            tileY = Math.floor(this._realY + ((((48 - this._maskheight)/2) + this._maskyoffset)/48) + ((j * this._maskheight / 48)/6) + (dir === 2 ? speed : dir === 8 ? -speed : 0));
            for (i = 0; i < 7; i++) {
                tileX = Math.floor(this._realX + (((48 - this._maskwidth)/2)/48) + ((i * this._maskwidth / 48)/6) + (dir === 6 ? speed : dir === 4 ? -speed : 0));
                var newTile = {id,tileX,tileY};
                var stringNewTile = JSON.stringify(newTile);
                var stringOldTile = JSON.stringify(tileCoordinate);
                if (stringNewTile !== stringOldTile) {
                    tileCoordinate = newTile;
                    var tiles = JSON.stringify($dataMap.occupiedTiles);
                    var found = tiles.includes(stringNewTile);
                    if (!found) {
                        $dataMap.occupiedTiles.push(tileCoordinate);
                        this._tiles.push(tileCoordinate);
                    }
                }
            }
        }
    };

    Game_CharacterBase.prototype.isCollidedWithEvents = function(x, y) {
        var events = $gameMap.eventsXyNt(x, y);
        return events.some(function(event) {
            return event.isNormalPriority();
        });
    };

    Game_CharacterBase.prototype.update = function() {
        if (this.isStopping()) {
            this.updateStop();
        }
        if (this.isJumping()) {
            this.updateJump();
        } else if (this.isMoving()) {
            this.updateMove();
        }
        if (this._impulse) {
            var dooba = this._impulse
            $gameMap.impulse(dooba[0],dooba[1],dooba[2],this._eventId,dooba[4])
        }
        this.updateAnimation();
    };

    Game_Map.prototype.impulse = function(x, y, t, thang, b) {
        var realThang = $gameMap._events[thang];
        if (b === undefined) {
            b = 2;
        }
        if (t > 0) {
            var impSpeedX = (b*x)/t;
            var impSpeedY = (b*y)/t;
            realThang._impulse = [x-impSpeedX,y-impSpeedY,t-1, realThang, b];
            realThang._realX = realThang._realX + impSpeedX;
            realThang._realY = realThang._realY + impSpeedY;
            realThang._x = realThang._realX;
            realThang._y = realThang._realY;
            realThang.updateMove();
            realThang.setOccupiedTiles();
        } else {
            realThang._impulse = null;
        }
        realThang.setOccupiedTiles();
    };

    Game_Player.prototype.update = function(sceneActive) {
        var lastScrolledX = this.scrolledX();
        var lastScrolledY = this.scrolledY();
        var wasMoving = this.isMoving();
        this._x = this._realX;
        this._y = this._realY;
        if (this.isCollidedWithEvents(this._x,this._y)) {
            console.log("Tru dat");
        }
        this.updateDashing();
        if (sceneActive) {
            this.moveByInput();
        }
        Game_Character.prototype.update.call(this);
        this.updateScroll(lastScrolledX, lastScrolledY);
        this.updateVehicle();
        if (true) {
            this.updateNonmoving(wasMoving);
        }
        this._followers.update();
    };

    Scene_Map.prototype.updateCallMenu = function() {
        if (this.isMenuEnabled()) {
            if (this.isMenuCalled()) {
                this.menuCalling = true;
            }
            if (this.menuCalling) {
                this.callMenu();
            }
        } else {
            this.menuCalling = false;
        }
    };

    Game_Map.prototype.setup = function(mapId) {
        if (!$dataMap) {
            throw new Error('The map data is not available');
        }

        $dataMap.occupiedTiles = [];
        this._mapId = mapId;
        this._tilesetId = $dataMap.tilesetId;
        this._displayX = 0;
        this._displayY = 0;
        this.refereshVehicles();
        this.setupEvents();
        this.setupScroll();
        this.setupParallax();
        this.setupBattleback();
        this._needsRefresh = false;
    };

    //=================================================================

    Game_Character.prototype.moveForward = function(d) {
        if (d) {
            this.setDirection(d);
            var dir = d;
        } 
        else {
            var dir = this.direction();
            this.setDirection(dir);
        }

        var speed = this.distancePerFrame();
        var yHopeThisWorks = $gameMap.roundYWithDirectionEvent(this._realY, dir, speed, this);
        var xHopeThisWorks = $gameMap.roundXWithDirectionEvent(this._realX, dir, speed,this);

        if (this.canPass(xHopeThisWorks, yHopeThisWorks, dir) || $gameMap.isLadder(x2,y2)) {
            this._x += (dir === 6 ? 0.5 : dir === 4 ? -0.5 : 0);
            this._y += (dir === 2 ? 0.5 : dir === 8 ? -0.5 : 0);
        }  
    };

    Game_Character.prototype.moveRandom = function() {
        var randDir = Math.floor((Math.random() * 4) + 1);
        var d = randDir * 2;

        this.setDirection(d);

        var speed = this.distancePerFrame();
        var yHopeThisWorks = $gameMap.roundYWithDirectionEvent(this._realY, d, speed, this);
        var xHopeThisWorks = $gameMap.roundXWithDirectionEvent(this._realX, d, speed,this);

        if (this.canPass(xHopeThisWorks, yHopeThisWorks, d) || $gameMap.isLadder(x2,y2)) {
            this.moveForward(d);
        }
    };

    Game_Event.prototype.updateSelfMovement = function() {
        if (!this._locked && this.isNearTheScreen() &&
                this.checkStop(this.stopCountThreshold())) {
            switch (this._moveType) {
                case 1:
                    this.moveTypeRandom();
                    break;
                case 2:
                    this.moveTypeTowardPlayer();
                    break;
                case 3:
                    this.moveTypeCustom();
                    break;
            }
        }

        if (!this._locked && !this.isNearTheScreen() && this._projectile) {
            this._locked = true;
            this.erase();
            this._maskwidth = 0;
            this._maskheight = 0;
            this._maskyoffset = 0;
            this._exists = false;
        }

        this._time += 1;
    };
})();