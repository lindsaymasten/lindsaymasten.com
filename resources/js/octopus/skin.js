const TAU = Math.PI * 2;
const INK = '#171513';
const INK_SOFT = '#24201c';
const INK_DRY = '#352f29';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + ((end - start) * amount);
const smoothstep = (start, end, value) => {
    const amount = clamp((value - start) / Math.max(0.0001, end - start), 0, 1);
    return amount * amount * (3 - (2 * amount));
};
const pointBetween = (first, second, amount) => ({
    x: lerp(first.x, second.x, amount),
    y: lerp(first.y, second.y, amount),
});
const distance = (first, second) => Math.hypot(second.x - first.x, second.y - first.y);
const vectorAt = (angle, length = 1) => ({
    x: Math.cos(angle) * length,
    y: Math.sin(angle) * length,
});
const normalize = (x, y) => {
    const magnitude = Math.max(0.0001, Math.hypot(x, y));
    return { x: x / magnitude, y: y / magnitude };
};
const localPoint = (center, forward, right, along, across) => ({
    x: center.x + (forward.x * along) + (right.x * across),
    y: center.y + (forward.y * along) + (right.y * across),
});
const noise = (seed) => {
    const value = Math.sin((seed + 1.731) * 78.233) * 43758.5453;
    return value - Math.floor(value);
};
const signedNoise = (seed) => (noise(seed) * 2) - 1;
const flowingContour = (progress, seed, phase) => (
    (Math.sin((progress * 19.7) + (seed * 0.031) + (phase * 0.72)) * 0.58)
    + (Math.sin((progress * 43.1) + (seed * 0.017) - (phase * 0.37)) * 0.29)
    + (Math.cos((progress * 71.3) - (seed * 0.009) + (phase * 0.19)) * 0.13)
);

function softenPolyline(points, iterations = 2) {
    let softened = points.map((point) => ({ ...point }));

    for (let iteration = 0; iteration < iterations; iteration += 1) {
        const next = [{ ...softened[0] }];

        for (let index = 0; index < softened.length - 1; index += 1) {
            const first = softened[index];
            const second = softened[index + 1];

            next.push(pointBetween(first, second, 0.25));
            next.push(pointBetween(first, second, 0.75));
        }

        next.push({ ...softened[softened.length - 1] });
        softened = next;
    }

    return softened;
}

function polylineLength(points) {
    return points.slice(1).reduce(
        (total, point, index) => total + distance(points[index], point),
        0,
    );
}

function resamplePolyline(points, count) {
    const cumulative = [0];

    for (let index = 1; index < points.length; index += 1) {
        cumulative.push(cumulative[index - 1] + distance(points[index - 1], points[index]));
    }

    const total = Math.max(0.0001, cumulative[cumulative.length - 1]);
    const result = [];
    let segment = 1;

    for (let index = 0; index < count; index += 1) {
        const target = total * (index / Math.max(1, count - 1));

        while (segment < cumulative.length - 1 && cumulative[segment] < target) {
            segment += 1;
        }

        const startDistance = cumulative[segment - 1];
        const endDistance = cumulative[segment];
        const amount = (target - startDistance) / Math.max(0.0001, endDistance - startDistance);

        result.push(pointBetween(points[segment - 1], points[segment], amount));
    }

    return result;
}

function shapeTerminalCurve(points, tipAngle) {
    if (!Number.isFinite(tipAngle) || points.length < 9) return points;

    const shaped = points.map((point) => ({ ...point }));
    const startIndex = Math.floor((points.length - 1) * 0.72);
    const start = points[startIndex];
    const before = points[Math.max(0, startIndex - 2)];
    const end = points[points.length - 1];
    const span = Math.max(1, distance(start, end));
    const startTangent = normalize(start.x - before.x, start.y - before.y);
    const chordAngle = Math.atan2(end.y - start.y, end.x - start.x);
    const requestedTurn = Math.atan2(
        Math.sin(tipAngle - chordAngle),
        Math.cos(tipAngle - chordAngle),
    );
    const endTangent = vectorAt(chordAngle + clamp(requestedTurn, -1.08, 1.08));
    const startMagnitude = span * 0.76;
    const endMagnitude = span * 0.25;

    for (let index = startIndex; index < points.length; index += 1) {
        const amount = (index - startIndex) / Math.max(1, points.length - 1 - startIndex);
        const squared = amount * amount;
        const cubed = squared * amount;
        const startWeight = (2 * cubed) - (3 * squared) + 1;
        const startTangentWeight = cubed - (2 * squared) + amount;
        const endWeight = (-2 * cubed) + (3 * squared);
        const endTangentWeight = cubed - squared;

        shaped[index] = {
            x: (startWeight * start.x)
                + (startTangentWeight * startTangent.x * startMagnitude)
                + (endWeight * end.x)
                + (endTangentWeight * endTangent.x * endMagnitude),
            y: (startWeight * start.y)
                + (startTangentWeight * startTangent.y * startMagnitude)
                + (endWeight * end.y)
                + (endTangentWeight * endTangent.y * endMagnitude),
        };
    }

    return shaped;
}

function shapeOccasionalCurl(points, curlAmount = 0, curlDirection = 1, broadCurl = false) {
    const amount = clamp(curlAmount, 0, 1);

    if (amount < 0.01 || points.length < 12) return points;

    const shaped = points.map((point) => ({ ...point }));
    const startIndex = Math.floor((points.length - 1) * (broadCurl ? 0.44 : 0.61));
    const start = points[startIndex];
    const next = points[Math.min(points.length - 1, startIndex + 2)];
    const startTangent = Math.atan2(next.y - start.y, next.x - start.x);
    const tail = points.slice(startIndex);
    const tailLength = Math.max(1, polylineLength(tail));
    const stepLength = tailLength / Math.max(1, tail.length - 1);
    const direction = curlDirection < 0 ? -1 : 1;
    const totalTurn = Math.PI * (broadCurl ? 1.72 : 1.38);
    const curled = [{ ...start }];

    for (let index = 1; index < tail.length; index += 1) {
        const progress = index / Math.max(1, tail.length - 1);
        const turn = direction * totalTurn * (progress ** 1.38);
        const taper = 1 - ((broadCurl ? 0.46 : 0.36) * progress);
        const previous = curled[index - 1];

        curled.push({
            x: previous.x + (Math.cos(startTangent + turn) * stepLength * taper),
            y: previous.y + (Math.sin(startTangent + turn) * stepLength * taper),
        });
    }

    for (let index = startIndex; index < points.length; index += 1) {
        const progress = (index - startIndex) / Math.max(1, points.length - 1 - startIndex);
        const blend = amount * smoothstep(0, 0.17, progress);

        shaped[index] = pointBetween(points[index], curled[index - startIndex], blend);
    }

    return shaped;
}

function armFrames(points, halfWidth, scale, arm) {
    const terminalCurve = shapeTerminalCurve(
        resamplePolyline(softenPolyline(points), 58),
        arm.tipAngle,
    );
    const centerline = shapeOccasionalCurl(
        terminalCurve,
        arm.curlAmount,
        arm.curlDirection,
        arm.index === 3 || arm.index === 4,
    );

    return centerline.map((point, index) => {
        const previous = centerline[Math.max(0, index - 1)];
        const next = centerline[Math.min(centerline.length - 1, index + 1)];
        const progress = index / Math.max(1, centerline.length - 1);
        const tangent = Math.atan2(next.y - previous.y, next.x - previous.x);
        const normal = vectorAt(tangent + (Math.PI / 2));
        const rootFlare = 1 + (0.12 * (1 - smoothstep(0, 0.24, progress)));
        const taper = 1 - (0.78 * (progress ** 1.54));
        const pulse = 1 + (Math.sin((progress * 11.5) + arm.config.phase) * 0.022);
        const width = Math.max(2.2 * scale, halfWidth * rootFlare * taper * pulse);

        return { point, tangent, normal, width, progress };
    });
}

function traceSmoothPath(context, points, close = false) {
    if (points.length === 0) return;

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    for (let index = 1; index < points.length - 1; index += 1) {
        const midpoint = pointBetween(points[index], points[index + 1], 0.5);
        context.quadraticCurveTo(points[index].x, points[index].y, midpoint.x, midpoint.y);
    }

    const last = points[points.length - 1];
    context.lineTo(last.x, last.y);

    if (close) context.closePath();
}

function traceArm(context, frames, seed, scale, inkPhase = 0) {
    const left = [];
    const right = [];

    frames.forEach((frame, index) => {
        const progress = index / Math.max(1, frames.length - 1);
        const leftContour = flowingContour(progress, seed, inkPhase)
            * (1.35 + (0.9 * scale));
        const rightContour = flowingContour(progress, seed + 127, inkPhase + 1.7)
            * (1.35 + (0.9 * scale));
        const pressure = 1 + (
            Math.sin((progress * 8.2) + (seed * 0.013) - (inkPhase * 0.24))
            * 0.045
        );
        const leftWidth = Math.max(1.6 * scale, (frame.width * pressure) + leftContour);
        const rightWidth = Math.max(1.6 * scale, (frame.width * pressure) + rightContour);

        left.push({
            x: frame.point.x + (frame.normal.x * leftWidth),
            y: frame.point.y + (frame.normal.y * leftWidth),
        });
        right.push({
            x: frame.point.x - (frame.normal.x * rightWidth),
            y: frame.point.y - (frame.normal.y * rightWidth),
        });
    });

    traceSmoothPath(context, [...left, ...right.reverse()], true);
}

function traceMantle(context, visual, scale) {
    const left = [];
    const right = [];
    const samples = 34;

    for (let index = 0; index <= samples; index += 1) {
        const progress = index / samples;
        const profile = progress < 0.72
            ? lerp(0.58, 1, smoothstep(0, 0.62, progress))
            : Math.sqrt(Math.max(0, 1 - (((progress - 0.72) / 0.28) ** 2)));
        const asymmetry = Math.sin((progress * 4.9) + visual.phase) * 0.045;
        const bend = visual.bend * (Math.sin(progress * Math.PI) ** 1.3);
        const along = (4 * scale) + (visual.length * progress);
        const leftWidth = visual.width * profile * (1 + asymmetry);
        const rightWidth = visual.width * profile * (1 - (asymmetry * 0.66));
        const contour = flowingContour(progress, 8100, visual.inkPhase)
            * 2.15
            * scale;
        const opposingContour = flowingContour(progress, 9100, visual.inkPhase + 2.2)
            * 2.15
            * scale;

        left.push(localPoint(
            visual.center,
            visual.forward,
            visual.right,
            along + (Math.sin((progress * 16) + visual.inkPhase) * 0.7 * scale),
            -leftWidth + bend - contour,
        ));
        right.push(localPoint(
            visual.center,
            visual.forward,
            visual.right,
            along + (Math.cos((progress * 14) - visual.inkPhase) * 0.7 * scale),
            rightWidth + bend + opposingContour,
        ));
    }

    traceSmoothPath(context, [...left, ...right.reverse()], true);
}

function drawIrregularOval(context, center, rotation, radiusX, radiusY, seed) {
    const points = Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * TAU;
        const wobble = 1 + (signedNoise(seed + (index * 3.7)) * 0.11);
        const x = Math.cos(angle) * radiusX * wobble;
        const y = Math.sin(angle) * radiusY * wobble;

        return {
            x: center.x + (x * Math.cos(rotation)) - (y * Math.sin(rotation)),
            y: center.y + (x * Math.sin(rotation)) + (y * Math.cos(rotation)),
        };
    });

    traceSmoothPath(context, points, true);
}

export class InkSkin {
    constructor(context) {
        this.context = context;
        this.scale = 1;
        this.inkPhase = 0;
    }

    setScale(scale) {
        this.scale = scale;
    }

    setInkPhase(phase) {
        this.inkPhase = phase;
    }

    prepareArm(arm, halfWidth) {
        return {
            arm,
            frames: armFrames(arm.pointsFromBody(), halfWidth, this.scale, arm),
        };
    }

    drawArm(prepared) {
        const { arm, frames } = prepared;
        const seed = 1000 + (arm.index * 311);

        this.context.save();
        if ('filter' in this.context) {
            this.context.filter = `blur(${1.25 * this.scale}px)`;
        }
        this.context.globalAlpha = 0.38;
        traceArm(this.context, frames, seed, this.scale, this.inkPhase + 0.2);
        this.context.fillStyle = INK;
        this.context.fill();
        this.context.restore();

        this.context.save();
        traceArm(this.context, frames, seed, this.scale, this.inkPhase);
        this.context.fillStyle = arm.index % 3 === 0 ? INK_SOFT : INK;
        this.context.fill();

        traceArm(this.context, frames, seed, this.scale, this.inkPhase);
        this.context.clip();
        this.drawArmDryBrush(frames, seed);
        this.context.restore();

        this.drawInkBeads(frames, seed);
        this.drawSuckers(arm, frames, seed);
    }

    drawInkBeads(frames, seed) {
        this.context.save();
        this.context.fillStyle = INK;

        for (let index = 7; index < frames.length - 3; index += 9) {
            const frame = frames[index];
            const side = signedNoise(seed + (index * 5)) < 0 ? -1 : 1;
            const pulse = 0.78 + (
                Math.sin(this.inkPhase + (index * 0.61) + seed) * 0.22
            );
            const radius = (0.65 + (noise(seed + index) * 1.35)) * this.scale * pulse;
            const offset = (frame.width + (radius * 0.45)) * side;
            const center = {
                x: frame.point.x + (frame.normal.x * offset),
                y: frame.point.y + (frame.normal.y * offset),
            };

            this.context.beginPath();
            this.context.arc(center.x, center.y, radius, 0, TAU);
            this.context.globalAlpha = 0.56 + (noise(seed + index + 3) * 0.4);
            this.context.fill();
        }

        this.context.restore();
    }

    drawArmDryBrush(frames, seed) {
        this.context.save();
        this.context.globalCompositeOperation = 'destination-out';
        this.context.lineCap = 'round';

        for (let lane = -1; lane <= 1; lane += 1) {
            const offsetFactor = lane * 0.31;
            const start = 5 + ((lane + 1) * 3);
            const points = frames.slice(start, frames.length - 4).map((frame, index) => {
                const skip = 0.58 + (noise(seed + (index * 7) + lane) * 0.42);
                const flow = Math.sin(
                    this.inkPhase
                    + (index * 0.22)
                    + (lane * 1.7)
                    + (seed * 0.01),
                ) * 0.075;
                return {
                    x: frame.point.x
                        + (frame.normal.x * frame.width * (offsetFactor + flow) * skip),
                    y: frame.point.y
                        + (frame.normal.y * frame.width * (offsetFactor + flow) * skip),
                };
            });

            traceSmoothPath(this.context, points);
            this.context.globalAlpha = lane === 0 ? 0.16 : 0.24;
            this.context.lineWidth = (lane === 0 ? 1.6 : 0.9) * this.scale;
            this.context.stroke();
        }

        for (let index = 5; index < frames.length - 4; index += 6) {
            const frame = frames[index];
            const across = signedNoise(seed + (index * 17)) * frame.width * 0.55;
            const length = (2.2 + (noise(seed + index) * 5.4)) * this.scale;
            const center = {
                x: frame.point.x + (frame.normal.x * across),
                y: frame.point.y + (frame.normal.y * across),
            };

            this.context.beginPath();
            this.context.moveTo(
                center.x - (Math.cos(frame.tangent) * length),
                center.y - (Math.sin(frame.tangent) * length),
            );
            this.context.lineTo(
                center.x + (Math.cos(frame.tangent) * length),
                center.y + (Math.sin(frame.tangent) * length),
            );
            this.context.globalAlpha = 0.18 + (noise(seed + index + 9) * 0.36);
            this.context.lineWidth = (0.45 + (noise(seed + index + 3) * 1.2)) * this.scale;
            this.context.stroke();
        }

        this.context.restore();
    }

    drawSuckers(arm, frames, seed) {
        this.context.save();
        this.context.globalCompositeOperation = 'destination-out';
        this.context.strokeStyle = '#000';
        this.context.lineCap = 'round';

        for (let index = 9; index < frames.length - 2; index += 3) {
            const frame = frames[index];
            if (frame.width < 3.1 * this.scale) continue;

            const side = arm.config.suckerSide;
            const offset = frame.width * (0.57 + (signedNoise(seed + index) * 0.055)) * side;
            const center = {
                x: frame.point.x + (frame.normal.x * offset),
                y: frame.point.y + (frame.normal.y * offset),
            };
            const radius = clamp(frame.width * 0.25, 1.05 * this.scale, 3.7 * this.scale);
            const stretch = 1.1 + (noise(seed + (index * 2)) * 0.36);

            drawIrregularOval(
                this.context,
                center,
                frame.tangent + (signedNoise(seed + index + 4) * 0.17),
                radius * stretch,
                radius * 0.72,
                seed + (index * 29),
            );
            this.context.globalAlpha = 0.78 + (noise(seed + index) * 0.2);
            this.context.lineWidth = clamp(radius * 0.5, 0.8, 1.8) * this.scale;
            this.context.stroke();
        }

        this.context.restore();
    }

    drawWeb(center, heading) {
        const forward = vectorAt(heading);
        const right = { x: -forward.y, y: forward.x };
        const points = Array.from({ length: 28 }, (_, index) => {
            const angle = (index / 28) * TAU;
            const flow = Math.sin((index * 1.43) + (this.inkPhase * 0.66)) * 3.1;
            const radius = (
                44
                + flow
                + (signedNoise(2200 + (index * 9)) * 4.8)
            ) * this.scale;
            const along = Math.cos(angle) * radius * 0.88;
            const across = Math.sin(angle) * radius;

            return localPoint(center, forward, right, along, across);
        });

        this.context.save();
        if ('filter' in this.context) {
            this.context.filter = `blur(${1.8 * this.scale}px)`;
        }
        this.context.globalAlpha = 0.42;
        traceSmoothPath(this.context, points, true);
        this.context.fillStyle = INK;
        this.context.fill();
        this.context.restore();

        traceSmoothPath(this.context, points, true);
        this.context.fillStyle = INK;
        this.context.fill();
    }

    drawRootTentacleLine(prepared, center) {
        const { frames, arm } = prepared;
        if (frames.length < 8) return;

        const start = pointBetween(center, frames[0].point, 0.78);
        const points = [
            start,
            ...frames.slice(0, 8).map((frame) => frame.point),
        ];
        const rootWidth = frames[0].width * (1.98 + ((arm.index % 3) * 0.035));

        this.context.save();
        this.context.lineCap = 'round';
        this.context.lineJoin = 'round';
        if ('filter' in this.context) {
            this.context.filter = `blur(${1.4 * this.scale}px)`;
        }
        this.context.globalAlpha = 0.46;
        traceSmoothPath(this.context, points);
        this.context.strokeStyle = INK;
        this.context.lineWidth = rootWidth * 1.08;
        this.context.stroke();
        this.context.restore();

        this.context.save();
        this.context.lineCap = 'round';
        this.context.lineJoin = 'round';
        traceSmoothPath(this.context, points);
        this.context.strokeStyle = arm.index % 3 === 0 ? INK_SOFT : INK;
        this.context.lineWidth = rootWidth * 0.96;
        this.context.stroke();
        this.context.restore();
    }

    drawFrontBridge() {
        // The irregular web provides the shared gestural bridge between arms.
    }

    drawMantle(visual) {
        this.context.save();
        if ('filter' in this.context) {
            this.context.filter = `blur(${1.9 * this.scale}px)`;
        }
        this.context.globalAlpha = 0.46;
        traceMantle(this.context, visual, this.scale);
        this.context.fillStyle = INK;
        this.context.fill();
        this.context.restore();

        this.context.save();
        traceMantle(this.context, visual, this.scale);
        this.context.fillStyle = INK;
        this.context.fill();

        traceMantle(this.context, visual, this.scale);
        this.context.clip();
        this.drawMantleTexture(visual);
        this.context.restore();

        this.drawEyes(visual);
        this.drawSplatter(visual);
    }

    drawMantleTexture(visual) {
        const heading = Math.atan2(visual.forward.y, visual.forward.x);

        this.context.save();
        this.context.globalCompositeOperation = 'destination-out';
        this.context.lineCap = 'round';

        for (let index = 0; index < 13; index += 1) {
            const progress = 0.12 + (index * 0.058);
            const center = localPoint(
                visual.center,
                visual.forward,
                visual.right,
                visual.length * progress,
                (visual.bend * Math.sin(progress * Math.PI))
                    + (
                        Math.sin(visual.inkPhase + (index * 0.78))
                        * 1.45
                        * this.scale
                    ),
            );
            const radiusX = (
                4
                + (noise(3400 + index) * 13)
                + (Math.sin((visual.inkPhase * 0.8) + index) * 1.2)
            ) * this.scale;
            const radiusY = (0.5 + (noise(3500 + index) * 1.4)) * this.scale;

            drawIrregularOval(
                this.context,
                center,
                heading + (signedNoise(3600 + index) * 0.23),
                radiusX,
                radiusY,
                3700 + index,
            );
            this.context.globalAlpha = 0.08 + (noise(3800 + index) * 0.27);
            this.context.fill();
        }

        for (let index = 0; index < 56; index += 1) {
            const progress = 0.08 + (noise(4300 + index) * 0.84);
            const widthAtPoint = visual.width * (Math.sin(progress * Math.PI) ** 0.55);
            const across = signedNoise(4400 + index) * widthAtPoint * 0.78;
            const flow = Math.sin((visual.inkPhase * 0.62) + (index * 1.37))
                * 1.2
                * this.scale;
            const center = localPoint(
                visual.center,
                visual.forward,
                visual.right,
                visual.length * progress,
                across + flow + (visual.bend * Math.sin(progress * Math.PI)),
            );
            const radius = (0.3 + (noise(4500 + index) * 1.05)) * this.scale;

            this.context.beginPath();
            this.context.arc(center.x, center.y, radius, 0, TAU);
            this.context.globalAlpha = 0.12 + (noise(4600 + index) * 0.42);
            this.context.fill();
        }

        this.context.restore();
    }

    drawEyes(visual) {
        const heading = Math.atan2(visual.forward.y, visual.forward.x);
        const eyeAlong = 4 * this.scale;
        const eyeAcross = 22.5 * this.scale;

        [-1, 1].forEach((side, index) => {
            const center = localPoint(
                visual.center,
                visual.forward,
                visual.right,
                eyeAlong + (index * 1.8 * this.scale),
                eyeAcross * side,
            );
            const radiusX = (10.2 + (index * 0.9)) * this.scale;
            const radiusY = (5.1 - (index * 0.35)) * this.scale;

            this.context.save();
            this.context.globalCompositeOperation = 'destination-out';
            drawIrregularOval(
                this.context,
                center,
                heading + (side * 0.08),
                radiusX,
                radiusY,
                5200 + (index * 100),
            );
            this.context.fill();
            this.context.restore();

            const pupil = localPoint(
                center,
                visual.forward,
                visual.right,
                radiusX * 0.13,
                side * radiusY * 0.08,
            );

            this.context.beginPath();
            this.context.ellipse(
                pupil.x,
                pupil.y,
                radiusY * 0.34,
                radiusY * 0.54,
                heading + (side * 0.13),
                0,
                TAU,
            );
            this.context.fillStyle = INK_DRY;
            this.context.fill();
        });
    }

    drawSplatter(visual) {
        const intensity = clamp(visual.energy + (visual.reaction * 0.65), 0.12, 1.2);
        const count = 8 + Math.round(intensity * 8);
        const trailing = {
            x: -visual.forward.x,
            y: -visual.forward.y,
        };

        this.context.save();
        this.context.fillStyle = INK;

        for (let index = 0; index < count; index += 1) {
            const side = signedNoise(6500 + index);
            const distanceAlong = (42 + (noise(6600 + index) * 94)) * this.scale;
            const distanceAcross = side * (28 + (noise(6700 + index) * 78)) * this.scale;
            const center = {
                x: visual.center.x
                    + (trailing.x * distanceAlong)
                    + (visual.right.x * distanceAcross),
                y: visual.center.y
                    + (trailing.y * distanceAlong)
                    + (visual.right.y * distanceAcross),
            };
            const radius = (0.45 + (noise(6800 + index) * 1.65)) * this.scale * intensity;

            this.context.beginPath();
            this.context.arc(center.x, center.y, radius, 0, TAU);
            this.context.globalAlpha = 0.32 + (noise(6900 + index) * 0.6);
            this.context.fill();
        }

        this.context.restore();
    }
}
