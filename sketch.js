
// --- Global State ---
let currentTileDefName, currentRotation = 0, placedTiles;
const TILE_SIZE = 50, PAN_SPEED = 10;
let camX = 0, camY = 0;

// --- Tile Definitions ---
const TILE_DEFINITIONS = {
  grass: { color: [120, 60, 70], connections: ["G", "G", "G", "G"] },
  road_straight_LR: {
    color: [120, 60, 60], connections: ["G", "R", "G", "R"],
    drawPattern: size => { fill(0, 0, 30); noStroke(); rect(0, 0, size, size / 3); }
  },
  road_straight_TB: {
    color: [120, 60, 60], connections: ["R", "G", "R", "G"],
    drawPattern: size => { fill(0, 0, 30); noStroke(); rect(0, 0, size / 3, size); }
  },
  road_corner_TR: {
    color: [120, 60, 60], connections: ["R", "R", "G", "G"],
    drawPattern: size => {
      fill(0, 0, 30); noStroke(); rectMode(CENTER);
      rect(0, -size / 4, size / 2, size / 2);
      rect(size / 4, 0, size / 2, size / 2);
    }
  },
  water_full: { color: [200, 70, 80], connections: ["W", "W", "W", "W"] },
  water_grass_split_TB: {
    color: [120, 60, 70], connections: ["W", "G", "G", "G"],
    drawPattern: size => {
      noStroke(); fill(TILE_DEFINITIONS.water_full.color);
      rectMode(CORNER); rect(-size / 2, -size / 2, size, size / 2);
    }
  },
  water_grass_split_LR: {
    color: [120, 60, 70], connections: ["G", "G", "G", "W"],
    drawPattern: size => {
      noStroke(); fill(TILE_DEFINITIONS.water_full.color);
      rectMode(CORNER); rect(-size / 2, -size / 2, size / 2, size);
    }
  },
  water_road_straight_TB: {
    color: [120, 60, 60], connections: ["W", "G", "R", "G"],
    drawPattern: size => {
      noStroke();
      fill(TILE_DEFINITIONS.water_full.color);
      rectMode(CORNER); rect(-size / 2, -size / 2, size, size / 2);
      fill(0, 0, 30); rectMode(CENTER);
      rect(0, size / 4, size / 3, size / 2);
    }
  },
  any_square: { color: [300, 70, 80], connections: ["*", "*", "*", "*"] }
};

// --- Tile Class ---
class Tile {
  constructor(id, gridX, gridY, rotation = 0) {
    Object.assign(this, { id, gridX, gridY, rotation: parseInt(rotation) || 0 });
    this.definition = TILE_DEFINITIONS[id] || TILE_DEFINITIONS[Object.keys(TILE_DEFINITIONS)[0]];
  }

  getConnections() {
    const { connections } = this.definition;
    return Array.from({ length: 4 }, (_, i) => 
      connections[(i - this.rotation + 4000) % 4]
    );
  }
}

// --- Grid Constants ---
const DIRECTIONS = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
const OPPOSITE_MAP = [2, 3, 0, 1];

// --- Utility Functions ---
const gridToPixel = (gx, gy) => ({ 
  x: gx * TILE_SIZE + TILE_SIZE / 2 + camX, 
  y: gy * TILE_SIZE + TILE_SIZE / 2 + camY 
});

const pixelToGrid = (mx, my) => ({ 
  x: floor((mx - camX) / TILE_SIZE), 
  y: floor((my - camY) / TILE_SIZE) 
});

// --- Game Logic ---
function canPlaceTileAt(tile, gridX, gridY) {
  const key = `${gridX},${gridY}`;
  if (placedTiles.has(key)) return false;

  const newConnections = tile.getConnections();
  
  return DIRECTIONS.every((dir, i) => {
    const neighborKey = `${gridX + dir.dx},${gridY + dir.dy}`;
    if (!placedTiles.has(neighborKey)) return true;
    
    const neighbor = placedTiles.get(neighborKey);
    const [newEdge, neighborEdge] = [
      newConnections[i], 
      neighbor.getConnections()[OPPOSITE_MAP[i]]
    ];
    
    return newEdge === '*' || neighborEdge === '*' || newEdge === neighborEdge;
  });
}

const placeTile = (id, gridX, gridY, rotation) => {
  const tile = new Tile(id, gridX, gridY, rotation);
  if (canPlaceTileAt(tile, gridX, gridY)) {
    placedTiles.set(`${gridX},${gridY}`, tile);
  }
};

const cycleTileType = () => {
  const keys = Object.keys(TILE_DEFINITIONS);
  const currentIndex = keys.indexOf(currentTileDefName);
  currentTileDefName = keys[(currentIndex + 1) % keys.length];
  currentRotation = 0;
};

const resetGame = () => {
  placedTiles = new Map();
  const keys = Object.keys(TILE_DEFINITIONS);
  currentTileDefName = keys[0];
  currentRotation = 0;
  [camX, camY] = [width / 2, height / 2];
  console.clear();
  console.log("Game Reset");
};

// --- Drawing ---
function drawTileObject(tile, x, y, size, isPreview = false, isValid = true) {
  push();
  translate(x, y);
  rotate(tile.rotation * HALF_PI);

  // Base tile
  const alpha = isPreview ? 50 : 100;
  fill(...tile.definition.color, alpha);
  stroke(isPreview ? (isValid ? [120, 100, 100] : [0, 100, 100]) : [0, 0, 20]);
  strokeWeight(isPreview ? 3 : 1);
  rectMode(CENTER);
  square(0, 0, size);

  // Pattern
  tile.definition.drawPattern?.(size);

  // Connection labels
  const connections = tile.definition.connections;
  fill(0, 0, 0, isPreview ? 128 : 255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(size * 0.2);
  
  connections.forEach((conn, i) => {
    if (!conn) return;
    const positions = [[0, -size * 0.35], [size * 0.35, 0], [0, size * 0.35], [-size * 0.35, 0]];
    text(conn, ...positions[i]);
  });
  
  pop();
}

// --- p5.js Functions ---
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textFont('monospace');
  resetGame();
}

function draw() {
  background(220, 10, 95);
  
  // Draw placed tiles
  for (const tile of placedTiles.values()) {
    const { x: sX, y: sY } = gridToPixel(tile.gridX, tile.gridY);
    if (sX > -TILE_SIZE * 2 && sX < width + TILE_SIZE * 2 && 
        sY > -TILE_SIZE * 2 && sY < height + TILE_SIZE * 2) {
      drawTileObject(tile, sX, sY, TILE_SIZE);
    }
  }
  
  // Draw preview tile
  if (currentTileDefName) {
    const previewTile = new Tile(currentTileDefName, 0, 0, currentRotation);
    const mouseGridPos = pixelToGrid(mouseX, mouseY);
    const { x: pX, y: pY } = gridToPixel(mouseGridPos.x, mouseGridPos.y);
    const isValid = canPlaceTileAt(previewTile, mouseGridPos.x, mouseGridPos.y);
    drawTileObject(previewTile, pX, pY, TILE_SIZE, true, isValid);
  }
  
  // UI
  fill(0); textSize(16); textAlign(LEFT, TOP);
  text(`Tile: ${currentTileDefName || "N"} (T)\nRot: ${currentRotation * 90}° (R)\nPlace. Pan. (C)lear.`, 10, 10);
}

function mousePressed() {
  if (mouseButton === LEFT && currentTileDefName) {
    const { x, y } = pixelToGrid(mouseX, mouseY);
    placeTile(currentTileDefName, x, y, currentRotation);
  }
}

function keyPressed() {
  const keyActions = {
    't': cycleTileType, 'T': cycleTileType,
    'r': () => currentRotation = (currentRotation + 1) % 4,
    'R': () => currentRotation = (currentRotation + 1) % 4,
    'c': resetGame, 'C': resetGame
  };
  
  const arrowActions = {
    [UP_ARROW]: () => camY += PAN_SPEED * 3,
    [DOWN_ARROW]: () => camY -= PAN_SPEED * 3,
    [LEFT_ARROW]: () => camX += PAN_SPEED * 3,
    [RIGHT_ARROW]: () => camX -= PAN_SPEED * 3
  };
  
  (keyActions[key] || arrowActions[keyCode])?.();
}

const windowResized = () => resizeCanvas(windowWidth, windowHeight);
