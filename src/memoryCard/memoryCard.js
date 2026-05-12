document.addEventListener("DOMContentLoaded", () => {
  const nicknameInput = document.getElementById("nickname");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");

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
  const MIN_NICKNAME_LENGTH = 3;
  const backgroundMusic = new Audio("memoryCard.mp3");
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.3;

  // START
  // Prepare pairs of card symbols
  const cardSymbols = ["🍎", "🍌", "🍇", "🍒", "🍉", "🥝", "🍍", "🍓"];

  let cards = [];
  let firstCardId = null;
  let secondCardId = null;
  let lockBoard = false;
  let moves = 0;
  let matchedPairs = 0;
  let playerName = "Player";
  let timerInterval = null;
  let secondsElapsed = 0;

  function setNicknameInvalidState(isInvalid) {
    nicknameInput.classList.toggle("input-invalid", isInvalid);

    if (isInvalid) {
      nicknameInput.setCustomValidity(
        `Nickname must be at least ${MIN_NICKNAME_LENGTH} characters.`,
      );
      nicknameInput.reportValidity();
      return;
    }

    nicknameInput.setCustomValidity("");
  }

  function getValidatedNickname() {
    const value = nicknameInput.value.trim();

    if (value.length < MIN_NICKNAME_LENGTH) {
      setNicknameInvalidState(true);
      return null;
    }

    setNicknameInvalidState(false);
    return value;
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function createCards() {
    // Shuffle the card positions
    const duplicatedSymbols = [...cardSymbols, ...cardSymbols];
    const shuffledCards = shuffleArray(duplicatedSymbols);

    cards = shuffledCards.map((symbol, index) => {
      return {
        id: index,
        symbol: symbol,
        matched: false,
        flipped: false,
      };
    });
  }

  function renderBoard() {
    // Render all cards face down
    gameBoard.innerHTML = "";

    cards.forEach((card) => {
      const cardElement = document.createElement("div");
      cardElement.classList.add("memory-card");
      cardElement.dataset.id = card.id;

      if (card.flipped) {
        cardElement.classList.add("flipped");
      }

      if (card.matched) {
        cardElement.classList.add("matched");
      }

      const cardInner = document.createElement("div");
      cardInner.classList.add("memory-card-inner");

      const cardFront = document.createElement("div");
      cardFront.classList.add("memory-card-face", "memory-card-front");
      cardFront.textContent = "?";

      const cardBack = document.createElement("div");
      cardBack.classList.add("memory-card-face", "memory-card-back");
      cardBack.textContent = card.symbol;

      cardInner.append(cardFront, cardBack);
      cardElement.appendChild(cardInner);

      cardElement.addEventListener("click", handleCardClick);
      gameBoard.appendChild(cardElement);
    });
  }

  function getCardElement(cardId) {
    return gameBoard.querySelector(`.memory-card[data-id="${cardId}"]`);
  }

  function updateCardElement(cardId) {
    const cardElement = getCardElement(cardId);
    const cardState = cards[cardId];

    if (!cardElement || !cardState) {
      return;
    }

    cardElement.classList.toggle("flipped", cardState.flipped);
    cardElement.classList.toggle("matched", cardState.matched);
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

  function playBackgroundMusic() {
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(() => {});
  }

  function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }

  function handleCardClick(event) {
    // When a card is clicked:
    //     If the game is not active, ignore it
    //     If the card is already matched, ignore it
    //     If the card is already face up, ignore it
    const clickedCard = event.currentTarget;
    const clickedId = Number(clickedCard.dataset.id);
    const clickedState = cards[clickedId];

    if (lockBoard) return;
    if (!clickedState) return;
    if (clickedState.flipped) return;
    if (clickedState.matched) return;

    // Reveal the card
    clickedState.flipped = true;
    updateCardElement(clickedId);

    // If there is no first card yet:
    //     save it as the first card
    if (firstCardId === null) {
      firstCardId = clickedId;
      return;
    }

    // If there is already a first card:
    //     save it as the second card
    //     increase moves
    //     compare both cards
    secondCardId = clickedId;
    lockBoard = true;
    moves++;
    updateStats();

    checkMatch();
  }

  function checkMatch() {
    // Compare both cards
    const firstSymbol = cards[firstCardId]?.symbol;
    const secondSymbol = cards[secondCardId]?.symbol;

    // If the symbols match:
    //     mark them as matched
    //     increase matches
    //     clear the first and second selection
    if (firstSymbol === secondSymbol) {
      markMatched();
    } else {
      // If the symbols are different:
      //     wait briefly
      //     flip both cards back over
      //     clear the first and second selection
      unflipCards();
    }
  }

  function markMatched() {
    // Mark both cards as matched
    cards[firstCardId].matched = true;
    cards[secondCardId].matched = true;
    updateCardElement(firstCardId);
    updateCardElement(secondCardId);

    // Increase matches
    // Clear the first and second selection
    matchedPairs++;
    updateStats();
    resetTurn();

    // If matches equal the total number of pairs:
    //     stop the timer
    //     save the score to localStorage
    //     show the win message
    if (matchedPairs === cardSymbols.length) {
      stopTimer();
      stopBackgroundMusic();
      messageText.textContent = `Congratulations, ${playerName}! You completed the game in ${moves} moves.`;
      finalMessage.textContent = `${playerName} completed all pairs in ${moves} moves and ${formatTime(secondsElapsed)}.`;
      resultOverlay.classList.remove("hidden");
      saveScore();
      renderLeaderboard();
    }
  }

  function unflipCards() {
    const selectedFirstId = firstCardId;
    const selectedSecondId = secondCardId;

    setTimeout(() => {
      cards[selectedFirstId].flipped = false;
      cards[selectedSecondId].flipped = false;
      updateCardElement(selectedFirstId);
      updateCardElement(selectedSecondId);
      resetTurn();
    }, 900);
  }

  function resetTurn() {
    firstCardId = null;
    secondCardId = null;
    lockBoard = false;
  }

  function updateStats() {
    movesText.textContent = moves;
    matchedText.textContent = `${matchedPairs} / ${cardSymbols.length}`;
  }

  function startGame() {
    // When the Start Game button is clicked:
    //     Read the nickname
    //     Validate minimum nickname length
    stopTimer();
    const validNickname = getValidatedNickname();
    if (!validNickname) {
      return;
    }

    playerName = validNickname;
    playerNameText.textContent = playerName;

    // Reset moves = 0
    // Reset matches = 0
    // Reset timer = 0
    moves = 0;
    matchedPairs = 0;
    secondsElapsed = 0;
    firstCardId = null;
    secondCardId = null;
    lockBoard = false;
    messageText.textContent = "Game started. Match all card pairs.";
    resultOverlay.classList.add("hidden");

    // Shuffle the cards again
    createCards();

    // Start the timer
    // Activate the game
    renderBoard();
    updateStats();
    updateTimer();
    playBackgroundMusic();
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
      const emptyEntry = document.createElement("li");
      emptyEntry.textContent = "No saved scores yet.";
      leaderboardList.appendChild(emptyEntry);
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

  nicknameInput.addEventListener("input", () => {
    if (nicknameInput.value.trim().length >= MIN_NICKNAME_LENGTH) {
      setNicknameInvalidState(false);
    }
  });

  // Render the leaderboard
  renderLeaderboard();

  // Update the timer each second
  updateTimer();
});
