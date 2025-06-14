// Global State
let currentTileDefName, currentRotation = 0, placedTiles, camX = 0, camY = 0, zoomLevel = 1;
const TILE_SIZE = 50, PAN_SPEED = 30, MIN_ZOOM = 0.5, MAX_ZOOM = 3;
const DIRECTIONS = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
const OPPOSITE_MAP = [2, 3, 0, 1];

// --- Tile Definitions ---
const TILE_DEFINITIONS = {
  grass: { color: [120, 60, 70], connections: ["G", "G", "G", "G"] },
  road_straight: {
    color: [120, 60, 60], connections: ["G", "R", "G", "R"],
    drawPattern: s => { fill(0, 0, 30); noStroke(); rect(0, 0, s, s / 3); }
  },
  road_corner: {
    color: [120, 60, 60], connections: ["R", "R", "G", "G"],
    drawPattern: s => {
      fill(0, 0, 30); noStroke(); rectMode(CENTER);
      rect(0, -s / 4, s / 2, s / 2);
      rect(s / 4, 0, s / 2, s / 2);
    }
  },
  road_start: {
    color: [120, 60, 60], connections: ["R", "G", "G", "G"],
    drawPattern: s => { fill(0, 0, 30); noStroke(); rectMode(CENTER); rect(0, -s / 4, s / 3, s / 2); }
  },
  road_split: {
    color: [120, 60, 60], connections: ["R", "R", "R", "G"],
    drawPattern: s => {
      fill(0, 0, 30); noStroke(); rectMode(CENTER);
      // North road segment (from center to top edge)
      rect(0, -s / 4, s / 3, s / 2);
      // East road segment (from center to right edge)  
      rect(s / 4, 0, s / 2, s / 3);
      // South road segment (from center to bottom edge)
      rect(0, s / 4, s / 3, s / 2);
    }
  },
  water_full: { color: [200, 70, 80], connections: ["W", "W", "W", "W"] },
  water_grass_split_LR: {
    color: [120, 60, 70], connections: ["G", "G", "G", "W"],
    drawPattern: s => { noStroke(); fill(TILE_DEFINITIONS.water_full.color); arc(-s / 2, 0, s / 2, s, -HALF_PI, HALF_PI); }
  },
  water_corner: {
    color: [120, 60, 70], connections: ["W", "W", "G", "G"],
    drawPattern: s => {
      noStroke(); fill(TILE_DEFINITIONS.water_full.color);
      // Draw arc from top-left to bottom-right with center at top-right
      arc(s / 2, -s / 2, s*2, s*2, HALF_PI, PI);
    }
  },
  water_road_straight: {
    color: [120, 60, 60], connections: ["W", "G", "R", "G"],
    drawPattern: s => {
      noStroke(); fill(TILE_DEFINITIONS.water_full.color);
      // Curved water edge using arc
      arc(0, -s / 2, s, s / 2, 0, PI);
      fill(0, 0, 30); rectMode(CENTER); rect(0, s / 4, s / 3, s / 2);
    }
  },
  water_road_straight_harbour: {
    color: [120, 60, 60], connections: ["W", "G", "R", "G"],
    drawPattern: s => {
      noStroke(); fill(TILE_DEFINITIONS.water_full.color);
      // Curved water edge using arc
      arc(0, -s / 2, s, s / 2, 0, PI);
      
      // Road
      fill(0, 0, 30); rectMode(CENTER); rect(0, s / 4, s / 3, s / 2);
      
      // Harbor structure
      rectMode(CENTER);
      
      // Main dock platform
      fill(25, 30, 50); rect(0, -s * 0.15, s * 0.35, s * 0.12);
      
      // Wooden dock posts/pillars
      fill(25, 60, 35);
      rect(-s * 0.12, -s * 0.2, s * 0.02, s * 0.08);
      rect(s * 0.12, -s * 0.2, s * 0.02, s * 0.08);
      rect(-s * 0.06, -s * 0.22, s * 0.015, s * 0.06);
      rect(s * 0.06, -s * 0.22, s * 0.015, s * 0.06);
      
      // Small boat
      fill(25, 70, 40);
      ellipse(-s * 0.08, -s * 0.3, s * 0.08, s * 0.04);
      
      // Boat mast
      stroke(25, 80, 30); strokeWeight(0.8);
      line(-s * 0.08, -s * 0.32, -s * 0.08, -s * 0.4);
      noStroke();
      
      // Small sail
      fill(0, 0, 90); triangle(-s * 0.08, -s * 0.4, -s * 0.11, -s * 0.35, -s * 0.08, -s * 0.33);
      
      // Harbor building/warehouse
      fill(30, 40, 65); rect(s * 0.08, -s * 0.08, s * 0.12, s * 0.08);
      
      // Warehouse roof
      fill(0, 60, 45);
      triangle(s * 0.08, -s * 0.15, s * 0.02, -s * 0.12, s * 0.14, -s * 0.12);
      
      // Warehouse door
      fill(25, 50, 30); rect(s * 0.08, -s * 0.06, s * 0.03, s * 0.04);
      
      // Cargo crates
      fill(30, 50, 45);
      rect(s * 0.15, -s * 0.12, s * 0.025, s * 0.025);
      rect(s * 0.18, -s * 0.1, s * 0.02, s * 0.02);
      rect(s * 0.13, -s * 0.08, s * 0.02, s * 0.02);
      
      // Rope/chains on dock
      stroke(25, 40, 40); strokeWeight(0.5);
      line(-s * 0.15, -s * 0.15, -s * 0.1, -s * 0.25);
      line(s * 0.15, -s * 0.15, s * 0.1, -s * 0.25);
      noStroke();
    }
  },
  grass_village: {
    color: [120, 60, 70], connections: ["G", "G", "G", "G"],
    drawPattern: s => {
      noStroke(); rectMode(CENTER);
      
      // Main house with timber frame
      fill(30, 40, 80); rect(0, -s * 0.05, s * 0.25, s * 0.25); // Stone base
      fill(25, 60, 85); rect(0, -s * 0.2, s * 0.22, s * 0.15); // Upper timber frame
      
      // Triangular roof
      fill(0, 70, 40); // Dark red/brown roof
      triangle(0, -s * 0.35, -s * 0.15, -s * 0.25, s * 0.15, -s * 0.25);
      
      // Left cottage
      fill(30, 35, 75); rect(-s * 0.22, s * 0.08, s * 0.12, s * 0.2);
      fill(0, 70, 45); // Roof
      triangle(-s * 0.22, -s * 0.08, -s * 0.3, s * 0.02, -s * 0.14, s * 0.02);
      
      // Right cottage
      fill(35, 30, 78); rect(s * 0.2, s * 0.1, s * 0.1, s * 0.15);
      fill(0, 65, 42); // Roof
      triangle(s * 0.2, -s * 0.05, s * 0.14, s * 0.03, s * 0.26, s * 0.03);
      
      // Timber frame details on main house
      stroke(25, 80, 30); strokeWeight(0.8);
      line(-s * 0.08, -s * 0.25, -s * 0.08, -s * 0.12);
      line(s * 0.08, -s * 0.25, s * 0.08, -s * 0.12);
      line(-s * 0.11, -s * 0.18, s * 0.11, -s * 0.18);
      noStroke();
      
      // Windows with shutters
      fill(20, 30, 40); // Dark windows
      rect(-s * 0.06, -s * 0.18, s * 0.025, s * 0.03);
      rect(s * 0.06, -s * 0.18, s * 0.025, s * 0.03);
      rect(0, -s * 0.08, s * 0.03, s * 0.04);
      
      // Window shutters
      fill(0, 60, 50);
      rect(-s * 0.08, -s * 0.18, s * 0.01, s * 0.03);
      rect(-s * 0.04, -s * 0.18, s * 0.01, s * 0.03);
      rect(s * 0.04, -s * 0.18, s * 0.01, s * 0.03);
      rect(s * 0.08, -s * 0.18, s * 0.01, s * 0.03);
      
      // Door
      fill(25, 70, 35); rect(0, s * 0.02, s * 0.04, s * 0.08);
      fill(0, 0, 20); circle(-s * 0.01, s * 0.02, s * 0.008); // Door handle
      
      // Cottage windows
      fill(20, 30, 40);
      rect(-s * 0.22, s * 0.05, s * 0.02, s * 0.025);
      rect(s * 0.2, s * 0.08, s * 0.015, s * 0.02);
      
      // Chimney
      fill(30, 20, 60); rect(s * 0.08, -s * 0.4, s * 0.03, s * 0.1);
      
      // Smoke
      fill(0, 0, 80, 40); // Light gray smoke
      circle(s * 0.08, -s * 0.42, s * 0.02);
      circle(s * 0.09, -s * 0.45, s * 0.015);
    }
  },
  grass_castle: {
    color: [120, 60, 70], connections: ["G", "G", "G", "G"],
    drawPattern: s => {
      noStroke(); rectMode(CENTER);
      
      // Main castle wall with stone texture
      fill(30, 15, 75); rect(0, 0, s * 0.45, s * 0.28);
      fill(30, 25, 70); rect(0, s * 0.02, s * 0.4, s * 0.2); // Shadow
      
      // Central keep tower
      fill(30, 20, 80); rect(0, -s * 0.18, s * 0.18, s * 0.35);
      
      // Side towers
      fill(30, 18, 78);
      rect(-s * 0.18, s * 0.02, s * 0.12, s * 0.25);
      rect(s * 0.18, s * 0.02, s * 0.12, s * 0.25);
      
      // Battlements (crenellations)
      fill(30, 15, 82);
      rect(-s * 0.15, -s * 0.28, s * 0.04, s * 0.08);
      rect(-s * 0.05, -s * 0.28, s * 0.04, s * 0.08);
      rect(s * 0.05, -s * 0.28, s * 0.04, s * 0.08);
      rect(s * 0.15, -s * 0.28, s * 0.04, s * 0.08);
      
      // Side tower battlements
      rect(-s * 0.18, -s * 0.12, s * 0.03, s * 0.06);
      rect(s * 0.18, -s * 0.12, s * 0.03, s * 0.06);
      
      // Castle gate
      fill(0, 0, 25); rect(0, s * 0.08, s * 0.08, s * 0.12);
      fill(25, 40, 40); rect(0, s * 0.05, s * 0.06, s * 0.06); // Gate details
      
      // Arrow slits
      fill(0, 0, 20);
      rect(-s * 0.06, -s * 0.1, s * 0.01, s * 0.04);
      rect(s * 0.06, -s * 0.1, s * 0.01, s * 0.04);
      rect(-s * 0.18, -s * 0.02, s * 0.008, s * 0.03);
      rect(s * 0.18, -s * 0.02, s * 0.008, s * 0.03);
      
      // Banner/flag
      fill(0, 85, 85); rect(s * 0.02, -s * 0.35, s * 0.08, s * 0.06);
      fill(30, 30, 50); rectMode(CORNER); rect(s * 0.01, -s * 0.38, s * 0.01, s * 0.1); // Flagpole
      
      // Stone block details
      stroke(30, 20, 60); strokeWeight(0.3);
      line(-s * 0.1, -s * 0.05, s * 0.1, -s * 0.05);
      line(-s * 0.15, s * 0.05, s * 0.15, s * 0.05);
      noStroke();
    }
  },
  grass_mountain: {
    color: [120, 60, 70], connections: ["G", "G", "G", "G"],
    drawPattern: s => {
      noStroke(); fill(0, 0, 60);
      triangle(0, -s * 0.25, -s * 0.2, s * 0.15, s * 0.2, s * 0.15);
      fill(0, 0, 95); triangle(0, -s * 0.25, -s * 0.08, -s * 0.05, s * 0.08, -s * 0.05);
      fill(0, 0, 70);
      triangle(-s * 0.25, s * 0.1, -s * 0.35, s * 0.2, -s * 0.15, s * 0.2);
      triangle(s * 0.25, s * 0.1, s * 0.15, s * 0.2, s * 0.35, s * 0.2);
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

// --- Constants & Utilities ---
const gridToPixel = (gx, gy) => ({ 
  x: gx * TILE_SIZE * zoomLevel + TILE_SIZE * zoomLevel / 2 + camX, 
  y: gy * TILE_SIZE * zoomLevel + TILE_SIZE * zoomLevel / 2 + camY 
});
const pixelToGrid = (mx, my) => ({ 
  x: floor((mx - camX) / (TILE_SIZE * zoomLevel)), 
  y: floor((my - camY) / (TILE_SIZE * zoomLevel)) 
});

// --- Game Logic ---
const canPlaceTileAt = (tile, gridX, gridY) => {
  const key = `${gridX},${gridY}`;
  if (placedTiles.has(key)) return false;
  const newConnections = tile.getConnections();
  return DIRECTIONS.every((dir, i) => {
    const neighborKey = `${gridX + dir.dx},${gridY + dir.dy}`;
    if (!placedTiles.has(neighborKey)) return true;
    const neighbor = placedTiles.get(neighborKey);
    const [newEdge, neighborEdge] = [newConnections[i], neighbor.getConnections()[OPPOSITE_MAP[i]]];
    return newEdge === '*' || neighborEdge === '*' || newEdge === neighborEdge;
  });
};

const placeTile = (id, gridX, gridY, rotation) => {
  const tile = new Tile(id, gridX, gridY, rotation);
  if (canPlaceTileAt(tile, gridX, gridY)) {
    placedTiles.set(`${gridX},${gridY}`, tile);
  }
};

const getCompatibleTiles = (gridX, gridY) => {
  const allTileKeys = Object.keys(TILE_DEFINITIONS);
  const compatibleTiles = [];
  
  for (const tileKey of allTileKeys) {
    for (let rotation = 0; rotation < 4; rotation++) {
      const testTile = new Tile(tileKey, gridX, gridY, rotation);
      if (canPlaceTileAt(testTile, gridX, gridY)) {
        compatibleTiles.push({ key: tileKey, rotation });
        break; // Only need to find one valid rotation per tile type
      }
    }
  }
  
  return compatibleTiles;
};

const cycleTileType = () => {
  const mouseGridPos = pixelToGrid(mouseX, mouseY);
  
  // Check if there are any adjacent placed tiles
  const hasAdjacentTiles = DIRECTIONS.some(dir => {
    const adjacentKey = `${mouseGridPos.x + dir.dx},${mouseGridPos.y + dir.dy}`;
    return placedTiles.has(adjacentKey);
  });
  
  if (hasAdjacentTiles) {
    // Filter to only compatible tiles
    const compatibleTiles = getCompatibleTiles(mouseGridPos.x, mouseGridPos.y);
    
    if (compatibleTiles.length === 0) {
      console.log("No compatible tiles available at this position");
      return;
    }
    
    // Find current tile in compatible list
    const currentIndex = compatibleTiles.findIndex(tile => 
      tile.key === currentTileDefName && tile.rotation === currentRotation
    );
    
    if (currentIndex === -1) {
      // Current tile is not compatible, switch to first compatible one
      currentTileDefName = compatibleTiles[0].key;
      currentRotation = compatibleTiles[0].rotation;
    } else {
      // Cycle to next compatible tile
      const nextIndex = (currentIndex + 1) % compatibleTiles.length;
      currentTileDefName = compatibleTiles[nextIndex].key;
      currentRotation = compatibleTiles[nextIndex].rotation;
    }
  } else {
    // No adjacent tiles, allow cycling through all tiles
    const keys = Object.keys(TILE_DEFINITIONS);
    currentTileDefName = keys[(keys.indexOf(currentTileDefName) + 1) % keys.length];
    currentRotation = 0;
  }
};

const rotateCurrentTile = () => {
  const mouseGridPos = pixelToGrid(mouseX, mouseY);
  
  // Check if there are any adjacent placed tiles
  const hasAdjacentTiles = DIRECTIONS.some(dir => {
    const adjacentKey = `${mouseGridPos.x + dir.dx},${mouseGridPos.y + dir.dy}`;
    return placedTiles.has(adjacentKey);
  });
  
  if (hasAdjacentTiles) {
    // Get all valid rotations for current tile type at this position
    const validRotations = [];
    for (let rotation = 0; rotation < 4; rotation++) {
      const testTile = new Tile(currentTileDefName, mouseGridPos.x, mouseGridPos.y, rotation);
      if (canPlaceTileAt(testTile, mouseGridPos.x, mouseGridPos.y)) {
        validRotations.push(rotation);
      }
    }
    
    if (validRotations.length === 0) {
      console.log("No valid rotations available for this tile at this position");
      return;
    }
    
    // Find current rotation in valid list
    const currentIndex = validRotations.indexOf(currentRotation);
    
    if (currentIndex === -1) {
      // Current rotation is not valid, switch to first valid one
      currentRotation = validRotations[0];
    } else {
      // Cycle to next valid rotation
      const nextIndex = (currentIndex + 1) % validRotations.length;
      currentRotation = validRotations[nextIndex];
    }
  } else {
    // No adjacent tiles, allow normal rotation
    currentRotation = (currentRotation + 1) % 4;
  }
};

const resetGame = () => {
  placedTiles = new Map();
  [currentTileDefName, currentRotation, camX, camY, zoomLevel] = [Object.keys(TILE_DEFINITIONS)[0], 0, width / 2, height / 2, 1];
  console.clear(); console.log("Game Reset");
};

// --- Landscape Integration Functions ---
function downloadLandscape() {
  if (placedTiles.size === 0) {
    alert("No landscape to download! Generate or create a landscape first.");
    return;
  }
  
  const tiles = [];
  for (const [key, tile] of placedTiles.entries()) {
    tiles.push({
      id: tile.id,
      gridX: tile.gridX,
      gridY: tile.gridY,
      rotation: tile.rotation
    });
  }
  
  const landscapeData = {
    width: 50,
    height: 50,
    tiles: tiles,
    metadata: {
      tileCount: tiles.length,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    }
  };
  
  const dataStr = JSON.stringify(landscapeData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `landscape_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`Downloaded landscape with ${tiles.length} tiles`);
}

function loadLandscapeFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const landscapeData = JSON.parse(e.target.result);
      
      if (!landscapeData.tiles || !Array.isArray(landscapeData.tiles)) {
        alert("Invalid landscape file format!");
        return;
      }
      
      // Clear existing tiles
      placedTiles.clear();
      
      // Load tiles
      for (const tileData of landscapeData.tiles) {
        if (TILE_DEFINITIONS[tileData.id]) {
          const tile = new Tile(tileData.id, tileData.gridX, tileData.gridY, tileData.rotation);
          placedTiles.set(`${tileData.gridX},${tileData.gridY}`, tile);
        }
      }
      
      console.log(`Loaded landscape with ${landscapeData.tiles.length} tiles`);
      
      // Reset camera to show the landscape
      camX = width / 2 - (25 * TILE_SIZE * zoomLevel);
      camY = height / 2 - (25 * TILE_SIZE * zoomLevel);
      
    } catch (error) {
      alert("Error loading landscape file: " + error.message);
      console.error("Landscape load error:", error);
    }
  };
  
  reader.readAsText(file);
}

// Enhanced landscape generation function
function generateAndLoadLandscape() {
  console.log("Generating new 50x50 landscape...");
  
  try {
    // Use the landscape generator
    const tiles = generateLandscape(50, 50);
    loadLandscapeIntoGame(tiles);
    
    // Reset camera to show the generated landscape
    camX = width / 2 - (25 * TILE_SIZE * zoomLevel);
    camY = height / 2 - (25 * TILE_SIZE * zoomLevel);
    zoomLevel = 0.8; // Zoom out to see more of the landscape
    
    console.log("Landscape generation complete!");
    
  } catch (error) {
    console.error("Error generating landscape:", error);
    alert("Error generating landscape. Check console for details.");
  }
}

// --- Drawing ---
const drawTileObject = (tile, x, y, size, isPreview = false, isValid = true) => {
  push();
  translate(x, y);
  rotate(tile.rotation * HALF_PI);

  const alpha = isPreview ? 50 : 100;
  fill(...tile.definition.color, alpha);
  stroke(isPreview ? (isValid ? [120, 100, 100] : [0, 100, 100]) : [0, 0, 20]);
  strokeWeight(isPreview ? 3 : 1);
  rectMode(CENTER);
  square(0, 0, size);

  tile.definition.drawPattern?.(size);

  fill(0, 0, 0, isPreview ? 128 : 255);
  noStroke(); textAlign(CENTER, CENTER); textSize(size * 0.2);
  
  tile.definition.connections.forEach((conn, i) => {
    if (conn) {
      const positions = [[0, -size * 0.35], [size * 0.35, 0], [0, size * 0.35], [-size * 0.35, 0]];
      text(conn, ...positions[i]);
    }
  });
  
  pop();
};

// --- p5.js Functions ---
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textFont('monospace');
  resetGame();
}

function draw() {
  background(220, 10, 95);
  
  for (const tile of placedTiles.values()) {
    const { x: sX, y: sY } = gridToPixel(tile.gridX, tile.gridY);
    const tileRenderSize = TILE_SIZE * zoomLevel;
    if (sX > -tileRenderSize * 2 && sX < width + tileRenderSize * 2 && 
        sY > -tileRenderSize * 2 && sY < height + tileRenderSize * 2) {
      drawTileObject(tile, sX, sY, tileRenderSize);
    }
  }
  
  if (currentTileDefName) {
    const previewTile = new Tile(currentTileDefName, 0, 0, currentRotation);
    const mouseGridPos = pixelToGrid(mouseX, mouseY);
    const { x: pX, y: pY } = gridToPixel(mouseGridPos.x, mouseGridPos.y);
    const isValid = canPlaceTileAt(previewTile, mouseGridPos.x, mouseGridPos.y);
    drawTileObject(previewTile, pX, pY, TILE_SIZE * zoomLevel, true, isValid);
  }
  
  fill(0); textSize(16); textAlign(LEFT, TOP);
  text(`Tile: ${currentTileDefName || "N"} (T)\nRot: ${currentRotation * 90}° (R)\nZoom: ${zoomLevel.toFixed(1)}x (+/-)\nPlace. Pan. (C)lear. (G)enerate.`, 10, 10);
}

function mousePressed() {
  if (mouseButton === LEFT && currentTileDefName) {
    const { x, y } = pixelToGrid(mouseX, mouseY);
    placeTile(currentTileDefName, x, y, currentRotation);
  }
}

function keyPressed() {
  const zoomAtCenter = (newZoomLevel) => {
    const oldZoom = zoomLevel;
    zoomLevel = newZoomLevel;
    
    // Calculate the world point that's currently at screen center
    const screenCenterX = width / 2;
    const screenCenterY = height / 2;
    const worldCenterX = (screenCenterX - camX) / oldZoom;
    const worldCenterY = (screenCenterY - camY) / oldZoom;
    
    // Adjust camera to keep that world point at screen center with new zoom
    camX = screenCenterX - worldCenterX * zoomLevel;
    camY = screenCenterY - worldCenterY * zoomLevel;
  };
  
  const keyActions = {
    't': cycleTileType, 'T': cycleTileType,
    'r': rotateCurrentTile,
    'R': rotateCurrentTile,
    'c': resetGame, 'C': resetGame,
    'g': generateAndLoadLandscape, 'G': generateAndLoadLandscape,
    '+': () => zoomAtCenter(Math.min(zoomLevel * 1.2, MAX_ZOOM)),
    '=': () => zoomAtCenter(Math.min(zoomLevel * 1.2, MAX_ZOOM)),
    '-': () => zoomAtCenter(Math.max(zoomLevel / 1.2, MIN_ZOOM)),
    '_': () => zoomAtCenter(Math.max(zoomLevel / 1.2, MIN_ZOOM))
  };
  
  const arrowActions = {
    [UP_ARROW]: () => camY += PAN_SPEED * 3,
    [DOWN_ARROW]: () => camY -= PAN_SPEED * 3,
    [LEFT_ARROW]: () => camX += PAN_SPEED * 3,
    [RIGHT_ARROW]: () => camX -= PAN_SPEED * 3
  };
  
  (keyActions[key] || arrowActions[keyCode])?.();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
