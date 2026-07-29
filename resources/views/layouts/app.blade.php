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
        <button
            class="ink-octopus__toggle"
            data-octopus-toggle
            type="button"
            aria-label="Put the octopus away"
            aria-pressed="false"
        >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 32 32">
                <ellipse cx="16" cy="10" rx="5.5" ry="5.8" fill="currentColor"/>
                <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.2">
                    <path d="M11.5 14C10 18 7 18 6 23"/>
                    <path d="M14 15C13 19 12 22 10 25"/>
                    <path d="M16 15.5V26"/>
                    <path d="M18 15C19 19 20 22 22 25"/>
                    <path d="M20.5 14C22 18 25 18 26 23"/>
                </g>
                <g class="ink-octopus__cross" fill="none" stroke="#ed4a2b" stroke-linecap="round">
                    <path stroke-width="3.5" d="M6 5.5L13 13M14.4 14.5L26 27"/>
                    <path stroke-width="3.2" d="M26 5L19.4 12.1M17.8 14L6.2 27"/>
                    <path opacity=".55" stroke-width=".9" d="M5.2 6.7L25.1 27.8M27 6.2L7.3 26.2"/>
                </g>
            </svg>
        </button>
    </div>
</body>
</html>
