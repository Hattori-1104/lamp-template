import type { AnyIslandModule } from "@/integrations/island-module";

// アイランドのレジストリ
// 新しいアイランドを追加したら、ここにも登録する
export const REGISTRY = {
    ExampleIsland: () => import("@islands/ExampleIsland"),
    FormPage: () => import("@/islands/pages/FormPage")
} as const satisfies Record<string, () => Promise<{default: AnyIslandModule}>>

export type IslandId = keyof typeof REGISTRY
