let board = [];
let players = [];
let currentPlayer = 0;
let allPieces = [];
let numPlayers = 4;
let drawPile = [];
let hasDrawnThisTurn = false;
let selectedIndex = 0;
let choosingSide = false;
let selectedSide = "direita";
let playerNames = [];
let passCount = 0;

const dropLeft = document.getElementById("drop-left");
const dropRight = document.getElementById("drop-right");
const boardDiv = document.getElementById("board-pieces");
const messageBox = document.getElementById("message-box");
const nameDisplay = document.getElementById("current-player-name");
const setupScreen = document.getElementById("setup-screen");
const controls = document.getElementById("controls");

document.getElementById("numPlayers").addEventListener("change", e => {
  numPlayers = parseInt(e.target.value);
  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`name-${i}`);
    input.style.display = i < numPlayers ? "block" : "none";
  }
});

function confirmNames() {
  playerNames = [];
  for (let i = 0; i < numPlayers; i++) {
    const name = document.getElementById(`name-${i}`).value.trim();
    playerNames.push(name || `Jogador ${i + 1}`);
  }
  setupScreen.style.display = "none";
  controls.style.display = "flex";
  startGame();
}

function showMessage(text) {
  messageBox.textContent = text;
  messageBox.style.display = "block";
  messageBox.style.opacity = "1";
  setTimeout(() => {
    messageBox.style.opacity = "0";
    setTimeout(() => {
      messageBox.style.display = "none";
    }, 1200);
  }, 1200);
}

function startGame() {
  board = [];
  allPieces = [];
  drawPile = [];
  players = [];
  currentPlayer = 0;
  selectedIndex = 0;
  choosingSide = false;
  hasDrawnThisTurn = false;
  passCount = 0;

  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      allPieces.push([i, j]);
    }
  }

  allPieces.sort(() => Math.random() - 0.5);

  for (let i = 0; i < numPlayers; i++) {
    players.push(allPieces.splice(0, 7));
  }

  drawPile = allPieces;
  render();
}

function render() {
  boardDiv.innerHTML = board.map(p => `<div class="piece">${p[0]}|${p[1]}</div>`).join("");
  nameDisplay.textContent = `Vez de: ${playerNames[currentPlayer]}`;

  ["player-1", "player-2", "player-3", "player-4"].forEach((id, idx) => {
    const div = document.getElementById(id);
    if (div) {
      div.innerHTML = "";
      div.style.display = idx === currentPlayer ? "flex" : "none";

      if (idx === currentPlayer) {
        const playable = players[idx].map((p, i) => ({ p, idx: i })).filter(({ p }) => isPlayable(p));
        if (selectedIndex >= playable.length) selectedIndex = 0;

        players[idx].forEach((piece, i) => {
          const el = document.createElement("div");
          el.className = "piece";
          el.textContent = `${piece[0]}|${piece[1]}`;

          if (isPlayable(piece)) {
            el.setAttribute("draggable", true);
            el.dataset.player = idx;
            el.dataset.index = i;
            el.ondragstart = dragStart;

            if (i === playable[selectedIndex]?.idx) {
              el.classList.add("selected");
              if (choosingSide) {
                el.innerHTML += selectedSide === "esquerda" ? " ⬅️" : " ➡️";
              }
            }
          } else {
            el.classList.add("disabled");
          }

          div.appendChild(el);
        });
      }
    }
  });
}

function isPlayable(piece) {
  if (board.length === 0) return true;
  const left = board[0][0];
  const right = board[board.length - 1][1];
  return piece.includes(left) || piece.includes(right);
}

function dragStart(event) {
  const player = event.target.dataset.player;
  const index = event.target.dataset.index;
  event.dataTransfer.setData("text/plain", `${player}-${index}`);

  // Garante visual de arraste
  const dragIcon = document.createElement("div");
  dragIcon.style.position = "absolute";
  dragIcon.style.top = "-9999px";
  dragIcon.textContent = event.target.textContent;
  dragIcon.style.padding = "10px";
  dragIcon.style.background = "#fff";
  dragIcon.style.color = "#000";
  dragIcon.style.borderRadius = "6px";
  dragIcon.style.fontWeight = "bold";
  document.body.appendChild(dragIcon);
  event.dataTransfer.setDragImage(dragIcon, 0, 0);

  setTimeout(() => {
    document.body.removeChild(dragIcon);
  }, 0);
}

dropLeft.ondragover = dropRight.ondragover = e => {
  e.preventDefault();
  e.currentTarget.classList.add("highlight");
};

dropLeft.ondragleave = dropRight.ondragleave = e => {
  e.currentTarget.classList.remove("highlight");
};

dropLeft.ondrop = e => handleDrop(e, "esquerda");
dropRight.ondrop = e => handleDrop(e, "direita");

function handleDrop(e, side) {
  e.preventDefault();
  e.currentTarget.classList.remove("highlight");

  const [playerIndex, pieceIndex] = e.dataTransfer.getData("text/plain").split("-").map(Number);
  const piece = players[playerIndex][pieceIndex];

  if (!tryPlayPiece(piece, playerIndex, pieceIndex, side)) {
    showMessage("Jogada inválida!");
    return;
  }

 if (players[playerIndex].length === 0) {
  showVictory(playerNames[playerIndex]);
  return;
}


  passCount = 0;
  nextTurn();
}

function tryPlayPiece(piece, playerIndex, pieceIndex, side) {
  const left = board[0]?.[0];
  const right = board[board.length - 1]?.[1];

  if (board.length === 0) {
    board.push(piece);
  } else if (side === "esquerda") {
    if (piece[1] === left) {
      board.unshift(piece);
    } else if (piece[0] === left) {
      board.unshift([piece[1], piece[0]]);
    } else {
      return false;
    }
  } else if (side === "direita") {
    if (piece[0] === right) {
      board.push(piece);
    } else if (piece[1] === right) {
      board.push([piece[1], piece[0]]);
    } else {
      return false;
    }
  }

  players[playerIndex].splice(pieceIndex, 1);
  return true;
}

function nextTurn() {
  currentPlayer = (currentPlayer + 1) % numPlayers;
  hasDrawnThisTurn = false;
  selectedIndex = 0;
  choosingSide = false;

  if (passCount >= numPlayers) {
    showMessage("⚠️ Jogo empatado!");
    controls.style.display = "none";
    return;
  }

  render();
  showMessage(`🔁 Vez de ${playerNames[currentPlayer]}`);
}

function drawPiece() {
  const hasPlayable = players[currentPlayer].some(p => isPlayable(p));
  if (hasPlayable) {
    showMessage("⚠️ Você já tem peças jogáveis.");
    return;
  }

  if (hasDrawnThisTurn) {
    showMessage("⚠️ Você só pode cavar uma vez por turno.");
    return;
  }

  if (drawPile.length === 0) {
    showMessage("⚠️ Não há mais peças para cavar!");
    return;
  }

  const piece = drawPile.pop();
  players[currentPlayer].push(piece);
  hasDrawnThisTurn = true;

  if (isPlayable(piece)) {
    showMessage("✅ Peça cavada pode ser jogada!");
  } else {
    showMessage("⚠️ Peça cavada não pode ser jogada. Você pode passar.");
  }

  render();
}

function passTurn() {
  const hasPlayable = players[currentPlayer].some(p => isPlayable(p));
  if (hasPlayable) {
    showMessage("⚠️ Você ainda tem jogadas possíveis!");
    return;
  }

  passCount++;
  showMessage("⏭️ Jogador passou a vez.");
  nextTurn();
}

// Navegação por teclado
document.addEventListener("keydown", e => {
  const playable = players[currentPlayer].map((p, idx) => ({ p, idx })).filter(({ p }) => isPlayable(p));
  if (playable.length === 0) return;

  if (choosingSide) {
    if (e.key === "ArrowLeft") {
      selectedSide = "esquerda";
      render();
    } else if (e.key === "ArrowRight") {
      selectedSide = "direita";
      render();
    } else if (e.key === "Enter") {
      const { p: piece, idx } = playable[selectedIndex];
      if (tryPlayPiece(piece, currentPlayer, idx, selectedSide)) {
        if (players[playerIndex].length === 0) {
  showVictory(playerNames[playerIndex]);
  return;
}

        passCount = 0;
        nextTurn();
      } else {
        showMessage("Jogada inválida!");
      }
      choosingSide = false;
      render();
    } else if (e.key === "Escape") {
      choosingSide = false;
      render();
    }
  } else {
    if (e.key === "ArrowRight") {
      selectedIndex = (selectedIndex + 1) % playable.length;
      render();
    } else if (e.key === "ArrowLeft") {
      selectedIndex = (selectedIndex - 1 + playable.length) % playable.length;
      render();
    } else if (e.key === "Enter") {
      choosingSide = true;
      selectedSide = "direita";
      render();
    }
  }
});
function resetGame() {
  // Limpa dados
  board = [];
  players = [];
  currentPlayer = 0;
  allPieces = [];
  drawPile = [];
  playerNames = [];
  hasDrawnThisTurn = false;
  selectedIndex = 0;
  choosingSide = false;
  selectedSide = "direita";
  passCount = 0;

  // Limpa nomes dos inputs
  for (let i = 0; i < 4; i++) {
    document.getElementById(`name-${i}`).value = "";
  }

  // Mostra tela inicial
  setupScreen.style.display = "block";
  controls.style.display = "none";
  nameDisplay.textContent = "";
  boardDiv.innerHTML = "";

  // Esconde todas as mãos
  ["player-1", "player-2", "player-3", "player-4"].forEach(id => {
    const div = document.getElementById(id);
    if (div) {
      div.innerHTML = "";
      div.style.display = "none";
    }
  });

  // Esconde a tela de vitória
  document.getElementById("victory-screen").style.display = "none";
}
function showVictory(winnerName) {
  const victoryScreen = document.getElementById("victory-screen");
  const winnerMessage = document.getElementById("winner-message");

  winnerMessage.textContent = `🎉 ${winnerName} venceu o jogo! 🎉`;
  victoryScreen.style.display = "block";
  controls.style.display = "none";
}
