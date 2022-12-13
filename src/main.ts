import "./style.css"
import {
    AxesHelper,
    ExtrudeGeometry, Mesh, MeshLambertMaterial, Path, PerspectiveCamera,
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

    const material = new MeshLambertMaterial({color: 0x200200 + rand * 255})
    const geometry = new ExtrudeGeometry(regionShape, {
        bevelEnabled: false,
        steps: 1,
        depth: 2 + rand * 3
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
            scene.add(scene.add(createRegionMesh(regionFeature.geometry.coordinates)))
    })
}

function initScene() {
    camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(50, 50, 50)

    scene = new Scene();
    scene.scale.set(0.6, 1, 1)
    scene.add(new AxesHelper(30))

    let pointLight = new PointLight(0xFFFFFF);
	pointLight.position.set(-800, 800, 800);
	scene.add(pointLight);

	let pointLight2 = new PointLight(0xFFFFFF);
	pointLight2.position.set(800, 800, 800);
	scene.add(pointLight2);

	let pointLight3 = new PointLight(0xFFFFFF);
	pointLight3.position.set(800, -800, -800);
	scene.add(pointLight3);

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