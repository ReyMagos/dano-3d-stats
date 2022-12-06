/// <reference types="vite/client" />

declare module "*.geojson" {
    const data: string
    export default data
}
