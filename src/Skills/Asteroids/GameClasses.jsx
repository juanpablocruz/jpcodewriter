export class Vec2D {   
    constructor(x=1, y=0) {
        this._x = x
        this._y = y
    }

    getX = () => this._x
    getY = () => this._y
    setX = (x) => this._x = x
    setY = (y) => this._y = y

    setXY(x, y) {
        this._x = x
        this._y = y
    }

    getLength() {
        return Math.sqrt(this._x * this._x + this._y*this._y)
    }

    setLength(length) {
        let angle = this.getAngle()
        this._x = Math.cos(angle) * length
        this._y = Math.sin(angle) * length
    }

    getAngle() {
        return Math.atan2(this._y, this._x)
    }

    setAngle(angle) {
        let length = this.getLength()
        this._x = Math.cos(angle) * length
        this._y = Math.sin(angle) * length
    }

    add(vector) {
        this._x += vector.getX()
        this._y += vector.getY()
    }
    sub(vector) {
        this._x -= vector.getX()
        this._y -= vector.getY()
    }

    mul(value) {
        this._x *= value
        this._y *= value
    }

    div(value) {
        this._x /= value
        this._y /= value
    }

}

export class Particle{
    constructor() {
        this.radius = 2
        this.color = "#fff"
        this.lifeSpan = 0
        this.fric = 0.98
        this.pos = new Vec2D(0,0)
        this.vel = new Vec2D(0,0)
        this.blacklisted = false
    }

    static create() {
        return new Particle();
    }

    update() {
        this.pos.add(this.vel)
        this.vel.mul(this.fric)
        this.radius -= 0.1

        if (this.radius < 0.1) this.radius = 0.1

        if (this.lifeSpan-- < 0) {
            this.blacklisted = true
        }
    }

    reset() {
        this.blacklisted = false
    }
}

export class Bullet{
    constructor() {
        this.radius = 4
        this.color = "#fff"
        this.pos = new Vec2D(0,0)
        this.vel = new Vec2D(0,0)
        this.blacklisted = false
    }

    static create() {
        return new Bullet();
    }

    update() {
        this.pos.add(this.vel)
    }

    reset() {
        this.blacklisted = false
    }
}

export class Asteroid{
    constructor() {
        this.radius = 40
        this.color = "#ff5900"
        this.pos = new Vec2D(0,0)
        this.vel = new Vec2D(0,0)
        this.blacklisted = false
        this.type = 'b'
        this.sides = (Math.random() * 2 + 7) >> 0
        this.angle = 0
        this.angleVel = (1 - Math.random() * 2) * 0.01
        this.name = ''
    }

    static create() {
        return new Asteroid();
    }

    update() {
        this.pos.add(this.vel)
        this.angle += this.angleVel
    }

    reset() {
        this.blacklisted = false
    }
}


export class Ship {
    constructor(x, y, ref) {
        this.ref = ref
        this.angle = 0
        this.pos = new Vec2D(x, y)
        this.vel = new Vec2D(0, 0)
        this.thrust = new Vec2D(0, 0)
        this.idle = false
        this.radius =8 
        this.idleDelay = 0
        this.bulletDelay = 0
    }

    update() {
        this.vel.add(this.thrust)
        this.pos.add(this.vel)

        if (this.vel.getLength() > 5) this.vel.setLength(5)

        ++this.bulletDelay
        if (this.idle) {
            if (++this.idleDelay > 120) {
                this.idleDelay = 0
                this.idle = false
                this.ref.resetGame()
            }
        }
    }

    shoot() {
        if (this.bulletDelay > 8) {
            this.ref.generateShot()
            this.bulletDelay = 0
        }
    }
}


export class Pool {
    constructor(type, size) {
        this._type = type
        this._size = size
        this._pointer = size
        this._elements = []

        let i = 0
        let length = this._size

        for (i; i < length; ++i) {
            this._elements[i] = this._type.create()
        }
    }

    getElement() {
        if (this._pointer > 0) return this._elements[--this._pointer]
        return null
    }

    disposeElement(obj) {
        this._elements[this._pointer++] = obj
    }
}