const SPREADSHEET_ID = "1BUaE0fYx0trpWqPQkQpeGWYmAAJvUvcZKDS78HjE7N8";

// 👇 Update with your real season tab names
const seasons = ["Lorwyn Eclipsed", "Avatar: The Last Airbender", "Marvel's Spider-Man", "Edge of Eternities", "Final Fantasy", "Tarkir: Dragonstorm", "Aetherdrift"];

const params = new URLSearchParams(window.location.search);
const playerName = params.get("player");
const SEASON_ORDER = [
  "Lorwyn Eclipsed",
  "Avatar: The Last Airbender",
  "Marvel's Spider-Man",
  "Edge of Eternities",
  "Final Fantasy",
  "Tarkir: Dragonstorm",
  "Aetherdrift"
];

const orderedSeasons = SEASON_ORDER.filter(season =>
  seasons.includes(season)
);

document.getElementById("player-name").textContent = playerName;

if (!playerName) {
  document.body.innerHTML = "<p>Player not found.</p>";
  throw new Error("Missing player name");
}

let careerTotals = {
  Points: 0,
  Wins: 0,
  Draws: 0,
  Matches: 0
};

const historyBody = document.getElementById("history-body");

function parseSheetDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day); // local time
}

orderedSeasons.forEach(async season => {
  const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${encodeURIComponent(season)}`;
  const data = await fetch(url).then(res => res.json());

  const row = data.find(p => p.Player === playerName);
  if (!row) return;

  const wins = Number(row.Wins) || 0;
  const draws = Number(row.Draws) || 0;
  const matches = Number(row.Matches) || 0;
  const points = Number(row.Points) || 0;

  const winPct =
    matches > 0
      ? (((wins + draws * 0.5) / matches) * 100).toFixed(1)
      : "0.0";

  careerTotals.Points += points;
  careerTotals.Wins += wins;
  careerTotals.Draws += draws;
  careerTotals.Matches += matches;

  historyBody.insertAdjacentHTML(
    "beforeend",
    `<tr>
      <td>${season}</td>
      <td>${points}</td>
      <td>${wins}</td>
      <td>${draws}</td>
      <td>${matches}</td>
      <td>${winPct}%</td>
    </tr>`
  );

  // Update career stats
  const careerWinPct =
    careerTotals.Matches > 0
      ? (((careerTotals.Wins) /
          careerTotals.Matches) * 100).toFixed(1)
      : "0.0";

  document.getElementById("points").textContent = careerTotals.Points;
  document.getElementById("wins").textContent = careerTotals.Wins;
  document.getElementById("draws").textContent = careerTotals.Draws;
  document.getElementById("matches").textContent = careerTotals.Matches;
  document.getElementById("winpct").textContent = careerWinPct + "%";
});

function renderPlayerSummary(matches) {
  const summaryEl = document.getElementById("player-summary");
  if (!summaryEl || !matches.length) return;

  let win = 0, loss = 0, draw = 0;

  matches.forEach(m => {
    if (m.Result === "Win") win++;
    else if (m.Result === "Loss") loss++;
    else if (m.Result === "Draw") draw++;
  });

  const total = win + loss + draw;

  const winPct = total
    ? ((win / total) * 100).toFixed(1)
    : "0.0";

  // ✅ last non-blank New Rating
  const lastRating =
  [...matches]
    .filter(m => m["New Rating"] && m["New Rating"].toString().trim() !== "")
    .sort((a, b) => new Date(a.Date) - new Date(b.Date)) // oldest → newest
    .at(-1)?.["New Rating"] ?? "—";

  const trophies = calculateTrophies(matches);
  
  summaryEl.innerHTML = `
    <div class="player-summary-line">
      <strong>Current Rating:</strong> ${lastRating}
      &nbsp;|&nbsp;
      <strong>Record:</strong>
      ${win}-${loss}-${draw} (${winPct}%)
      ${
        trophies > 0
          ? `&nbsp;|&nbsp;🏆 ${trophies}`
          : ""
      }
    </div>
  `;
}

async function loadMatchHistory(playerName) {
  const container = document.getElementById("matches-container");
  container.innerHTML = "";

  const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${encodeURIComponent(playerName)}`;

  try {
    const data = await fetch(url).then(res => res.json());

    if (!data.length) {
      container.innerHTML = "<p>No match history available.</p>";
      return;
    }

    // Sort newest → oldest
    data.sort((a, b) => new Date(b.Date) - new Date(a.Date));

    // Group by EVENT
    const grouped = data.reduce((acc, match) => {
      const eventKey = match.Event || "Other Events";
      acc[eventKey] = acc[eventKey] || [];
      acc[eventKey].push(match);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([eventName, matches]) => {
      const section = document.createElement("div");
      section.className = "match-event-section";

      const date = matches[0].Date;
      const startRating = matches[0]["Starting Rating"];
      const newRating = matches[0]["New Rating"];

      // Sort rounds numerically inside event
      matches.sort((a, b) => Number(a.Round) - Number(b.Round));

      let eventWin = 0;
      let eventLoss = 0;
      let eventDraw = 0;

      matches.forEach(m => {
        if (m.Result === "Win") eventWin++;
        else if (m.Result === "Loss") eventLoss++;
        else if (m.Result === "Draw") eventDraw++;
      });

      section.innerHTML = `
        <div class="event-card">
          <h2 class="match-event-title">${eventName}</h2>

          ${
            date
              ? `<div class="match-date">
                  ${new parseSheetDate(date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </div>`
              : ""
          }

          ${
            startRating && newRating
              ? `<div class="match-rating">
                  Starting Rating: <strong>${startRating}</strong>
                  &nbsp;→&nbsp;
                  New Rating: <strong>${newRating}</strong>
                </div>`
              : ""
          }

          <div class="event-rounds">
            <div class="round-header">
              <div>Round</div>
              <div>Opponent</div>
              <div>Result</div>
              <div>Δ ELO</div>
            </div>
          </div>

          <div class="event-record">
            <strong>Record:</strong> ${eventWin}-${eventLoss}-${eventDraw}
          </div>
        
        </div>
      `;

      const roundsContainer = section.querySelector(".event-rounds");

      matches.forEach(match => {
        const resultClass =
          match.Result === "Win"
            ? "result-win"
            : match.Result === "Loss"
            ? "result-loss"
            : "result-draw";

        // ✅ Δ ELO coloring logic
        const delta = Number(match.ELO) || 0;
        let deltaClass = "elo-neutral";
        if (delta > 0) deltaClass = "elo-positive";
        else if (delta < 0) deltaClass = "elo-negative";

        const row = document.createElement("div");
        row.className = "round-row";

        row.innerHTML = `
          <div class="round">${match.Round}</div>

          <div class="opponent">
            <a class="opponent-link"
              href="index.html?player=${encodeURIComponent(match.Opponent)}">
              ${match.Opponent}
              ${
                match["Opponent Rating"]
                  ? ` (${match["Opponent Rating"]})`
                  : ""
              }
            </a>
          </div>

          <div class="result ${resultClass}">
            ${match.Result}
          </div>

          <div class="elo ${deltaClass}">
            ${delta > 0 ? "+" : ""}${delta}
          </div>
        `;

        roundsContainer.appendChild(row);
      });

      container.appendChild(section);
    });

    renderPlayerSummary(data);
    renderHeadToHead(data);

  } catch (err) {
    container.innerHTML = "<p>Unable to load match history.</p>";
  }
}

function calculateTrophies(matches) {
  const events = {};

  // Group matches by event
  matches.forEach(m => {
    const event = m.Event;
    if (!event) return;

    events[event] = events[event] || [];
    events[event].push(m);
  });

  let trophies = 0;

  Object.values(events).forEach(eventMatches => {
    if (eventMatches.length !== 3) return;

    let win = 0, loss = 0, draw = 0;

    eventMatches.forEach(m => {
      if (m.Result === "Win") win++;
      else if (m.Result === "Loss") loss++;
      else if (m.Result === "Draw") draw++;
    });

    if (win === 3 && loss === 0 && draw === 0) {
      trophies++;
    }
  });

  return trophies;
}

function renderHeadToHead(matches) {
  const container = document.getElementById("h2h-container");
  if (!container) return;

  container.innerHTML = "";

  const records = {};

  matches.forEach(match => {
    const opp = match.Opponent;
    if (!opp) return;

    if (!records[opp]) {
      records[opp] = { win: 0, loss: 0, draw: 0 };
    }

    if (match.Result === "Win") records[opp].win++;
    else if (match.Result === "Loss") records[opp].loss++;
    else if (match.Result === "Draw") records[opp].draw++;
  });

  const rows = Object.entries(records)
    .map(([opponent, r]) => {
      const total = r.win + r.loss + r.draw;
      const winPct = total ? (r.win / total) * 100 : 0;

      return {
        opponent,
        ...r,
        total,
        winPct
      };
    })
    .sort((a, b) => b.total - a.total);

  if (!rows.length) {
    container.innerHTML = "<p>No head-to-head data.</p>";
    return;
  }

  // Single card
  const card = document.createElement("div");
  card.className = "head-to-head-card";

  card.innerHTML = `
    <h2 class="section-title">Head-to-Head</h2>

    <div class="h2h-header">
      <div>Opponent</div>
      <div>Record</div>
      <div>Win %</div>
    </div>
  `;

  rows.forEach(r => {
    const row = document.createElement("div");
    row.className = "h2h-row";

    row.innerHTML = `
      <div class="h2h-opponent">
        <a href="index.html?player=${encodeURIComponent(r.opponent)}">
          ${r.opponent}
        </a>
      </div>

      <div class="h2h-record">
        ${r.win}–${r.loss}–${r.draw}
      </div>

      <div class="h2h-winpct">
        ${r.winPct.toFixed(1)}%
      </div>
    `;

    card.appendChild(row);
  });

  container.appendChild(card);
}


loadMatchHistory(playerName);

