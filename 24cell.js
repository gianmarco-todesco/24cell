
'use strict';


function createVertex(p) {
    let vertexMat = new BABYLON.StandardMaterial('vertex-mat',scene);
    vertexMat.diffuseColor.set(0.1,0.1,0.1);
    let vertexMesh = BABYLON.MeshBuilder.CreateSphere('vertex', {
        diameter:0.05}, scene);
    vertexMesh.material = vertexMat;
    vertexMesh.position.copyFrom(p);
    return vertexMesh;
}

function createEdge(p1,p2) {
    let edgeMat = new BABYLON.StandardMaterial('edge-mat',scene);
    edgeMat.diffuseColor.set(0.2,0.6,0.7);
    let edgeMesh = BABYLON.MeshBuilder.CreateCylinder('vertex', {
        diameter:0.08, 
        height:1
    }, scene);
    edgeMesh.material = edgeMat;
    align(edgeMesh, p1,p2);
    return edgeMesh;
}

function createLineEdge(p1, p2) {
    let edgeLine = BABYLON.CreateLines('a', {points:[p1,p2]})
    edgeLine.color.set(0.3,0.4,0.5);
    return edgeLine;
}

function createTriangle(p1,p2,p3) {
    let mesh = new BABYLON.Mesh('triangle');
    let positions = [];
    let pts = [p1,p2,p3,p1,p2,p3];
    pts.forEach(p=>{
        positions.push(p.x,p.y,p.z)
    });
    let indices = [0,1,2,3,5,4];
    let vertexData = new BABYLON.VertexData();
    let normals = [];
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);      
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.applyToMesh(mesh);    
    let material = mesh.material = new BABYLON.StandardMaterial('mat')
    material.ambientColor.set(0.8,0.9,0.25);        
    material.diffuseColor.set(0.8,0.9,0.25);        
    material.diffuseColor.set(0.2,0.2,0.25);        
    material.alpha = 0.5;
    return mesh;
}

function createInnerOctFaces(points) {
    let center = new BABYLON.Vector3(0,0,0);
    points.forEach(p=>center.addInPlace(p));
    center.scaleInPlace(1/points.length);
    points = points.map(p=>
        BABYLON.Vector3.Lerp(center, p, 0.9));
    let mesh = new BABYLON.Mesh('innerOct');
    let positions = [];
    points.forEach(p=>{
        positions.push(p.x,p.y,p.z)
    });
    let indices = [0,1,2,0,2,3,0,3,4,0,4,1,5,2,1,5,3,2,5,4,3,5,1,4];
    let vertexData = new BABYLON.VertexData();
    //let normals = [];
    //BABYLON.VertexData.ComputeNormals(positions, indices, normals);      
    vertexData.positions = positions;
    vertexData.indices = indices;
    // vertexData.normals = normals;
    vertexData.applyToMesh(mesh);    
    let material = mesh.material = new BABYLON.StandardMaterial('mat')
    material.ambientColor.set(0.8,0.9,0.25);        
    material.diffuseColor.set(0.8,0.9,0.25);        
    material.specularColor.set(0.1,0.1,0.1);        
    // material.alpha = 0.75;
    return mesh;
}


class P24 {
    constructor(vertices, faces, cells) {
        this.vertices = vertices;
        this.hFaces = faces;
        this.cells = cells;
        this._updateFaces();
        this._updateEdges();
        this.toruses = [
            [0,10,11,22,23],
            [13,15,4,16,6,18],
            [2,9,17,3,12,20],
            [5,7,8,14,21,19]
        ];
        this._createEdgesGroups();
    }

    _updateFaces() {
        let hFaces = this.hFaces;
        let faceMap = {}
        let faces = this.faces_ = [];
        let hFacesToFaces = this.hFacesToFaces = [];
        hFaces.forEach(hFace => {
            let v = hFace.map(x=>x).sort();
            let faceId = `${v}`;
            let j = faceMap[faceId];
            if(j===undefined) {
                j = faces.length;
                faces.push(v);
                faceMap[faceId] = j;
            }
            hFacesToFaces.push(j);
        })        
    }

    _updateEdges() {
        this.edges = [];
        let edgeMap = {}
        let n = this.vertices.length;
        let edges = this.edges;
        this.faces_.forEach(face => {
            for(let i=0; i<face.length; i++) {
                let a = face[i], b = face[(i+1)%face.length];
                if(!((a*n+b) in edgeMap)) {
                    edgeMap[a*n+b] = edgeMap[b*n+a] = edges.length;
                    edges.push([a,b])
                }
            }
        })
    }

    _createEdgesGroups() {
        let edgesGroups = this.edgesGroups = [[],[],[],[],[],[]];
        const getVGroup = (v) => {
            if(v<6) return 0;
            else if(v<12) return 1;
            else return 2;
        } 
        this.edges.forEach(([a,b],i) => {
            let ga = getVGroup(a);
            let gb = getVGroup(b);
            if(ga==0 && gb==0)
                this.edgesGroups[0].push(i); // primo oct
            else if(ga==1 && gb==1)
               this.edgesGroups[1].push(i); // secondo oct
            else if(ga==2 && gb==2)
               this.edgesGroups[2].push(i); // cuboct
            else 
               this.edgesGroups[3].push(i); // oct2/cuboct
        });
    }
    createMeshes() {
        // vertices
        // this.vertexMeshes = this.vertices.map(p=>createVertex(p))

        // edges
        let vertices = this.vertices;
        this.edgeMeshes = this.edges.map(([a,b]) => createEdge(vertices[a], vertices[b]));
        this.edgeLines = this.edges.map(([a,b]) => createLineEdge(vertices[a], vertices[b]));
        this.edgeMeshes.forEach(mesh=>mesh.isVisible=false)
        this.edgeLines.forEach(line=>line.isVisible=false)
        
        // faces
        let faceMeshes = this.faceMeshes = this.faces_.map(face => 
            createTriangle(...face.map(i => vertices[i])));
        faceMeshes.forEach(mesh => mesh.isVisible = false)        
    }

    createInnerCells() {
        this.innerCells = [];
        for(let i=0;i<this.cells.length;i++) {
            let oct = createInnerOctFaces(this.getCellPoints(i));
            oct.isVisible = false
            this.innerCells.push(oct);
        }

    }

    getCellFaces(i) {
        return this.cells[i].map(j=>this.hFacesToFaces[j]);
    }

    showCell(i) {
        this.getCellFaces(i).forEach(j=>this.faceMeshes[j].isVisible = true);
    }
    hideCell(i) {
        this.getCellFaces(i).forEach(j=>this.faceMeshes[j].isVisible = false);
    }
    hideFaces() {
        this.faceMeshes.forEach(mesh=>mesh.isVisible=false)
    }

    getCellPoints(i) {
        let hFaces = this.cells[i].map(j=>this.hFaces[j]);
        let links = new Set();
        let vertices = new Set();
        const M = 10000;
        const linkid = (a,b) => a>=b ? a*M+b : b*M+a;
        hFaces.forEach(([a,b,c]) => {
            vertices.add(a);
            vertices.add(b);
            vertices.add(c);
            links.add(linkid(a,b))
            links.add(linkid(a,c))
            links.add(linkid(b,c))
        })
        const linked = (a,b) => links.has(linkid(a,b));        
        vertices = Array.from(vertices);
        let [v0,v1,v2] = hFaces[0];        
        let vv = vertices.filter(v=>(v!=v0 && v!=v1 && v!=v2 && linked(v0,v)))
        let [v3,v4] = linked(vv[0],v2) ? vv : [vv[1],vv[0]];
        let v5 = vertices.find(v=>!(new Set([v0,v1,v2,v3,v4])).has(v));
        let pts = [v0,v1,v2,v3,v4,v5].map(j=>this.vertices[j]);
        let center = new BABYLON.Vector3(0,0,0);
        pts.forEach(p=>center.addInPlace(p));
        center.scaleInPlace(1.0/pts.length);
        let nrm1 = BABYLON.Vector3.Cross(
            pts[2].subtract(pts[0]),
            pts[1].subtract(pts[0]));
        if(BABYLON.Vector3.Dot(nrm1, pts[0].subtract(center)) < 0.0) {
            let p1 = pts[1], p3 = pts[3];
            pts[1] = p3;
            pts[3] = p1;
        }
        return pts;
    }

    showTorus(i, color) {
        let cells = this.toruses[i];
        cells.forEach(c => {
            this.innerCells[c].isVisible = true;
            let material = this.innerCells[c].material;
            material.ambientColor.copyFrom(color);
            material.diffuseColor.copyFrom(color);             
        });        
    }
    hideTorus(i) {
        let cells = this.toruses[i];
        cells.forEach(c=>this.innerCells[c].isVisible = false);
    }

} 


P24.create24Cell = function (r1, r2, r3) {

    let vertices = [];
    let faces = [];
    let cells = [];
    function addVertex(x,y,z) {
        let i = vertices.length;
        vertices.push(new BABYLON.Vector3(x,y,z));
        return i;
    }
    function addFace(vv) {
        let i = faces.length;
        faces.push(vv);
        return i;
    }
    function addOct(r) {
        let ii = [[0,r,0],[-r,0,0],[0,0,-r],[r,0,0],[0,0,r],[0,-r,0]].map(([x,y,z]) => addVertex(x,y,z));
        let ff = [[0,1,2],[0,2,3],[0,3,4],[0,4,1],[5,2,1],[5,3,2],[5,4,3],[5,1,4]].map(vv=>addFace(vv.map(i=>ii[i])));
        cells.push(ff);
        return ff;
    }
    function addCubOct(r) {
        const squareEdge = Math.sqrt(2)*r;
        let y = Math.sqrt(2)*squareEdge/2;
        let ii = [
            // quadrato superiore
            [-r,y,0],[0,y,-r],[r,y,0],[0,y,r],
            // quadrato inferiore
            [-r,-y,0],[0,-y,-r],[r,-y,0],[0,-y,r],
            // equatore
            [-r,0,-r],[r,0,-r],[r,0,r],[-r,0,r],
        ].map(([x,y,z]) => addVertex(x,y,z));
        [
            [0,8,1],[1,9,2],[2,10,3],[3,11,0],
            [5,8,4],[6,9,5],[7,10,6],[4,11,7],
            
        ].map(vv=>addFace(vv.map(i=>ii[i])));

    }
    function addOctFaces(i0,i1,i2,i3,i4,i5) {
        let ii = [i0,i1,i2,i3,i4,i5];
        let ff = [];
        for(let i=0;i<4;i++) {
            let i1 = (i+1)%4;
            ff.push(addFace([0,1+i,1+i1].map(j=>ii[j])));
            ff.push(addFace([5,1+i1,1+i].map(j=>ii[j])));
        }
        cells.push(ff);
        return ff;
    }


    addOct(r1);
    addOct(r3);
    addCubOct(r2);

    // cuboct squares
    let quads = [
        [12,13,14,15],
        [19,18,17,16],
        [12,23,16,20],
        [13,20,17,21],
        [14,21,18,22],
        [15,22,19,23] 
    ]

    addOctFaces(6,...quads[0],0)
    addOctFaces(11,...quads[1],5)
    addOctFaces(7,...quads[2],1)
    addOctFaces(8,...quads[3],2)
    addOctFaces(9,...quads[4],3)
    addOctFaces(10,...quads[5],4)

    // cuboct triangles
    let triangles = [
        [12,20,13],
        [13,21,14],
        [14,22,15],
        [15,23,12],
        
        [17,20,16],
        [18,21,17],
        [19,22,18],
        [16,23,19]
        
    ]
    for(let i=0; i<4; i++) {
        addOctFaces(...triangles[i], ...faces[8+i])
        addOctFaces(...triangles[i], ...faces[i])
    }
    for(let i=0; i<4; i++) {
        addOctFaces(...triangles[4+i], ...faces[8+4+i])
        addOctFaces(...triangles[4+i], ...faces[4+i])
    }

    let p24 = new P24(vertices, faces, cells);

    return p24;
}

