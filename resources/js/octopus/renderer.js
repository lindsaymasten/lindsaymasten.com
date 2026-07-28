import { CodepenArm, distanceBetween } from './motion.js';
import { InkSkin } from './skin.js';

const TAU = Math.PI * 2;
const ARM_CONFIGS = [
    { angle: 68, length: 1.06, width: 0.98, phase: 0.15, plantDuration: 1880, swingDuration: 1040, suckerSide: -1, layer: 3 },
    { angle: 96, length: 1.17, width: 0.94, phase: 0.92, plantDuration: 2180, swingDuration: 1220, suckerSide: 1, layer: 1 },
    { angle: 126, length: 1.01, width: 1.07, phase: 1.68, plantDuration: 1760, swingDuration: 980, suckerSide: -1, layer: 5 },
    { angle: 157, length: 1.34, width: 1.12, phase: 2.44, plantDuration: 2100, swingDuration: 1180, suckerSide: 1, layer: 0 },
    { angle: 203, length: 1.31, width: 1.1, phase: 3.23, plantDuration: 1820, swingDuration: 1080, suckerSide: -1, layer: 2 },
    { angle: 234, length: 1.0, width: 1.05, phase: 4.01, plantDuration: 2260, swingDuration: 1280, suckerSide: 1, layer: 6 },
    { angle: 264, length: 1.19, width: 0.96, phase: 4.79, plantDuration: 1980, swingDuration: 1140, suckerSide: -1, layer: 4 },
    { angle: 292, length: 1.04, width: 1.02, phase: 5.57, plantDuration: 1700, swingDuration: 960, suckerSide: 1, layer: 7 },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + ((end - start) * amount);
const smoothstep = (start, end, value) => {
    const amount = clamp((value - start) / Math.max(0.0001, end - start), 0, 1);
    return amount * amount * (3 - (2 * amount));
};
const smootherstep = (value) => {
    const amount = clamp(value, 0, 1);
    return amount * amount * amount * ((amount * ((amount * 6) - 15)) + 10);
};
const vectorAt = (angle, length = 1) => ({
    x: Math.cos(angle) * length,
    y: Math.sin(angle) * length,
});
const normalize = (x, y) => {
    const magnitude = Math.max(0.0001, Math.hypot(x, y));
    return { x: x / magnitude, y: y / magnitude };
};
const shortestAngle = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
const pseudoRandom = (seed) => {
    const value = Math.sin(seed * 12.9898) * 43758.5453;

    return value - Math.floor(value);
};
const requestFrame = globalThis.requestAnimationFrame
    ? (callback) => globalThis.requestAnimationFrame(callback)
    : (callback) => globalThis.setTimeout(() => callback(performance.now()), 16);
const cancelFrame = globalThis.cancelAnimationFrame
    ? (request) => globalThis.cancelAnimationFrame(request)
    : (request) => globalThis.clearTimeout(request);

class InkOctopusRenderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
        });
        this.skin = new InkSkin(this.context);
        this.frameRate = options.frameRate ?? 60;
        this.width = 1;
        this.height = 1;
        this.density = 1;
        this.scale = 1;
        this.armLength = 332;
        this.mantleLength = 146;
        this.mantleWidth = 62;
        this.rootRadius = 32;
        this.clearance = 162;
        this.body = null;
        this.lastBody = null;
        this.velocity = { x: 0, y: 0 };
        this.heading = -0.24;
        this.lastHeading = -0.24;
        this.lastSpeed = 0;
        this.pointer = { x: 0, y: 0, active: false };
        this.arms = [];
        this.activeEdge = null;
        this.edgeRanks = [];
        this.armPull = { x: 0, y: 0 };
        this.autonomousPhase = 0;
        this.inkPhase = 0;
        this.reaction = 0;
        this.running = false;
        this.paused = false;
        this.initialized = false;
        this.frameRequest = null;
        this.lastFrame = 0;
        this.lastUpdate = 0;
        this.tick = this.tick.bind(this);
    }

    resize(width, height, density = 1) {
        const previousWidth = this.width;
        const previousHeight = this.height;

        this.width = Math.max(1, Math.round(width));
        this.height = Math.max(1, Math.round(height));
        this.density = clamp(density, 1, 1.6);
        this.canvas.width = Math.round(this.width * this.density);
        this.canvas.height = Math.round(this.height * this.density);
        this.scale = clamp(Math.min(this.width, this.height) / 900, 0.68, 1.08);
        this.armLength = 332 * this.scale;
        this.mantleLength = 146 * this.scale;
        this.mantleWidth = 62 * this.scale;
        this.rootRadius = 32 * this.scale;
        this.clearance = clamp(182 * this.scale, 92, Math.min(this.width, this.height) * 0.32);
        this.skin.setScale(this.scale);

        if (!this.initialized) {
            this.initialize();
            return;
        }

        this.body.x = (this.body.x / Math.max(1, previousWidth)) * this.width;
        this.body.y = (this.body.y / Math.max(1, previousHeight)) * this.height;
        this.clampBody();
        this.lastBody = { ...this.body };
        this.createArms(performance.now());
    }

    initialize() {
        this.body = {
            x: clamp(this.width * 0.24, this.clearance, this.width - this.clearance),
            y: clamp(this.height * 0.56, this.clearance, this.height - this.clearance),
        };
        this.lastBody = { ...this.body };
        this.pointer.x = this.body.x;
        this.pointer.y = this.body.y;
        this.createArms(performance.now());
        this.lastUpdate = performance.now();
        this.initialized = true;
    }

    createArms(timestamp) {
        this.arms = ARM_CONFIGS.map((config, index) => {
            const length = this.armLength * config.length;
            const root = this.rootForConfig(config, this.body, this.heading);
            const anchor = this.freeAnchor(config, length, root, timestamp / 1000, index);
            const arm = new CodepenArm(anchor, length, 30, root, config, index);

            arm.rootHalfWidth = 16.25 * this.scale * config.width;
            arm.lastRoot = { ...root };
            arm.plantUntil = timestamp + 420 + (index * 140);
            arm.stepIndex = index;
            arm.tipAngle = Math.atan2(anchor.y - root.y, anchor.x - root.x)
                + (Math.sin((index + 1) * 1.91) * 0.72);
            arm.curlTarget = 0;
            arm.curlAmount = arm.curlTarget;
            arm.curlDirection = index % 2 === 0 ? 1 : -1;
            arm.associatedSwingAt = 0;
            arm.associatedStep = null;
            arm.edgeHoldUntil = 0;

            return arm;
        });
    }

    rootForConfig(config, center = this.body, heading = this.heading) {
        const angle = heading + ((config.angle * Math.PI) / 180);

        return {
            x: center.x + (Math.cos(angle) * this.rootRadius),
            y: center.y + (Math.sin(angle) * this.rootRadius),
        };
    }

    freeAnchor(config, length, root, seconds, stepIndex = 0) {
        const movementAngle = Math.atan2(this.velocity.y, this.velocity.x);
        const speed = Math.hypot(this.velocity.x, this.velocity.y);
        const hasMovement = speed > 0.2;
        const strideWave = Math.sin(((stepIndex + 1) * 1.73) + (config.phase * 2.17));
        const secondaryWave = Math.cos(((stepIndex + 1) * 0.93) - (config.phase * 1.41));
        const landingSweep = (strideWave * 0.56) + (secondaryWave * 0.18);
        const baseAngle = this.heading
            + ((config.angle * Math.PI) / 180)
            + landingSweep
            + (Math.sin((seconds * 0.16) + config.phase) * 0.1);
        const extension = 0.7
            + (0.14 * ((Math.sin((seconds * 0.15) + (config.phase * 1.31)) + 1) / 2));
        const speedAmount = clamp(speed / Math.max(1, 23 * this.scale), 0, 1);
        const forwardReach = hasMovement
            ? length * speedAmount * (0.07 + (0.09 * ((strideWave + 1) / 2)))
            : 0;
        const prediction = {
            x: this.velocity.x * 0.85,
            y: this.velocity.y * 0.85,
        };
        const desired = {
            x: root.x
                + prediction.x
                + (Math.cos(baseAngle) * length * extension)
                + (Math.cos(movementAngle) * forwardReach),
            y: root.y
                + prediction.y
                + (Math.sin(baseAngle) * length * extension)
                + (Math.sin(movementAngle) * forwardReach),
        };

        return this.constrainAnchor(root, desired, length * 0.9);
    }

    setPointer(x, y, active = true) {
        this.pointer.x = clamp(x, 0, this.width);
        this.pointer.y = clamp(y, 0, this.height);
        this.pointer.active = active;
    }

    clearPointer() {
        this.pointer.active = false;
    }

    trigger(intensity = 1) {
        this.reaction = clamp(this.reaction + intensity, 0, 1.5);
    }

    setPaused(paused) {
        this.paused = paused;

        if (!paused && this.running && this.frameRequest === null) {
            this.lastUpdate = performance.now();
            this.frameRequest = requestFrame(this.tick);
        }
    }

    start() {
        if (this.running) return;

        this.running = true;
        this.lastUpdate = performance.now();
        this.frameRequest = requestFrame(this.tick);
    }

    stop() {
        this.running = false;

        if (this.frameRequest !== null) {
            cancelFrame(this.frameRequest);
            this.frameRequest = null;
        }
    }

    tick(timestamp) {
        this.frameRequest = null;

        if (!this.running || this.paused) return;

        const minimumFrameTime = 1000 / this.frameRate;

        if ((timestamp - this.lastFrame) >= minimumFrameTime) {
            const elapsed = timestamp - this.lastUpdate;

            this.lastFrame = timestamp;
            this.lastUpdate = timestamp;
            this.update(timestamp, elapsed);
            this.draw();
        }

        this.frameRequest = requestFrame(this.tick);
    }

    targetPoint() {
        if (this.pointer.active) {
            return {
                x: clamp(this.pointer.x, this.clearance, this.width - this.clearance),
                y: clamp(this.pointer.y, this.clearance, this.height - this.clearance),
            };
        }

        const sine = Math.sin(this.autonomousPhase);
        const denominator = (sine ** 2) + 1;
        const horizontalRadius = Math.max(0, (this.width / 2) - this.clearance);
        const verticalRadius = Math.max(0, (this.height / 2) - this.clearance);

        return {
            x: (this.width / 2)
                + ((horizontalRadius * Math.sqrt(2) * Math.cos(this.autonomousPhase)) / denominator),
            y: (this.height / 2)
                + ((verticalRadius * Math.sqrt(2) * Math.cos(this.autonomousPhase) * sine) / denominator),
        };
    }

    updateBody(frameScale) {
        this.lastBody.x = this.body.x;
        this.lastBody.y = this.body.y;
        this.lastHeading = this.heading;

        const target = this.targetPoint();
        const errorX = target.x - this.body.x;
        const errorY = target.y - this.body.y;
        const response = 1 - Math.pow(0.9765, frameScale);
        let moveX = errorX * response;
        let moveY = errorY * response;
        const movement = Math.hypot(moveX, moveY);
        const maximumStep = 5.5 * this.scale * frameScale;

        if (movement > maximumStep) {
            moveX = (moveX / movement) * maximumStep;
            moveY = (moveY / movement) * maximumStep;
        }

        this.body.x += moveX;
        this.body.y += moveY;
        this.clampBody();
        this.velocity.x = (this.body.x - this.lastBody.x) / Math.max(0.35, frameScale);
        this.velocity.y = (this.body.y - this.lastBody.y) / Math.max(0.35, frameScale);

        const speed = Math.hypot(this.velocity.x, this.velocity.y);

        if (speed > 0.18) {
            const targetHeading = Math.atan2(this.velocity.y, this.velocity.x);
            const turnResponse = 1 - Math.pow(0.963, frameScale);

            this.heading += shortestAngle(this.heading, targetHeading) * turnResponse;
        }

        this.lastSpeed = lerp(this.lastSpeed, speed, 0.065 * frameScale);
        this.autonomousPhase += 0.0032 * frameScale;
    }

    clampBody() {
        this.body.x = clamp(this.body.x, this.clearance, this.width - this.clearance);
        this.body.y = clamp(this.body.y, this.clearance, this.height - this.clearance);
    }

    nearestEdge(point, threshold) {
        const candidates = [
            ['left', point.x],
            ['right', this.width - point.x],
            ['top', point.y],
            ['bottom', this.height - point.y],
        ].sort((first, second) => first[1] - second[1]);

        return candidates[0][1] <= threshold ? candidates[0][0] : null;
    }

    edgeVectors(edge) {
        if (edge === 'left') return { outward: { x: -1, y: 0 }, tangent: { x: 0, y: 1 } };
        if (edge === 'right') return { outward: { x: 1, y: 0 }, tangent: { x: 0, y: 1 } };
        if (edge === 'top') return { outward: { x: 0, y: -1 }, tangent: { x: 1, y: 0 } };
        return { outward: { x: 0, y: 1 }, tangent: { x: 1, y: 0 } };
    }

    updateActiveEdge() {
        const pointerEdge = this.pointer.active
            ? this.nearestEdge(this.pointer, 38 * this.scale)
            : null;
        const bodyEdge = this.nearestEdge(this.body, this.clearance + (3 * this.scale));

        this.activeEdge = pointerEdge ?? bodyEdge;
        this.edgeRanks = this.activeEdge ? this.rankedArms(this.edgeVectors(this.activeEdge).outward) : [];
    }

    rankedArms(direction) {
        return this.arms
            .map((arm) => {
                const angle = this.heading + ((arm.config.angle * Math.PI) / 180);

                return {
                    arm,
                    score: (Math.cos(angle) * direction.x) + (Math.sin(angle) * direction.y),
                };
            })
            .sort((first, second) => second.score - first.score)
            .slice(0, 3)
            .map(({ arm }) => arm.index);
    }

    pointOnEdge(edge, along, margin) {
        if (edge === 'left') {
            return { x: margin, y: clamp(this.body.y + along, margin, this.height - margin) };
        }

        if (edge === 'right') {
            return { x: this.width - margin, y: clamp(this.body.y + along, margin, this.height - margin) };
        }

        if (edge === 'top') {
            return { x: clamp(this.body.x + along, margin, this.width - margin), y: margin };
        }

        return { x: clamp(this.body.x + along, margin, this.width - margin), y: this.height - margin };
    }

    desiredAnchor(arm, root, seconds) {
        const edgeRank = this.edgeRanks.indexOf(arm.index);

        if (this.activeEdge && edgeRank >= 0) {
            const { tangent } = this.edgeVectors(this.activeEdge);
            const tangentVelocity = (this.velocity.x * tangent.x) + (this.velocity.y * tangent.y);
            const along = ((edgeRank - 1) * 58 * this.scale)
                + (Math.sin(
                    (seconds * 0.28)
                    + arm.config.phase
                    + (arm.stepIndex * 1.37),
                ) * 32 * this.scale)
                + (tangentVelocity * 2.2);

            return this.constrainAnchor(
                root,
                this.pointOnEdge(this.activeEdge, along, 2.5 * this.scale),
                arm.l * 0.94,
            );
        }

        return this.freeAnchor(arm.config, arm.l, root, seconds, arm.stepIndex);
    }

    constrainAnchor(root, desired, maximumDistance) {
        const deltaX = desired.x - root.x;
        const deltaY = desired.y - root.y;
        const targetDistance = Math.max(0.0001, Math.hypot(deltaX, deltaY));
        const constrained = targetDistance > maximumDistance
            ? {
                x: root.x + ((deltaX / targetDistance) * maximumDistance),
                y: root.y + ((deltaY / targetDistance) * maximumDistance),
            }
            : desired;
        const margin = 7 * this.scale;

        return {
            x: clamp(constrained.x, margin, this.width - margin),
            y: clamp(constrained.y, margin, this.height - margin),
        };
    }

    startSwing(arm, root, timestamp, seconds, associateFront = true) {
        arm.stepIndex += 1;
        const destination = this.desiredAnchor(arm, root, seconds);
        const delta = normalize(destination.x - arm.x, destination.y - arm.y);
        const speed = Math.hypot(this.velocity.x, this.velocity.y);
        const destinationAngle = Math.atan2(destination.y - root.y, destination.x - root.x);

        arm.state = 'swinging';
        arm.swingStarted = timestamp;
        arm.swingDuration = clamp(
            arm.config.swingDuration / (1 + (speed * 0.003)),
            arm.config.swingDuration * 0.88,
            arm.config.swingDuration,
        );
        arm.swingFrom = arm.anchor();
        arm.swingTo = destination;
        arm.tipAngleFrom = arm.tipAngle;
        arm.tipAngleTo = destinationAngle
            + (Math.sin((arm.stepIndex * 2.11) + arm.config.phase) * 0.92)
            + (Math.cos((arm.stepIndex * 1.07) - arm.config.phase) * 0.22);
        const curlRoll = pseudoRandom(
            ((arm.stepIndex + 1) * 17.17) + ((arm.index + 1) * 31.73),
        );
        const isFront = arm.index === 3 || arm.index === 4;
        const curlChance = isFront ? 0.38 : 0.17;
        const curlStrength = pseudoRandom(
            ((arm.stepIndex + 1) * 43.11) + ((arm.index + 1) * 7.93),
        );

        arm.curlTarget = curlRoll < curlChance
            ? (isFront ? 0.78 : 0.56) + (curlStrength * (isFront ? 0.19 : 0.15))
            : 0;
        arm.curlDirection = (arm.stepIndex + arm.index) % 2 === 0 ? 1 : -1;
        arm.swingNormal = {
            x: -delta.y * (arm.index % 2 === 0 ? 1 : -1),
            y: delta.x * (arm.index % 2 === 0 ? 1 : -1),
        };
        arm.edge = this.activeEdge;

        if (associateFront && (arm.index === 3 || arm.index === 4)) {
            const partnerIndex = arm.index === 3 ? 4 : 3;
            const partner = this.arms[partnerIndex];

            if (partner?.state === 'planted') {
                partner.associatedSwingAt = timestamp + 320;
                partner.associatedStep = arm.stepIndex;
            }
        }
    }

    updateSwing(arm, root, timestamp) {
        const rawProgress = clamp((timestamp - arm.swingStarted) / arm.swingDuration, 0, 1);
        const progress = smootherstep(rawProgress);
        const lift = Math.sin(Math.PI * progress) * 13 * this.scale;
        const anchor = {
            x: lerp(arm.swingFrom.x, arm.swingTo.x, progress) + (arm.swingNormal.x * lift),
            y: lerp(arm.swingFrom.y, arm.swingTo.y, progress) + (arm.swingNormal.y * lift),
        };

        arm.setAnchor(this.constrainAnchor(root, anchor, arm.l * 0.96));
        arm.tipAngle = arm.tipAngleFrom
            + (shortestAngle(arm.tipAngleFrom, arm.tipAngleTo) * progress);

        if (rawProgress >= 1) {
            arm.state = 'planted';
            arm.setAnchor(this.constrainAnchor(root, arm.swingTo, arm.l * 0.94));
            const edgeHold = arm.edge
                ? 760 + (pseudoRandom((arm.index + 1) * 17.3) * 620)
                : 0;

            arm.edgeHoldUntil = timestamp + edgeHold;
            arm.plantUntil = timestamp + arm.config.plantDuration + edgeHold;
        }
    }

    updateArms(timestamp) {
        const seconds = timestamp / 1000;
        let swinging = this.arms.filter((arm) => arm.state === 'swinging').length;

        this.arms.forEach((arm) => {
            const root = this.rootForConfig(arm.config);
            const lastRoot = arm.lastRoot ?? this.rootForConfig(
                arm.config,
                this.lastBody,
                this.lastHeading,
            );

            if (arm.state === 'swinging') {
                this.updateSwing(arm, root, timestamp);
            } else {
                const strain = distanceBetween(arm.anchor(), root) / arm.l;
                const desired = this.desiredAnchor(arm, root, seconds);
                const edgeHolding = timestamp < (arm.edgeHoldUntil ?? 0);
                const edgeMismatch = !edgeHolding
                    && this.activeEdge
                    && this.edgeRanks.includes(arm.index)
                    && distanceBetween(arm.anchor(), desired) > 44 * this.scale;
                const due = timestamp >= arm.plantUntil;
                const associatedDue = arm.associatedSwingAt > 0
                    && timestamp >= arm.associatedSwingAt;

                if (associatedDue && swinging < 2) {
                    if (Number.isFinite(arm.associatedStep)) {
                        arm.stepIndex = Math.max(arm.stepIndex, arm.associatedStep - 1);
                    }

                    arm.associatedSwingAt = 0;
                    arm.associatedStep = null;
                    this.startSwing(arm, root, timestamp, seconds, false);
                    swinging += 1;
                    this.updateSwing(arm, root, timestamp);
                } else if (
                    strain > (edgeHolding ? 0.95 : 0.88)
                    || edgeMismatch
                    || (due && swinging < 2)
                ) {
                    arm.associatedSwingAt = 0;
                    arm.associatedStep = null;
                    this.startSwing(arm, root, timestamp, seconds, true);
                    swinging += 1;
                    this.updateSwing(arm, root, timestamp);
                }
            }

            arm.move(lastRoot, root);
            arm.lastRoot = { ...root };
            arm.curlAmount = lerp(
                arm.curlAmount ?? 0,
                arm.curlTarget ?? 0,
                0.022,
            );
        });

        this.updateArmPull();
    }

    updateArmPull() {
        const right = vectorAt(this.heading + (Math.PI / 2));
        let lateral = 0;
        let longitudinal = 0;
        let total = 0;

        this.arms.forEach((arm) => {
            const root = this.rootForConfig(arm.config);
            const direction = normalize(arm.x - root.x, arm.y - root.y);
            const tension = clamp(distanceBetween(root, arm.anchor()) / arm.l, 0, 1)
                * (arm.state === 'planted' ? 1 : 0.55);

            lateral += ((direction.x * right.x) + (direction.y * right.y)) * tension;
            longitudinal += ((direction.x * Math.cos(this.heading))
                + (direction.y * Math.sin(this.heading))) * tension;
            total += tension;
        });

        if (total > 0) {
            lateral /= total;
            longitudinal /= total;
        }

        this.armPull.x = lerp(this.armPull.x, longitudinal, 0.055);
        this.armPull.y = lerp(this.armPull.y, lateral, 0.055);
    }

    update(timestamp, elapsed) {
        if (!this.initialized) return;

        const frameScale = clamp(elapsed / (1000 / 60), 0.35, 2.2);

        this.updateBody(frameScale);
        this.updateActiveEdge();
        this.updateArms(timestamp);
        this.inkPhase += 0.0042 * frameScale;
        this.reaction = Math.max(0, this.reaction - (0.028 * frameScale));
    }

    bodyVisual() {
        const speed = Math.hypot(this.velocity.x, this.velocity.y);
        const speedAmount = clamp(speed / Math.max(1, 28 * this.scale), 0, 1);
        const acceleration = speed - this.lastSpeed;
        const forward = vectorAt(this.heading);
        const right = { x: -forward.y, y: forward.x };
        const turn = shortestAngle(this.lastHeading, this.heading);

        return {
            center: this.body,
            forward,
            right,
            phase: this.autonomousPhase,
            inkPhase: this.inkPhase,
            energy: speedAmount,
            reaction: this.reaction,
            length: this.mantleLength * (
                1
                + (speedAmount * 0.14)
                + clamp(acceleration * 0.012, -0.035, 0.055)
                + (this.reaction * 0.025)
            ),
            width: this.mantleWidth * (
                1
                - (speedAmount * 0.075)
                - clamp(acceleration * 0.007, -0.03, 0.035)
                + (this.activeEdge ? 0.025 : 0)
            ),
            bend: clamp(
                (this.armPull.y * 13 * this.scale) + (turn * 38 * this.scale),
                -14 * this.scale,
                14 * this.scale,
            ),
        };
    }

    draw() {
        if (!this.initialized) return;

        this.context.setTransform(this.density, 0, 0, this.density, 0, 0);
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.globalAlpha = 0.99;

        const preparedArms = this.arms
            .map((arm) => this.skin.prepareArm(arm, arm.rootHalfWidth))
            .sort((first, second) => first.arm.config.layer - second.arm.config.layer);

        this.skin.setInkPhase(this.inkPhase);
        preparedArms.forEach((arm) => this.skin.drawArm(arm));
        this.skin.drawWeb(this.body, this.heading);
        preparedArms.forEach((arm) => this.skin.drawRootTentacleLine(arm, this.body));
        this.skin.drawFrontBridge(preparedArms, this.body, this.heading);
        this.skin.drawMantle(this.bodyVisual());
        this.context.globalAlpha = 1;
    }
}

export function createInkOctopusRenderer(canvas, options) {
    return new InkOctopusRenderer(canvas, options);
}
