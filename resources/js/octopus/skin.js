import { MANTLE_TILES } from './mantle-template.js';

const TAU = Math.PI * 2;
const TILE_WHITE = '#fff8e8';
const GROUT = '#e7d7ba';
const EYE_BLACK = '#17110e';
const TILE_SIZE = 6;
const TILE_STEP = 6.45;
// The animated splines place one consistent tessera scale. A small set of
// authored pieces is cut at tight joins; there are no silhouette fills or
// clipping masks in this renderer.
const TILE_COLORS = [
    '#681b16',
    '#761f19',
    '#84241c',
    '#92291f',
    '#a03225',
    '#ad3c2a',
    '#b84a31',
];
const MANTLE_PROFILE = [
    [0, 0.64],
    [0.1, 0.72],
    [0.23, 0.84],
    [0.4, 0.96],
    [0.56, 1],
    [0.68, 1],
    [0.78, 0.94],
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + ((end - start) * amount);
const pointBetween = (first, second, amount) => ({
    x: lerp(first.x, second.x, amount),
    y: lerp(first.y, second.y, amount),
});
const distance = (first, second) => Math.hypot(second.x - first.x, second.y - first.y);
const smoothstep = (start, end, value) => {
    const amount = clamp((value - start) / Math.max(0.0001, end - start), 0, 1);
    return amount * amount * (3 - (2 * amount));
};
const vectorAt = (angle, length = 1) => ({
    x: Math.cos(angle) * length,
    y: Math.sin(angle) * length,
});
const normalize = (x, y) => {
    const magnitude = Math.max(0.0001, Math.hypot(x, y));
    return { x: x / magnitude, y: y / magnitude };
};

function colorFor(seed) {
    const value = Math.abs(Math.sin((seed + 1) * 91.733) * 10000);
    return TILE_COLORS[Math.floor(value) % TILE_COLORS.length];
}

function variation(seed, amplitude) {
    return ((Math.abs(Math.sin((seed + 7) * 37.719)) % 1) - 0.5) * amplitude;
}

function mantleProfile(progress) {
    const amount = clamp(progress, 0, 1);

    if (amount >= 0.78) {
        const cap = (amount - 0.78) / 0.22;
        return 0.95 * Math.sqrt(Math.max(0, 1 - (cap ** 2)));
    }

    for (let index = 1; index < MANTLE_PROFILE.length; index += 1) {
        const [endProgress, endWidth] = MANTLE_PROFILE[index];

        if (amount <= endProgress) {
            const [startProgress, startWidth] = MANTLE_PROFILE[index - 1];
            return lerp(
                startWidth,
                endWidth,
                smoothstep(startProgress, endProgress, amount),
            );
        }
    }

    return MANTLE_PROFILE[MANTLE_PROFILE.length - 1][1];
}

function localPoint(center, forward, right, along, across) {
    return {
        x: center.x + (forward.x * along) + (right.x * across),
        y: center.y + (forward.y * along) + (right.y * across),
    };
}

function drawTile(context, center, angle, fill, scale, cut = null) {
    const half = (TILE_SIZE * scale) / 2;
    const along = vectorAt(angle, half * (cut?.length ?? 1));
    const acrossAngle = angle + (Math.PI / 2);
    const startAcross = vectorAt(acrossAngle, half * (cut?.startWidth ?? 1));
    const endAcross = vectorAt(acrossAngle, half * (cut?.endWidth ?? 1));
    const points = [
        {
            x: center.x - along.x - startAcross.x,
            y: center.y - along.y - startAcross.y,
        },
        {
            x: center.x + along.x - endAcross.x,
            y: center.y + along.y - endAcross.y,
        },
        {
            x: center.x + along.x + endAcross.x,
            y: center.y + along.y + endAcross.y,
        },
        {
            x: center.x - along.x + startAcross.x,
            y: center.y - along.y + startAcross.y,
        },
    ];

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = GROUT;
    context.lineWidth = 0.56 * scale;
    context.lineJoin = 'round';
    context.stroke();
}

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
        const target = total * (index / (count - 1));

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

function drawTilePath(
    context,
    points,
    fill,
    scale,
    seedOffset = 0,
    closed = false,
    cutFor = null,
) {
    if (points.length === 0) return;

    if (points.length === 1) {
        const tileFill = typeof fill === 'function' ? fill(seedOffset, 0) : fill;
        drawTile(context, points[0], 0, tileFill, scale);
        return;
    }

    const source = closed ? [...points, points[0]] : points;
    const segments = Math.max(
        1,
        Math.round(polylineLength(source) / (TILE_STEP * scale)),
    );
    const sampled = resamplePolyline(source, segments + 1);
    const tileCount = closed ? segments : segments + 1;

    for (let index = 0; index < tileCount; index += 1) {
        const previous = closed
            ? sampled[index === 0 ? tileCount - 1 : index - 1]
            : sampled[Math.max(0, index - 1)];
        const next = closed
            ? sampled[index === tileCount - 1 ? 0 : index + 1]
            : sampled[Math.min(tileCount - 1, index + 1)];
        const seed = seedOffset + (index * 17);
        const tileFill = typeof fill === 'function' ? fill(seed, index) : fill;
        const cut = typeof cutFor === 'function'
            ? cutFor(index, tileCount)
            : cutFor;
        const angle = Math.atan2(next.y - previous.y, next.x - previous.x)
            + variation(seed + 5, 0.035);

        drawTile(context, sampled[index], angle, tileFill, scale, cut);
    }
}

function quadraticCurve(start, control, end, count = 17) {
    return Array.from({ length: count }, (_, index) => {
        const progress = index / (count - 1);
        const inverse = 1 - progress;

        return {
            x: (inverse * inverse * start.x)
                + (2 * inverse * progress * control.x)
                + (progress * progress * end.x),
            y: (inverse * inverse * start.y)
                + (2 * inverse * progress * control.y)
                + (progress * progress * end.y),
        };
    });
}

function ellipsePath(center, forward, right, alongRadius, acrossRadius, count = 72) {
    return Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * TAU;

        return localPoint(
            center,
            forward,
            right,
            Math.cos(angle) * alongRadius,
            Math.sin(angle) * acrossRadius,
        );
    });
}

function authoredLocalPath(center, forward, right, coordinates, scale) {
    return coordinates.map(([along, across]) => localPoint(
        center,
        forward,
        right,
        along * scale,
        across * scale,
    ));
}

function centerOutOffsets(maximum, step) {
    const offsets = [0];
    const count = Math.floor(maximum / step);

    for (let index = 1; index <= count; index += 1) {
        offsets.push(-index * step, index * step);
    }

    return offsets;
}

function shapeTerminalCurve(points, tipAngle) {
    if (!Number.isFinite(tipAngle) || points.length < 9) return points;

    const shaped = points.map((point) => ({ ...point }));
    const startIndex = Math.floor((points.length - 1) * 0.74);
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
    const endTangent = vectorAt(chordAngle + clamp(requestedTurn, -0.96, 0.96));
    const startMagnitude = span * 0.72;
    const endMagnitude = span * 0.28;

    for (let index = startIndex; index < points.length; index += 1) {
        const amount = (index - startIndex) / Math.max(1, points.length - 1 - startIndex);
        const amountSquared = amount * amount;
        const amountCubed = amountSquared * amount;
        const startWeight = (2 * amountCubed) - (3 * amountSquared) + 1;
        const startTangentWeight = amountCubed - (2 * amountSquared) + amount;
        const endWeight = (-2 * amountCubed) + (3 * amountSquared);
        const endTangentWeight = amountCubed - amountSquared;

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

function shapeOccasionalCurl(
    points,
    curlAmount = 0,
    curlDirection = 1,
    broadCurl = false,
) {
    const amount = clamp(curlAmount, 0, 1);

    if (amount < 0.01 || points.length < 12) return points;

    const shaped = points.map((point) => ({ ...point }));
    const startIndex = Math.floor((points.length - 1) * (broadCurl ? 0.46 : 0.64));
    const start = points[startIndex];
    const next = points[Math.min(points.length - 1, startIndex + 2)];
    const startTangent = Math.atan2(next.y - start.y, next.x - start.x);
    const tail = points.slice(startIndex);
    const tailLength = Math.max(1, polylineLength(tail));
    const stepLength = tailLength / Math.max(1, tail.length - 1);
    const direction = curlDirection < 0 ? -1 : 1;
    const totalTurn = Math.PI * (broadCurl ? 1.58 : 1.22);
    const curled = [{ ...start }];

    for (let index = 1; index < tail.length; index += 1) {
        const progress = index / Math.max(1, tail.length - 1);
        const turn = direction * totalTurn * (progress ** 1.42);
        const taper = 1 - ((broadCurl ? 0.43 : 0.34) * progress);
        const previous = curled[index - 1];

        curled.push({
            x: previous.x + (Math.cos(startTangent + turn) * stepLength * taper),
            y: previous.y + (Math.sin(startTangent + turn) * stepLength * taper),
        });
    }

    for (let index = startIndex; index < points.length; index += 1) {
        const progress = (index - startIndex) / Math.max(1, points.length - 1 - startIndex);
        const blend = amount * smoothstep(0, 0.16, progress);
        const curlPoint = curled[index - startIndex];

        shaped[index] = pointBetween(points[index], curlPoint, blend);
    }

    return shaped;
}

function armFrames(points, halfWidth, scale, arm) {
    const terminalCurve = shapeTerminalCurve(
        resamplePolyline(softenPolyline(points), 55),
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
        const progress = index / (centerline.length - 1);
        const tangent = Math.atan2(next.y - previous.y, next.x - previous.x);
        const normal = vectorAt(tangent + (Math.PI / 2));
        const rootFlare = 1 + (0.04 * (1 - smoothstep(0, 0.2, progress)));
        const taper = 1 - (0.66 * (progress ** 1.7));
        const width = Math.max(5.1 * scale, halfWidth * rootFlare * taper);

        return { point, tangent, normal, width, progress };
    });
}

export class MosaicSkin {
    constructor(context) {
        this.context = context;
        this.scale = 1;
    }

    setScale(scale) {
        this.scale = scale;
    }

    prepareArm(arm, halfWidth) {
        return {
            arm,
            frames: armFrames(arm.pointsFromBody(), halfWidth, this.scale, arm),
        };
    }

    drawArm(prepared) {
        const { arm, frames } = prepared;
        const step = TILE_STEP * this.scale;
        const halfDiagonal = (TILE_SIZE * this.scale) / Math.sqrt(2);
        const maximumWidth = Math.max(...frames.map((frame) => frame.width));
        const offsets = centerOutOffsets(maximumWidth - halfDiagonal, step);

        offsets.forEach((offset, lane) => {
            const points = frames
                .filter((frame) => Math.abs(offset) + halfDiagonal <= frame.width)
                .map((frame) => ({
                    x: frame.point.x + (frame.normal.x * offset),
                    y: frame.point.y + (frame.normal.y * offset),
                }));

            if (points.length === 0) return;

            drawTilePath(
                this.context,
                points,
                (seed) => colorFor(seed),
                this.scale,
                (arm.index * 10000) + (lane * 601),
            );
        });

        this.drawTentacleLine(arm, frames);
    }

    tentacleLinePoint(arm, frame) {
        const offset = frame.width * 0.53 * arm.config.suckerSide;

        return {
            x: frame.point.x + (frame.normal.x * offset),
            y: frame.point.y + (frame.normal.y * offset),
        };
    }

    drawTentacleLine(arm, frames, startIndex = 0, endIndex = frames.length - 1) {
        const firstIndex = clamp(startIndex, 0, frames.length - 2);
        const lastIndex = clamp(endIndex, firstIndex + 1, frames.length - 1);
        const points = frames
            .slice(firstIndex, lastIndex + 1)
            .map((frame) => this.tentacleLinePoint(arm, frame));

        drawTilePath(
            this.context,
            points,
            TILE_WHITE,
            this.scale,
            70000 + (arm.index * 1000) + firstIndex,
        );
    }

    drawRootTentacleLine(prepared) {
        this.drawTentacleLine(
            prepared.arm,
            prepared.frames,
            0,
            Math.min(8, prepared.frames.length - 1),
        );
    }

    drawFrontBridge(preparedArms, center, heading) {
        const first = preparedArms.find(({ arm }) => arm.index === 3);
        const second = preparedArms.find(({ arm }) => arm.index === 4);

        if (!first || !second) return;

        const firstFrame = first.frames[Math.min(2, first.frames.length - 1)];
        const secondFrame = second.frames[Math.min(2, second.frames.length - 1)];
        const start = this.tentacleLinePoint(first.arm, firstFrame);
        const end = this.tentacleLinePoint(second.arm, secondFrame);
        const forward = vectorAt(heading);
        const right = { x: -forward.y, y: forward.x };
        const control = localPoint(center, forward, right, -47 * this.scale, 0);

        drawTilePath(
            this.context,
            quadraticCurve(start, control, end),
            TILE_WHITE,
            this.scale,
            78000,
        );
    }

    drawWeb(center, heading) {
        const forward = vectorAt(heading);
        const right = { x: -forward.y, y: forward.x };
        const step = TILE_STEP * this.scale;
        const focus = localPoint(center, forward, right, 4 * this.scale, 0);

        drawTile(this.context, focus, heading, colorFor(12000), this.scale);

        for (let ring = 1; ring <= 9; ring += 1) {
            const loopCenter = localPoint(
                focus,
                forward,
                right,
                -ring * 0.65 * this.scale,
                Math.sin(ring * 0.71) * 0.55 * this.scale,
            );
            const path = ellipsePath(
                loopCenter,
                forward,
                right,
                Math.min(48 * this.scale, ring * step * 0.9),
                Math.min(53 * this.scale, ring * step),
            );

            drawTilePath(
                this.context,
                path,
                (seed) => colorFor(seed),
                this.scale,
                12000 + (ring * 701),
                true,
            );
        }
    }

    mantlePoint(visual, across, progress) {
        const profile = mantleProfile(progress);
        const halfWidth = visual.width * profile;
        const along = (8 * this.scale) + (visual.length * progress);
        const bend = visual.bend * (Math.sin(Math.PI * progress) ** 1.25);

        return localPoint(
            visual.center,
            visual.forward,
            visual.right,
            along,
            (halfWidth * across) + bend,
        );
    }

    mantleTemplatePoint(visual, across, progress) {
        const along = (8 * this.scale) + (visual.length * progress);
        const bend = visual.bend * (Math.sin(Math.PI * progress) ** 1.25);

        return localPoint(
            visual.center,
            visual.forward,
            visual.right,
            along,
            (visual.width * across) + bend,
        );
    }

    drawMantle(visual) {
        const heading = Math.atan2(visual.forward.y, visual.forward.x);

        MANTLE_TILES.forEach(([progress, across, localAngle, cutClass], index) => {
            const seed = 14000 + (index * 37);
            let cut = null;

            if (cutClass === 1) {
                cut = index % 2 === 0
                    ? { length: 0.82, startWidth: 0.72, endWidth: 0.94 }
                    : { length: 0.82, startWidth: 0.94, endWidth: 0.72 };
            } else if (cutClass === 2) {
                cut = index % 2 === 0
                    ? { length: 0.66, startWidth: 0.5, endWidth: 0.86 }
                    : { length: 0.66, startWidth: 0.86, endWidth: 0.5 };
            }

            drawTile(
                this.context,
                this.mantleTemplatePoint(visual, across, progress),
                heading + localAngle + variation(seed, 0.008),
                colorFor(seed),
                this.scale,
                cut,
            );
        });

        const edgeSamples = 36;
        const leftEdge = Array.from({ length: edgeSamples + 1 }, (_, index) => (
            this.mantlePoint(visual, -1, index / edgeSamples)
        ));
        const rightEdge = Array.from({ length: edgeSamples + 1 }, (_, index) => (
            this.mantlePoint(visual, 1, index / edgeSamples)
        ));

        drawTilePath(this.context, leftEdge, TILE_WHITE, this.scale, 41000);
        drawTilePath(this.context, rightEdge, TILE_WHITE, this.scale, 43000);
        this.drawEyeConnections(visual);
        this.drawEyes(visual);
    }

    drawEyeConnections(visual) {
        const eyeAcross = 28.5 * this.scale;
        const innerLowerEnds = [];

        [-1, 1].forEach((side) => {
            const eyeCenter = localPoint(
                visual.center,
                visual.forward,
                visual.right,
                0,
                eyeAcross * side,
            );
            const mantleAnchor = this.mantlePoint(visual, side, 0.025);
            const eyeTopOuter = localPoint(
                eyeCenter,
                visual.forward,
                visual.right,
                20.5 * this.scale,
                7.5 * this.scale * side,
            );
            const upperOuterControl = localPoint(
                visual.center,
                visual.forward,
                visual.right,
                19 * this.scale,
                34 * this.scale * side,
            );
            const upperInnerStart = localPoint(
                visual.center,
                visual.forward,
                visual.right,
                14 * this.scale,
                8.5 * this.scale * side,
            );
            const eyeTopInner = localPoint(
                eyeCenter,
                visual.forward,
                visual.right,
                20.5 * this.scale,
                -7 * this.scale * side,
            );
            const upperInnerControl = localPoint(
                visual.center,
                visual.forward,
                visual.right,
                21 * this.scale,
                14 * this.scale * side,
            );
            const eyeBottomOuter = localPoint(
                eyeCenter,
                visual.forward,
                visual.right,
                -20.5 * this.scale,
                7 * this.scale * side,
            );
            const lowerOuterEnd = localPoint(
                visual.center,
                visual.forward,
                visual.right,
                -34 * this.scale,
                40 * this.scale * side,
            );
            const lowerOuterControl = localPoint(
                visual.center,
                visual.forward,
                visual.right,
                -27 * this.scale,
                35 * this.scale * side,
            );
            const eyeBottomInner = localPoint(
                eyeCenter,
                visual.forward,
                visual.right,
                -20.5 * this.scale,
                -7 * this.scale * side,
            );
            const innerLowerEnd = localPoint(
                visual.center,
                visual.forward,
                visual.right,
                -27 * this.scale,
                10 * this.scale * side,
            );
            const lowerInnerControl = localPoint(
                visual.center,
                visual.forward,
                visual.right,
                -24 * this.scale,
                16 * this.scale * side,
            );

            drawTilePath(
                this.context,
                quadraticCurve(mantleAnchor, upperOuterControl, eyeTopOuter),
                TILE_WHITE,
                this.scale,
                52000 + (side * 101),
            );
            drawTilePath(
                this.context,
                quadraticCurve(upperInnerStart, upperInnerControl, eyeTopInner),
                TILE_WHITE,
                this.scale,
                53000 + (side * 101),
            );
            drawTilePath(
                this.context,
                quadraticCurve(eyeBottomOuter, lowerOuterControl, lowerOuterEnd),
                TILE_WHITE,
                this.scale,
                54000 + (side * 101),
            );
            drawTilePath(
                this.context,
                quadraticCurve(eyeBottomInner, lowerInnerControl, innerLowerEnd),
                TILE_WHITE,
                this.scale,
                55000 + (side * 101),
            );

            innerLowerEnds.push(innerLowerEnd);
        });

        drawTilePath(
            this.context,
            quadraticCurve(
                innerLowerEnds[0],
                localPoint(
                    visual.center,
                    visual.forward,
                    visual.right,
                    -31 * this.scale,
                    0,
                ),
                innerLowerEnds[1],
            ),
            TILE_WHITE,
            this.scale,
            57000,
        );
    }

    drawEyes(visual) {
        const eyeAcross = 28.5 * this.scale;
        const left = localPoint(
            visual.center,
            visual.forward,
            visual.right,
            0,
            -eyeAcross,
        );
        const right = localPoint(
            visual.center,
            visual.forward,
            visual.right,
            0,
            eyeAcross,
        );

        this.drawEye(left, visual.forward, visual.right, 0, -1);
        this.drawEye(right, visual.forward, visual.right, 1, 1);
    }

    drawEye(center, forward, right, eyeIndex, side) {
        const hand = side * 0.55;
        const outer = [
            [28, 0],
            [24, -7],
            [16, -12.5],
            [5, -14.5],
            [-7, -14],
            [-17, -11],
            [-24, -5],
            [-27, 0],
            [-23, 6],
            [-15, 12],
            [-4, 14],
            [7, 13.5],
            [17, 10.5],
            [24, 5],
        ].map(([along, across], index) => [
            along + variation(index + (eyeIndex * 19), 0.42),
            across + (hand * Math.sin((index / 14) * TAU)),
        ]);
        const redRing = [
            [21.5, 0],
            [18, -6],
            [10, -9.5],
            [-2, -10.5],
            [-12, -8.5],
            [-19, -4],
            [-21, 1],
            [-17, 6.5],
            [-9, 9.5],
            [2, 10],
            [12, 7.5],
            [19, 3.5],
        ];
        const innerWhite = [
            [15.5, 0],
            [12.5, -4.7],
            [5.5, -6.5],
            [-3.5, -6.2],
            [-10, -3.5],
            [-14, 1],
            [-10, 4.2],
            [-3, 6],
            [5.5, 5.7],
            [12, 3],
        ];
        const tipCut = (index, count) => {
            const progress = index / count;
            const tipDistance = Math.min(
                progress,
                1 - progress,
                Math.abs(progress - 0.5),
            );

            if (tipDistance > 0.045) return null;

            return index % 2 === 0
                ? { length: 0.72, startWidth: 0.56, endWidth: 0.88 }
                : { length: 0.72, startWidth: 0.88, endWidth: 0.56 };
        };

        drawTilePath(
            this.context,
            authoredLocalPath(center, forward, right, outer, this.scale),
            TILE_WHITE,
            this.scale,
            60000 + (eyeIndex * 1000),
            true,
            tipCut,
        );
        drawTilePath(
            this.context,
            authoredLocalPath(center, forward, right, redRing, this.scale),
            (seed) => colorFor(seed),
            this.scale,
            61000 + (eyeIndex * 1000),
            true,
            tipCut,
        );
        drawTilePath(
            this.context,
            authoredLocalPath(center, forward, right, innerWhite, this.scale),
            TILE_WHITE,
            this.scale,
            62000 + (eyeIndex * 1000),
            true,
        );

        const pupilPositions = [
            [-7.9, 0],
            [-2.65, -2.65],
            [-2.65, 2.65],
            [2.65, -2.65],
            [2.65, 2.65],
            [7.9, 0],
        ];

        pupilPositions.forEach(([along, across], index) => {
            drawTile(
                this.context,
                localPoint(
                    center,
                    forward,
                    right,
                    along * this.scale,
                    across * this.scale,
                ),
                Math.atan2(forward.y, forward.x) + variation(index + eyeIndex, 0.025),
                EYE_BLACK,
                this.scale,
            );
        });
    }
}
