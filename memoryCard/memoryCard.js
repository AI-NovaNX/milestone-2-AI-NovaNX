document.addEventListener("DOMContentLoaded", () => {
  const nicknameInput = document.getElementById("nickname");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const backHomeBtn = document.querySelector(".back-home-btn");

  const gameBoard = document.getElementById("memoryBoard");
  const movesText = document.getElementById("moves");
  const matchedText = document.getElementById("matches");
  const timerText = document.getElementById("timer");
  const messageText = document.getElementById("statusMessage");
  const playerNameText = document.getElementById("playerName");
  const leaderboardList = document.getElementById("leaderboardList");
  const resultOverlay = document.getElementById("resultOverlay");
  const finalMessage = document.getElementById("finalMessage");
  const playAgainBtn = document.getElementById("playAgainBtn");

  const cardSymbols = ["🍎", "🍌", "🍇", "🍒", "🍉", "🥝", "🍍", "🍓"];

  let cards = [];
  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let moves = 0;
  let matchedPairs = 0;
  let playerName = "Player";
  let timerInterval = null;
  let secondsElapsed = 0;

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function createCards() {
    const duplicatedSymbols = [...cardSymbols, ...cardSymbols];
    const shuffledCards = shuffleArray(duplicatedSymbols);

    cards = shuffledCards.map((symbol, index) => {
      return {
        id: index,
        symbol: symbol,
        matched: false,
      };
    });
  }

  function renderBoard() {
    gameBoard.innerHTML = "";

    cards.forEach((card) => {
      const cardElement = document.createElement("div");
      cardElement.classList.add("memory-card");
      cardElement.dataset.id = card.id;
      cardElement.dataset.symbol = card.symbol;

      cardElement.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-card-face memory-card-front">?</div>
          <div class="memory-card-face memory-card-back">${card.symbol}</div>
        </div>
      `;

      cardElement.addEventListener("click", handleCardClick);
      gameBoard.appendChild(cardElement);
    });
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function updateTimer() {
    timerText.textContent = formatTime(secondsElapsed);
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = window.setInterval(() => {
      secondsElapsed += 1;
      updateTimer();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function handleCardClick(event) {
    const clickedCard = event.currentTarget;
    const clickedId = Number(clickedCard.dataset.id);

    if (lockBoard) return;
    if (clickedCard.classList.contains("flipped")) return;
    if (cards[clickedId].matched) return;

    clickedCard.classList.add("flipped");

    if (!firstCard) {
      firstCard = clickedCard;
      return;
    }

    secondCard = clickedCard;
    lockBoard = true;
    moves++;
    updateStats();

    checkMatch();
  }

  function checkMatch() {
    const firstSymbol = firstCard.dataset.symbol;
    const secondSymbol = secondCard.dataset.symbol;

    if (firstSymbol === secondSymbol) {
      markMatched();
    } else {
      unflipCards();
    }
  }

  function markMatched() {
    const firstId = Number(firstCard.dataset.id);
    const secondId = Number(secondCard.dataset.id);

    cards[firstId].matched = true;
    cards[secondId].matched = true;

    matchedPairs++;
    updateStats();
    resetTurn();

    if (matchedPairs === cardSymbols.length) {
      stopTimer();
      messageText.textContent = `Selamat, ${playerName}! Kamu menyelesaikan game dalam ${moves} langkah.`;
      finalMessage.textContent = `${playerName} menyelesaikan semua pasangan dalam ${moves} langkah dan waktu ${formatTime(secondsElapsed)}.`;
      resultOverlay.classList.remove("hidden");
      saveScore();
      renderLeaderboard();
    }
  }

  function unflipCards() {
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetTurn();
    }, 900);
  }

  function resetTurn() {
    firstCard = null;
    secondCard = null;
    lockBoard = false;
  }

  function updateStats() {
    movesText.textContent = moves;
    matchedText.textContent = `${matchedPairs} / ${cardSymbols.length}`;
  }

  function startGame() {
    stopTimer();
    playerName = nicknameInput.value.trim() || "Player";
    playerNameText.textContent = playerName;
    moves = 0;
    matchedPairs = 0;
    secondsElapsed = 0;
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    messageText.textContent = "Game dimulai. Cocokkan semua pasangan kartu.";
    resultOverlay.classList.add("hidden");

    createCards();
    renderBoard();
    updateStats();
    updateTimer();
    startTimer();
  }

  function saveScore() {
    const leaderboard =
      JSON.parse(localStorage.getItem("memoryCardLeaderboard")) || [];

    leaderboard.push({
      name: playerName,
      moves: moves,
      time: secondsElapsed,
    });

    leaderboard.sort((a, b) => {
      if (a.moves !== b.moves) {
        return a.moves - b.moves;
      }

      return a.time - b.time;
    });

    const topTen = leaderboard.slice(0, 10);
    localStorage.setItem("memoryCardLeaderboard", JSON.stringify(topTen));
  }

  function renderLeaderboard() {
    const leaderboard =
      JSON.parse(localStorage.getItem("memoryCardLeaderboard")) || [];
    leaderboardList.innerHTML = "";

    if (leaderboard.length === 0) {
      leaderboardList.innerHTML = "<li>Belum ada skor tersimpan.</li>";
      return;
    }

    leaderboard.forEach((player) => {
      const li = document.createElement("li");
      li.classList.add("leaderboard-entry");

      const playerSpan = document.createElement("span");
      playerSpan.classList.add("leaderboard-player");
      playerSpan.textContent = player.name;

      const stepsSpan = document.createElement("span");
      stepsSpan.classList.add("leaderboard-steps");
      stepsSpan.textContent = player.moves;

      const durationSpan = document.createElement("span");
      durationSpan.classList.add("leaderboard-duration");
      durationSpan.textContent = formatTime(player.time || 0);

      li.append(playerSpan, stepsSpan, durationSpan);
      leaderboardList.appendChild(li);
    });
  }

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);
  playAgainBtn.addEventListener("click", startGame);

  if (backHomeBtn) {
    backHomeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "index.html";
    });
  }

  renderLeaderboard();
  updateTimer();
});
