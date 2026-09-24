import { createRoot } from "react-dom/client"
import { REGISTRY, type IslandId } from "@/integrations/registry"
import type { AnyIslandModule } from "@/integrations/island-module"
import * as v from "valibot"

// データセットの定義名
// こんな感じ？
// <div data-island="ExampleIsland" data-props='{"message": "hello from PHP"}'></div>
const DATASET_ID_ISLAND = "island"
const DATASET_ID_ISLAND_PROPS = "props"

export async function renderIslands() {
    // data-islandを持つ要素を収集
    const elements = document.querySelectorAll<HTMLElement>(`[data-${DATASET_ID_ISLAND}]`)

    for (const elm of elements) {
        const islandId = elm.dataset[DATASET_ID_ISLAND]
        if (!isValidIslandId(islandId)) {
            console.log(`スキップしました：${islandId}`)
            continue
        }

        // 個々のスキーマの型はdefineIslandで検証済みなので、ここでは判別可能なunionとして扱う
        // （unionで宣言した変数に直接代入すると、代入値の型に絞り込まれてしまうため、関数型を経由する）
        const loadIsland: () => Promise<{ default: AnyIslandModule }> = REGISTRY[islandId]
        const { default: islandModule } = await loadIsland()


        // propsなし
        if (!islandModule.propsSchema) {
            createRoot(elm).render(<islandModule.Component />)
            continue
        }

        // propsあり
        const propsRaw = elm.dataset[DATASET_ID_ISLAND_PROPS]
        if (!propsRaw) {
            console.error("propsが空です。")
            continue
        }
        const propsParseResult = await v.safeParseAsync(islandModule.propsSchema, JSON.parse(propsRaw))
        if (!propsParseResult.success) {
            console.error("propsのパースに失敗しました。")
            console.error(`> ID: ${islandId}`)
            console.error(`> props: ${propsRaw}`)
            continue
        }

        const props = propsParseResult.output
        createRoot(elm).render(<islandModule.Component {...props} />)

    }
}


function isValidIslandId(islandId: string | undefined): islandId is IslandId {
    if (!islandId) return false
    if (islandId in REGISTRY) return true
    return false
}
