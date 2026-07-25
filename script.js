const telemetryChart = document.getElementById("telemetryChart");
const advisoryText = document.getElementById("advisoryText");
const cityHealth = document.getElementById("cityHealth");
const activeThreats = document.getElementById("activeThreats");
const gridLoad = document.getElementById("gridLoad");
const logRows = document.getElementById("logRows");
const interceptFeed = document.getElementById("interceptFeed");
const assetBars = document.getElementById("assetBars");
const incidentCards = document.getElementById("incidentCards");
const mapNodes = document.getElementById("mapNodes");

let requests = [38, 43, 44, 52, 39, 41, 47, 50, 51, 34, 35, 44, 40, 52, 43, 36, 45];
let threats = [0, 0, 1, 0, 1, 1, 2, 2, 1, 0, 1, 2, 1, 0, 1, 1, 0];
let totalThreats = 3;
let load = 82;
let health = 94.2;

const assets = [
  { name: "Main St Corridor", usage: 80 },
  { name: "City Grid A", usage: 95 },
  { name: "Reservoir West", usage: 51 },
];

const incidents = [
  { id: "INC-182", level: "Critical", title: "Critical Power Overload in Grid A" },
  { id: "INC-305", level: "Warning", title: "Main St Traffic Collision" },
  { id: "INC-900", level: "Critical", title: "Suspicious Package at Transit Hub" },
];

const darkFeed = [
  "23:14:31 :: broker@forum node seeking utility api overrun vectors",
  "23:14:42 :: chatter from enclave references sector-a comms blackout",
  "23:15:10 :: package mention: firmware hash mismatch / exploit payload",
  "23:15:34 :: watchlist keyword matched: hospital-routing spoof",
  "23:16:05 :: endpoint scrape detected from rotating bot cluster",
  "23:16:27 :: suspicious dump offer includes city relay credentials",
  "23:16:56 :: encrypted channel suggests coordinated stress event",
];

function renderAssets() {
  assetBars.innerHTML = assets
    .map(
      (asset) => `
      <div class="asset">
        <header>
          <span>${asset.name}</span>
          <span>${asset.usage}%</span>
        </header>
        <div class="track"><div class="fill" style="width:${asset.usage}%"></div></div>
      </div>
    `
    )
    .join("");
}

function renderIncidents() {
  incidentCards.innerHTML = incidents
    .map(
      (item) => `
      <article class="incident">
        <h4>${item.id} - ${item.level}</h4>
        <p>${item.title}</p>
      </article>
    `
    )
    .join("");
}

function renderMapNodes() {
  const points = [
    { x: 42, y: 66 },
    { x: 52, y: 58 },
    { x: 66, y: 34 },
  ];

  mapNodes.innerHTML = "";
  points.forEach((point) => {
    const node = document.createElement("span");
    node.className = "map-node";
    node.style.left = `${point.x}%`;
    node.style.top = `${point.y}%`;
    mapNodes.appendChild(node);
  });
}

function addLogRow(time, origin, ip, status) {
  const statusClass = status === 200 ? "status-ok" : "status-block";
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${time}</td>
    <td>${origin}</td>
    <td>${ip}</td>
    <td class="${statusClass}">${status}</td>
  `;

  logRows.prepend(row);
  while (logRows.children.length > 8) {
    logRows.lastElementChild.remove();
  }
}

function renderDarkFeed() {
  interceptFeed.textContent = darkFeed.join("\n");
}

function drawChart() {
  const ctx = telemetryChart.getContext("2d");
  const { width, height } = telemetryChart;
  const pad = 28;

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(100, 145, 210, 0.22)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i += 1) {
    const y = pad + (i * (height - pad * 2)) / 5;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
  }

  const drawSeries = (series, color, max, useFill = false) => {
    const step = (width - pad * 2) / (series.length - 1);
    ctx.beginPath();
    series.forEach((value, index) => {
      const x = pad + index * step;
      const y = height - pad - (value / max) * (height - pad * 2);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (useFill) {
      ctx.lineTo(width - pad, height - pad);
      ctx.lineTo(pad, height - pad);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, pad, 0, height - pad);
      gradient.addColorStop(0, "rgba(0, 209, 255, 0.22)");
      gradient.addColorStop(1, "rgba(0, 209, 255, 0.01)");
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  };

  drawSeries(requests, "#00d1ff", 70, true);
  drawSeries(threats, "#ff375f", 7);
}

function jitterData() {
  const nextRequests = Math.max(26, Math.min(62, requests[requests.length - 1] + Math.floor(Math.random() * 15 - 7)));
  const nextThreat = Math.max(0, Math.min(4, threats[threats.length - 1] + Math.floor(Math.random() * 3 - 1)));

  requests = [...requests.slice(1), nextRequests];
  threats = [...threats.slice(1), nextThreat];

  totalThreats = Math.max(0, Math.min(8, totalThreats + (Math.random() > 0.7 ? 1 : -1)));
  load = Math.max(42, Math.min(97, load + Math.floor(Math.random() * 7 - 3)));
  health = Math.max(72, Math.min(99, health + (Math.random() * 0.8 - 0.5)));

  activeThreats.textContent = String(totalThreats);
  gridLoad.textContent = `${load}%`;
  cityHealth.textContent = `${health.toFixed(1)}%`;

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour12: false });
  const status = Math.random() > 0.27 ? 200 : 403;
  const originPool = ["US", "IN", "DE", "CN", "BR", "ZA", "JP"];
  const randomIp = `${10 + Math.floor(Math.random() * 180)}.${Math.floor(Math.random() * 255)}.${1 + Math.floor(Math.random() * 255)}.${1 + Math.floor(Math.random() * 255)}`;
  addLogRow(time, originPool[Math.floor(Math.random() * originPool.length)], randomIp, status);

  if (Math.random() > 0.5) {
    const line = darkFeed.shift();
    darkFeed.push(line.replace("::", ":: relay"));
    renderDarkFeed();
  }

  drawChart();
}

function spikeThreat(message) {
  totalThreats += 2;
  load = Math.min(99, load + 6);
  health = Math.max(65, health - 1.4);
  activeThreats.textContent = String(totalThreats);
  gridLoad.textContent = `${load}%`;
  cityHealth.textContent = `${health.toFixed(1)}%`;
  advisoryText.textContent = message;
}

document.getElementById("injectBtn").addEventListener("click", () => {
  spikeThreat(
    "Tactical advisory: synthetic cyber stress test injected. Firewall pressure climbing; initiate segmented containment if threat score exceeds 6."
  );
});

document.getElementById("incidentBtn").addEventListener("click", () => {
  spikeThreat(
    "Tactical advisory: physical incident simulation active. Dispatch reroutes engaged and critical corridor response windows tightened."
  );
});

document.getElementById("lockdownBtn").addEventListener("click", () => {
  spikeThreat(
    "Lockdown sequence requested. Restricting external API access, promoting all pending incident tickets, and elevating response posture to red."
  );
});

renderAssets();
renderIncidents();
renderMapNodes();
renderDarkFeed();

const bootLogs = [
  ["09:10:19", "US", "113.22.1.190", 200],
  ["09:10:28", "IN", "16.88.1.157", 403],
  ["09:10:54", "DE", "37.29.3.172", 200],
  ["09:11:11", "BR", "67.154.1.250", 403],
  ["09:11:38", "JP", "236.148.1.246", 200],
];

bootLogs.forEach((entry) => addLogRow(...entry));
drawChart();
setInterval(jitterData, 2200);
