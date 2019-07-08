import { Pool, Particle, Bullet, Asteroid, Ship, Vec2D } from "./GameClasses";
import { Color } from "../../Terminal/Terminal";
import { Skill } from "../SkillItem";

export default class Game {
    canvas: any
    context: any
    screenWidth: number
    screenHeight: number
    hScan: number
    asteroidVelFactor: number

    keyLeft: boolean
    keyRight: boolean
    keyUp: boolean
    keyDown: boolean
    keySpace: boolean

    particlePool: Pool
    particles: Particle[]

    bulletPool: Pool
    bullets: Bullet[]

    asteroidPool: Pool
    asteroids: Asteroid[]

    skills: Skill[]
    ship: Ship

    skillConquered: any
    finishGame: any
    registerAnimationFrame: any
    color: Color
    showInfo: any


    constructor(canvas: any, skills: Skill[], color: Color, skillConquered: any, finishGame: any, registerAnimationFrame: any, showInfo: any) {
        this.canvas = canvas
        this.context = this.canvas.getContext('2d')

        this.onResize = this.onResize.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleKeyUp = this.handleKeyUp.bind(this)
        this.loop = this.loop.bind(this)

        window.onresize = this.onResize

        this.asteroidVelFactor = 0

        this.screenWidth = 500
        this.screenHeight = 500
        this.hScan = (this.screenHeight / 4) >> 0

        this.keyLeft = false
        this.keyRight = false
        this.keyUp = false
        this.keyDown = false
        this.keySpace = false

        this.skills = skills

        this.skillConquered = skillConquered
        this.finishGame = finishGame
        this.registerAnimationFrame = registerAnimationFrame
        this.showInfo = showInfo

        this.keyboardInit()

        this.particlePool = new Pool(Particle, 100)
        this.particles = []

        this.bulletPool = new Pool(Bullet, 40)
        this.bullets = []

        this.asteroidPool = new Pool(Asteroid, skills.length)
        this.asteroids = []

        this.color = color

        this.ship = new Ship(this.screenWidth >> 1, this.screenHeight >> 1, this)

        this.shipInit()

    }

    keyboardInit() {
        window.onkeydown = this.handleKeyDown
        window.onkeyup = this.handleKeyUp
    }

    handleKeyDown(event: KeyboardEvent) {
        switch (event.keyCode) {
            // A or LEFT
            case 65:
            case 37:
                this.keyLeft = true
                break;
            // W or UP
            case 87:
            case 38:
                this.keyUp = true
                break;
            // D or RIGHT
            case 68:
            case 39:
                this.keyRight = true
                break;
            // S or DOWN
            case 83:
            case 40:
                this.keyDown = true
                break;
            case 32:
            case 75:
                this.keySpace = true
                break
        }
        event.preventDefault()
    }
    handleKeyUp(event: KeyboardEvent) {
        switch (event.keyCode) {
            case 27:
                this.finishGame()
                break
            case 9:
                this.showInfo()
                break
            // A or LEFT
            case 65:
            case 37:
                this.keyLeft = false
                break;
            // W or UP
            case 87:
            case 38:
                this.keyUp = false
                break;
            // D or RIGHT
            case 68:
            case 39:
                this.keyRight = false
                break;
            // S or DOWN
            case 83:
            case 40:
                this.keyDown = false
                break;
            case 32:
            case 75:
                this.keySpace = false
                break
        }
        event.preventDefault()
    }

    particleInit() {
        this.particlePool = new Pool(Particle, 100)
        this.particles = []
    }

    bulletInit() {
        this.bulletPool = new Pool(Bullet, 40)
        this.bullets = []
    }

    asteroidInit() {
        this.asteroidPool = new Pool(Asteroid, 30)
        this.asteroids = []
    }


    shipInit() {
        this.ship = new Ship(this.screenWidth >> 1, this.screenHeight >> 1, this)
    }

    loop() {
        this.updateShip()
        this.updateParticles()
        this.updateBullets()
        this.updateAsteroids()
        this.checkCollisions()
        this.render()
        this.registerAnimationFrame(requestAnimationFrame(this.loop))
    }

    onResize() {
        if (!this.canvas) return

        this.screenWidth = this.canvas.clientWidth
        this.screenHeight = this.canvas.clientHeight

        this.canvas.width = this.screenWidth
        this.canvas.height = this.screenHeight

        this.hScan = (this.screenHeight / 4) >> 0
    }

    updateShip() {
        this.ship.update()

        if (this.ship.idle) return

        if (this.keySpace) this.ship.shoot()
        if (this.keyLeft) this.ship.angle -= 0.1
        if (this.keyRight) this.ship.angle += 0.1

        if (this.keyUp) {
            this.ship.thrust.setLength(0.1)
            this.ship.thrust.setAngle(this.ship.angle)

            this.generateThrustParticle()
        } else {
            this.ship.vel.mul(0.94)
            this.ship.thrust.setLength(0)
        }

        if (this.ship.pos.getX() > this.screenWidth) this.ship.pos.setX(0)
        else if (this.ship.pos.getX() < 0) this.ship.pos.setX(this.screenWidth)

        if (this.ship.pos.getY() > this.screenHeight) this.ship.pos.setY(0)
        else if (this.ship.pos.getY() < 0) this.ship.pos.setY(this.screenHeight)
    }

    generateThrustParticle() {
        let p = this.particlePool.getElement()

        if (!p) return

        p.radius = Math.random() * 3 + 2
        p.color = '#FFF';
        p.lifeSpan = 80;
        p.pos.setXY(this.ship.pos.getX() + Math.cos(this.ship.angle) * -14, this.ship.pos.getY() + Math.sin(this.ship.angle) * -14);
        p.vel.setLength(8 / p.radius);
        p.vel.setAngle(this.ship.angle + (1 - Math.random() * 2) * (Math.PI / 18));
        p.vel.mul(-1);

        this.particles[this.particles.length] = p;
    }

    updateParticles() {
        this.particles.forEach((p: Particle) => {
            if (p.blacklisted) {
                p.reset()

                this.particles.splice(this.particles.indexOf(p), 1)
                this.particlePool.disposeElement(p)
            } else {
                p.update()
            }
        })
    }

    updateBullets() {
        this.bullets.forEach((b: Bullet) => {
            if (b.blacklisted) {
                b.reset()

                this.bullets.splice(this.bullets.indexOf(b), 1)
                this.bulletPool.disposeElement(b)
            } else {
                b.update()

                if (b.pos.getX() > this.screenWidth) b.blacklisted = true
                else if (b.pos.getX() < 0) b.blacklisted = true

                if (b.pos.getY() > this.screenHeight) b.blacklisted = true
                else if (b.pos.getY() < 0) b.blacklisted = true
            }
        })
    }

    updateAsteroids() {
        this.asteroids.forEach((a: Asteroid) => {
            if (a.blacklisted) {
                a.reset()

                this.asteroids.splice(this.asteroids.indexOf(a), 1)
                this.asteroidPool.disposeElement(a)
            } else {
                a.update()

                if (a.pos.getX() > this.screenWidth + a.radius) a.pos.setX(-a.radius)
                else if (a.pos.getX() < -a.radius) a.pos.setX(this.screenWidth + a.radius)

                if (a.pos.getY() > this.screenHeight + a.radius) a.pos.setY(-a.radius)
                else if (a.pos.getY() < -a.radius) a.pos.setY(this.screenHeight + a.radius)
            }
        })

        if (this.asteroids.length < 5) {
            let factor = (Math.random() * 2) >> 0

            this.generateAsteroid(this.screenWidth * factor, this.screenHeight * factor, 60, 'b', this.skills[Math.floor(Math.random() * this.skills.length)].name)
        }
    }

    generateAsteroid(x: number, y: number, radius: number, type: string, skillName: string) {
        let a = this.asteroidPool.getElement()

        if (!a) return

        a.radius = radius
        a.type = type
        a.pos.setXY(x, y)
        a.vel.setLength(1 + this.asteroidVelFactor)
        a.vel.setAngle(Math.random() * (Math.PI * 2))
        a.name = skillName
        a.color = this.color.color

        this.asteroids[this.asteroids.length] = a
        this.asteroidVelFactor += 0.025
    }

    checkCollisions() {
        this.checkBulletAsteroidCollisions()
        this.checkShipAsteroidCollisions()
    }

    checkBulletAsteroidCollisions() {
        this.bullets.forEach((b) => {
            this.asteroids.forEach((a) => {
                if (this.checkDistanceCollision(b, a)) {
                    b.blacklisted = true
                    this.destroyAsteroid(a)
                }
            })
        })
    }

    checkShipAsteroidCollisions() {
        this.asteroids.forEach((a: Asteroid) => {
            let s = this.ship
            if (this.checkDistanceCollision(a, s)) {
                if (s.idle) return
                s.idle = true
                this.generateShipExplosion()
                this.destroyAsteroid(a)
            }
        })
    }

    generateShipExplosion() {
        for (let i = 18; i > -1; --i) {
            let p = this.particlePool.getElement()

            if (!p) return

            p.radius = Math.random() * 6 + 2
            p.lifeSpan = 80
            p.color = "#FFF"
            p.vel.setLength(20 / p.radius)
            p.vel.setAngle(this.ship.angle + (1 - Math.random() * 2) * (Math.PI * 2))
            p.pos.setXY(this.ship.pos.getX() + Math.cos(p.vel.getAngle()) * (this.ship.radius * 0.8),
                this.ship.pos.getY() + Math.sin(p.vel.getAngle()) * (this.ship.radius * 0.8))

            this.particles[this.particles.length] = p
        }
    }

    checkDistanceCollision(obj1: any, obj2: any) {
        let vx = obj1.pos.getX() - obj2.pos.getX()
        let vy = obj1.pos.getY() - obj2.pos.getY()
        let vec = new Vec2D(vx, vy)

        if (vec.getLength() < obj1.radius + obj2.radius) {
            return true
        }
        return false
    }

    destroyAsteroid(asteroid: Asteroid) {
        asteroid.blacklisted = true

        this.generateAsteroidExplosion(asteroid)
        this.resolveAsteroidType(asteroid)
    }

    generateAsteroidExplosion(asteroid: Asteroid) {
        for (let i = 18; i > -1; --i) {
            let p = this.particlePool.getElement()

            if (!p) return

            p.radius = Math.random() * (asteroid.radius >> 2) + 2
            p.lifeSpan = 80
            p.color = this.color.color
            p.vel.setLength(20 / p.radius)
            p.vel.setAngle(this.ship.angle + (1 - Math.random() * 2) * (Math.PI * 2))
            p.pos.setXY(asteroid.pos.getX() + Math.cos(p.vel.getAngle()) * (asteroid.radius * 0.8), asteroid.pos.getY() + Math.sin(p.vel.getAngle()) * (asteroid.radius * 0.8))

            this.particles[this.particles.length] = p
        }
    }

    resolveAsteroidType(asteroid: Asteroid) {
        switch (asteroid.type) {
            case 'b':
                this.generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 40, 'm', asteroid.name)
                this.generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 40, 'm', asteroid.name)
                break
            case 'm':
                this.generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 40, 's', asteroid.name)
                this.generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 40, 's', asteroid.name)
                break
            case 's':
                this.skillConquered(asteroid.name)
                break
        }
    }

    render() {
        this.context.fillStyle = '#262626'
        this.context.globalAlpha = 0.4
        this.context.fillRect(0, 0, this.screenWidth, this.screenHeight)
        this.context.globalAlpha = 1

        this.renderShip()
        this.renderParticles()
        this.renderBullets()
        this.renderAsteroids()
        this.renderScanlines()
    }

    renderShip() {
        if (this.ship.idle) return
        this.context.save()
        this.context.translate(this.ship.pos.getX() >> 0, this.ship.pos.getY() >> 0)
        this.context.rotate(this.ship.angle)

        this.context.strokeStyle = '#FFF'
        this.context.lineWidth = (Math.random() > 0.9) ? 2 : 1
        this.context.beginPath()
        this.context.moveTo(10, 0)
        this.context.lineTo(-10, -10)
        this.context.lineTo(-10, 10)
        this.context.lineTo(10, 0)
        this.context.stroke()
        this.context.closePath()

        this.context.restore()

    }

    renderParticles() {
        this.particles.forEach((p: Particle) => {
            this.context.beginPath()
            this.context.strokeStyle = p.color
            this.context.arc(p.pos.getX() >> 0, p.pos.getY() >> 0, p.radius, 0, Math.PI * 2)
            if (Math.random() > 0.4) this.context.stroke()
            this.context.closePath()
        })
    }
    renderBullets() {
        this.bullets.forEach((b: Bullet) => {
            this.context.beginPath()
            this.context.strokeStyle = b.color
            this.context.arc(b.pos.getX() >> 0, b.pos.getY() >> 0, b.radius, 0, Math.PI * 2)
            if (Math.random() > 0.2) this.context.stroke()
            this.context.closePath()
        })
    }

    renderAsteroids() {
        this.asteroids.forEach((a: Asteroid) => {
            this.context.beginPath()
            this.context.lineWidth = (Math.random() > 0.2) ? 4 : 3
            this.context.strokeStyle = a.color

            let j = a.sides

            let doublePI = Math.PI * 2
            this.context.moveTo((a.pos.getX() + Math.cos(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0,
                (a.pos.getY() + Math.sin(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0)

            for (j; j > -1; --j) {
                this.context.lineTo(
                    (a.pos.getX() + Math.cos(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0,
                    (a.pos.getY() + Math.sin(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0
                )
            }
            this.context.fillStyle = a.color
            this.context.fillText(a.name, a.pos.getX() - 10, a.pos.getY())
            if (Math.random() > 0.2) this.context.stroke()

            this.context.closePath()
        })
    }

    renderScanlines() {
        let i = this.hScan

        this.context.globalAlpha = 0.05
        this.context.lineWidth = 1

        for (i; i > -1; --i) {
            this.context.beginPath()
            this.context.moveTo(0, i * 4)
            this.context.lineTo(this.screenWidth, i * 4)
            this.context.strokeStyle = (Math.random() > 0.0001) ? '#FFF' : '#222'
            this.context.stroke()
        }

        this.context.globalAlpha = 1
    }

    generateShot() {
        let b = this.bulletPool.getElement()

        if (!b) return

        b.radius = 1
        b.pos.setXY(this.ship.pos.getX() + Math.cos(this.ship.angle) * 14, this.ship.pos.getY() + Math.sin(this.ship.angle) * 14)
        b.vel.setLength(10)
        b.vel.setAngle(this.ship.angle)

        this.bullets[this.bullets.length] = b
    }

    resetGame() {
        this.asteroidVelFactor = 0

        this.ship.pos.setXY(this.screenWidth >> 1, this.screenHeight >> 1)
        this.ship.vel.setXY(0, 0)

        this.resetAsteroids()
    }

    resetAsteroids() {
        this.asteroids.forEach((a: Asteroid) => a.blacklisted = true)
    }

}