// The segment solver and follow/fallback order are preserved from Dung's
// licensed CodePen. See CODEPEN_ORIGINAL.js and CODEPEN_LICENSE.txt.

export function distanceBetween(first, second) {
    return Math.hypot(second.x - first.x, second.y - first.y);
}

export class CodepenSegment {
    constructor(parent, length, angle, first) {
        this.first = first;
        this.pos = first
            ? { x: parent.x, y: parent.y }
            : { x: parent.nextPos.x, y: parent.nextPos.y };
        this.l = length;
        this.ang = angle;
        this.nextPos = {
            x: this.pos.x + (this.l * Math.cos(this.ang)),
            y: this.pos.y + (this.l * Math.sin(this.ang)),
        };
    }

    update(target) {
        this.ang = Math.atan2(target.y - this.pos.y, target.x - this.pos.x);
        this.pos.x = target.x + (this.l * Math.cos(this.ang - Math.PI));
        this.pos.y = target.y + (this.l * Math.sin(this.ang - Math.PI));
        this.nextPos.x = this.pos.x + (this.l * Math.cos(this.ang));
        this.nextPos.y = this.pos.y + (this.l * Math.sin(this.ang));
    }

    fallback(target) {
        this.pos.x = target.x;
        this.pos.y = target.y;
        this.nextPos.x = this.pos.x + (this.l * Math.cos(this.ang));
        this.nextPos.y = this.pos.y + (this.l * Math.sin(this.ang));
    }
}

export class CodepenArm {
    constructor(anchor, length, count, target, config, index) {
        this.index = index;
        this.config = config;
        this.x = anchor.x;
        this.y = anchor.y;
        this.l = length;
        this.n = count;
        this.t = {};
        this.state = 'planted';
        this.plantUntil = 0;
        this.swingStarted = 0;
        this.swingDuration = config.swingDuration;
        this.swingFrom = { ...anchor };
        this.swingTo = { ...anchor };
        this.edge = null;
        this.segments = [new CodepenSegment(this, this.l / this.n, 0, true)];

        for (let indexValue = 1; indexValue < this.n; indexValue += 1) {
            this.segments.push(new CodepenSegment(
                this.segments[indexValue - 1],
                this.l / this.n,
                0,
                false,
            ));
        }

        this.move(target, target);
    }

    setAnchor(anchor) {
        this.x = anchor.x;
        this.y = anchor.y;
    }

    anchor() {
        return { x: this.x, y: this.y };
    }

    // This is the CodePen tentacle.move method with names expanded only for
    // clarity. Its fixed outer endpoint follows the shared moving body target.
    move(lastTarget, target) {
        this.angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.dt = distanceBetween(lastTarget, target) + 5;
        this.t = {
            x: target.x - (0.8 * this.dt * Math.cos(this.angle)),
            y: target.y - (0.8 * this.dt * Math.sin(this.angle)),
        };

        if (this.t.x) {
            this.segments[this.n - 1].update(this.t);
        } else {
            this.segments[this.n - 1].update(target);
        }

        for (let indexValue = this.n - 2; indexValue >= 0; indexValue -= 1) {
            this.segments[indexValue].update(this.segments[indexValue + 1].pos);
        }

        if (distanceBetween({ x: this.x, y: this.y }, target)
            <= this.l + distanceBetween(lastTarget, target)) {
            this.segments[0].fallback({ x: this.x, y: this.y });

            for (let indexValue = 1; indexValue < this.n; indexValue += 1) {
                this.segments[indexValue].fallback(this.segments[indexValue - 1].nextPos);
            }
        }
    }

    pointsFromBody() {
        return [
            { ...this.segments[0].pos },
            ...this.segments.map((segment) => ({ ...segment.nextPos })),
        ].reverse();
    }
}
