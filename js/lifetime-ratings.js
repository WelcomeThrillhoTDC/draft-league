const SPREADSHEET_ID = "1BUaE0fYx0trpWqPQkQpeGWYmAAJvUvcZKDS78HjE7N8";
const RATINGS_TAB = "Ratings";

async function loadLifetimeRatings() {
  const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${RATINGS_TAB}`;
  const data = await fetch(url).then(res => res.json());

  const tbody = document.getElementById("ratings-body");
  tbody.innerHTML = "";

  data
    .filter(r => r.Player)
    .sort((a, b) => Number(a.Rank) - Number(b.Rank))
    .forEach(row => {
      const wins = Number(row.Wins) || 0;
      const losses = Number(row.Losses) || 0;
      const draws = Number(row.Draws) || 0;
      const matches = wins + losses + draws;

      const winPct =
        matches > 0
          ? (((wins + draws * 0.5) / matches) * 100).toFixed(1)
          : "0.0";

      const deltaRank =
        row["Prev Rank"]
          ? Number(row["Prev Rank"]) - Number(row.Rank)
          : 0;

      const deltaDisplay =
        deltaRank > 0
          ? `<span class="rank-up">▲ ${deltaRank}</span>`
          : deltaRank < 0
          ? `<span class="rank-down">▼ ${Math.abs(deltaRank)}</span>`
          : "—";

      tbody.insertAdjacentHTML(
        "beforeend",
        `<tr>
          <td>${row.Rank}</td>
          <td>${deltaDisplay}</td>
          <td>
            <a href="index.html?player=${encodeURIComponent(row.Player)}">
              ${row.Player}
            </a>
          </td>
          <td>${row.Rating}</td>
          <td>${wins}-${losses}-${draws}</td>
          <td>${winPct}%</td>
        </tr>`
      );
    });
}

loadLifetimeRatings();