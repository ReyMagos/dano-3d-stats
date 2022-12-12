import "./style.css"

import * as d3 from "d3"
import {SVGLoader} from "three/examples/jsm/loaders/SVGLoader";
import {
    BufferGeometry, DoubleSide,
    Float32BufferAttribute, Mesh,
    MeshPhongMaterial, PerspectiveCamera, Scene,
    Shape, ShapeUtils, WebGLRenderer
} from "three";


class RegionObject extends Mesh {
    currentHeight: number

    constructor(shapes: Shape[], initialHeight = 10) {
        super(
            new BufferGeometry(),
            new MeshPhongMaterial( {
                side: DoubleSide,
                vertexColors: true
            })
        )

        this.currentHeight = initialHeight

        const indices: number[] = []
        const vertices: number[] = []
        const normals: number[] = []
        const colors: number[] = []

        for (let i = 0; i < shapes.length; ++i)
            addShape(shapes[i])

        this.geometry.setIndex(indices)
        this.geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3))
        this.geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3))
        this.geometry.setAttribute("color", new Float32BufferAttribute(colors, 3))

        function addShape(shape: Shape) {
            const indexOffset = vertices.length / 3
            const points = shape.extractPoints(12)

            // We don't have holes in region shapes
            let shapeVertices = points.shape

            // Bottom shape
            shapeVertices.forEach(vertex => addVertex(vertex.x, vertex.y, 0))
            // Top shape
            shapeVertices.forEach(vertex => addVertex(vertex.x, vertex.y, initialHeight))

            const lidFaces = ShapeUtils.triangulateShape(points.shape, points.holes)
            for (let i = 0; i < lidFaces.length; ++i) {
                const bottom = lidFaces[i].map(vertex => vertex + indexOffset)
                const top = lidFaces[i].map(vertex => vertex + indexOffset + shapeVertices.length)
                indices.push(...bottom, ...top)
            }

            const sideFaces = createSideTriangles(shapeVertices.length)
            for (let i = 0; i < sideFaces.length; ++i) {
                const side = sideFaces[i].map(vertex => vertex + indexOffset)
                indices.push(...side)
            }
        }

        function createSideTriangles(shapeLength: number) {
            const triangles: number[][] = []
            for (let i = 0; i < shapeLength; ++i)
                triangles.push([i, i + 1, i + shapeLength])

            return triangles
        }

        function addVertex(x: number, y: number, z: number) {
            vertices.push(x, y, z)
            normals.push(0, 0, 1)
            colors.push(1, 0, 0)
        }
    }

    updateHeight(newHeight: number) {
        const vertices = this.geometry.attributes.position.array

        for (let i = vertices.length / 2; i < vertices.length; ++i) {
            // @ts-ignore
            vertices[i] += newHeight - this.currentHeight
        }

        this.geometry.attributes.position.needsUpdate = true;
    }

    updateColor(newColor: any) {

    }
}

function init(mapPath: string) {
    const generatePath = d3.geoPath().projection(d3.geoMercator())
    const svgLoader = new SVGLoader()

    d3.json(mapPath).then((json: any) => {
        (json as d3.ExtendedFeatureCollection).features.forEach(regionFeature => {
            const regionName = regionFeature.properties!.region
            const svgPath = generatePath(regionFeature)

            if (svgPath === null)
                throw `Region (${regionName}) path hasn't been generated`

            scene.add(new RegionObject(
                SVGLoader.createShapes(svgLoader.parse(`<path d="${svgPath}" />`).paths[0])
            ))
        })
    })
}


const scene = new Scene()
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer = new WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.append(renderer.domElement)

init("optimized.geojson")

function render() {
    requestAnimationFrame(render)
    renderer.render(scene, camera)
}


render()
