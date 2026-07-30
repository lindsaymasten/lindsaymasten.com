<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#ffffff">
    <meta name="description" content="Lindsay Masten is a designer, educator, and academic leader working across visual communication, digital experience, and design education.">
    <meta property="og:title" content="@yield('title', 'Lindsay Masten')">
    <meta property="og:description" content="Designer, educator, and academic leader in Prescott, Arizona.">
    <meta property="og:type" content="website">
    <title>@yield('title', 'Lindsay Masten')</title>

    <link rel="icon" type="image/png" sizes="259x259" href="{{ asset('favicon.png') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500&amp;family=Sofia+Sans+Extra+Condensed:wght@300;400;500;600&amp;display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <a class="skip-link" href="#main-content">Skip to content</a>
    @yield('content')

    <div class="ink-octopus" data-ink-octopus hidden>
        <canvas
            class="ink-octopus__canvas"
            data-octopus-canvas
            width="1"
            height="1"
            aria-hidden="true"
        ></canvas>
        <div class="ink-octopus__controls">
            <div
                class="ink-octopus__parked-marker"
                data-octopus-parked-marker
                role="status"
                aria-live="polite"
                hidden
            >
                <span class="ink-octopus__parked-visual" aria-hidden="true">
                    <span class="ink-octopus__parked-octopus">
                        <span class="ink-octopus__parked-round-o"><span>●</span></span><span>CTOPUS</span>
                    </span>
                    <span class="ink-octopus__parked-word">PARKED</span>
                </span>
                <span class="ink-octopus__parked-announcement">Octopus parked</span>
            </div>
            <button
                class="ink-octopus__toggle"
                data-octopus-toggle
                type="button"
                aria-label="Put the octopus away"
                aria-pressed="false"
            >
                <svg aria-hidden="true" focusable="false" viewBox="0 0 32 32">
                    <defs>
                        <linearGradient id="octopus-cross-soft-tip" x1="27" y1="22" x2="38" y2="33" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stop-color="#fff"/>
                            <stop offset=".48" stop-color="#fff"/>
                            <stop offset=".72" stop-color="#aaa"/>
                            <stop offset=".86" stop-color="#555"/>
                            <stop offset="1" stop-color="#000"/>
                        </linearGradient>
                        <mask id="octopus-cross-soft-tip-mask" x="-8" y="-8" width="48" height="48" maskUnits="userSpaceOnUse">
                            <rect x="-8" y="-8" width="48" height="48" fill="url(#octopus-cross-soft-tip)"/>
                        </mask>
                    </defs>
                    <ellipse cx="16" cy="10" rx="5.5" ry="5.8" fill="currentColor"/>
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.2">
                        <path d="M11.5 14C10 18 7 18 6 23"/>
                        <path d="M14 15C13 19 12 22 10 25"/>
                        <path d="M16 15.5V26"/>
                        <path d="M18 15C19 19 20 22 22 25"/>
                        <path d="M20.5 14C22 18 25 18 26 23"/>
                    </g>
                    <g class="ink-octopus__cross" fill="#ed4a2b">
                        <path class="ink-octopus__cross-soft-leg" mask="url(#octopus-cross-soft-tip-mask)" d="M2.6 2.8C3.8 1.6 5.5 2.3 6.9 4L13.8 11.8C15 13.1 15.9 13.9 17.2 15L35.8 29.5C37.5 30.8 36.7 33.5 34.6 33.8C33.7 33.9 33 33.2 32.2 32.6L13.9 18.2C12.4 17 11.5 15.6 10.3 14.3L2.5 6.5C1.3 5.3 1.4 4 2.6 2.8Z"/>
                        <path d="M27.8 1.2C29.4 1.8 29.7 3.5 28.5 5.1L21.2 13.4C20.2 14.6 19 15.9 17.9 17.2L6 29.8C4.8 31.5 2.6 30.7 2.3 29.1C2.1 28.2 2.8 27.4 3.5 26.6L15.4 14C16.8 12.4 18 11.2 19.2 9.8L25.6 2.2C26.2 1.4 27 1 27.8 1.2Z"/>
                        <path d="M34.7 32.2C36.3 32.6 37.4 34.1 36.6 35.5C35.7 36.8 33.7 36.2 33.5 34.8C33.3 33.7 33.8 32.8 34.7 32.2Z"/>
                        <path d="M4.9 28.7C6 30.1 6.4 32.8 5.1 34.1C3.7 33.7 3.5 31.3 4.9 28.7Z"/>
                    </g>
                </svg>
            </button>
        </div>
    </div>
</body>
</html>
