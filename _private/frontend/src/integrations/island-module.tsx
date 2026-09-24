import type { ReactNode } from "react"
import * as v from "valibot"

// Propsとして使用できる最も広い型のスキーマ
type AnyObjectSchema = v.ObjectSchema<any, any>

// アイランドモジュール（ファイル）で宣言するデータ
type IslandModuleWithProps<S extends AnyObjectSchema> = {
    propsSchema: S
    Component: (props: v.InferOutput<S>) => ReactNode
}

type IslandModuleWithoutProps = {
    propsSchema?: undefined
    Component: () => ReactNode
}

export type IslandModule<S extends AnyObjectSchema | undefined> = S extends AnyObjectSchema ? IslandModuleWithProps<S> : IslandModuleWithoutProps

// スキーマの型を消した、描画側で扱うための型
// propsSchemaの有無で判別できる
export type AnyIslandModule = IslandModuleWithProps<AnyObjectSchema> | IslandModuleWithoutProps

// Identity関数
// 条件型からはSを推論できないため、オーバーロードで定義する
export function defineIsland<S extends AnyObjectSchema>(obj: IslandModuleWithProps<S>): IslandModuleWithProps<S>
export function defineIsland(obj: IslandModuleWithoutProps): IslandModuleWithoutProps
export function defineIsland(obj: AnyIslandModule) {
    return obj
}
