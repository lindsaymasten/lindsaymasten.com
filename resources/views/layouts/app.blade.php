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
            class="ink-octopus__trigger"
            data-octopus-trigger
            type="button"
            aria-label="Play with the ink octopus"
        >Play with the ink octopus</button>
    </div>
</body>
</html>
