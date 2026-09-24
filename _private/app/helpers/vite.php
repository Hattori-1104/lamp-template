<?php

declare(strict_types=1);

const VITE_BASE = "/dist/";
const VITE_ENTRY = "src/main.tsx";
const VITE_ISLAND_NS = "src/islands/";

function vite_root(): string {
    // helpers -> app -> _private -> ルート（ドキュメントルート）
    return dirname(__DIR__, 3);
}

function vite_dev_url(): ?string {
    static $url = false;
    if ($url === false) {
        $hot = vite_root() . "/.vite-hot";
        $url = is_file($hot) ? rtrim(trim(file_get_contents($hot)), "/") : null;
    }

    return $url;
}

function vite_manifest(): array {
    static $manifest = null;
    if ($manifest !== null) return $manifest;

    $dist = vite_root() . "/dist";

    $path = $dist . "/.vite/manifest.json";

    if (is_file($path)) {
        return $manifest = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    }
    throw new RuntimeException("manifest.jsonが見つかりません。_private/frontend で bun run build を実行してください。");
}

function vite_url(string $file): string {
    return VITE_BASE . ltrim($file, "/");
}

function vite_tag(string $rel, string $href, string $extra = ""): string {
    return sprintf('<link rel="%s" href="%s"%s>' . "\n", $rel, htmlspecialchars($href, ENT_QUOTES), $extra);
}

function vite_collect_imports(array $item, array $manifest, array &$seen = []): array {
    $out = [];
    foreach ($item["imports"] ?? [] as $key) {
        if (isset($seen[$key]) || !isset($manifest[$key])) continue;
        $seen[$key] = true;
        $child = $manifest[$key];
        $out[] = $child["file"];
        $out = array_merge($out, vite_collect_imports($child, $manifest, $seen));
    }
    return $out;
}

function vite(string $entry = VITE_ENTRY): string {
    if ($dev = vite_dev_url()) {
        return <<<HTML
        <script type="module">
            import RefreshRuntime from "{$dev}/@react-refresh";
            RefreshRuntime.injectIntoGlobalHook(window);
            window.\$RefreshReg\$ = () => {};
            window.\$RefreshSig\$ = () => (type) => type;
            window.__vite_plugin_react_preamble_installed__ = true;
        </script>
        <script type="module" src="{$dev}/@vite/client"></script>
        <script type="module" src="{$dev}/{$entry}"></script>
        HTML;
    }

    $m = vite_manifest();
    if (!isset($m[$entry])) {
        throw new RuntimeException(("manifestにエントリがありません：{$entry}"));
    }
    $item = $m[$entry];

    $html = "";
    foreach ($item["css"] ?? [] as $css) {
        $html .= vite_tag("stylesheet", vite_url($css));
    }

    foreach (vite_collect_imports($item, $m) as $file) {
        $html .= vite_tag("modulepreload", vite_url($file), " crossorigin");
    }
    return $html . sprintf('<script type="module" src="%s"></script>' . "\n", htmlspecialchars(vite_url($item["file"]), ENT_QUOTES));
}

function island(string $id, array $props = []): string {
    $GLOBALS["_vite_islands"][$id] = true;

    return sprintf('<div data-island="%s" data-props="%s"></div>', htmlspecialchars($id, ENT_QUOTES), htmlspecialchars(json_encode($props, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE), ENT_QUOTES));
}

function island_preloads(): string {
    if (vite_dev_url()) return "";

    $m = vite_manifest();
    $html = "";
    $seen = [];

    foreach (array_keys($GLOBALS["_vite_islands"] ?? []) as $id) {
        $key = VITE_ISLAND_NS . $id . ".tsx";
        if (!isset($m[$key])) continue;
        $item = $m[$key];

        foreach ($item["css"] ?? [] as $css) {
            if (isset($seen[$css])) continue;
            $seen[$css] = true;
            $html .= vite_tag("stylesheet", vite_url($css));
        }

        foreach ([$item["file"], ...vite_collect_imports($item, $m, $seen)] as $file) {
            if (isset($seen[$file])) continue;
            $seen[$file] = true;
            $html .= vite_tag("modulepreload", vite_url($file), " crossorigin");
        }
    }
    return $html;
}
