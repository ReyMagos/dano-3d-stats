import {Object3D} from "three";

import inMigr from "./data/inmigr.json"
import outMigr from "./data/outmigr.json"
import {updateScene} from "./map";


export const data: { [key: string]: any } = {
    "inmigr": inMigr,
    "outmigr": outMigr
}
export let sceneData = "inmigr",
    year = "2019",
    month = "1"
let foldState = false

function $(selector: string) {
    return document.querySelector(selector)!
}

export function init() {
    $("form #year").addEventListener("input", updateYear)
    $("form #month").addEventListener("input", updateMonth)
    $("form #inmigr").addEventListener("click",
        () => updateSceneData("inmigr"))
    $("form #outmigr").addEventListener("click",
        () => updateSceneData("outmigr"))
    $("#fold").addEventListener("click", foldControls)
}

function updateYear() {
    year = ($("form #year") as HTMLInputElement).value
    $("form #year-field").innerHTML = year
    updateScene()
}

function updateMonth() {
    const months = ["", "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август",
        "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
    month = ($("form #month") as HTMLInputElement).value
    $("form #month-field").innerHTML = months[parseInt(month)]
    updateScene()
}

function updateSceneData(data: string) {
    if (data !== sceneData) {
        ($(`form #${sceneData}`) as HTMLInputElement).checked = false
        sceneData = data
    }
    ($(`form #${data}`) as HTMLInputElement).checked = true
    updateScene()
}

function foldControls() {
    foldState = !foldState;

    ($("#control") as HTMLElement).style.maxHeight = (foldState ? "0" : "200px");
    ($("#fold img") as HTMLElement).style.transform = `rotate(${foldState ? 0 : 180}deg)`;
}

export function updateMouseTarget(mesh: Object3D | null) {
    let html = "?"
    if (mesh !== null)
        html = `<p class="name">${mesh.userData.name}</p><p class="data">${mesh.userData.dataValue}</p>`
    $("#info").innerHTML = html
}
