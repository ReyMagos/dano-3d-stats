import {
    DirectionalLight, ExtrudeGeometry, HemisphereLight, Mesh,
    MeshStandardMaterial, Path, PerspectiveCamera, Raycaster,
    Scene, Shape, Vector2, WebGLRenderer
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Stats from "stats.js";

// output from optimize.py
import geoJson from "./data/optimized.geo.json"
import mapping from "./data/region_mapping.json";
import {data, month, sceneData, updateMouseTarget, year} from "./supplier";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {OutlinePass} from "three/examples/jsm/postprocessing/OutlinePass";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
import {FXAAShader} from "three/examples/jsm/shaders/FXAAShader";


export let scene: Scene,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer,
    stats: Stats,
    raycaster: Raycaster,
    composer: EffectComposer,
    mouse = new Vector2(),
    outline: OutlinePass

function gradient(c1: number, c2: number, x: number) {
    const r1 = c1 / 65536, g1 = c1 % 65536 / 256, b1 = c1 % 256,
          r2 = c2 / 65536, g2 = c2 % 65536 / 256, b2 = c2 % 256

    return Math.round(r1 + x * (r2 - r1)) * 65536 +
           Math.round(g1 + x * (g2 - g1)) * 256 +
           Math.round(b1 + x * (b2 - b1))
}

function setupLights() {
    const hemiLight = new HemisphereLight(0xffffff, 0xdddddd)
    hemiLight.position.set(0, 1000, 0)
    scene.add(hemiLight)

    const dirLight = new DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(- 3000, 1000, - 1000)
    scene.add(dirLight);
}

function createRegionMesh(dataValue: number, polygons: any[]) {
    const regionShape: Shape[] = []

    for (const polygon of polygons) {
        const shape = new Shape()

        // Exterior path
        shape.moveTo(polygon[0][0][0], polygon[0][0][1])
        for (const point of polygon[0])
            shape.lineTo(point[0], point[1])

        // Interior paths
        for (let i = 1; i < polygon.length; ++i) {
            const holePath = new Path()

            holePath.moveTo(polygon[i][0][0], polygon[i][0][1])
            for (const point of polygon[i])
                holePath.lineTo(point[0], point[1])

            shape.holes.push(holePath)
        }

        regionShape.push(shape)
    }

    const faceMaterial = new MeshStandardMaterial({
        color: gradient(0x202020, 0x6bba3a, dataValue),
        flatShading: true,
        roughness: 1,
    })
    const geometry = new ExtrudeGeometry(regionShape, {
        bevelEnabled: false,
        steps: 1,
        depth: 1 + dataValue * 5
    })

    return new Mesh(geometry, faceMaterial)
}

function loadRegionsMeshes() {
    geoJson.features.forEach(regionFeature => {
        const geometry = regionFeature.geometry.type === "Polygon" ?
            [regionFeature.geometry.coordinates] : regionFeature.geometry.coordinates
        const mesh = createRegionMesh(Math.random(), geometry)
        const regionName = regionFeature.properties.region

        // @ts-ignore
        mesh.userData = {"id": mapping[regionName], "name": regionName, "dataValue": 0}
        scene.add(mesh)
    })
    updateScene()
}

export function init() {
    camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000)
    camera.position.set(50, 50, 50)

    scene = new Scene()
    scene.scale.set(0.6, 1, 1)

    setupLights()
    loadRegionsMeshes()

    renderer = new WebGLRenderer({antialias: true})
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(55, 60, 10)
    controls.update()

    // stats = new Stats()
    // document.body.appendChild(stats.dom)

    raycaster = new Raycaster()

    composer = new EffectComposer(renderer)

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    outline = new OutlinePass(new Vector2(window.innerWidth, window.innerHeight), scene, camera)
    outline.hiddenEdgeColor.setHex(0x181818)
    composer.addPass(outline)

    const effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    composer.addPass(effectFXAA);

    window.addEventListener("resize", onWindowResize)
    document.addEventListener("mousemove", onMouseMove)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
}

function onMouseMove(event: any) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;
}

function traceMouseTarget() {
    raycaster.setFromCamera(mouse, camera)
    const intersection = raycaster.intersectObjects(scene.children)

    let target = null;
    for (let i = 0; i < intersection.length; ++i) {
        if (intersection[i].object.userData.id) {
            target = intersection[i]
            break
        }
    }

    if (target !== null) {
        outline.selectedObjects = [target.object]
        updateMouseTarget(target.object)
    } else {
        outline.selectedObjects = []
        updateMouseTarget(null)
    }
}

export function updateScene() {
    const dataSource = data[sceneData][year][month]
    for (let i = 0; i < scene.children.length; ++i) {
        const object = scene.children[i]
        if (object instanceof Mesh) {
            const position = object.geometry.attributes.position
            const dataValue = dataSource[object.userData.id] / dataSource["max"]
            for (let j = 0; j < position.count; ++j) {
                if (position.getZ(j) != 0) {
                    position.setZ(j, dataValue * 20)
                }
            }

            object.userData.dataValue = dataValue
            object.material.color.setHex(gradient(0x202020, 0x6bba3a, dataValue))

            position.needsUpdate = true
            object.geometry.computeBoundingSphere()
        }
    }
}

export function launchRender() {
    requestAnimationFrame(launchRender)
    renderer.render(scene, camera)

    traceMouseTarget()
    composer.render()
    // stats.update()
}
