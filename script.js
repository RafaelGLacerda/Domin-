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

const dropLeft = document.getElementById("drop-left");
const dropRight = document.getElementById("drop-right");
const boardDiv = document.getElementById("board-pieces");
const messageBox = document.getElementById("message-box");

document.getElementById("numPlayers").addEventListener("change", e => {
  numPlayers = parseInt(e.target.value);
});

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
  currentPlayer = 0;
  players = [];
  hasDrawnThisTurn = false;
  selectedIndex = 0;
  choosingSide = false;

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

  for (let i = 0; i < 4; i++) {
    const playerDiv = document.getElementById(`player-${i + 1}`);
    playerDiv.innerHTML = "";

    if (i >= numPlayers) {
      playerDiv.style.display = "none";
      continue;
    } else {
      playerDiv.style.display = "flex";
    }

    if (i === currentPlayer) {
      playerDiv.classList.add("turn-highlight");

      const playable = players[i].map((p, idx) => ({ p, idx })).filter(({ p }) => isPlayable(p));
      if (selectedIndex >= playable.length) selectedIndex = 0;

      players[i].forEach((piece, index) => {
        const el = document.createElement("div");
        el.className = "piece";
        el.textContent = `${piece[0]}|${piece[1]}`;
        if (isPlayable(piece)) {
          el.setAttribute("draggable", true);
          el.dataset.player = i;
          el.dataset.index = index;
          el.ondragstart = dragStart;

          if (index === playable[selectedIndex]?.idx) {
            el.classList.add("selected");
            if (choosingSide) {
              el.innerHTML += selectedSide === "esquerda" ? " ⬅️" : " ➡️";
            }
          }
        } else {
          el.classList.add("disabled");
        }
        playerDiv.appendChild(el);
      });
    } else {
      playerDiv.classList.remove("turn-highlight");
      const hidden = document.createElement("div");
      hidden.className = "piece disabled";
      hidden.textContent = "🂠".repeat(players[i].length);
      playerDiv.appendChild(hidden);
    }
  }
}

function isPlayable(piece) {
  if (board.length === 0) return true;
  const left = board[0][0];
  const right = board[board.length - 1][1];
  return piece.includes(left) || piece.includes(right);
}

function dragStart(event) {
  event.dataTransfer.setData("player", event.target.dataset.player);
  event.dataTransfer.setData("index", event.target.dataset.index);
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

  const playerIndex = parseInt(e.dataTransfer.getData("player"));
  const pieceIndex = parseInt(e.dataTransfer.getData("index"));
  const piece = players[playerIndex][pieceIndex];

  if (!tryPlayPiece(piece, playerIndex, pieceIndex, side)) {
    showMessage("Jogada inválida!");
    return;
  }

  if (players[playerIndex].length === 0) {
    showMessage(`🎉 Jogador ${playerIndex + 1} venceu!`);
    return;
  }

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
  render();

  showMessage(`🔁 Jogador ${currentPlayer + 1}, é sua vez.`);
}

function drawPiece() {
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
        if (players[currentPlayer].length === 0) {
          showMessage(`🎉 Jogador ${currentPlayer + 1} venceu!`);
          return;
        }
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

startGame();
