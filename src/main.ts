import "./style.css"
import {
    AxesHelper,
    ExtrudeGeometry, Mesh, MeshStandardMaterial, Path, PerspectiveCamera,
    PointLight, Scene, Shape, WebGLRenderer
} from "three"
import Stats from "stats.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

// output from optimize.py
import geoJson from "./optimized.geo.json"


let scene: Scene,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer,
    stats: Stats

function gradient(c1: number, c2: number, x: number) {
    const r1 = c1 / 65536, g1 = c1 % 65536 / 256, b1 = c1 % 256,
          r2 = c2 / 65536, g2 = c2 % 65536 / 256, b2 = c2 % 256

    return Math.round(r1 + x * (r2 - r1)) * 65536 +
           Math.round(g1 + x * (g2 - g1)) * 256 +
           Math.round(b1 + x * (b2 - b1))
}

function createRegionMesh(...polygons: any) {
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

    const rand = Math.random()

    const material = new MeshStandardMaterial({color: gradient(0x202020, 0x6bba3a, rand)})
    const geometry = new ExtrudeGeometry(regionShape, {
        bevelEnabled: false,
        steps: 1,
        depth: 1 + rand * 5
    })

    return new Mesh(geometry, material)
}

function initRegions() {
    // @ts-ignore
    geoJson.features.forEach(regionFeature => {
        const regionName = regionFeature.properties.region

        if (regionFeature.geometry.type === "MultiPolygon")
            scene.add(createRegionMesh(...regionFeature.geometry.coordinates))
        else
            scene.add(createRegionMesh(regionFeature.geometry.coordinates))
    })
}

function setupLights() {
    const light1 = new PointLight(0xfcdb9f);
	light1.position.set(0, 50, 20);
    // light1.add(new AxesHelper(30))
	scene.add(light1);

    const light2 = new PointLight(0xfcdb9f);
	light2.position.set(200, 50, 20);
    // light2.add(new AxesHelper(30))
	scene.add(light2);

	const light3 = new PointLight(0xfcdb9f);
	light3.position.set(100, 100, 20);
    // light3.add(new AxesHelper(30))
	scene.add(light3);

	const light4 = new PointLight(0xfcdb9f);
	light4.position.set(100, 0, 20);
    // light4.add(new AxesHelper(30))
	scene.add(light4);
}

function initScene() {
    camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(50, 50, 50)

    scene = new Scene();
    scene.scale.set(0.6, 1, 1)

    setupLights()

    renderer = new WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(55, 60, 10)

    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function init() {
    initScene()
    initRegions()
}

function render() {
    requestAnimationFrame(render)
    renderer.render(scene, camera)
    stats.update()
}

init()
render()