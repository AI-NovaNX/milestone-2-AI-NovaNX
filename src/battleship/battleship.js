// 1. Initial setup
// Board size follows the selected difficulty:
// - Easy: 8 x 8
// - Medium: 12 x 12
// - Hard: 16 x 16
const BATTLESHIP_DEFAULT_BOARD_SIZE = 8;

// 1. Initial setup
// Prepare the ship list with different sizes
const BATTLESHIP_FLEET_TEMPLATE = [
  { name: "Carrier", size: 4 },
  { name: "Destroyer", size: 3 },
  { name: "Missile Cruiser", size: 3 },
  { name: "Submarine", size: 2 },
  { name: "Fast Patrol Boat", size: 2 },
];

const BATTLESHIP_SCORE_PER_HIT = Object.freeze({
  "Fast Patrol Boat": 10,
  Submarine: 20,
  Destroyer: 30,
  "Missile Cruiser": 30,
  Carrier: 40,
});

const BATTLESHIP_SUNK_BONUS = 50;

const battleshipState = {
  playerName: "Guest",
  difficulty: "easy",
  boardSize: BATTLESHIP_DEFAULT_BOARD_SIZE,
  phase: "placement", // placement | battle | gameover
  orientation: "horizontal",
  score: 0,
  currentShipIndex: 0,
  hoverCells: [],
  lastHoverCell: null,
  playerBoard: [],
  enemyBoard: [],
  playerShips: [],
  enemyShips: [],
  aiTargets: [],
  aiHitsStack: [],
  aiTried: new Set(),
};

const battleshipEls = {
  playerBoardWrapper: document.getElementById("battleshipPlayerBoardWrapper"),
  enemyBoardWrapper: document.getElementById("battleshipEnemyBoardWrapper"),
  nicknameInput: document.getElementById("battleshipNickname"),
  saveNameBtn: document.getElementById("battleshipSaveNameBtn"),
  difficultySelect: document.getElementById("battleshipDifficulty"),
  rotateBtn: document.getElementById("battleshipRotateBtn"),
  startBtn: document.getElementById("battleshipStartBtn"),
  restartBtn: document.getElementById("battleshipRestartBtn"),
  playAgainBtn: document.getElementById("battleshipPlayAgainBtn"),
  closeModalBtn: document.getElementById("battleshipCloseModalBtn"),
  leaderboardList: document.getElementById("battleshipLeaderboardList"),
  shipsQueue: document.getElementById("battleshipShipsQueue"),
  playerLabel: document.getElementById("battleshipPlayerLabel"),
  phaseLabel: document.getElementById("battleshipPhaseLabel"),
  scoreLabel: document.getElementById("battleshipScoreLabel"),
  messageLabel: document.getElementById("battleshipMessageLabel"),
  modal: document.getElementById("battleshipModal"),
  modalTitle: document.getElementById("battleshipModalTitle"),
  modalText: document.getElementById("battleshipModalText"),
};

function battleshipGetBoardSizeForDifficulty(difficulty) {
  if (difficulty === "hard") {
    return 16;
  }

  if (difficulty === "medium") {
    return 12;
  }

  return 8;
}

function battleshipGetColumnLabel(index) {
  // 0 -> A, 25 -> Z, 26 -> AA, ...
  let n = index + 1;
  let label = "";

  while (n > 0) {
    const r = (n - 1) % 26;
    label = String.fromCharCode(65 + r) + label;
    n = Math.floor((n - 1) / 26);
  }

  return label;
}

function battleshipGetGridSizing(boardSize) {
  if (boardSize <= 8) {
    return { coord: 28, cell: 44 };
  }

  if (boardSize <= 12) {
    return { coord: 24, cell: 34 };
  }

  return { coord: 22, cell: 28 };
}

// 1. Initial setup
// Create the player and enemy boards based on the difficulty size
function battleshipCreateEmptyBoard() {
  const size = battleshipState.boardSize;

  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      shipId: null,
      hit: false,
      miss: false,
    })),
  );
}

// 1. Initial setup
// Prepare the ship list with different sizes
function battleshipCreateShips() {
  return BATTLESHIP_FLEET_TEMPLATE.map((ship, index) => ({
    id: index,
    name: ship.name,
    size: ship.size,
    positions: [],
    hits: 0,
    placed: false,
  }));
}

function battleshipCellKey(row, col) {
  return `${row},${col}`;
}

// 1. Initial setup
// Make sure ships stay within the board boundaries
function battleshipInBounds(row, col) {
  return (
    row >= 0 &&
    row < battleshipState.boardSize &&
    col >= 0 &&
    col < battleshipState.boardSize
  );
}

// 1. Initial setup
// Each ship can only be placed horizontally or vertically
function battleshipGetPlacementCells(row, col, size, orientation) {
  const cells = [];

  for (let i = 0; i < size; i += 1) {
    const nextRow = orientation === "vertical" ? row + i : row;
    const nextCol = orientation === "horizontal" ? col + i : col;
    cells.push({ row: nextRow, col: nextCol });
  }

  return cells;
}

// 1. Initial setup
// Make sure ships stay in bounds and do not overlap with other ships
function battleshipCanPlaceShip(board, row, col, size, orientation) {
  const cells = battleshipGetPlacementCells(row, col, size, orientation);

  for (const cell of cells) {
    if (!battleshipInBounds(cell.row, cell.col)) {
      return false;
    }

    if (board[cell.row][cell.col].shipId !== null) {
      return false;
    }
  }

  return true;
}

// 1. Initial setup
// Place a ship on the board if the position is valid
function battleshipPlaceShip(board, ships, shipIndex, row, col, orientation) {
  const ship = ships[shipIndex];
  const valid = battleshipCanPlaceShip(board, row, col, ship.size, orientation);

  if (!valid) {
    return false;
  }

  const cells = battleshipGetPlacementCells(row, col, ship.size, orientation);
  ship.positions = [];
  ship.placed = true;

  for (const cell of cells) {
    board[cell.row][cell.col].shipId = ship.id;
    ship.positions.push({ row: cell.row, col: cell.col });
  }

  return true;
}

// 1. Initial setup
// Place all enemy ships randomly on the board
function battleshipPlaceEnemyShipsRandom() {
  battleshipState.enemyBoard = battleshipCreateEmptyBoard();
  battleshipState.enemyShips = battleshipCreateShips();

  for (let i = 0; i < battleshipState.enemyShips.length; i += 1) {
    let placed = false;

    while (!placed) {
      const row = Math.floor(Math.random() * battleshipState.boardSize);
      const col = Math.floor(Math.random() * battleshipState.boardSize);
      const orientation = Math.random() < 0.5 ? "horizontal" : "vertical";

      placed = battleshipPlaceShip(
        battleshipState.enemyBoard,
        battleshipState.enemyShips,
        i,
        row,
        col,
        orientation,
      );
    }
  }
}

function battleshipUpdateTopInfo() {
  battleshipEls.playerLabel.textContent = `Player: ${battleshipState.playerName}`;
  battleshipEls.phaseLabel.textContent =
    battleshipState.phase === "placement"
      ? "Phase: Ship Placement"
      : battleshipState.phase === "battle"
        ? "Phase: Battle"
        : "Phase: Game Over";
  battleshipEls.scoreLabel.textContent = `Score: ${battleshipState.score}`;
}

function battleshipSetMessage(text) {
  battleshipEls.messageLabel.textContent = text;
}

function battleshipRenderShipQueue() {
  const rotateBtn = battleshipEls.rotateBtn;

  // Preserve the rotate button node + its event listeners.
  if (rotateBtn && rotateBtn.parentElement === battleshipEls.shipsQueue) {
    rotateBtn.remove();
  }

  battleshipEls.shipsQueue.innerHTML = "";

  battleshipState.playerShips.forEach((ship, index) => {
    const token = document.createElement("div");
    token.className = "ship-token";

    if (ship.placed) {
      token.classList.add("placed");
    }

    const swatch = document.createElement("span");
    swatch.className = `ship-swatch ship-color-${ship.id}`;
    swatch.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    const currentMark =
      index === battleshipState.currentShipIndex && !ship.placed
        ? " ← current"
        : "";
    label.textContent = `${ship.name} (${ship.size})${currentMark}`;

    token.appendChild(swatch);
    token.appendChild(label);

    battleshipEls.shipsQueue.appendChild(token);
  });

  // Place the rotate button to the right of the last ship token (Patrol (2)).
  if (rotateBtn) {
    battleshipEls.shipsQueue.appendChild(rotateBtn);
  }
}

// 2. Render the boards
// Render the player board and the enemy board
function battleshipBuildBoard(board, kind) {
  const grid = document.createElement("div");
  grid.className = "board-grid";

  const size = battleshipState.boardSize;
  const { coord, cell } = battleshipGetGridSizing(size);

  grid.style.gridTemplateColumns = `${coord}px repeat(${size}, ${cell}px)`;
  grid.style.gridTemplateRows = `${coord}px repeat(${size}, ${cell}px)`;
  grid.style.gap = size <= 8 ? "4px" : size <= 16 ? "3px" : "2px";

  grid.style.setProperty("--coord-size", `${coord}px`);
  grid.style.setProperty("--cell-size", `${cell}px`);
  grid.style.setProperty(
    "--cell-radius",
    size <= 8 ? "10px" : size <= 16 ? "8px" : "6px",
  );

  const topLeft = document.createElement("div");
  topLeft.className = "coord-cell";
  grid.appendChild(topLeft);

  // 2. Render the boards
  // Render the column coordinates
  for (let col = 0; col < size; col += 1) {
    const coord = document.createElement("div");
    coord.className = "coord-cell";
    coord.textContent = battleshipGetColumnLabel(col);
    grid.appendChild(coord);
  }

  for (let row = 0; row < size; row += 1) {
    // 2. Render the boards
    // Render the row coordinates
    const rowCoord = document.createElement("div");
    rowCoord.className = "coord-cell";
    rowCoord.textContent = row + 1;
    grid.appendChild(rowCoord);

    for (let col = 0; col < size; col += 1) {
      const cell = document.createElement("div");
      const data = board[row][col];
      cell.classList.add("cell");
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);

      if (kind === "player") {
        cell.classList.add("player-cell");
      } else {
        cell.classList.add("enemy-cell");
      }

      // 2. Render the boards
      // Show ships on the player board
      if (kind === "player" && data.shipId !== null && !data.hit) {
        cell.classList.add("ship-cell");
        cell.classList.add(`ship-color-${data.shipId}`); // color matches the ship id
        cell.textContent = ""; // color-only cell, no icon
      }

      // 3. Start the battle
      // If the cell contains an attack result, show 💥 for a hit and 🌊 for a miss
      if (data.hit) {
        cell.classList.add("hit-cell", "explosion");
        cell.textContent = "💥";
      } else if (data.miss) {
        cell.classList.add("miss-cell");
        cell.textContent = "🌊";
      }

      if (kind === "player" && battleshipState.phase === "placement") {
        const currentShip =
          battleshipState.playerShips[battleshipState.currentShipIndex];
        if (currentShip && !currentShip.placed) {
          const hoverMatch = battleshipState.hoverCells.find(
            (item) => item.row === row && item.col === col,
          );

          if (hoverMatch) {
            cell.classList.add(hoverMatch.valid ? "preview-ok" : "preview-bad");
          }
        }
      }

      if (kind === "player" && battleshipState.phase === "placement") {
        cell.addEventListener("mouseenter", () =>
          battleshipHandlePlacementHover(row, col),
        );
        cell.addEventListener("mouseleave", battleshipClearHoverPreview);
        cell.addEventListener("click", () =>
          battleshipHandlePlacementClick(row, col),
        );
      }

      if (kind === "enemy") {
        if (battleshipState.phase !== "battle") {
          cell.classList.add("battle-disabled");
        } else {
          // 3. Start the battle
          // The player clicks a cell on the enemy board to attack
          cell.addEventListener("click", () =>
            battleshipHandlePlayerAttack(row, col),
          );
        }

        // 2. Render the boards
        // Hide ships on the enemy board
        if (data.hit) {
          cell.textContent = "💥";
        } else if (data.miss) {
          cell.textContent = "🌊";
        }
      }

      grid.appendChild(cell);
    }
  }

  return grid;
}

// 2. Render the boards
// Render the player board and the enemy board
function battleshipRenderBoards() {
  battleshipEls.playerBoardWrapper.innerHTML = "";
  battleshipEls.enemyBoardWrapper.innerHTML = "";

  battleshipEls.playerBoardWrapper.appendChild(
    battleshipBuildBoard(battleshipState.playerBoard, "player"),
  );

  battleshipEls.enemyBoardWrapper.appendChild(
    battleshipBuildBoard(battleshipState.enemyBoard, "enemy"),
  );
}

function battleshipRenderAll() {
  battleshipUpdateTopInfo();
  battleshipRenderShipQueue();
  battleshipRenderBoards();
  battleshipRenderLeaderboard();
}

function battleshipUpdatePlacementPreview() {
  const playerGrid =
    battleshipEls.playerBoardWrapper.querySelector(".board-grid");
  if (!playerGrid) {
    return;
  }

  const cells = playerGrid.querySelectorAll(".player-cell");
  cells.forEach((cell) => {
    cell.classList.remove("preview-ok", "preview-bad");

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    const hoverMatch = battleshipState.hoverCells.find(
      (item) => item.row === row && item.col === col,
    );

    if (hoverMatch) {
      cell.classList.add(hoverMatch.valid ? "preview-ok" : "preview-bad");
    }
  });
}

function battleshipHandlePlacementHover(row, col) {
  battleshipState.lastHoverCell = { row, col };
  const ship = battleshipState.playerShips[battleshipState.currentShipIndex];
  if (!ship || ship.placed) {
    battleshipState.hoverCells = [];
    battleshipUpdatePlacementPreview();
    return;
  }

  const valid = battleshipCanPlaceShip(
    battleshipState.playerBoard,
    row,
    col,
    ship.size,
    battleshipState.orientation,
  );

  const cells = battleshipGetPlacementCells(
    row,
    col,
    ship.size,
    battleshipState.orientation,
  ).filter((item) => battleshipInBounds(item.row, item.col));

  battleshipState.hoverCells = cells.map((item) => ({
    ...item,
    valid,
  }));

  battleshipUpdatePlacementPreview();
}

function battleshipClearHoverPreview() {
  battleshipState.hoverCells = [];
  battleshipState.lastHoverCell = null;
  battleshipUpdatePlacementPreview();
}

function battleshipHandlePlacementClick(row, col) {
  if (battleshipState.phase !== "placement") {
    return;
  }

  const shipIndex = battleshipState.currentShipIndex;
  const ship = battleshipState.playerShips[shipIndex];

  if (!ship || ship.placed) {
    return;
  }

  const placed = battleshipPlaceShip(
    battleshipState.playerBoard,
    battleshipState.playerShips,
    shipIndex,
    row,
    col,
    battleshipState.orientation,
  );

  if (!placed) {
    battleshipPlaySound("error");
    battleshipSetMessage("Invalid position. Try another placement.");
    battleshipState.hoverCells = [];
    battleshipState.lastHoverCell = null;
    battleshipRenderAll();
    return;
  }

  battleshipPlaySound("place");
  battleshipSetMessage(`${ship.name} placed successfully.`);

  battleshipState.currentShipIndex += 1;
  battleshipState.hoverCells = [];
  battleshipState.lastHoverCell = null;

  const allPlaced = battleshipState.playerShips.every((item) => item.placed);
  battleshipEls.startBtn.disabled = !allPlaced;

  if (allPlaced) {
    battleshipSetMessage("All ships placed. Click Start Battle.");
  }

  battleshipRenderAll();
}

// 3. Start the battle
// The battle begins after all player ships have been placed
function battleshipStartBattle() {
  const allPlaced = battleshipState.playerShips.every((ship) => ship.placed);

  if (!allPlaced) {
    battleshipSetMessage("Place all ships before starting the battle.");
    return;
  }

  battleshipState.phase = "battle";
  battleshipState.hoverCells = [];
  battleshipSetMessage("Battle started. Attack the enemy board.");
  battleshipPlaySound("start");
  battleshipRenderAll();
}

function battleshipFindShipById(ships, shipId) {
  return ships.find((ship) => ship.id === shipId);
}

// 4. Check for sunk ships
// If all parts of a ship have been hit, report it as sunk
function battleshipIsShipSunk(ships, shipId) {
  const ship = battleshipFindShipById(ships, shipId);
  return ship ? ship.hits >= ship.size : false;
}

// 6. End the game
// If all enemy ships sink, the player wins; if all player ships sink, the computer wins
function battleshipAllShipsSunk(ships) {
  return ships.every((ship) => ship.hits >= ship.size);
}

// 3. Start the battle
// The player or computer attacks one target cell
// 4. Check for sunk ships
// After a hit, check whether the affected ship has sunk
function battleshipApplyHit(board, ships, row, col) {
  const cell = board[row][col];

  if (cell.hit || cell.miss) {
    return { valid: false };
  }

  if (cell.shipId !== null) {
    cell.hit = true;
    const ship = battleshipFindShipById(ships, cell.shipId);
    ship.hits += 1;

    return {
      valid: true,
      result: "hit",
      shipId: cell.shipId,
      sunk: battleshipIsShipSunk(ships, cell.shipId),
      shipName: ship.name,
    };
  }

  cell.miss = true;
  return {
    valid: true,
    result: "miss",
  };
}

// 3. Start the battle
// The player enters a nickname and clicks cells on the enemy board to attack
// If the enemy cell contains a ship, change it to 💥 and add score
// If the cell is empty, change it to 🌊
function battleshipHandlePlayerAttack(row, col) {
  if (battleshipState.phase !== "battle") {
    return;
  }

  const outcome = battleshipApplyHit(
    battleshipState.enemyBoard,
    battleshipState.enemyShips,
    row,
    col,
  );

  if (!outcome.valid) {
    battleshipSetMessage("That cell has already been attacked.");
    return;
  }

  if (outcome.result === "hit") {
    const hitPoints = BATTLESHIP_SCORE_PER_HIT[outcome.shipName] ?? 10;
    battleshipState.score += hitPoints;
    battleshipPlaySound("enemy-hit");

    // 4. Check for sunk ships
    // If all sections of that ship have been hit, show the sunk message
    if (outcome.sunk) {
      battleshipState.score += BATTLESHIP_SUNK_BONUS;
      battleshipSetMessage(`Direct hit! You sank enemy ${outcome.shipName}.`);
    } else {
      battleshipSetMessage("Direct hit! Enemy ship damaged.");
    }
  } else {
    battleshipPlaySound("miss");
    battleshipSetMessage("Miss. Enemy turn.");
  }

  battleshipRenderAll();

  // 6. End the game
  // If all enemy ships have sunk, the player wins and the score is saved
  if (battleshipAllShipsSunk(battleshipState.enemyShips)) {
    battleshipFinishGame(true);
    return;
  }

  // 5. Computer turn
  // After the player attacks, the computer chooses a cell on the player board to attack
  setTimeout(() => {
    battleshipComputerTurn();
  }, 650);
}

function battleshipGetUntouchedNeighbors(row, col, board) {
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  return deltas
    .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
    .filter(
      (cell) =>
        battleshipInBounds(cell.row, cell.col) &&
        !board[cell.row][cell.col].hit &&
        !board[cell.row][cell.col].miss,
    );
}

function battleshipAddAITargets(cells) {
  cells.forEach((cell) => {
    const key = battleshipCellKey(cell.row, cell.col);
    if (!battleshipState.aiTried.has(key)) {
      const exists = battleshipState.aiTargets.some(
        (item) => item.row === cell.row && item.col === cell.col,
      );
      if (!exists) {
        battleshipState.aiTargets.push(cell);
      }
    }
  });
}

// 5. Computer turn
// The computer chooses a random cell on the player board
function battleshipPickRandomUntouchedCell() {
  const candidates = [];
  const size = battleshipState.boardSize;

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const cell = battleshipState.playerBoard[row][col];
      const untouched = !cell.hit && !cell.miss;

      if (!untouched) {
        continue;
      }

      if (battleshipState.difficulty === "hard") {
        if ((row + col) % 2 === 0) {
          candidates.push({ row, col });
        }
      } else {
        candidates.push({ row, col });
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function battleshipChooseAIMove() {
  if (battleshipState.difficulty === "easy") {
    return battleshipPickRandomUntouchedCell();
  }

  if (battleshipState.aiTargets.length > 0) {
    return battleshipState.aiTargets.shift();
  }

  return battleshipPickRandomUntouchedCell();
}

// 5. Computer turn
// After the player attacks, the computer chooses a random cell on the player board
// Show 💥 on a hit
// Show 🌊 on a miss
function battleshipComputerTurn() {
  if (battleshipState.phase !== "battle") {
    return;
  }

  const move = battleshipChooseAIMove();
  if (!move) {
    return;
  }

  const key = battleshipCellKey(move.row, move.col);
  battleshipState.aiTried.add(key);

  const outcome = battleshipApplyHit(
    battleshipState.playerBoard,
    battleshipState.playerShips,
    move.row,
    move.col,
  );

  if (!outcome.valid) {
    battleshipComputerTurn();
    return;
  }

  if (outcome.result === "hit") {
    battleshipPlaySound("alliance-hit");

    if (battleshipState.difficulty !== "easy") {
      const neighbors = battleshipGetUntouchedNeighbors(
        move.row,
        move.col,
        battleshipState.playerBoard,
      );
      battleshipAddAITargets(neighbors);
    }

    // 4. Check for sunk ships
    // If all parts of the player ship have been hit, show the sunk message
    if (outcome.sunk) {
      battleshipState.aiTargets = battleshipState.aiTargets.filter((cell) => {
        const boardCell = battleshipState.playerBoard[cell.row][cell.col];
        return !boardCell.hit && !boardCell.miss;
      });

      battleshipSetMessage(`Computer sank your ${outcome.shipName}.`);
    } else {
      battleshipSetMessage("Computer hit your ship!");
    }
  } else {
    battleshipPlaySound("miss");
    battleshipSetMessage("Computer missed. Your turn.");
  }

  battleshipRenderAll();

  // 6. End the game
  // If all player ships sink, the computer wins
  if (battleshipAllShipsSunk(battleshipState.playerShips)) {
    battleshipFinishGame(false);
  }
}

// 6. End the game
// If all enemy ships sink, the player wins and the score is saved to localStorage
function battleshipSaveScore() {
  const key = "battleship_portfolio_leaderboard";
  const leaderboard = JSON.parse(localStorage.getItem(key)) || [];

  leaderboard.push({
    name: battleshipState.playerName,
    score: battleshipState.score,
    difficulty: battleshipState.difficulty,
    date: new Date().toLocaleDateString(),
  });

  leaderboard.sort((a, b) => b.score - a.score);

  localStorage.setItem(key, JSON.stringify(leaderboard.slice(0, 10)));
}

// 7. Restart and leaderboard
// The leaderboard shows the highest scores from localStorage
function battleshipRenderLeaderboard() {
  const key = "battleship_portfolio_leaderboard";
  const leaderboard = JSON.parse(localStorage.getItem(key)) || [];

  battleshipEls.leaderboardList.innerHTML = "";

  if (leaderboard.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No scores yet.";
    battleshipEls.leaderboardList.appendChild(li);
    return;
  }

  leaderboard.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.score} pts (${item.difficulty})`;
    battleshipEls.leaderboardList.appendChild(li);
  });
}

function battleshipShowModal(title, text) {
  battleshipEls.modalTitle.textContent = title;
  battleshipEls.modalText.textContent = text;
  battleshipEls.modal.classList.remove("hidden");
}

function battleshipHideModal() {
  battleshipEls.modal.classList.add("hidden");
}

// 6. End the game
// If all enemy ships sink, the player wins
// If all player ships sink, the computer wins
function battleshipFinishGame(playerWon) {
  battleshipState.phase = "gameover";

  if (playerWon) {
    battleshipPlaySound("win");
    battleshipSaveScore();
    battleshipSetMessage(`Victory! Final score: ${battleshipState.score}`);
    battleshipShowModal(
      "You Win! 🎉",
      `${battleshipState.playerName}, your final score is ${battleshipState.score}. Great job sinking the enemy fleet.`,
    );
  } else {
    battleshipPlaySound("lose");
    battleshipSetMessage("Defeat. Your fleet has been destroyed.");
    battleshipShowModal(
      "You Lose 💀",
      "The enemy fleet outsmarted you this time. Try another strategy and play again.",
    );
  }

  battleshipRenderAll();
}

function battleshipRotateOrientation() {
  battleshipState.orientation =
    battleshipState.orientation === "horizontal" ? "vertical" : "horizontal";

  battleshipEls.rotateBtn.textContent =
    battleshipState.orientation === "horizontal"
      ? "Rotate: Horizontal"
      : "Rotate: Vertical";

  battleshipSetMessage(`Ship direction: ${battleshipState.orientation}`);

  if (battleshipState.phase === "placement" && battleshipState.lastHoverCell) {
    battleshipHandlePlacementHover(
      battleshipState.lastHoverCell.row,
      battleshipState.lastHoverCell.col,
    );
  }
}

// 3. Start the battle
// The player enters a nickname
function battleshipSavePlayerName() {
  const value = battleshipEls.nicknameInput.value.trim();

  if (!value) {
    return;
  }

  battleshipState.playerName = value;
  localStorage.setItem("battleship_portfolio_player_name", value);
  battleshipSetMessage(`Welcome, ${value}. Place your ships.`);
  battleshipRenderAll();
}

function battleshipLoadPlayerName() {
  const saved = localStorage.getItem("battleship_portfolio_player_name");

  if (saved) {
    battleshipState.playerName = saved;
    battleshipEls.nicknameInput.value = saved;
  }
}

function battleshipReadDifficulty() {
  battleshipState.difficulty = battleshipEls.difficultySelect.value;
}

// 7. Restart and leaderboard
// The restart button resets the entire game
// 1. Initial setup
// Recreate the player and enemy boards, then place enemy ships randomly
function battleshipResetState() {
  battleshipState.phase = "placement";
  battleshipState.orientation = "horizontal";
  battleshipState.score = 0;
  battleshipState.currentShipIndex = 0;
  battleshipState.hoverCells = [];
  battleshipState.lastHoverCell = null;
  battleshipState.aiTargets = [];
  battleshipState.aiHitsStack = [];
  battleshipState.aiTried = new Set();

  battleshipEls.rotateBtn.textContent = "Rotate: Horizontal";
  battleshipEls.startBtn.disabled = true;

  battleshipReadDifficulty();
  battleshipState.boardSize = battleshipGetBoardSizeForDifficulty(
    battleshipState.difficulty,
  );

  battleshipState.playerBoard = battleshipCreateEmptyBoard();
  battleshipState.enemyBoard = battleshipCreateEmptyBoard();
  battleshipState.playerShips = battleshipCreateShips();
  battleshipState.enemyShips = battleshipCreateShips();

  battleshipPlaceEnemyShipsRandom();
  battleshipSetMessage("Place your ships on the left board.");
  battleshipHideModal();
  battleshipRenderAll();
}

function battleshipPlaySound(type) {
  const playAudioFile = (src) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = 0.9;
    audio.play().catch(() => {
      // Autoplay policies may block non-user-gesture playback (e.g., AI turn).
    });
  };

  if (type === "alliance-hit") {
    playAudioFile("asset/alliance-explosion.wav");
    return;
  }

  if (type === "enemy-hit") {
    playAudioFile("asset/enemy-explosion.wav");
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  const now = context.currentTime;

  if (type === "hit") {
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(70, now + 0.16);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
    return;
  }

  if (type === "miss") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(180, now);
    oscillator.frequency.exponentialRampToValueAtTime(120, now + 0.12);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    oscillator.start(now);
    oscillator.stop(now + 0.13);
    return;
  }

  if (type === "place") {
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(330, now);
    oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.08);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.09, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
    return;
  }

  if (type === "error") {
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(160, now);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    oscillator.start(now);
    oscillator.stop(now + 0.11);
    return;
  }

  if (type === "start") {
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(330, now);
    oscillator.frequency.exponentialRampToValueAtTime(520, now + 0.2);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscillator.start(now);
    oscillator.stop(now + 0.22);
    return;
  }

  if (type === "win") {
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(392, now);
    oscillator.frequency.setValueAtTime(523, now + 0.14);
    oscillator.frequency.setValueAtTime(659, now + 0.28);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    oscillator.start(now);
    oscillator.stop(now + 0.46);
    return;
  }

  if (type === "lose") {
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.4);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    oscillator.start(now);
    oscillator.stop(now + 0.42);
  }
}

// 7. Restart and leaderboard
// The restart button resets the game while the leaderboard continues reading from localStorage
function battleshipBindEvents() {
  battleshipEls.saveNameBtn.addEventListener("click", battleshipSavePlayerName);
  battleshipEls.rotateBtn.addEventListener(
    "click",
    battleshipRotateOrientation,
  );
  battleshipEls.startBtn.addEventListener("click", battleshipStartBattle);
  battleshipEls.restartBtn.addEventListener("click", battleshipResetState);
  battleshipEls.playAgainBtn.addEventListener("click", battleshipResetState);
  battleshipEls.closeModalBtn.addEventListener("click", battleshipHideModal);
  battleshipEls.difficultySelect.addEventListener("change", () => {
    const previousDifficulty = battleshipState.difficulty;
    const nextDifficulty = battleshipEls.difficultySelect.value;

    const shipsAlreadyPlaced = battleshipState.playerShips.some(
      (ship) => ship.placed,
    );

    if (battleshipState.phase !== "placement" || shipsAlreadyPlaced) {
      battleshipEls.difficultySelect.value = previousDifficulty;
      battleshipSetMessage("Restart the game to change difficulty.");
      return;
    }

    battleshipEls.difficultySelect.value = nextDifficulty;
    battleshipResetState();
    battleshipSetMessage(`Difficulty set to ${battleshipState.difficulty}.`);
  });
}

// 1. Initial setup
// Initialize the game on first load
function battleshipInit() {
  battleshipLoadPlayerName();
  battleshipBindEvents();
  battleshipResetState();
}

battleshipInit();
