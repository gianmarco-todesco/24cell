'use strict';

let canvas, engine, scene, camera;

window.addEventListener('DOMContentLoaded', () => {
    // il tag canvas che visualizza l'animazione
    canvas = document.getElementById('c');
    // la rotella del mouse serve per fare zoom e non per scrollare la pagina
    canvas.addEventListener('wheel', evt => evt.preventDefault(), {passive:false});
    
    // engine & scene
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    scene.ambientColor.set(0.75,0.75,0.75)

    // camera
    camera = new BABYLON.ArcRotateCamera('cam', 
            -2.43, 1.22,
            20, 
            new BABYLON.Vector3(0,0,0), 
            scene);
    camera.attachControl(canvas,true);
    camera.wheelPrecision = 50;
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 13*2;  
    camera.fov = 0.5;          
    
    // luce
    let light1 = new BABYLON.PointLight('light1',new BABYLON.Vector3(0,1,0), scene);
    light1.parent = camera;
    
    // aggiungo i vari oggetti
    populateScene(scene);
    
    // main loop
    engine.runRenderLoop(()=>scene.render());

    // resize event
    window.addEventListener("resize", () => engine.resize());

});

let p24 = P24.create24Cell(0.5,1,5);

/*
let currentCell = -1;

function setCurrentCell(idx) {
    p24.hideFaces();
    currentCell = idx;
    if(0<=currentCell && currentCell<p24.cells.length) 
        p24.showCell(currentCell);
}

function incCurrentCell() {
    currentCell = (currentCell+1) % p24.cells.length;
    setCurrentCell(currentCell);
}
function decCurrentCell() {
    currentCell = (currentCell-1+p24.cells.length) % p24.cells.length;
    setCurrentCell(currentCell);
}
*/

function setInnerCellColor(i, r,g,b) {
    let mat = p24.innerCells[i].material;
    mat.ambientColor.set(r,g,b);
    mat.diffuseColor.set(r,g,b);
}

function populateScene() {
    // createGrid(scene);
    p24.createMeshes();
    p24.createInnerCells();
    // p24.showCell(p24.cells.length-1);

    /*
    let torus1 = [0,10,11,22,23];
    torus1.forEach(i=>{
        p24.innerCells[i].isVisible = true;
        setInnerCellColor(i, 0.2,0.5,0.8);
    })

    let torus2 = [13,15,4,16,6,18];
    */
    // p24.showTorus(0, new BABYLON.Color3(0.2,0.5,0.8));
    // p24.showTorus(1, new BABYLON.Color3(0.8,0.2,0.1)); // 0.8,0.75,0.1));
        

    let t = [2,9,17,3,12,20];

    /*
    let div = document.getElementById('cells-checkboxes');
    for(let i=0; i<24; i++) {
        let cb = document.createElement('input');
        cb.type = "checkbox";
        cb.id = "cb"+i;
        cb.name = "cb"+i;
        cb.checked = p24.innerCells[i].isVisible;
        div.appendChild(cb);
        cb.onchange = () => {
            p24.innerCells[i].isVisible = cb.checked;
            console.log(i);
        };
        if(i == 1 || i == 7) div.appendChild(document.createElement('br'));
    }
    */
    // gestione tasti
    /*
    scene.onKeyboardObservable.add((kbInfo) => {
        if(kbInfo.type == BABYLON.KeyboardEventTypes.KEYDOWN) {
            let key = kbInfo.event.key;
            if(key == 'd') incCurrentCell();
            else if(key == 'a') decCurrentCell();
        }
    });
    */


}

function uff(cb, i) {
    let colors = [
        new BABYLON.Color3(0.2,0.6,0.9),
        new BABYLON.Color3(0.8,0.75,0.1),
        new BABYLON.Color3(0.8,0.4,0.1),
        new BABYLON.Color3(0.9,0.1,0.8)
    ]
    if(cb.checked) p24.showTorus(i, colors[i]);
    else p24.hideTorus(i)
}