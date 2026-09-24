FROM php:8.3-apache

# a2enmod は Debian 系の Apache のヘルパー。
# シンボリックリンクを貼って機能を有効化する。
RUN a2enmod rewrite headers

# compose から受け取る
ARG APACHE_DOCUMENT_ROOT
# 実行時の Apache にも引き継ぐ
ENV APACHE_DOCUMENT_ROOT=${APACHE_DOCUMENT_ROOT}

# ドキュメントルートを変更。デフォルトは /var/www/html 。
RUN sed -ri 's!DocumentRoot /var/www/html!DocumentRoot ${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/000-default.conf

# MySQL 接続用の拡張（ベースイメージには含まれない）
# 本番の `php -m` と見比べて、必要な拡張があればここに追加する。
RUN docker-php-ext-install pdo_mysql mysqli

# Bun（React 連携（_private/frontend）のビルド・開発サーバー用）
# ビルド時にしか使わないので、インストールスクリプトを実行せず公式イメージからバイナリだけ拝借する
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

# Apache の追加設定
COPY apache/project.conf /etc/apache2/conf-available/project.conf
RUN a2enconf project

# 開発用 PHP 設定（保存が即反映されるように）
RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini" \
 && printf '%s\n' \
  'opcache.validate_timestamps=1' \
  'opcache.revalidate_freq=0' \
  > "$PHP_INI_DIR/conf.d/dev.ini"

# Git を使えるようにする
RUN apt-get update \
 && apt-get install -y --no-install-recommends git openssh-client \
 && rm -rf /var/lib/apt/lists/*

# 開発用ユーザー（ホストユーザーのUID/GIDに合わせる）
# ・Apache本体はこの後もrootのまま起動する（rootでないと80番ポートにbindできないため）。
# ・VS Code（devcontainer.jsonのremoteUser）やターミナルからの `docker compose exec --user dev` は
#   このユーザーで実行されるので、bunの実行などコンテナ内で作られるファイルがホストと同じ所有者になる。
ARG DEV_UID=1000
ARG DEV_GID=1000
RUN groupadd -g ${DEV_GID} dev \
 && useradd -m -u ${DEV_UID} -g ${DEV_GID} -s /bin/bash dev

# 実行コマンドはベースイメージに含まれているので CMD 指定不要。
# （↑のRUNはbuild時のみで、コンテナ起動時のユーザーは変わらずroot＝Apache用）
WORKDIR ${APACHE_DOCUMENT_ROOT}