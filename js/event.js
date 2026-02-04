const params = new URLSearchParams(window.location.search);
const eventName = params.get("event");
const SPREADSHEET_ID = "1BUaE0fYx0trpWqPQkQpeGWYmAAJvUvcZKDS78HjE7N8";

document.getElementById("event-title").textContent = eventName;

async function loadEvent() {
  const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${encodeURIComponent(eventName)}`;
  const data = await fetch(url).then(r => r.json());

  const body = document.getElementById("event-body");
  body.innerHTML = "";

  data.forEach(row => {
    body.insertAdjacentHTML(
      "beforeend",
      `<tr>
        <td>${row.Rank}</td>
        <td>
          <a href="../player.html?player=${encodeURIComponent(row.Name)}">
            ${row.Name}
          </a>
        </td>
        <td>${row.Pod}</td>
        <td>${row.Points}</td>
        <td>${row["OMW%"]}</td>
        <td>${row["GW%"]}</td>
        <td>${row["OGW%"]}</td>
      </tr>`
    );
  });
}

loadEvent();