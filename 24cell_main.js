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

let p24 = P24.create24Cell(0.7,1.2,5);

class EdgeStyle {
    constructor(name) {
        this.name = name;
    }
    setEdges(edges) {
        if(!p24.edgeMeshes || !p24.edgeLines) return;
        edges.forEach(i => this.style(p24.edgeLines[i], p24.edgeMeshes[i]));
    }
}

class InvisibleEdgeStyle extends EdgeStyle {
    constructor(name) {
        super(name);
    }
    style(line, mesh) {
        line.isVisible = mesh.isVisible = false;
    }
}

class LineEdgeStyle extends EdgeStyle {
    constructor(name, r,g,b) {
        super(name);
        this.color = new BABYLON.Color3(r,g,b);
    }
    style(line, mesh) {
        line.isVisible = true;
        mesh.isVisible = false;
        line.color.copyFrom(this.color);
    }
}


class TubeEdgeStyle extends EdgeStyle {
    constructor(name, r,g,b) {
        super(name);
        this.color = new BABYLON.Color3(r,g,b);
    }
    style(line, mesh) {
        line.isVisible = false;
        mesh.isVisible = true;
        mesh.material.diffuseColor.copyFrom(this.color);
        mesh.material.ambientColor.copyFrom(this.color);
    }
}
let edgeStyles = {
    '0': new InvisibleEdgeStyle("No"),

    '1': new LineEdgeStyle("Linea nera", 0.1,0.1,0.1),
    '2': new LineEdgeStyle("Linea bianca",0.9,0.9,0.9),
    '3': new LineEdgeStyle("Linea rossa",0.9,0.1,0.1),
    '4': new LineEdgeStyle("Linea magenta",0.9,0.1,0.9),

    '5': new TubeEdgeStyle("Tubo azzurro",0.1,0.6,0.9),
    '6': new TubeEdgeStyle("Tubo giallo",0.6,0.6,0.1),
    '7': new TubeEdgeStyle("Tubo arancio",0.9,0.45,0.1),

}

function changeEdgeStyle(cb) {
    console.log(cb);
    let tb = {
        'oct1' : p24.edgesGroups[0],
        'oct2' : p24.edgesGroups[1],
        'cuboct' : p24.edgesGroups[2],
        'link' : p24.edgesGroups[3],
               
    };
    let edges = tb[cb.id];
    let style = edgeStyles[cb.value];
    console.log(cb.id, edges)
    if(style === undefined || edges === undefined) return;
    style.setEdges(edges);    
    console.log(cb);
}

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

    updateGui();


}

function updateGui() {
    document.querySelectorAll(".edge-color").forEach(menu => {
        Object.keys(edgeStyles).forEach(key => {
            let s = document.createElement('option');
            s.value = key;
            s.innerHTML = edgeStyles[key].name;
            menu.appendChild(s);
        })
    })
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