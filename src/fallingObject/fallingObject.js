// START

// Get all required HTML elements
const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const scoreDisplays = document.querySelectorAll(".score-value");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const nicknameInput = document.getElementById("nickname");
const playerNameDisplay = document.getElementById("playerName");
const hudPlayerNameDisplay = document.getElementById("hudPlayerName");
const hudLevelDisplay = document.getElementById("hudLevel");
const hudDurationDisplay = document.getElementById("hudDuration");
const messageDisplay = document.getElementById("message");
const leaderboardList = document.getElementById("leaderboardList");
const levelUpBanner = document.getElementById("levelUpBanner");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const finalScoreText = document.getElementById("finalScoreText");
const finalDurationText = document.getElementById("finalDurationText");

const gameAreaWidth = 700;
const playerWidth = 60;
const objectWidth = 40;
const LEVEL_SCORE_STEP = 500;
const MAX_LEVEL = 10;
const CHAMPION_SCORE = 5000;
const BASE_SPAWN_INTERVAL = 800;
const SPAWN_INTERVAL_STEP = 50;
const MIN_SPAWN_INTERVAL = 350;
const MIN_NICKNAME_LENGTH = 3;
const playerEmoji = "😎";
const diamondBonusPlayerEmoji = "😄";
const gameOverPlayerEmoji = "🤪";
const fallingEmojis = [
  "🍎",
  "🍊",
  "🍋",
  "🍉",
  "⭐",
  "🔥",
  "⚽",
  "🎈",
  "💎",
  "🪐",
];
const backgroundMusic = new Audio("avoidFallingObject.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

// Set score = 0
// Set gameOver = false
// Set playerPosition = center
// Set fallingObjects = empty array
let playerX = (gameAreaWidth - playerWidth) / 2;
let score = 0;
let gameRunning = false;
let gameLoop = null;
let spawnLoop = null;
let durationLoop = null;
let playerName = "Player";
let fallingObjects = [];
let gameStartTime = 0;
let playerBonusTimeout = null;
let currentLevel = 1;
let levelBannerTimeout = null;
let championAchieved = false;
const startButtonLabel = "Start Game";

function setNicknameInvalidState(isInvalid, message = "") {
  nicknameInput.classList.toggle("input-invalid", isInvalid);

  if (!isInvalid) {
    nicknameInput.setCustomValidity("");
    return;
  }

  nicknameInput.setCustomValidity(message);
  nicknameInput.reportValidity();
}

function getValidatedPlayerName() {
  const value = nicknameInput.value.trim();

  if (value.length < MIN_NICKNAME_LENGTH) {
    setNicknameInvalidState(
      true,
      `Nickname must be at least ${MIN_NICKNAME_LENGTH} characters.`,
    );
    return null;
  }

  setNicknameInvalidState(false);
  return value;
}

function movePlayerToX(nextX) {
  const maxX = gameArea.clientWidth - player.offsetWidth;
  playerX = Math.min(Math.max(nextX, 0), maxX);
  updatePlayerPosition();
}

function updateStartButtonState() {
  startBtn.disabled = gameRunning;
  startBtn.textContent = gameRunning ? "Playing..." : startButtonLabel;
}

function stopGameLoops() {
  clearInterval(gameLoop);
  clearInterval(spawnLoop);
  clearInterval(durationLoop);
}

function playBackgroundMusic() {
  backgroundMusic.currentTime = 0;
  backgroundMusic.play().catch(() => {});
}

function stopBackgroundMusic() {
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}

function getSpawnInterval() {
  return Math.max(
    MIN_SPAWN_INTERVAL,
    BASE_SPAWN_INTERVAL - (currentLevel - 1) * SPAWN_INTERVAL_STEP,
  );
}

function getObjectSpeed() {
  const baseSpeed = 3 + (currentLevel - 1) * 0.45;
  return baseSpeed + Math.random() * 3;
}

function restartSpawnLoop() {
  clearInterval(spawnLoop);

  if (!gameRunning) {
    return;
  }

  spawnLoop = setInterval(() => {
    createFallingObject();
  }, getSpawnInterval());
}

function resetPlayerToDefaultEmoji() {
  player.textContent = playerEmoji;
  player.classList.remove("player-hit", "player-bonus");
}

function showDiamondBonusPlayer() {
  clearTimeout(playerBonusTimeout);
  player.textContent = diamondBonusPlayerEmoji;
  player.classList.remove("player-hit");
  player.classList.add("player-bonus");

  playerBonusTimeout = window.setTimeout(() => {
    if (gameRunning) {
      resetPlayerToDefaultEmoji();
    }
  }, 450);
}

function loadLeaderboard() {
  // Load the leaderboard from localStorage
  const saved = localStorage.getItem("fallingObjectsLeaderboard");
  return saved ? JSON.parse(saved) : [];
}

function saveLeaderboard(data) {
  localStorage.setItem("fallingObjectsLeaderboard", JSON.stringify(data));
}

function formatDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function renderLeaderboard() {
  // Render the leaderboard
  const leaderboard = loadLeaderboard();
  leaderboardList.innerHTML = "";

  if (leaderboard.length === 0) {
    leaderboardList.innerHTML = "<li>No scores yet.</li>";
    return;
  }

  leaderboard.forEach((item) => {
    const li = document.createElement("li");
    li.classList.add("leaderboard-entry");

    const nameSpan = document.createElement("span");
    nameSpan.classList.add("leaderboard-name");
    nameSpan.textContent = item.name;

    const scoreSpan = document.createElement("span");
    scoreSpan.classList.add("leaderboard-score");
    scoreSpan.textContent = item.score;

    const durationSpan = document.createElement("span");
    durationSpan.classList.add("leaderboard-duration");
    durationSpan.textContent = formatDuration(item.durationMs || 0);

    li.append(nameSpan, scoreSpan, durationSpan);
    leaderboardList.appendChild(li);
  });
}

function updatePlayerPosition() {
  player.style.left = `${playerX}px`;
}

function updateScoreDisplay() {
  scoreDisplays.forEach((display) => {
    display.textContent = score;
  });
}

function updateMessage(text) {
  if (messageDisplay) {
    messageDisplay.textContent = text;
  }
}

function updateLevelDisplay() {
  hudLevelDisplay.textContent = currentLevel;
}

function showLevelUpBanner() {
  clearTimeout(levelBannerTimeout);
  levelUpBanner.textContent = "Level up >>>";
  levelUpBanner.classList.remove("champion-banner");
  levelUpBanner.classList.remove("hidden");
  levelUpBanner.classList.add("show");

  levelBannerTimeout = window.setTimeout(() => {
    levelUpBanner.classList.remove("show");
    levelUpBanner.classList.add("hidden");
  }, 1400);
}

function showChampionBanner() {
  clearTimeout(levelBannerTimeout);
  levelUpBanner.textContent = "You are the Champion";
  levelUpBanner.classList.add("champion-banner");
  levelUpBanner.classList.remove("hidden");
  levelUpBanner.classList.add("show");
}

function updateLevelProgress() {
  const nextLevel = Math.min(
    Math.floor(score / LEVEL_SCORE_STEP) + 1,
    MAX_LEVEL,
  );

  if (nextLevel > currentLevel) {
    currentLevel = nextLevel;
    updateLevelDisplay();
    showLevelUpBanner();
    restartSpawnLoop();
  }

  if (!championAchieved && score >= CHAMPION_SCORE) {
    championAchieved = true;
    currentLevel = MAX_LEVEL;
    updateLevelDisplay();
    showChampionBanner();
    updateMessage("You are the Champion.");
    endGame(true);
  }
}

function getElapsedDurationMs() {
  if (!gameStartTime) {
    return 0;
  }

  return Date.now() - gameStartTime;
}

function updateDurationDisplay(durationMs = getElapsedDurationMs()) {
  hudDurationDisplay.textContent = formatDuration(durationMs);
}

function resetGame() {
  score = 0;
  currentLevel = 1;
  championAchieved = false;
  updateScoreDisplay();
  updateLevelDisplay();
  updateDurationDisplay(0);
  clearTimeout(playerBonusTimeout);
  clearTimeout(levelBannerTimeout);
  resetPlayerToDefaultEmoji();
  overlayTitle.textContent = "Game Over";
  levelUpBanner.classList.remove("show");
  levelUpBanner.classList.remove("champion-banner");
  levelUpBanner.classList.add("hidden");
  finalDurationText.textContent = "Your Duration: 0:00";
  playerX = (gameArea.clientWidth - player.offsetWidth) / 2;
  updatePlayerPosition();
  updateMessage(
    "Avoid the falling objects. Your score increases for each object you dodge.",
  );
  gameOverOverlay.classList.add("hidden");

  fallingObjects.forEach((obj) => obj.element.remove());
  fallingObjects = [];
}

function createFallingObject() {
  // createFallingObject:
  //     Create a new object element
  //     Set a random horizontal position
  //     Add it to the game area
  //     Save it in the fallingObjects array
  if (!gameRunning) return;

  const object = document.createElement("div");
  object.classList.add("falling-object");
  const emoji = fallingEmojis[Math.floor(Math.random() * fallingEmojis.length)];
  object.textContent = emoji;

  const maxX = gameArea.clientWidth - objectWidth;
  const randomX = Math.floor(Math.random() * maxX);

  object.style.left = `${randomX}px`;
  object.style.top = `0px`;
  object.style.transform = "translate3d(0, 0, 0)";

  gameArea.appendChild(object);

  fallingObjects.push({
    element: object,
    emoji: emoji,
    x: randomX,
    y: 0,
    width: objectWidth,
    height: 40,
    speed: getObjectSpeed(),
  });
}

function isColliding(circle1, circle2) {
  const deltaX = circle1.x - circle2.x;
  const deltaY = circle1.y - circle2.y;
  const distance = Math.hypot(deltaX, deltaY);

  return distance < circle1.radius + circle2.radius;
}

function showScorePopup(x, y, points = 1) {
  const popup = document.createElement("div");
  popup.classList.add("score-popup");
  popup.textContent = `+${points}`;
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;

  gameArea.appendChild(popup);

  window.setTimeout(() => {
    popup.remove();
  }, 700);
}

function updateObjects() {
  // updateGame:
  //     If gameOver = true:
  //         stop the loop
  //     For each object in fallingObjects:
  //         move the object downward
  //         If the object leaves the area:
  //             remove the object
  //         If the object touches the player:
  //             gameOver = true
  //             show the game over state
  //             save the score
  //             render the leaderboard
  //     Increase the score
  //     Update the score display
  //
  // Note: in this implementation, the "gameOver" state is represented by `gameRunning === false`
  // and the loops are stopped through `endGame()` -> `stopGameLoops()`.
  for (let i = fallingObjects.length - 1; i >= 0; i--) {
    const obj = fallingObjects[i];
    // turunkan posisi objek
    obj.y += obj.speed;
    obj.element.style.transform = `translate3d(0, ${obj.y}px, 0)`;

    const objCircle = {
      x: obj.x + obj.width / 2,
      y: obj.y + obj.height / 2,
      radius: obj.width * 0.32,
    };

    const playerCircle = {
      x: playerX + player.offsetWidth / 2,
      y: gameArea.clientHeight - player.offsetHeight / 2 - 16,
      radius: player.offsetWidth * 0.28,
    };

    if (isColliding(objCircle, playerCircle)) {
      switch (obj.emoji) {
        case "💎":
          score += 50;
          updateScoreDisplay();
          updateLevelProgress();
          updateMessage(`${playerName} mendapatkan bonus diamond +50 poin.`);
          showDiamondBonusPlayer();
          showScorePopup(obj.x, obj.y, 50);
          obj.element.remove();
          fallingObjects.splice(i, 1);
          continue;

        default:
          endGame();
          return;
      }
    }

    if (obj.y > gameArea.clientHeight) {
      score += 1;
      updateScoreDisplay();
      updateLevelProgress();
      updateMessage(`${playerName} has successfully dodged ${score} objects.`);
      showScorePopup(obj.x, gameArea.clientHeight - 80);
      obj.element.remove();
      fallingObjects.splice(i, 1);
    }
  }
}

function saveScore() {
  // On game over:
  //     Save the nickname and score to localStorage
  const leaderboard = loadLeaderboard();
  const durationMs = getElapsedDurationMs();

  leaderboard.push({
    name: playerName,
    score: score,
    durationMs: durationMs,
  });

  leaderboard.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return (b.durationMs || 0) - (a.durationMs || 0);
  });
  const topFive = leaderboard.slice(0, 5);

  saveLeaderboard(topFive);
  renderLeaderboard();
}

function endGame(isChampion = false) {
  // On game over:
  //     Stop the intervals
  //     Save the nickname and score to localStorage
  gameRunning = false;
  updateStartButtonState();

  stopGameLoops();
  stopBackgroundMusic();
  clearTimeout(playerBonusTimeout);
  if (isChampion) {
    resetPlayerToDefaultEmoji();
  } else {
    player.textContent = gameOverPlayerEmoji;
    player.classList.remove("player-bonus");
    player.classList.add("player-hit");
  }

  const finalDurationMs = getElapsedDurationMs();
  updateDurationDisplay(finalDurationMs);

  overlayTitle.textContent = isChampion ? "You are the Champion" : "Game Over";
  finalScoreText.textContent = `Your Score: ${score}`;
  finalDurationText.textContent = `Your Duration: ${formatDuration(finalDurationMs)}`;
  if (!isChampion) {
    updateMessage("Game over. Click Restart to play again.");
  }

  saveScore();

  window.setTimeout(() => {
    gameOverOverlay.classList.remove("hidden");
  }, 250);
}

function startGame() {
  // When the Start button is clicked:
  //     Read the nickname
  //     If the nickname is empty:
  //         use the default "Player"
  const validatedName = getValidatedPlayerName();
  if (!validatedName) {
    return;
  }

  playerName = validatedName;
  if (playerNameDisplay) {
    playerNameDisplay.textContent = playerName;
  }
  hudPlayerNameDisplay.textContent = playerName;

  // Reset score
  // Reset gameOver
  // Reset posisi player
  // Remove all falling objects
  resetGame();

  // Start the game loop
  // Start the object spawner
  gameRunning = true;
  gameStartTime = Date.now();
  updateDurationDisplay(0);
  updateStartButtonState();
  playBackgroundMusic();

  gameLoop = setInterval(() => {
    updateObjects();
  }, 20);

  restartSpawnLoop();

  durationLoop = setInterval(() => {
    if (gameRunning) {
      updateDurationDisplay();
    }
  }, 250);
}

document.addEventListener("keydown", (event) => {
  // When a keyboard key is pressed:
  //     If the left key is pressed:
  //         move the player left
  //     If the right key is pressed:
  //         move the player right
  if (!gameRunning) return;

  const moveStep = 25;

  if (event.key === "ArrowLeft") {
    movePlayerToX(playerX - moveStep);
  }

  if (event.key === "ArrowRight") {
    movePlayerToX(playerX + moveStep);
  }
});

gameArea.addEventListener("touchstart", (event) => {
  if (!gameRunning || event.touches.length === 0) {
    return;
  }

  const touch = event.touches[0];
  const bounds = gameArea.getBoundingClientRect();
  movePlayerToX(touch.clientX - bounds.left - player.offsetWidth / 2);
});

gameArea.addEventListener(
  "touchmove",
  (event) => {
    if (!gameRunning || event.touches.length === 0) {
      return;
    }

    event.preventDefault();
    const touch = event.touches[0];
    const bounds = gameArea.getBoundingClientRect();
    movePlayerToX(touch.clientX - bounds.left - player.offsetWidth / 2);
  },
  { passive: false },
);

nicknameInput.addEventListener("input", () => {
  if (nicknameInput.value.trim().length >= MIN_NICKNAME_LENGTH) {
    setNicknameInvalidState(false);
  }
});

startBtn.addEventListener("click", () => {
  // When the Start button is clicked:
  //     (run startGame to reset state and start the loops)
  if (gameRunning) return;
  stopGameLoops();
  stopBackgroundMusic();
  startGame();
});

restartBtn.addEventListener("click", () => {
  stopGameLoops();
  stopBackgroundMusic();
  startGame();
});

// Load the leaderboard from localStorage
// Render the leaderboard
renderLeaderboard();

updatePlayerPosition();
updateStartButtonState();

// END
