const SPREADSHEET_ID = "1BUaE0fYx0trpWqPQkQpeGWYmAAJvUvcZKDS78HjE7N8";

const seasons = [
  { label: "Lorwyn Eclipsed", tab: "Lorwyn Eclipsed" },
  { label: "Avatar: The Last Airbender", tab: "Avatar: The Last Airbender" },
  { label: "Marvel's Spider-Man", tab: "Marvel's Spider-Man" },
  { label: "Edge of Eternities", tab: "Edge of Eternities" },
  { label: "Final Fantasy", tab: "Final Fantasy" },
  { label: "Tarkir: Dragonstorm", tab: "Tarkir: Dragonstorm" },
  { label: "Aetherdrift", tab: "Aetherdrift" }
];

const seasonSelect = document.getElementById("season-select");
const tbody = document.getElementById("table-body");
// const uniqueSeasons = [...new Set(seasons)]
//   .sort((a, b) => b.localeCompare(a));

function populateSeasonDropdown(seasons) {
  const select = document.getElementById("season-select");
  if (!select) return;

  // 🔥 Clear existing options FIRST
  select.innerHTML = "";

  // ✅ Remove duplicates
  const uniqueSeasons = [...new Set(seasons)];

  uniqueSeasons.forEach(season => {
    const option = document.createElement("option");
    option.value = season;
    option.textContent = season;
    select.appendChild(option);
  });
}

// Build dropdown
seasons.forEach(season => {
  const option = document.createElement("option");
  option.value = season.tab;
  option.textContent = season.label;
  seasonSelect.appendChild(option);
});

let currentPlayers = [];
let currentSort = { key: "Points", direction: "desc" };

// document.addEventListener("DOMContentLoaded", () => {
//   populateSeasonDropdown();

//   // Default season
//   const defaultSeason = seasons[0];
//   document.getElementById("season-select").value = defaultSeason;

//   loadSeason(defaultSeason);
// });

function loadSeason(tabName) {
  const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${encodeURIComponent(tabName)}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      currentPlayers = data.map(p => ({
        ...p,
        Points: Number(p.Points) || 0,
        Wins: Number(p.Wins) || 0,
        Draws: Number(p.Draws) || 0,
        Matches: Number(p.Matches) || 0
      }));

      // 🔒 Always start sorted by Points (desc)
      currentSort = { key: "Points", direction: "asc" };
      sortAndRender("Points");
    })
    .catch(() => {
      tbody.innerHTML =
        "<tr><td colspan='7'>Failed to load season</td></tr>";
    });
}

function sortAndRender(key) {
  if (currentSort.key === key) {
    currentSort.direction =
      currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentSort.key = key;
    currentSort.direction = "desc";
  }

  currentPlayers.sort((a, b) => {
    let aVal, bVal;

    if (key === "WinPct") {
      aVal = calculateWinPct(a);
      bVal = calculateWinPct(b);
    } else {
      aVal = a[key];
      bVal = b[key];
    }

    if (typeof aVal === "string") {
      return currentSort.direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return currentSort.direction === "asc"
      ? aVal - bVal
      : bVal - aVal;
  });

// document.querySelectorAll("th").forEach(th =>
//   th.classList.remove("sorted-asc", "sorted-desc")
// );

// const activeHeader = document.querySelector(
//   `th[data-key="${key}"]`
// );

// activeHeader.classList.add(
//   currentSort.direction === "asc"
//     ? "sorted-asc"
//     : "sorted-desc"
// );

  renderTable(currentPlayers);
}

function renderTable(players) {
  tbody.innerHTML = "";

  players.forEach((p, index) => {
// Insert cut line AFTER rank 8
//    if (index === 8) {
//      tbody.insertAdjacentHTML(
//        "beforeend",
//        `<tr class="cut-line">
//          <td colspan="7">⬆ Top 8 Cut ⬆</td>
//        </tr>`
//      );
//    }

    tbody.insertAdjacentHTML(
      "beforeend",
      `<tr class="${index < 8 ? "top-eight" : ""}">
        <td>${index + 1}</td>
        <td>
          <a class="player-link"
            href="players/index.html?player=${encodeURIComponent(p.Player)}">
            ${p.Player}
          </a>
        </td>
        <td>${p.Points}</td>
        <td>${p.Wins}</td>
        <td>${p.Draws ?? 0}</td>
        <td>${p.Matches}</td>
        <td>${p.WinPct}</td>
      </tr>`
    );
  });
}

// Load newest season by default
loadSeason(seasons[0].tab);

// Switch seasons
seasonSelect.addEventListener("change", e => {
  loadSeason(e.target.value);
});

// document.querySelectorAll("th[data-key]").forEach(header => {
//   header.addEventListener("click", () => {
//     sortAndRender(header.dataset.key);
//   });
// });