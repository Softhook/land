// Automatic Landscape Generator for 50x50 Tile Maps
// Generates realistic terrain patterns with rivers, roads, villages, and natural features

class LandscapeGenerator {
  constructor(width = 50, height = 50) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.rivers = [];
    this.roads = [];
    this.settlements = [];
    this.waterBodies = [];
    
    // Initialize empty grid
    this.initializeGrid();
  }

  initializeGrid() {
    this.grid = Array(this.height).fill(null).map(() => 
      Array(this.width).fill(null).map(() => ({
        type: 'grass',
        rotation: 0,
        elevation: 0,
        moisture: 0,
        temperature: 0,
        biome: 'temperate'
      }))
    );
  }

  // Generate height map using Perlin-like noise
  generateHeightMap() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Multiple octaves of noise for realistic terrain
        let elevation = 0;
        elevation += this.noise(x * 0.02, y * 0.02) * 100;     // Large features
        elevation += this.noise(x * 0.05, y * 0.05) * 50;      // Medium features  
        elevation += this.noise(x * 0.1, y * 0.1) * 25;        // Small features
        elevation += this.noise(x * 0.2, y * 0.2) * 12;        // Fine detail
        
        this.grid[y][x].elevation = elevation;
      }
    }
  }

  // Simple noise function (pseudo-random based on coordinates)
  noise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1; // Return value between -1 and 1
  }

  // Generate moisture map (distance from water sources)
  generateMoistureMap() {
    // Add some random water sources
    const waterSources = [];
    for (let i = 0; i < 5; i++) {
      waterSources.push({
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      });
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Find distance to nearest water source
        let minDistance = Infinity;
        for (const source of waterSources) {
          const distance = Math.sqrt((x - source.x) ** 2 + (y - source.y) ** 2);
          minDistance = Math.min(minDistance, distance);
        }
        
        // Convert distance to moisture (closer = more moisture)
        this.grid[y][x].moisture = Math.max(0, 100 - minDistance * 2);
      }
    }
  }

  // Generate rivers flowing from high to low elevation
  generateRivers() {
    const numRivers = Math.floor(Math.random() * 3) + 2; // 2-4 rivers
    
    for (let i = 0; i < numRivers; i++) {
      this.generateSingleRiver();
    }
  }

  generateSingleRiver() {
    // Choose a starting point for the river
    let startX, startY;
    
    // Either start from water body or from high elevation
    if (this.waterBodies && this.waterBodies.length > 0 && Math.random() < 0.6) {
      // Start from existing water body
      const waterBody = this.waterBodies[Math.floor(Math.random() * this.waterBodies.length)];
      const waterCell = waterBody[Math.floor(Math.random() * waterBody.length)];
      startX = waterCell.x;
      startY = waterCell.y;
    } else {
      // Start from high elevation point (traditional method)
      // Find highest points on the map
      let highPoints = [];
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.grid[y][x].elevation > 60) {
            highPoints.push({x, y, elevation: this.grid[y][x].elevation});
          }
        }
      }
      
      // Fall back to edge points if no high points found
      if (highPoints.length === 0) {
        const edgePoints = [];
        for (let x = 0; x < this.width; x++) {
          edgePoints.push({x, y: 0, elevation: this.grid[0][x].elevation});
          edgePoints.push({x, y: this.height-1, elevation: this.grid[this.height-1][x].elevation});
        }
        for (let y = 0; y < this.height; y++) {
          edgePoints.push({x: 0, y, elevation: this.grid[y][0].elevation});
          edgePoints.push({x: this.width-1, y, elevation: this.grid[y][this.width-1].elevation});
        }
        
        highPoints = edgePoints;
      }
      
      highPoints.sort((a, b) => b.elevation - a.elevation);
      const source = highPoints[Math.floor(Math.random() * Math.min(5, highPoints.length))];
      startX = source.x;
      startY = source.y;
    }
    
    // Target either another water body, a low point, or an edge
    let targetX, targetY;
    let targetFound = false;
    
    // Try to connect to another water body
    if (this.waterBodies && this.waterBodies.length > 1 && Math.random() < 0.7) {
      // Find a different water body to connect to
      const otherWaterBodies = this.waterBodies.filter(wb => 
        !wb.some(cell => cell.x === startX && cell.y === startY)
      );
      
      if (otherWaterBodies.length > 0) {
        const targetWaterBody = otherWaterBodies[Math.floor(Math.random() * otherWaterBodies.length)];
        const targetCell = targetWaterBody[Math.floor(Math.random() * targetWaterBody.length)];
        targetX = targetCell.x;
        targetY = targetCell.y;
        targetFound = true;
      }
    }
    
    // Otherwise, find a low point or edge
    if (!targetFound) {
      // Find lowest points or edge points
      let lowPoints = [];
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.grid[y][x].elevation < 30) {
            lowPoints.push({x, y, elevation: this.grid[y][x].elevation});
          }
        }
      }
      
      // Fall back to edge points
      if (lowPoints.length === 0) {
        const edgePoints = [];
        for (let x = 0; x < this.width; x++) {
          edgePoints.push({x, y: 0, elevation: this.grid[0][x].elevation});
          edgePoints.push({x, y: this.height-1, elevation: this.grid[this.height-1][x].elevation});
        }
        for (let y = 0; y < this.height; y++) {
          edgePoints.push({x: 0, y, elevation: this.grid[y][0].elevation});
          edgePoints.push({x: this.width-1, y, elevation: this.grid[y][this.width-1].elevation});
        }
        
        lowPoints = edgePoints;
      }
      
      // Sort by elevation (ascending)
      lowPoints.sort((a, b) => a.elevation - b.elevation);
      
      // Pick one of the lowest points
      const target = lowPoints[Math.floor(Math.random() * Math.min(5, lowPoints.length))];
      targetX = target.x;
      targetY = target.y;
    }
    
    // Generate a path from start to target with downhill preference
    const riverPath = this.generateRiverPath({x: startX, y: startY}, {x: targetX, y: targetY});
    
    this.rivers.push(riverPath);
  }
  
  // Generate a river path from start to target with downhill preference
  generateRiverPath(start, target) {
    // A* pathfinding with elevation cost
    const openSet = [{ 
      x: start.x, 
      y: start.y, 
      g: 0,  // Cost from start
      h: Math.abs(target.x - start.x) + Math.abs(target.y - start.y),  // Heuristic
      parent: null
    }];
    
    const closedSet = new Set();
    const gScore = {}; // Cost from start to this node
    gScore[`${start.x},${start.y}`] = 0;
    
    while (openSet.length > 0) {
      // Find node with lowest f = g + h
      openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
      const current = openSet.shift();
      
      // Check if we reached the target
      if (current.x === target.x && current.y === target.y) {
        // Reconstruct path
        const path = [];
        let node = current;
        while (node) {
          path.unshift({x: node.x, y: node.y});
          node = node.parent;
        }
        
        // Add some natural meandering
        return this.addRiverMeandering(path);
      }
      
      // Add to closed set
      closedSet.add(`${current.x},${current.y}`);
      
      // Process neighbors
      const neighbors = this.getNeighbors(current.x, current.y);
      for (const neighbor of neighbors) {
        if (closedSet.has(`${neighbor.x},${neighbor.y}`)) {
          continue;
        }
        
        // Calculate cost (prefer downhill paths)
        const elevationDiff = this.grid[current.y][current.x].elevation - 
                              this.grid[neighbor.y][neighbor.x].elevation;
        
        // Lower cost for downhill, higher for uphill
        const elevationCost = elevationDiff > 0 ? 0.5 : 2;
        
        // Add randomness for natural paths
        const randomFactor = 0.8 + Math.random() * 0.4;
        
        const moveCost = 1 * elevationCost * randomFactor;
        const gScoreNeighbor = current.g + moveCost;
        
        // Check if this path is better
        const key = `${neighbor.x},${neighbor.y}`;
        if (gScoreNeighbor < (gScore[key] || Infinity)) {
          // This path is better
          gScore[key] = gScoreNeighbor;
          
          // Update or add to open set
          const existing = openSet.find(node => node.x === neighbor.x && node.y === neighbor.y);
          if (existing) {
            existing.g = gScoreNeighbor;
            existing.parent = current;
          } else {
            openSet.push({
              x: neighbor.x,
              y: neighbor.y,
              g: gScoreNeighbor,
              h: Math.abs(target.x - neighbor.x) + Math.abs(target.y - neighbor.y),
              parent: current
            });
          }
        }
      }
    }
    
    // If no path found, create a simple direct path
    return this.createDirectPath(start, target);
  }
  
  // Add natural meandering to river paths
  addRiverMeandering(path) {
    // Only add meandering to longer paths
    if (path.length < 5) return path;
    
    const newPath = [path[0]]; // Start point
    
    // Add meandering points between straight segments
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const current = path[i];
      
      // For longer straight segments, add some bends
      if (i < path.length - 1) {
        const dx = current.x - prev.x;
        const dy = current.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance >= 2 && Math.random() < 0.7) {
          // Create a bend point
          const bendFactor = (Math.random() * 0.5) + 0.5; // 0.5-1.0
          const perpX = -dy * bendFactor;  // Perpendicular direction
          const perpY = dx * bendFactor;
          
          const bendX = Math.round((prev.x + current.x) / 2 + perpX);
          const bendY = Math.round((prev.y + current.y) / 2 + perpY);
          
          // Check if bend point is within bounds
          if (bendX >= 0 && bendX < this.width && bendY >= 0 && bendY < this.height) {
            newPath.push({x: bendX, y: bendY});
          }
        }
      }
      
      newPath.push(current);
    }
    
    return newPath;
  }
  
  // Create a direct path between two points with some variance
  createDirectPath(start, target) {
    const path = [];
    let currentX = start.x;
    let currentY = start.y;
    
    path.push({x: currentX, y: currentY});
    
    // Simple pathfinding - move towards target with some randomness
    while (currentX !== target.x || currentY !== target.y) {
      const dx = Math.sign(target.x - currentX);
      const dy = Math.sign(target.y - currentY);
      
      // Add some randomness to river paths
      if (Math.random() < 0.8) {
        if (Math.abs(target.x - currentX) > Math.abs(target.y - currentY)) {
          currentX += dx;
        } else {
          currentY += dy;
        }
      } else {
        // Random direction for variance
        if (Math.random() < 0.5 && dx !== 0) {
          currentX += dx;
        } else if (dy !== 0) {
          currentY += dy;
        }
      }
      
      // Bounds checking
      currentX = Math.max(0, Math.min(this.width - 1, currentX));
      currentY = Math.max(0, Math.min(this.height - 1, currentY));
      
      path.push({x: currentX, y: currentY});
      
      // Prevent infinite loops
      if (path.length > this.width + this.height) break;
    }
    
    return path;
  }

  // Generate road network connecting settlements
  generateRoads() {
    // Create main roads connecting settlements
    for (let i = 0; i < this.settlements.length - 1; i++) {
      const start = this.settlements[i];
      const end = this.settlements[i + 1];
      const roadPath = this.generateRoadPath(start, end);
      this.roads.push(roadPath);
    }
    
    // Add some random roads
    const numRandomRoads = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numRandomRoads; i++) {
      const start = {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      };
      const end = {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      };
      const roadPath = this.generateRoadPath(start, end);
      this.roads.push(roadPath);
    }
  }

  generateRoadPath(start, end) {
    const path = [];
    let currentX = start.x;
    let currentY = start.y;
    
    // Simple pathfinding - move towards target with some randomness
    while (currentX !== end.x || currentY !== end.y) {
      path.push({x: currentX, y: currentY});
      
      const dx = Math.sign(end.x - currentX);
      const dy = Math.sign(end.y - currentY);
      
      // Add some randomness to road paths
      if (Math.random() < 0.8) {
        if (Math.abs(end.x - currentX) > Math.abs(end.y - currentY)) {
          currentX += dx;
        } else {
          currentY += dy;
        }
      } else {
        // Random direction
        if (Math.random() < 0.5 && dx !== 0) {
          currentX += dx;
        } else if (dy !== 0) {
          currentY += dy;
        }
      }
      
      // Bounds checking
      currentX = Math.max(0, Math.min(this.width - 1, currentX));
      currentY = Math.max(0, Math.min(this.height - 1, currentY));
      
      // Prevent infinite loops
      if (path.length > this.width + this.height) break;
    }
    
    path.push({x: end.x, y: end.y});
    return path;
  }

  // Place settlements (villages, castles) in good locations
  generateSettlements() {
    const numSettlements = Math.floor(Math.random() * 4) + 3; // 3-6 settlements
    
    for (let i = 0; i < numSettlements; i++) {
      let attempts = 0;
      let placed = false;
      
      while (!placed && attempts < 50) {
        const x = Math.floor(Math.random() * (this.width - 4)) + 2;
        const y = Math.floor(Math.random() * (this.height - 4)) + 2;
        
        // Check if location is suitable (not too close to other settlements)
        const tooClose = this.settlements.some(settlement => 
          Math.sqrt((x - settlement.x) ** 2 + (y - settlement.y) ** 2) < 8
        );
        
        if (!tooClose) {
          const elevation = this.grid[y][x].elevation;
          const moisture = this.grid[y][x].moisture;
          
          // Determine settlement type based on location
          let settlementType;
          if (elevation > 60) {
            settlementType = 'grass_castle'; // Castles on high ground
          } else if (moisture > 60) {
            settlementType = 'grass_village'; // Villages near water
          } else {
            settlementType = Math.random() < 0.7 ? 'grass_village' : 'grass_castle';
          }
          
          this.settlements.push({x, y, type: settlementType});
          placed = true;
        }
        attempts++;
      }
    }
  }

  // Get valid neighbors for pathfinding
  getNeighbors(x, y) {
    const neighbors = [];
    const directions = [{dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}];
    
    for (const dir of directions) {
      const newX = x + dir.dx;
      const newY = y + dir.dy;
      
      if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
        neighbors.push({x: newX, y: newY});
      }
    }
    
    return neighbors;
  }

  // Apply features to the grid
  applyFeatures() {
    // Apply rivers first
    for (const river of this.rivers) {
      for (let i = 0; i < river.length; i++) {
        const {x, y} = river[i];
        this.setTileWithConnections(x, y, 'water', i === 0, i === river.length - 1, river, i);
      }
    }
    
    
    // Apply roads with proper connections
    for (const road of this.roads) {
      for (let i = 0; i < road.length; i++) {
        const {x, y} = road[i];
        this.setTileWithConnections(x, y, 'road', i === 0, i === road.length - 1, road, i);
      }
    }
    
    // Apply settlements
    for (const settlement of this.settlements) {
      this.grid[settlement.y][settlement.x].type = settlement.type;
    }
    
    // Add some random features
    this.addRandomFeatures();
    
    // Validate and fix all connections
    this.validateAndFixConnections();
  }

  // Set tile type based on connections to neighbors
  setTileWithConnections(x, y, featureType, isStart, isEnd, path, pathIndex) {
    // Skip if there's already a settlement here
    if (this.grid[y][x].type.includes('village') || this.grid[y][x].type.includes('castle')) {
      return;
    }
    
    // Calculate required connections based on neighbors
    const requiredConnections = ['G', 'G', 'G', 'G']; // North, East, South, West
    
    // Check path connections
    if (!isStart && pathIndex > 0) {
      const prev = path[pathIndex - 1];
      const direction = this.getDirection(prev, {x, y});
      if (direction !== -1) {
        requiredConnections[direction] = featureType === 'water' ? 'W' : 'R';
      }
    }
    
    if (!isEnd && pathIndex < path.length - 1) {
      const next = path[pathIndex + 1];
      const direction = this.getDirection({x, y}, next);
      if (direction !== -1) {
        requiredConnections[direction] = featureType === 'water' ? 'W' : 'R';
      }
    }
    
    // Check for intersections with other features
    this.checkIntersections(x, y, requiredConnections, featureType);
    
    // Find the best matching tile type
    const bestTile = this.findBestTileType(requiredConnections, featureType);
    this.grid[y][x].type = bestTile.type;
    this.grid[y][x].rotation = bestTile.rotation;
  }

  // Get direction from point A to point B (0=North, 1=East, 2=South, 3=West)
  getDirection(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    if (dy === -1 && dx === 0) return 0; // North
    if (dy === 0 && dx === 1) return 1;  // East
    if (dy === 1 && dx === 0) return 2;  // South
    if (dy === 0 && dx === -1) return 3; // West
    
    return -1; // Not adjacent
  }

  // Check for intersections with other roads/rivers
  checkIntersections(x, y, connections, featureType) {
    const directions = [{dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}];
    
    for (let i = 0; i < 4; i++) {
      const nx = x + directions[i].dx;
      const ny = y + directions[i].dy;
      
      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
        const neighborTile = this.grid[ny][nx];
        
        // Check if neighbor has a road or water that should connect
        if (featureType === 'road' && neighborTile.type.includes('road')) {
          connections[i] = 'R';
        } else if (featureType === 'water' && neighborTile.type.includes('water')) {
          connections[i] = 'W';
        }
        // Handle road-water intersections (bridges/harbors)
        else if (featureType === 'road' && neighborTile.type.includes('water')) {
          // This will be handled as a special case
        } else if (featureType === 'water' && neighborTile.type.includes('road')) {
          // This will be handled as a special case
        }
      }
    }
  }

  // Find the best tile type that matches the required connections
  findBestTileType(requiredConnections, featureType) {
    const TILE_DEFINITIONS = this.getTileDefinitions();
    let bestMatch = { type: 'grass', rotation: 0, score: -1 };
    
    // Filter tiles by feature type
    const candidateTiles = Object.keys(TILE_DEFINITIONS).filter(tileType => {
      if (featureType === 'water') {
        return tileType.includes('water') || tileType === 'grass';
      } else if (featureType === 'road') {
        return tileType.includes('road') || tileType === 'grass';
      }
      return true;
    });
    
    for (const tileType of candidateTiles) {
      const tileDef = TILE_DEFINITIONS[tileType];
      if (!tileDef || !tileDef.connections) continue;
      
      // Try all 4 rotations
      for (let rotation = 0; rotation < 4; rotation++) {
        const rotatedConnections = this.rotateConnections(tileDef.connections, rotation);
        const score = this.calculateConnectionScore(requiredConnections, rotatedConnections);
        
        if (score > bestMatch.score) {
          bestMatch = { type: tileType, rotation, score };
        }
      }
    }
    
    return bestMatch;
  }

  // Rotate connection array by specified amount
  rotateConnections(connections, rotation) {
    const rotated = [...connections];
    for (let i = 0; i < rotation; i++) {
      const temp = rotated.pop();
      rotated.unshift(temp);
    }
    return rotated;
  }

  // Calculate how well tile connections match requirements
  calculateConnectionScore(required, actual) {
    let score = 0;
    
    for (let i = 0; i < 4; i++) {
      if (required[i] === actual[i]) {
        score += 2; // Perfect match
      } else if (required[i] === 'G' && actual[i] !== 'W' && actual[i] !== 'R') {
        score += 1; // Acceptable (grass can be anything non-specific)
      } else if (actual[i] === '*') {
        score += 1; // Wildcard match
      }
      // Penalty for mismatches
      else if (required[i] !== 'G' && actual[i] !== required[i]) {
        score -= 1;
      }
    }
    
    return score;
  }

  // Validate all connections and fix mismatches
  validateAndFixConnections() {
    const TILE_DEFINITIONS = this.getTileDefinitions();
    const directions = [{dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}];
    
    // Multiple passes to resolve dependencies
    for (let pass = 0; pass < 3; pass++) {
      let changes = 0;
      
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const tile = this.grid[y][x];
          const tileDef = TILE_DEFINITIONS[tile.type];
          
          if (!tileDef || !tileDef.connections) continue;
          
          const tileConnections = this.rotateConnections(tileDef.connections, tile.rotation);
          let needsUpdate = false;
          const requiredConnections = ['G', 'G', 'G', 'G'];
          
          // Check each neighbor
          for (let i = 0; i < 4; i++) {
            const nx = x + directions[i].dx;
            const ny = y + directions[i].dy;
            
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
              const neighbor = this.grid[ny][nx];
              const neighborDef = TILE_DEFINITIONS[neighbor.type];
              
              if (neighborDef && neighborDef.connections) {
                const neighborConnections = this.rotateConnections(neighborDef.connections, neighbor.rotation);
                const neighborConnection = neighborConnections[(i + 2) % 4]; // Opposite direction
                
                // If neighbor expects a specific connection, we should match it
                if (neighborConnection === 'R' || neighborConnection === 'W') {
                  requiredConnections[i] = neighborConnection;
                  if (tileConnections[i] !== neighborConnection && tileConnections[i] !== '*') {
                    needsUpdate = true;
                  }
                }
              }
            }
          }
          
          if (needsUpdate) {
            const betterTile = this.findBestTileType(requiredConnections, 
              tile.type.includes('water') ? 'water' : 
              tile.type.includes('road') ? 'road' : 'grass');
            
            if (betterTile.score > this.calculateConnectionScore(requiredConnections, tileConnections)) {
              this.grid[y][x].type = betterTile.type;
              this.grid[y][x].rotation = betterTile.rotation;
              changes++;
            }
          }
        }
      }
      
      if (changes === 0) break; // No more changes needed
    }
  }

  // Get tile definitions (should match the main game's definitions)
  getTileDefinitions() {
    return {
      grass: { connections: ["G", "G", "G", "G"] },
      road_straight: { connections: ["G", "R", "G", "R"] },
      road_corner: { connections: ["R", "R", "G", "G"] },
      road_start: { connections: ["R", "G", "G", "G"] },
      road_split: { connections: ["R", "R", "R", "G"] },
      water_full: { connections: ["W", "W", "W", "W"] },
      water_grass_split_LR: { connections: ["G", "G", "G", "W"] },
      water_corner: { connections: ["W", "W", "G", "G"] },
      water_road_straight: { connections: ["W", "G", "R", "G"] },
      water_road_straight_harbour: { connections: ["W", "G", "R", "G"] },
      grass_village: { connections: ["G", "G", "G", "G"] },
      grass_castle: { connections: ["G", "G", "G", "G"] },
      grass_mountain: { connections: ["G", "G", "G", "G"] },
      any_square: { connections: ["*", "*", "*", "*"] }
    };
  }

  addRandomFeatures() {
    const numMountains = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numMountains; i++) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      
      // Only place mountains on grass tiles with high elevation
      if (this.grid[y][x].type === 'grass' && this.grid[y][x].elevation > 50) {
        this.grid[y][x].type = 'grass_mountain';
      }
    }
  }

  // Calculate appropriate rotation for each tile (now handled in setTileWithConnections)
  calculateRotations() {
    // Most rotations are now calculated during tile placement
    // Just handle decorative elements that don't need specific connections
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.grid[y][x];
        
        // Random rotation for decorative elements that don't have strict connection requirements
        if ((tile.type.includes('village') || tile.type.includes('castle') || tile.type.includes('mountain')) 
            && tile.rotation === 0) {
          tile.rotation = Math.floor(Math.random() * 4);
        }
      }
    }
  }

  // Generate large water bodies (lakes)
  generateWaterBodies() {
    console.log("Generating water bodies...");
    this.waterBodies = [];
    
    // Create 1-3 water bodies
    const numWaterBodies = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numWaterBodies; i++) {
      this.generateWaterBody();
    }
  }

  // Generate a single water body using cellular automaton approach
  generateWaterBody() {
    // Start with a random seed point
    const centerX = Math.floor(Math.random() * (this.width * 0.6) + this.width * 0.2);
    const centerY = Math.floor(Math.random() * (this.height * 0.6) + this.height * 0.2);
    
    // Size of water body (radius)
    const radius = Math.floor(Math.random() * 5) + 3;
    
    // Create water cells with noise for natural shape
    const waterCells = [];
    
    for (let y = Math.max(0, centerY - radius); y <= Math.min(this.height - 1, centerY + radius); y++) {
      for (let x = Math.max(0, centerX - radius); x <= Math.min(this.width - 1, centerX + radius); x++) {
        // Distance from center
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        // Use noise to create irregular edges
        const noiseValue = this.noise(x * 0.2, y * 0.2);
        
        // Add randomness to the water body shape
        if (distance < radius + noiseValue * 2) {
          waterCells.push({x, y});
        }
      }
    }
    
    // Mark water cells and remember the water body
    for (const cell of waterCells) {
      this.grid[cell.y][cell.x].type = 'water_full';
    }
    
    // Add shores/edges around water (water-grass transitions)
    this.addWaterEdges(waterCells);
    
    this.waterBodies.push(waterCells);
  }
  
  // Add water edges around a water body
  addWaterEdges(waterCells) {
    const directions = [{dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}];
    const waterEdges = new Set();
    
    // Find edge cells (water cells adjacent to non-water)
    for (const cell of waterCells) {
      for (const dir of directions) {
        const nx = cell.x + dir.dx;
        const ny = cell.y + dir.dy;
        
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          // If this adjacent cell is not part of the water body
          if (!waterCells.some(wc => wc.x === nx && wc.y === ny)) {
            // It's a shore/edge cell
            waterEdges.add(`${nx},${ny}`);
          }
        }
      }
    }
    
    // Process edges
    for (const edgeKey of waterEdges) {
      const [x, y] = edgeKey.split(',').map(Number);
      
      // Check surrounding cells to determine appropriate water edge type
      const surroundingWater = [];
      
      for (let i = 0; i < directions.length; i++) {
        const nx = x + directions[i].dx;
        const ny = y + directions[i].dy;
        
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          // Check if it's one of our water body cells
          if (waterCells.some(wc => wc.x === nx && wc.y === ny)) {
            surroundingWater.push(i); // Direction index (0=North, 1=East, 2=South, 3=West)
          }
        }
      }
      
      // Choose appropriate edge type based on surrounding water
      if (surroundingWater.length === 1) {
        // Water on one side - use water_grass_split_LR with proper rotation
        this.grid[y][x].type = 'water_grass_split_LR';
        this.grid[y][x].rotation = (surroundingWater[0] + 3) % 4; // Rotate to face water
      } else if (surroundingWater.length === 2) {
        // Two adjacent water sides - likely a water corner
        const isAdjacent = Math.abs(surroundingWater[0] - surroundingWater[1]) === 1 || 
                           Math.abs(surroundingWater[0] - surroundingWater[1]) === 3;
        
        if (isAdjacent) {
          this.grid[y][x].type = 'water_corner';
          // Calculate rotation based on which two sides have water
          const minDir = Math.min(surroundingWater[0], surroundingWater[1]);
          const maxDir = Math.max(surroundingWater[0], surroundingWater[1]);
          if ((minDir === 0 && maxDir === 3) || (minDir === 0 && maxDir === 1)) {
            this.grid[y][x].rotation = 0;
          } else if (minDir === 1 && maxDir === 2) {
            this.grid[y][x].rotation = 1;
          } else if (minDir === 2 && maxDir === 3) {
            this.grid[y][x].rotation = 2;
          } else {
            this.grid[y][x].rotation = 3;
          }
        } else {
          // Non-adjacent waters - use water_grass_split_LR and pick one direction
          this.grid[y][x].type = 'water_grass_split_LR';
          this.grid[y][x].rotation = (surroundingWater[0] + 3) % 4;
        }
      }
      // For 3 or more surrounding waters, logic will be handled during connection validation
    }
  }

  // Generate clustered settlements (villages and castles)
  generateSettlementClusters() {
    console.log("Generating settlement clusters...");
    this.settlements = [];
    
    // Generate 2-4 clusters of settlements
    const numClusters = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numClusters; i++) {
      this.generateSettlementCluster();
    }
  }
  
  // Generate a single cluster of settlements
  generateSettlementCluster() {
    // Pick a cluster center away from water bodies
    let centerX, centerY;
    let attempts = 0;
    let validLocation = false;
    
    while (!validLocation && attempts < 20) {
      centerX = Math.floor(Math.random() * (this.width * 0.7) + this.width * 0.15);
      centerY = Math.floor(Math.random() * (this.height * 0.7) + this.height * 0.15);
      
      // Check if too close to water
      validLocation = true;
      const waterCheck = 6; // Distance from water
      
      if (this.waterBodies) {
        for (const waterBody of this.waterBodies) {
          for (const waterCell of waterBody) {
            const distance = Math.sqrt((centerX - waterCell.x) ** 2 + (centerY - waterCell.y) ** 2);
            if (distance < waterCheck) {
              validLocation = false;
              break;
            }
          }
          if (!validLocation) break;
        }
      }
      
      attempts++;
    }
    
    if (!validLocation) {
      console.log("Could not find valid settlement cluster location after 20 attempts");
      return;
    }
    
    // Generate 2-5 settlements in this cluster
    const numSettlements = Math.floor(Math.random() * 4) + 2;
    const clusterType = Math.random() < 0.5 ? 'mixed' : 
                       (Math.random() < 0.5 ? 'villages' : 'castles');
    
    // Place a primary settlement at the center
    const primaryType = clusterType === 'villages' ? 'grass_village' : 
                        clusterType === 'castles' ? 'grass_castle' : 
                        (Math.random() < 0.5 ? 'grass_village' : 'grass_castle');
    
    this.settlements.push({
      x: centerX,
      y: centerY,
      type: primaryType,
      isPrimary: true
    });
    
    // Generate satellite settlements
    for (let i = 1; i < numSettlements; i++) {
      // Random angle and distance from center
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.floor(Math.random() * 4) + 3;
      
      const x = Math.floor(centerX + Math.cos(angle) * distance);
      const y = Math.floor(centerY + Math.sin(angle) * distance);
      
      // Skip if out of bounds
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
        continue;
      }
      
      // Skip if too close to another settlement
      const tooClose = this.settlements.some(settlement => 
        Math.sqrt((x - settlement.x) ** 2 + (y - settlement.y) ** 2) < 2
      );
      
      if (tooClose) continue;
      
      // Determine type
      let settlementType;
      
      switch(clusterType) {
        case 'villages':
          settlementType = 'grass_village';
          break;
        case 'castles':
          settlementType = 'grass_castle';
          break;
        case 'mixed':
          settlementType = Math.random() < 0.7 ? primaryType : 
                         (primaryType === 'grass_village' ? 'grass_castle' : 'grass_village');
          break;
      }
      
      this.settlements.push({
        x, y, type: settlementType, isPrimary: false
      });
    }
  }
  
  // Generate road network that connects settlement clusters
  generateRoadNetwork() {
    console.log("Generating road network...");
    this.roads = [];
    
    // First, ensure all settlements within a cluster are connected
    this.connectSettlementClusters();
    
    // Then connect the clusters to each other (primary settlements)
    this.connectPrimarySettlements();
    
    // Add some random branches to make the road network more interesting
    this.addRandomRoadBranches();
  }
  
  // Connect settlements within each cluster
  connectSettlementClusters() {
    // Group settlements by proximity
    const clusterMap = new Map();
    
    for (let i = 0; i < this.settlements.length; i++) {
      const settlement = this.settlements[i];
      let foundCluster = false;
      
      // Check if this settlement belongs to an existing cluster
      for (const [clusterId, clusterSettlements] of clusterMap.entries()) {
        for (const existingSettlement of clusterSettlements) {
          const distance = Math.sqrt(
            (settlement.x - existingSettlement.x) ** 2 + 
            (settlement.y - existingSettlement.y) ** 2
          );
          
          if (distance < 6) { // Within cluster distance
            clusterMap.get(clusterId).push(settlement);
            foundCluster = true;
            break;
          }
        }
        if (foundCluster) break;
      }
      
      // If not part of any cluster, create a new one
      if (!foundCluster) {
        clusterMap.set(clusterMap.size, [settlement]);
      }
    }
    
    // Connect settlements within each cluster
    for (const clusterSettlements of clusterMap.values()) {
      if (clusterSettlements.length <= 1) continue;
      
      // Sort to find the primary settlement (or most central if none marked as primary)
      clusterSettlements.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return 0;
      });
      
      const primary = clusterSettlements[0];
      
      // Connect all other settlements to the primary
      for (let i = 1; i < clusterSettlements.length; i++) {
        const roadPath = this.generateRoadPath(primary, clusterSettlements[i]);
        this.roads.push(roadPath);
      }
    }
  }
  
  // Connect the primary settlements of each cluster
  connectPrimarySettlements() {
    const primarySettlements = this.settlements.filter(s => s.isPrimary);
    if (primarySettlements.length <= 1) {
      // If no primary settlements defined, just connect some random ones
      const randomSettlements = this.pickRandomSettlements(3);
      for (let i = 0; i < randomSettlements.length - 1; i++) {
        const roadPath = this.generateRoadPath(randomSettlements[i], randomSettlements[i + 1]);
        this.roads.push(roadPath);
      }
      return;
    }
    
    // Sort primary settlements for deterministic connection order
    primarySettlements.sort((a, b) => (a.x + a.y) - (b.x + b.y));
    
    // Connect them in sequence
    for (let i = 0; i < primarySettlements.length - 1; i++) {
      const roadPath = this.generateRoadPath(primarySettlements[i], primarySettlements[i + 1]);
      this.roads.push(roadPath);
    }
  }
  
  // Add some random branches to the road network
  addRandomRoadBranches() {
    const numBranches = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numBranches; i++) {
      // 50% chance to connect random settlement to existing road
      if (Math.random() < 0.5 && this.settlements.length > 0 && this.roads.length > 0) {
        const settlement = this.settlements[Math.floor(Math.random() * this.settlements.length)];
        const roadPointCandidates = [];
        
        // Find points on existing roads to connect to
        for (const road of this.roads) {
          for (const point of road) {
            if (Math.random() < 0.1) { // Sample some points
              roadPointCandidates.push(point);
            }
          }
        }
        
        if (roadPointCandidates.length > 0) {
          // Connect settlement to a random point on existing road
          const roadPoint = roadPointCandidates[Math.floor(Math.random() * roadPointCandidates.length)];
          const roadPath = this.generateRoadPath(settlement, roadPoint);
          this.roads.push(roadPath);
        }
      } 
      // 50% chance to create a detour on existing road
      else if (this.roads.length > 0) {
        const road = this.roads[Math.floor(Math.random() * this.roads.length)];
        
        if (road.length >= 10) { // Only long enough roads
          // Pick two points on the road with some distance
          const idx1 = Math.floor(Math.random() * (road.length / 2));
          const idx2 = Math.floor(road.length / 2) + Math.floor(Math.random() * (road.length / 2));
          
          if (idx1 !== idx2) {
            // Generate an alternative path between these points
            const detour = this.generateAlternativeRoadPath(road[idx1], road[idx2]);
            if (detour.length > 0) {
              this.roads.push(detour);
            }
          }
        }
      }
    }
  }
  
  // Generate alternative road path (with more randomness for detours)
  generateAlternativeRoadPath(start, end) {
    // Similar to generateRoadPath but with more randomness
    const path = [];
    let currentX = start.x;
    let currentY = start.y;
    
    // Add jitter to force a different path
    const midpointX = (start.x + end.x) / 2 + (Math.random() * 6 - 3);
    const midpointY = (start.y + end.y) / 2 + (Math.random() * 6 - 3);
    
    // Path to midpoint
    while (Math.abs(currentX - midpointX) > 1 || Math.abs(currentY - midpointY) > 1) {
      path.push({x: currentX, y: currentY});
      
      const dx = Math.sign(midpointX - currentX);
      const dy = Math.sign(midpointY - currentY);
      
      // Higher randomness
      if (Math.random() < 0.6) {
        if (Math.abs(midpointX - currentX) > Math.abs(midpointY - currentY)) {
          currentX += dx;
        } else {
          currentY += dy;
        }
      } else {
        // Random direction
        if (Math.random() < 0.5 && dx !== 0) {
          currentX += dx;
        } else if (dy !== 0) {
          currentY += dy;
        }
      }
      
      // Bounds checking
      currentX = Math.max(0, Math.min(this.width - 1, currentX));
      currentY = Math.max(0, Math.min(this.height - 1, currentY));
      
      // Prevent infinite loops
      if (path.length > this.width + this.height) break;
    }
    
    // Path from midpoint to end
    while (Math.abs(currentX - end.x) > 0 || Math.abs(currentY - end.y) > 0) {
      path.push({x: currentX, y: currentY});
      
      const dx = Math.sign(end.x - currentX);
      const dy = Math.sign(end.y - currentY);
      
      if (Math.random() < 0.7) {
        if (Math.abs(end.x - currentX) > Math.abs(end.y - currentY)) {
          currentX += dx;
        } else {
          currentY += dy;
        }
      } else {
        if (Math.random() < 0.5 && dx !== 0) {
          currentX += dx;
        } else if (dy !== 0) {
          currentY += dy;
        }
      }
      
      currentX = Math.max(0, Math.min(this.width - 1, currentX));
      currentY = Math.max(0, Math.min(this.height - 1, currentY));
      
      if (path.length > this.width + this.height) break;
    }
    
    path.push({x: end.x, y: end.y});
    return path;
  }
  
  // Pick random settlements for connections
  pickRandomSettlements(count) {
    if (this.settlements.length <= count) {
      return [...this.settlements];
    }
    
    const selected = [];
    const indices = new Set();
    
    while (selected.length < count) {
      const idx = Math.floor(Math.random() * this.settlements.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        selected.push(this.settlements[idx]);
      }
    }
    
    return selected;
  }
  
  // Ensure all available tile types are used at least once
  ensureAllTileTypesUsed() {
    const TILE_DEFINITIONS = this.getTileDefinitions();
    const usedTileTypes = new Set();
    
    // Check which tile types are already used
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        usedTileTypes.add(this.grid[y][x].type);
      }
    }
    
    // For each unused tile type, try to place at least one
    for (const tileType of Object.keys(TILE_DEFINITIONS)) {
      if (!usedTileTypes.has(tileType)) {
        // Find a suitable location
        const placed = this.placeSingleTile(tileType);
        if (placed) {
          console.log(`Placed missing tile type: ${tileType}`);
        }
      }
    }
  }
  
  // Place a single tile of a specific type
  placeSingleTile(tileType) {
    // Try to find a suitable location that doesn't break connections
    const TILE_DEFINITIONS = this.getTileDefinitions();
    const tileDef = TILE_DEFINITIONS[tileType];
    
    if (!tileDef || !tileDef.connections) return false;
    
    // Try random locations
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      
      // Skip settlement locations
      if (this.grid[y][x].type.includes('village') || this.grid[y][x].type.includes('castle')) {
        continue;
      }
      
      // Get required connections based on neighbors
      const requiredConnections = ['G', 'G', 'G', 'G']; // Default to grass
      const directions = [{dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}];
      
      for (let i = 0; i < 4; i++) {
        const nx = x + directions[i].dx;
        const ny = y + directions[i].dy;
        
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          const neighbor = this.grid[ny][nx];
          const neighborDef = TILE_DEFINITIONS[neighbor.type];
          
          if (neighborDef && neighborDef.connections) {
            const neighborConnections = this.rotateConnections(neighborDef.connections, neighbor.rotation);
            const neighborConnection = neighborConnections[(i + 2) % 4]; // Opposite direction
            
            // If neighbor expects a specific connection, we must match it
            if (neighborConnection === 'R' || neighborConnection === 'W') {
              requiredConnections[i] = neighborConnection;
            }
          }
        }
      }
      
      // Check if this tile type can work with these connections
      for (let rotation = 0; rotation < 4; rotation++) {
        const rotatedConnections = this.rotateConnections(tileDef.connections, rotation);
        let matches = true;
        
        for (let i = 0; i < 4; i++) {
          if (requiredConnections[i] === 'R' && rotatedConnections[i] !== 'R' && rotatedConnections[i] !== '*') {
            matches = false;
            break;
          }
          if (requiredConnections[i] === 'W' && rotatedConnections[i] !== 'W' && rotatedConnections[i] !== '*') {
            matches = false;
            break;
          }
        }
        
        if (matches) {
          this.grid[y][x].type = tileType;
          this.grid[y][x].rotation = rotation;
          return true;
        }
      }
    }
    
    return false; // Could not place the tile
  }

  // Main generation function
  generate() {
    console.log("Generating 50x50 landscape...");
    
    this.generateHeightMap();
    this.generateMoistureMap();
    this.generateWaterBodies();
    this.generateSettlementClusters();
    this.generateRivers();
    this.generateRoadNetwork();
    this.applyFeatures();
    this.calculateRotations();
    this.ensureAllTileTypesUsed();
    
    console.log(`Generated landscape with ${this.settlements.length} settlements, ${this.waterBodies?.length || 0} water bodies, ${this.rivers.length} rivers, and ${this.roads.length} roads`);
    
    return this.grid;
  }

  // Export to a format compatible with the main game
  exportToGameFormat() {
    const tiles = [];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        tiles.push({
          id: cell.type,
          gridX: x,
          gridY: y,
          rotation: cell.rotation
        });
      }
    }
    
    return tiles;
  }

  // Export as JSON string for saving/loading
  exportToJSON() {
    return JSON.stringify({
      width: this.width,
      height: this.height,
      tiles: this.exportToGameFormat(),
      metadata: {
        settlements: this.settlements.length,
        rivers: this.rivers.length,
        roads: this.roads.length,
        generatedAt: new Date().toISOString()
      }
    }, null, 2);
  }
}

// Function to generate and return a landscape
function generateLandscape(width = 50, height = 50) {
  const generator = new LandscapeGenerator(width, height);
  generator.generate();
  return generator.exportToGameFormat();
}

// Function to load generated landscape into the main game
function loadLandscapeIntoGame(tiles) {
  if (typeof placedTiles !== 'undefined') {
    // Clear existing tiles
    placedTiles.clear();
    
    // Place all generated tiles
    for (const tileData of tiles) {
      const tile = new Tile(tileData.id, tileData.gridX, tileData.gridY, tileData.rotation);
      placedTiles.set(`${tileData.gridX},${tileData.gridY}`, tile);
    }
    
    console.log(`Loaded ${tiles.length} tiles into game`);
  } else {
    console.error("Main game not loaded - placedTiles not found");
  }
}

// Example usage function
function generateAndLoadLandscape() {
  const tiles = generateLandscape(50, 50);
  loadLandscapeIntoGame(tiles);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LandscapeGenerator, generateLandscape, loadLandscapeIntoGame, generateAndLoadLandscape };
}
