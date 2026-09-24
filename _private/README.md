# _private — 開発専用ディレクトリ

開発環境（Docker / Dev Container）の設定と、このプロジェクトの運用ドキュメントを置くディレクトリです。

## このディレクトリがある理由

- 本番サーバーでは **ドキュメントルートより上の階層に触れない** ため、リポジトリのルート ＝ ドキュメントルートとしています。
- そのため、開発用のファイルもドキュメントルート内に置く必要があり、ここにまとめています。
- 本番へのリリースは **ドキュメントルートをそのまま FTP でアップロード** します（既存サービスのファイルとの整合性を保つため）。
  **このディレクトリも本番サーバーに置かれます。** 外部から見えないようにしているのは、ルートの `.htaccess` だけです。

> ⚠️ 本番に置かれる前提なので、**本番の秘密情報（DB パスワードなど）は `_private/` に置かないでください。**
> `docker/compose.yml` の DB パスワードは開発専用です。

## ディレクトリ構成

```
/var/www/html/                     ← ドキュメントルート ＝ リポジトリのルート
├── .htaccess                      公開設定。非公開パスを 404 にするルールもここ
├── index.php                      公開
├── .devcontainer.json             Dev Container の定義                 （非公開）
├── .gitignore                                                         （非公開）
├── .vscode/settings.json          エクスプローラーで _private を隠す設定  （非公開）
├── lamp-template.code-workspace   開発用のワークスペース（下記参照）      （非公開）
└── _private/                                                          （非公開）
    ├── README.md                  このファイル
    └── docker/
        ├── .env                   compose 用の変数（APACHE_DOCUMENT_ROOT）
        ├── compose.yml            web / db コンテナの定義
        ├── Dockerfile             web コンテナ（PHP 8.3 + Apache）
        └── apache/project.conf    Apache の追加設定（開発環境のみ）
```

## 非公開にする仕組み

ルートの `.htaccess` で、次のパスへのアクセスを 404 にしています。

| 対象 | 例 | ルール |
|---|---|---|
| `.` で始まるファイル・ディレクトリ | `.git/`, `.devcontainer.json`, `.vscode/`, `.gitignore` | `RedirectMatch 404 /\.(?!well-known/)` |
| 開発専用ディレクトリ | `_private/` | `RedirectMatch 404 ^/_private(/\|$)` |
| VS Code ワークスペース | `*.code-workspace` | `RedirectMatch 404 \.code-workspace$` |
| パッケージの置き場所 | `vendor/`, `node_modules/` | `RedirectMatch 404 ^/(vendor\|node_modules)(/\|$)` |
| パッケージマネージャーの定義ファイル | `composer.json/.lock`, `package.json`, `package-lock.json` | `RedirectMatch 404 /(composer\.(json\|lock)\|package(-lock)?\.json)$` |

`.well-known/`（Let's Encrypt の認証などで使う）だけは例外として公開しています。

### 開発用のファイルを追加するとき

1. できるだけ `_private/` の中に置く。
2. ツールの都合でルートに置く必要がある場合（設定ファイルなど）は、次のどちらかにする。
   - `.` で始まるファイル名にする（自動で非公開になる）
   - `.htaccess` の「公開しないパス」にルールを追加する
3. 開発環境で `http://localhost:8080/<パス>` を開き、**404 になることを確認** する。
   開発環境の Apache も同じ `.htaccess` を読むので、ここで確認できます。

## 開発環境

### 起動

1. VS Code に拡張機能「Dev Containers」を入れる。
2. リポジトリのルートを開き、コマンドパレットで **Dev Containers: Reopen in Container** を実行する。
3. コンテナで開いたら、**ワークスペース `lamp-template.code-workspace` を開く。**
   - メニューの「ファイル」→「ファイルでワークスペースを開く...」から選ぶか、エクスプローラーでファイルを開くと右下に表示される「ワークスペースを開く」ボタンを押します。
   - ウィンドウが再読み込みされ、エクスプローラーに次の 2 つのフォルダーが並びます。

     | 表示名 | 中身 |
     |---|---|
     | Apache Document Root (/var/www/html) | 公開するファイル（`_private` は非表示） |
     | Dev Folder (./_private) | 開発専用のファイル |

   - ルートのフォルダーでは `.vscode/settings.json` の設定で `_private` を隠しているので、**ワークスペースを開かないと `_private` がエクスプローラーに表示されません。**
     公開するファイルと開発専用のファイルを混同しないよう、普段の開発はこのワークスペースで行ってください。

`Dockerfile` や `compose.yml` を変更したときは **Dev Containers: Rebuild Container** を実行してください。

### 接続先

| 用途 | 接続先 |
|---|---|
| ブラウザ | http://localhost:8080 |
| DB（PHP から） | ホスト `db` / ポート `3306` |
| DB（ホストの DB クライアントから） | `127.0.0.1:3306` |

- DB 名: `appdb` / ユーザー: `app` / パスワード: `app`（root のパスワードは `root`）
- ポートは `127.0.0.1` だけで待ち受けているので、LAN の他の端末からは接続できません。弱いパスワードを使っているので、**`0.0.0.0` には変えないでください。**

### 本番との違い

| 項目 | 開発環境 | 本番 |
|---|---|---|
| HTTPS リダイレクト | 無効（`project.conf` で `APP_ENV=dev` を設定） | 有効 |
| php.ini | `php.ini-development`（エラーを画面に表示） | 本番の設定 |
| OPcache | 毎リクエストでファイルの更新を確認 | 本番の設定 |
| `AllowOverride` | `All` | **未確認**（下記参照） |

開発環境だけに必要な Apache の設定は `docker/apache/project.conf` に書いてください。
**`.htaccess` は本番にもそのまま反映される** ので、開発用の一時的な変更を入れないでください。

## 本番へのリリース

### 初回リリース前に確認すること

非公開ファイルを守っているのは `.htaccess` だけなので、次の点を **インフラ担当に確認してから** リリースしてください。

- [ ] **`AllowOverride` の設定**
  - `None` だと `.htaccess` が無視され、`_private/` や `.git/` がそのまま公開されてしまいます。
  - `RedirectMatch`・`RewriteRule`・`Header` を使うには `FileInfo` が必要です。
  - `Options -Indexes` を使うには `Options`（または `Options=Indexes`）が必要です。許可されていないとサイト全体が 500 エラーになります。
- [ ] **Apache モジュール** `mod_alias`・`mod_rewrite`・`mod_headers` が有効か
- [ ] **HTTPS の終端**：ロードバランサーや CDN で HTTPS を終端している場合、`.htaccess` の HTTPS リダイレクトが無限ループします。
- [ ] **バージョン**：PHP・MySQL のバージョンと PHP 拡張（`php -m`）が本番と一致しているか。違う場合は `Dockerfile` / `compose.yml` を本番に合わせる。

確認した結果に合わせて、開発環境の `docker/apache/project.conf` の `AllowOverride` も本番と同じ値にしておくと、本番との差異に気づきやすくなります。

### 手順

1. **変更をコミットする。** リリースするのは `main` にコミット済みの状態にします。
2. **FTP でルートディレクトリをアップロードする。**
   - `.git/` は本番では使わないので、FTP クライアントの除外設定で **アップロードしないことを推奨** します（`.htaccess` が効かなかったときに、ソースと履歴がすべて漏れるのを防ぐため）。
3. **リポジトリから削除したファイルは、本番からも手動で削除する。** アップロードしても、サーバー上のファイルは消えません。
   前回リリースからの削除ファイルは次のコマンドで確認できます。
   ```bash
   git diff --name-status --diff-filter=D <前回のリリースタグ> HEAD
   ```
4. **リリースしたコミットにタグを付ける。** 次回の手順 3 で使います。
   ```bash
   git tag release-YYYYMMDD
   git push origin release-YYYYMMDD
   ```
5. **非公開ファイルが見えていないか確認する。**
   ```bash
   BASE=https://本番のドメイン
   for p in / /_private/README.md /.devcontainer.json /lamp-template.code-workspace /.gitignore /.git/HEAD; do
     curl -s -o /dev/null -w "%{http_code} $p\n" "$BASE$p"
   done
   ```
   `/` が `200`、それ以外がすべて `404` なら OK です。
   **`200` が一つでもあれば、すぐにそのファイルを本番から削除し、`AllowOverride` の設定を確認してください。**
