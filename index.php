<?php

declare(strict_types=1);

require __DIR__ . "/_private/app/helpers/vite.php";

ob_start();
?>
<p>Lamp Template</p>
<?= island("ExampleIsland", ["message" => "hello from PHP"]) ?>
<?php $body = ob_get_clean(); ?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <?= vite() ?>
    <?= island_preloads() ?>
</head>
<body><?= $body ?></body>
</html>