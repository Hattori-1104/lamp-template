import { defineIsland } from "@/integrations/island-module";
import { useState } from "react";
import * as v from "valibot"

export default defineIsland({
    propsSchema: v.object({
        message: v.string()
    }),
    Component({ message }) {
        const [count, setCount] = useState(0)
        return <div>
            <div>ホットリロード: {message}</div>
            <button type="button" onClick={() => setCount(prev => prev + 1)}>Count: {count}</button>
        </div>
    },
})
