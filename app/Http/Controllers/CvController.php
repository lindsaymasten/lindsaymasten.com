<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Support\Str;

final class CvController extends Controller
{
    public function __invoke(): View
    {
        $source = file_get_contents(resource_path('content/cv.md'));
        $source = '## EDUCATION'.Str::after($source, '## EDUCATION');

        $sections = [];
        $cv = Str::markdown($source, [
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
        ]);

        $cv = preg_replace_callback('/<h2>(.*?)<\/h2>/s', function (array $matches) use (&$sections): string {
            $label = html_entity_decode(strip_tags($matches[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $id = Str::slug($label);
            $sections[] = ['id' => $id, 'label' => Str::title(Str::lower($label))];

            return sprintf('<h2 id="%s">%s</h2>', e($id), $matches[1]);
        }, $cv);

        $cv = preg_replace_callback('/<(h3|h4)>(.*?)<\/\\1>/s', function (array $matches): string {
            $tag = $matches[1];
            $label = html_entity_decode(strip_tags($matches[2]), ENT_QUOTES | ENT_HTML5, 'UTF-8');

            if (preg_match('/^((?:Fall\s+)?\d{4}(?:[–—-](?:Present|\d{4}))?)\s+(.+)$/u', trim($label), $parts)) {
                return sprintf(
                    '<%1$s class="cv-entry-heading"><span class="cv-entry-heading__date">%2$s</span><span class="cv-entry-heading__title">%3$s</span></%1$s>',
                    $tag,
                    e($parts[1]),
                    e($parts[2]),
                );
            }

            return sprintf('<%1$s class="cv-subheading">%2$s</%1$s>', $tag, $matches[2]);
        }, $cv);

        return view('cv', [
            'cv' => $cv,
            'sections' => $sections,
        ]);
    }
}
