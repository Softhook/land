
// --- Global Settings & State ---
let currentTileDefName;
let currentTileDefKeys = [];
let currentRotation = 0;
let placedTiles; // Map: key "x,y" -> Tile object
const GRID_TYPE = "square"; // Hardcoded to square
const TILE_SIZE = 50;

let camX = 0;
let camY = 0;
const PAN_SPEED = 10;

// --- Tile Definitions (Squares Only) ---
const TILE_DEFINITIONS = {
  "grass": {
    type: "square",
    color: [120, 60, 70], // Green
    connections: ["G", "G", "G", "G"], // Top, Right, Bottom, Left
  },
  "road_straight_LR": {
    type: "square",
    color: [120, 60, 60], // Grass Green background
    connections: ["G", "R", "G", "R"], // Grass Top/Bottom, Road Right/Left
    drawPattern: (size) => {
      fill(0,0,30); noStroke(); // Dark grey road
      rectMode(CENTER);
      rect(0, 0, size, size / 3);
    }
  },
  "road_straight_TB": {
    type: "square",
    color: [120, 60, 60], // Grass Green background
    connections: ["R", "G", "R", "G"], // Road Top/Bottom, Grass Right/Left
    drawPattern: (size) => {
      fill(0,0,30); noStroke(); // Dark grey road
      rectMode(CENTER);
      rect(0, 0, size / 3, size);
    }
  },
  "road_corner_TR": { // Road Top & Right
    type: "square",
    color: [120, 60, 60], // Grass Green background
    connections: ["R", "R", "G", "G"], 
    drawPattern: (size) => {
      fill(0,0,30); noStroke(); // Dark grey road
      rectMode(CORNER); // Use CORNER for easier path drawing from center
      // Path: Top segment then Right segment
      // Remember canvas is rotated, so 0,0 is center of tile
      // Top part: from (-size/6, -size/2) to (size/6, -size/6)
      // Right part: from (size/6, -size/6) to (size/2, size/6)
      // For simplicity, draw two overlapping rects from center outwards
      rectMode(CENTER);
      rect(0, -size / 4, size / 2, size / 2); // Covers top-left and top-right quadrants partially
      rect(size / 4, 0, size / 2, size / 2); // Covers top-right and bottom-right quadrants partially
      
      // A more precise L-shape for corner
      // fill(0,0,30); noStroke();
      // beginShape();
      // vertex(-size/6, -size/2); // Top-left of vertical bar
      // vertex(size/6, -size/2);  // Top-right of vertical bar
      // vertex(size/6, -size/6);  // Bottom-right of vertical, inner corner
      // vertex(size/2, -size/6);  // Inner-top of horizontal bar
      // vertex(size/2, size/6);   // Outer-bottom of horizontal bar
      // vertex(-size/6, size/6);  // Outer-left of "imaginary" bottom of L
      // endShape(CLOSE);
      // This is still tricky due to rotation. The two rects are simpler.
    }
  },
  "water_full": {
    type: "square",
    color: [200, 70, 80], // Blue
    connections: ["W", "W", "W", "W"],
  },
  "water_grass_split_TB": { // Water Top, Grass Bottom
    type: "square",
    color: [120,60,70], // Default to grass, pattern will draw water
    connections: ["W", "G", "G", "G"], // T=W, R=G, B=G, L=G (adjust G as needed)
    drawPattern: (size) => {
      noStroke();
      fill(TILE_DEFINITIONS.water_full.color); // Water color
      rectMode(CORNER); // Relative to top-left of the (rotated) tile's 0,0 center
      rect(-size/2, -size/2, size, size/2); // Top half
    }
  },
  "water_grass_split_LR": { // Water Left, Grass Right
    type: "square",
    color: [120,60,70], // Default to grass
    connections: ["G", "G", "G", "W"], // T=G, R=G, B=G, L=W
    drawPattern: (size) => {
      noStroke();
      fill(TILE_DEFINITIONS.water_full.color);
      rectMode(CORNER);
      rect(-size/2, -size/2, size/2, size); // Left half
    }
  },
   "water_road_straight_TB": { // Water Top, Road-Straight (TB) on Grass Bottom
    type: "square",
    color: [120, 60, 60], // Grass Green background
    connections: ["W", "G", "R", "G"], // Water Top, Grass Right, Road Bottom, Grass Left
    drawPattern: (size) => {
      noStroke();
      // Water Top
      fill(TILE_DEFINITIONS.water_full.color);
      rectMode(CORNER);
      rect(-size/2, -size/2, size, size/2); // Top half is water

      // Road on bottom half (on top of the grass base color)
      fill(0,0,30); // Dark grey road
      rectMode(CENTER); // Road part relative to center of tile
      // Road is on bottom, so its center is at y = size/4
      rect(0, size/4, size/3, size/2); // Vertical road strip on bottom half
    }
  },
  "any_square": { // Wildcard tile
    type: "square",
    color: [300, 70, 80], // Purple
    connections: ["*", "*", "*", "*"],
  }
};

// --- Tile Class ---
class Tile {
  constructor(tileId, gridX, gridY, rotation = 0) {
    this.id = tileId; 
    this.definition = TILE_DEFINITIONS[tileId];
    if (!this.definition) this.definition = TILE_DEFINITIONS[Object.keys(TILE_DEFINITIONS)[0]];
    this.gridX = gridX; 
    this.gridY = gridY; 
    this.rotation = parseInt(rotation) || 0; 
    this.type = this.definition.type; // Should always be "square" now
  }

  getConnections() { // Square specific
    const base = this.definition.connections; 
    const numSides = 4; // Squares have 4 sides
    const rotated = []; 
    let r = this.rotation;
    for (let i = 0; i < numSides; i++) { 
      let originalIndex = (i - r + numSides * 1000) % numSides; 
      rotated[i] = String(base[originalIndex]);
    }
    return rotated; 
  }
}

// --- Grid Constants & Helpers (Squares Only) ---
const SQUARE_DIRECTIONS = [ { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 } ]; // T, R, B, L
const SQUARE_OPPOSITE_EDGE_MAP = [2, 3, 0, 1]; // Opposite of T(0) is B(2), R(1) is L(3), etc.

function gridToPixel(gx, gy) { // Square only
  let px = gx * TILE_SIZE + TILE_SIZE / 2; 
  let py = gy * TILE_SIZE + TILE_SIZE / 2;
  return { x: px + camX, y: py + camY };
}

function pixelToGrid(mx, my) { // Square only
  const worldMx = mx - camX; 
  const worldMy = my - camY;
  let gx = floor(worldMx / TILE_SIZE); 
  let gy = floor(worldMy / TILE_SIZE);
  return { x: gx, y: gy };
}

// --- Game Logic ---
function canPlaceTileAt(tileToPlace, gridX, gridY) {
  const key = `${gridX},${gridY}`;
  if (placedTiles.has(key)) return false;

  const newTileConnections = tileToPlace.getConnections(); 
  let placementAllowed = true; 
  
  for (let i = 0; i < 4; i++) { // Iterate 4 sides for a square
    const dir = SQUARE_DIRECTIONS[i]; 
    const neighborX = gridX + dir.dx;
    const neighborY = gridY + dir.dy;
    const neighborKey = `${neighborX},${neighborY}`;

    if (placedTiles.has(neighborKey)) {
      const neighborTile = placedTiles.get(neighborKey);
      // No need to check neighborTile.type, should always be "square"

      const neighborConnections = neighborTile.getConnections(); 
      const newTileEdgeType = newTileConnections[i]; 
      const neighborFacingEdgeIndex = SQUARE_OPPOSITE_EDGE_MAP[i]; 
      const neighborEdgeType = neighborConnections[neighborFacingEdgeIndex]; 

      const isMismatchCondition = (newTileEdgeType !== '*' && neighborEdgeType !== '*' && newTileEdgeType !== neighborEdgeType);
      
      if (isMismatchCondition) {
        // console.log(`Mismatch: New ${tileToPlace.id} S${i} (${newTileEdgeType}) vs Neigh ${neighborTile.id} S${neighborFacingEdgeIndex} (${neighborEdgeType})`);
        placementAllowed = false;
        break; 
      }
    }
  }
  return placementAllowed;
}

function placeTile(tileId, gridX, gridY, rotation) {
  const tile = new Tile(tileId, gridX, gridY, rotation);
  // No need to check tile.definition.type, should always be "square"
  if (canPlaceTileAt(tile, gridX, gridY)) { 
    placedTiles.set(`${gridX},${gridY}`, tile);
  }
}

function cycleTileType() {
  // No need to filter by GRID_TYPE as it's always square
  currentTileDefKeys = Object.keys(TILE_DEFINITIONS); 
  if (currentTileDefKeys.length === 0) return;
  let currentIndex = currentTileDefKeys.indexOf(currentTileDefName);
  currentTileDefName = currentTileDefKeys[(currentIndex + 1) % currentTileDefKeys.length];
  currentRotation = 0;
}

function resetGame() {
  placedTiles = new Map();
  currentTileDefKeys = Object.keys(TILE_DEFINITIONS); // All tiles are square
  currentTileDefName = currentTileDefKeys.length > 0 ? currentTileDefKeys[0] : null;
  currentRotation = 0;
  camX = width/2; camY = height/2;
  console.clear();
  console.log("Game Reset (Square Grid Only).");
}

// --- Drawing Functions ---
function drawTileObject(tile, screenX, screenY, size, isPreview = false, isValidPlacement = true) {
  push();
  translate(screenX, screenY);
  rotate(tile.rotation * HALF_PI); // Square rotation

  if (isPreview) {
    fill(tile.definition.color[0], tile.definition.color[1], tile.definition.color[2], 50);
    strokeWeight(3); stroke(isValidPlacement ? [120, 100, 100] : [0, 100, 100]);
  } else {
    fill(tile.definition.color); stroke(0, 0, 20); strokeWeight(1);
  }
  
  rectMode(CENTER); // Base shape
  square(0, 0, size); 
  
  // Call drawPattern if it exists (relative to tile's center, already rotated context)
  if (tile.definition.drawPattern) {
    tile.definition.drawPattern(size, tile.definition.connections, tile.definition, tile.rotation);
  }
  
  // Draw connection labels (T, R, B, L in current orientation)
  const effectiveConnections = tile.definition.connections; // Use original connections since canvas is already rotated
  fill(0,0,0, isPreview ? 128: 255); noStroke();
  textAlign(CENTER, CENTER); textSize(size * 0.2);
  if(effectiveConnections[0]) text(effectiveConnections[0],0,-size*0.35);      // Top
  if(effectiveConnections[1]) text(effectiveConnections[1],size*0.35,0);       // Right
  if(effectiveConnections[2]) text(effectiveConnections[2],0,size*0.35);       // Bottom
  if(effectiveConnections[3]) text(effectiveConnections[3],-size*0.35,0);      // Left
  pop();
}

// --- p5.js Lifecycle Functions ---
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100); textFont('monospace');
  resetGame();
}

function draw() {
  background(220, 10, 95); 
  for (const tile of placedTiles.values()) {
    const {x:sX,y:sY}=gridToPixel(tile.gridX,tile.gridY);
    if(sX>-TILE_SIZE*2 && sX<width+TILE_SIZE*2 && sY>-TILE_SIZE*2 && sY<height+TILE_SIZE*2) drawTileObject(tile,sX,sY,TILE_SIZE);
  }
  if (currentTileDefName) { 
    const currentDef=TILE_DEFINITIONS[currentTileDefName];
    // No need to check currentDef.type, all are square
    const tempPrevTile=new Tile(currentTileDefName,0,0,currentRotation);
    const mouseGridPos=pixelToGrid(mouseX,mouseY);
    const {x:pSX,y:pSY}=gridToPixel(mouseGridPos.x,mouseGridPos.y);
    const isValid=canPlaceTileAt(tempPrevTile,mouseGridPos.x,mouseGridPos.y);
    drawTileObject(tempPrevTile,pSX,pSY,TILE_SIZE,true,isValid);
  }
  fill(0,0,0); textSize(16); textAlign(LEFT,TOP);
  text(`Tile: ${currentTileDefName||"N"} (T)\nRot: ${currentRotation*90} (R)\nPlace. Pan. (C)lear.`,10,10);
}

function mousePressed() {
  if (mouseButton===LEFT&&currentTileDefName) {
    // No need to check def.type
    const gridPos=pixelToGrid(mouseX,mouseY);
    placeTile(currentTileDefName,gridPos.x,gridPos.y,currentRotation);
  }
}

function keyPressed() {
  if (key==='t'||key==='T') cycleTileType();
  else if (key==='r'||key==='R') currentRotation=(currentRotation+1)%4; // Squares have 4 rotations
  // else if (key==='g'||key==='G') { /* Grid switching removed */ } 
  else if (key==='c'||key==='C') resetGame();
  else if (keyCode===UP_ARROW)camY+=PAN_SPEED*3; 
  else if(keyCode===DOWN_ARROW)camY-=PAN_SPEED*3;
  else if (keyCode===LEFT_ARROW)camX+=PAN_SPEED*3; 
  else if(keyCode===RIGHT_ARROW)camX-=PAN_SPEED*3;
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
