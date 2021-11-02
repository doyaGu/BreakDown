var sizes = {
    gameArea: [650, 600],
    board: [540, 300],
    bar: [100, 20],
    brick: [90, 30],
    ball: [20, 20],
    bonus: [10, 10]
};

var randColor = function () {
    return '#' + Math.floor(Math.random() * 0xffffff).toString(16);
};

var update = function () {
    var ball1, entity, i, j;
    for (i = 0; i < gameArea.balls.length; i++) {
        ball1 = gameArea.balls[i];
        if (gameArea.bar.isOverLapping(ball1)) {
            var lengthSquared = ball1.vx * ball1.vx + ball1.vy * ball1.vy;
            ball1.vy *= -Math.cos(Math.abs(ball1.x - gameArea.bar.x) /
                gameArea.bar.width * Math.PI / 4);
            ball1.vx *= Math.sqrt(lengthSquared - ball1.vy * ball1.vy) / Math.abs(ball1.vx);
            game.score += 5;
        }

        for (j = 0; j < gameArea.bonuses.length; j++) {
            entity = gameArea.bonuses[j];
            if (entity.visible &&
                gameArea.bar.isOverLapping(entity)) {
                entity.effect();
                entity.visible = false;
                entity.removed = true;
                entity.element.style.display = 'none';
                gameArea.bonuses.splice(j, 1);
            }
            if (entity.top + entity.height >= gameArea.bottom) {
                entity.element.style.display = 'none';
            }
        }
        for (j = 0; j < gameArea.board.bricks.length; j++) {
            entity = gameArea.board.bricks[j];
            if (entity.visible) {
                if (entity.isOverLapping(ball1)) {
                    if (entity.bonus) {
                        entity.bonus.moveable = true;
                        entity.bonus.visible = true;
                        entity.bonus.element.style.display = 'block';
                    }
                    ball1.vy *= -1;
                    entity.removed = true;
                    entity.element.style.display = 'none';
                    gameArea.board.bricks.splice(j, 1);
                    game.score += 10;
                }
            }
        }
        if (ball1.left <= gameArea.left) {
            ball1.vx *= -1;
        } else if (ball1.left + ball1.width >= gameArea.right) {
            ball1.vx *= -1;
        } else if (ball1.top <= gameArea.top) {
            ball1.vy *= -1;
        } else if (ball1.top + ball1.height >= gameArea.bottom) {
            ball1.element.style.display = 'none';
            gameArea.balls.splice(i, 1);
        }
    }
};

var Entity = function (params) {
    this.width = params.width;
    this.height = params.height;
    this.left = params.left;
    this.top = params.top;
    this.color = params.color || randColor();
    this.visible = params.visible || true;
    this.removed = false;
    this.element = null;
    Object.defineProperties(this, {
        x: {
            configurable: true,
            get: function () {
                return this.left + Math.floor(this.width / 2);
            },
            set: function (newValue) {
                this.left = newValue - Math.floor(this.width / 2);
            }
        },
        y: {
            configurable: true,
            get: function () {
                return this.top + Math.floor(this.height / 2);
            },
            set: function (newValue) {
                this.top = newValue - Math.floor(this.height / 2);
            }
        }
    });

    game.entities.push(this);
};

Entity.prototype.initTarget = function () {
    this.element = document.createElement('div');
    if (this.constructor === Brick) {
        this.element.setAttribute('class', 'brick');
    } else if (this.constructor === Ball) {
        this.element.setAttribute('class', 'ball');
    } else if (this.constructor === Bar) {
        this.element.setAttribute('id', 'bar');
    }
    this.element.style.backgroundColor = this.color;
    this.element.style.display = (this.visible) ? 'block' : 'none';
    ['left', 'top', 'width', 'height'].forEach(function (item, index, array) {
        this.element.style[item] = this[item] + 'px';
    }, this);
    this.parent.appendChild(this.element);
};

Entity.prototype.draw = function () {
    if (!this.element) {
        this.initTarget();
    } else if (this.visible) {
        if (this.moveable) {
            if ('move' in this) {
                this.move();
            }
            this.element.style.left = this.x - Math.floor(this.width / 2) + 'px';
            this.element.style.top = this.y - Math.floor(this.height / 2) + 'px';
        }
    }
};

Entity.prototype.isOverLapping = function (collider) {
    return (Math.abs(this.x - collider.x) <=
            this.width / 2 + collider.width / 2) &&
        (Math.abs(this.y - collider.y) <=
            this.height / 2 + collider.height / 2);
};

var Bar = function (params) {
    Entity.call(this, params);
    this.moveable = true;
    this.parent = gameArea.element;
};

Bar.prototype = Object.create(Entity.prototype);
Bar.prototype.constructor = Bar;

var Ball = function (params) {
    Entity.call(this, params);
    Object.defineProperties(this, {
        x: {
            configurable: true,
            get: function () {
                return this.left + Math.floor(this.width / 2);
            },
            set: function (newValue) {
                this.left = newValue - Math.floor(this.width / 2);
            }
        },
        y: {
            configurable: true,
            get: function () {
                return this.top + Math.floor(this.height / 2);
            },
            set: function (newValue) {
                this.top = newValue - Math.floor(this.height / 2);
            }
        }
    });
    this.radius = params.radius;
    this.vx = params.vx;
    this.vy = params.vy;
    this.parent = gameArea.element;
};

Ball.prototype = Object.create(Entity.prototype);
Ball.prototype.constructor = Ball;
Ball.prototype.move = function () {
    this.x += this.vx;
    this.y -= this.vy;
};

var randBonus = (function () {
    var Bonus = function (params) {
        Entity.call(this, params);
        this.speed = 4;
        this.visible = false;
        this.effect = params.effect;
        this.parent = gameArea.element;
    };

    Bonus.prototype = Object.create(Entity.prototype);
    Bonus.prototype.constructor = Bonus;
    Bonus.prototype.move = function () {
        this.y += this.speed;
    };

    var colors = ['green', 'red', 'blue'];
    var effects = {
        green: function () {
            game.score += 20;
            if (gameArea.bar.width < sizes.gameArea[0] / 2) {
                gameArea.bar.width += 10;
                gameArea.bar.element.style.width = gameArea.bar.width + 'px';
            }
        },
        red: function () {
            game.score -= 20;
            if (gameArea.bar.width > sizes.ball[0] * 2) {
                gameArea.bar.width -= 10;
                gameArea.bar.element.style.width = gameArea.bar.width + 'px';
            }
        },
        blue: function () {
            game.score += 40;
            gameArea.balls.unshift(new Ball({
                width: sizes.ball[0],
                height: sizes.ball[1],
                left: 315,
                top: 528,
                radius: 10,
                vx: (Math.random() > 0.5) ? 3 : -3,
                vy: 9
            }));
        }
    };
    return function (brick) {
        var color = colors[Math.floor((Math.random() * colors.length))];
        var bonus = new Bonus({
            width: sizes.bonus[0],
            height: sizes.bonus[1],
            left: brick.x - sizes.bonus[0] / 2,
            top: brick.y - sizes.bonus[1] / 2,
            color: color,
            effect: effects[color],
            visible: false
        });
        gameArea.bonuses.push(bonus);
        return bonus;
    };
})();

var Brick = function (params) {
    Entity.call(this, params);
    this.parent = gameArea.element;
};

Brick.prototype = Object.create(Entity.prototype);
Brick.prototype.constructor = Brick;

var gameArea = {
    left: 0,
    top: 0,
    right: sizes.gameArea[0],
    bottom: sizes.gameArea[1],
    balls: [],
    bonuses: [],
    bar: undefined,
    board: {
        bricks: [],
        init: function (params) {
            this.width = params.width;
            this.height = params.height;
            this.left = params.left;
            this.top = params.top;
            this.row = Math.floor(sizes.board[1] / sizes.brick[1]);
            this.column = Math.floor(sizes.board[0] / sizes.brick[0]);
            for (var i = 0; i < this.row; i++) {
                for (var j = 0; j < this.column; j++) {
                    if (Math.random() < 0.7) {
                        this.bricks.push(new Brick({
                            width: sizes.brick[0],
                            height: sizes.brick[1],
                            left: this.left + sizes.brick[0] * j,
                            top: this.top + sizes.brick[1] * i,
                        }));
                        var brick = this.bricks[this.bricks.length - 1];
                        brick.bonus = (Math.random() < 0.1) ? randBonus(brick) : undefined;
                    }
                }
            }
        }
    },
    element: document.querySelector('.game-area')
};

var mouse = {
    x: 0,
    y: 0,
    down: false,
    init: function () {
        window.addEventListener('mousemove', mouse.mouseMoveHander);
        window.addEventListener('mousedown', mouse.mouseDownHander);
        window.addEventListener('mouseup', mouse.mouseUpHander);
        window.addEventListener('mouseout', mouse.mouseOutHander);
    },
    mouseMoveHander: function (event) {
        var offset = {
            left: gameArea.element.style.left,
            top: gameArea.element.style.top
        };
        mouse.x = event.pageX - offset.left;
        mouse.y = event.pageY - offset.top;
        if (mouse.down) {
            mouse.dragging = true;
        }
    },
    mouseDownHander: function (event) {
        mouse.down = true;
        mouse.downX = mouse.x;
        mouse.downY = mouse.y;
        event.preventDefault();
    },
    mouseUpHander: function (event) {
        mouse.down = false;
        mouse.dragging = false;
    }
};

var game = {
    time: undefined,
    entities: [],
    state: 'playing',
    score: 0,
    launcher: function () {
        if (!gameArea.balls[0].moveable && mouse.down) {
            gameArea.balls[0].moveable = true;
        }
    },
    drawer: function () {

        var newProcessList = [];
        for (var i = 0; i < game.entities.length; i++) {
            if ((!game.entities[i].removed)) {
                game.entities[i].draw();
                newProcessList.push(game.entities[i]);
            }
        }
        game.entities = newProcessList;
    },
    init: function () {
        mouse.init();
        gameArea.bar = new Bar({
            width: sizes.bar[0],
            height: sizes.bar[1],
            left: 275,
            top: 550,
            color: 'blue'
        });
        gameArea.bar.move = (function () {
            var lastX;
            return function () {
                if (lastX) {
                    var delta = mouse.x - lastX;
                    if (mouse.dragging) {
                        gameArea.bar.left += delta;
                        if (gameArea.bar.left < 0) {
                            gameArea.bar.left += Math.abs(delta);
                        } else if (gameArea.bar.left + gameArea.bar.width > gameArea.right) {
                            gameArea.bar.left -= Math.abs(delta);
                        }
                    }
                }
                lastX = mouse.x;
            };
        })();
        gameArea.balls.push(new Ball({
            width: sizes.ball[0],
            height: sizes.ball[1],
            left: 315,
            top: 528,
            radius: 10,
            vx: (Math.random() > 0.5) ? 3 : -3,
            vy: 9,
        }));
        gameArea.board.init({
            width: sizes.board[0],
            height: sizes.board[1],
            left: 55,
            top: 60
        });
    },
    main: function () {
        switch (game.state) {
            case 'playing':
                game.launcher();
                update();
                game.drawer(game.entities);
                if (gameArea.board.bricks.length === 0) {
                    game.state = 'You Win!';
                } else if (gameArea.balls.length === 0) {
                    game.state = 'Game Over';
                }
                setTimeout(game.main, 20);
                break;
            default:
                setTimeout(function () {
                    gameArea.element.innerHTML =
                        '<div class="message">' +
                        '<h2>' + game.state + '</h2>' +
                        '<p>Score: ' + game.score + '</p>';
                }, 100);
        }
    }
};

game.init();
game.main();