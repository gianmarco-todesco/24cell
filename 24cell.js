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
    scene.ambientColor.set(0.5,0.5,0.5)

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


function createVertex(p) {
    let vertexMat = new BABYLON.StandardMaterial('vertex-mat',scene);
    vertexMat.diffuseColor.set(0.1,0.1,0.1);
    let vertexMesh = BABYLON.MeshBuilder.CreateSphere('vertex', {diameter:0.1}, scene);
    vertexMesh.material = vertexMat;
    vertexMesh.position.copyFrom(p);
    return vertexMesh;
}

function createEdge(p1,p2) {
    let edgeMat = new BABYLON.StandardMaterial('edge-mat',scene);
    edgeMat.diffuseColor.set(0.1,0.4,0.8);
    let edgeMesh = BABYLON.MeshBuilder.CreateCylinder('vertex', {
        diameter:0.1, 
        height:1
    }, scene);
    edgeMesh.material = edgeMat;
    align(edgeMesh, p1,p2);
    return edgeMesh;
}

class Polyhedron {
    constructor(vertices, faces) {
        this.vertices = vertices;
        this.faces = faces;
        this._updateEdges();
        this._createMeshes();
    }
    _updateEdges() {
        this.edges = [];
        let edgeMap = {}
        let n = this.vertices.length;
        let edges = this.edges;
        this.faces.forEach(face => {
            for(let i=0; i<face.length; i++) {
                let a = face[i], b = face[(i+1)%face.length];
                if(!((a*n+b) in edgeMap)) {
                    edgeMap[a*n+b] = edgeMap[b*n+a] = edges.length;
                    edges.push([a,b])
                }
            }
        })
    }

    _createMeshes() {
        let vertexMeshes = this.vertexMeshes = [];
        this.vertices.forEach(vertex => {
            vertexMeshes.push(createVertex(vertex));
        })
        let edgeMeshes = this.edgeMeshes = [];
        let vertices = this.vertices;
        this.edges.forEach(([a,b]) => {
            edgeMeshes.push(createEdge(vertices[a], vertices[b]))
        })        
    }
};

const Vector3 = BABYLON.Vector3;

function createOctahedron(r) {
    let pts = [
        new Vector3(0,r,0),
        new Vector3(-r,0,0),
        new Vector3(0,0,-r),
        new Vector3(r,0,0),
        new Vector3(0,0,r),
        new Vector3(0,-r,0)
    ];
    let faces = [
        [0,1,2],[0,2,3],[0,3,4],[0,4,1],[5,2,1],[5,3,2],[5,4,3],[5,1,4]
    ];
    return new Polyhedron(pts, faces);
}

function createCubeoctahedron(r) {
    const squareEdge = Math.sqrt(2)*r;
    let y = Math.sqrt(2)*squareEdge/2;
    let pts = [
        // quadrato superiore
        new Vector3(-r,y,0),
        new Vector3(0,y,-r),
        new Vector3(r,y,0),
        new Vector3(0,y,r),
        // quadrato inferiore
        new Vector3(-r,-y,0),
        new Vector3(0,-y,-r),
        new Vector3(r,-y,0),
        new Vector3(0,-y,r),
        // equatore
        new Vector3(-r,0,-r),
        new Vector3( r,0,-r),
        new Vector3( r,0, r),
        new Vector3(-r,0, r)    
    ];
    let faces = [
        [0,1,2,3],
        [0,11,4,8],
        [1,8,5,9],
        [2,9,6,10],
        [3,10,7,11],
        [4,7,6,5],
    ]
    return new Polyhedron(pts, faces)
}

class TriangleMesh {
    constructor(pts) {
        let positions = []
        pts.forEach(p => positions.push(p.x,p.y,p.z,p.x,p.y,p.z));
        let normals = [];
        let indices = [];
        for(let i=0;i+5<positions.length;i+=6) {
            indices.push(i,i+2,i+4,i+1,i+5,i+3);
        }
        let vertexData = new BABYLON.VertexData();
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);      
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
        
        this.mesh = new BABYLON.Mesh('mesh');
        vertexData.applyToMesh(this.mesh);    
        this.mesh.material = new BABYLON.StandardMaterial('mat')
        this.mesh.material.ambientColor.set(0.8,0.9,0.95);
        
        this.mesh.material.diffuseColor.set(0.8,0.9,0.95);
        this.mesh.material.specularColor.set(0.01,0.01,0.01);
        this.mesh.material.alpha = 0.5;
    }
}

let innerOct, outerOct, cubOct, crossEdges1, crossEdges2;
let edgesTable= {};

function populateScene() {
    // createGrid(scene);

    outerOct = createOctahedron(5);
    edgesTable["outerOct"] = outerOct.edgeMeshes;

    // oct1.edgeMeshes.forEach(mesh=>mesh.material.diffuseColor.set(0.8,0.75,0.1));
    innerOct = createOctahedron(1);
    edgesTable["innerOct"] = innerOct.edgeMeshes;

    // oct2.edgeMeshes.forEach(mesh=>mesh.material.diffuseColor.set(0.4,0.2,0.9));
    cubOct = createCubeoctahedron(1.7);
    edgesTable["cubOct"] = cubOct.edgeMeshes;

    let cross = edgesTable["cross"] = [];
    crossEdges1 = [];
    crossEdges2 = [];

    for(let i=0; i<6; i++) {
        let p1 = outerOct.vertices[i];
        let p2 = innerOct.vertices[i];
        for(let j=0; j<4; j++) {
            let p3 = cubOct.vertices[cubOct.faces[i][j]];
            let e13 = createEdge(p1,p3);
            let e23 = createEdge(p2,p3);
            
            crossEdges1.push(e13);
            crossEdges2.push(e23);
            cross.push(e13, e23);
        }
    }
    //crossEdges1.forEach(mesh=>mesh.material.diffuseColor.set(0.2,0.85,0.3));
    //crossEdges2.forEach(mesh=>mesh.material.diffuseColor.set(0.85,0.4,0.35));
    

    // mat = new BABYLON.StandardMaterial('a');
    // crossEdges1.forEach(mesh=>mesh.material = mat);

    let oct1 = outerOct, oct2 = innerOct, cub = cubOct;
    new TriangleMesh(
        [
            oct1.vertices[0], oct1.vertices[1], oct1.vertices[2],
            cub.vertices[1],cub.vertices[0],cub.vertices[8],
            oct2.vertices[0], oct2.vertices[1], oct2.vertices[2],
            
            oct2.vertices[5], oct2.vertices[3], oct2.vertices[4],
            cub.vertices[7],cub.vertices[6],cub.vertices[10],
            
            oct1.vertices[3], oct1.vertices[4], oct1.vertices[5],
            
        ])

    /*
    
    links2.forEach(([a,b])=>createEdge(pts2[a],pts2[b]))
*/
    /*
    // creo le palline
    let vertexMat = new BABYLON.StandardMaterial('vertex-mat',scene);
    vertexMat.diffuseColor.set(0.1,0.1,0.5);

    let vertices = pts.map((p,i)=>{
        let ball = BABYLON.MeshBuilder.CreateSphere('ball'+i, {diameter:0.5}, scene);
        ball.material = vertexMat;
        ball.position.copyFrom(p);
        return ball;
    })

    // creo i legami fra le palline
    let edgeMat = new BABYLON.StandardMaterial('edge-mat',scene);
    edgeMat.diffuseColor.set(0.1,0.4,0.7);
    links.forEach(([a,b],i) => {
        let pa = pts[a];
        let pb = pts[b];
        let edge = BABYLON.CreateCylinder('edge'+i, {
            diameter:0.25,
            height:1
        }, scene);
        align(edge, pa, pb);        
    });
    */



}

function changeColor(widget) {
    let color = BABYLON.Color3.FromHexString(widget.value);
    let name = widget.name;
    let edges = edgesTable[name];
    if(edges) {
        edges.forEach(mesh=>mesh.material.diffuseColor.copyFrom(color));
    }
}
