let processes = [];
let pid = 1;

function renderProcesses() {
  const tbody = document.getElementById('process-list');
  tbody.innerHTML = '';
  processes.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>P${p.id}</td>
      <td>${p.arrivalTime}</td>
      <td>${p.burstTime}</td>
      <td><button onclick="removeProcess(${i})">Remove</button></td>`;
    tbody.appendChild(tr);
  });
}
window.removeProcess = function(i) {
  processes.splice(i, 1);
  renderProcesses();
};

document.getElementById('add-process').onclick = function() {
  const arrival = Number(document.getElementById('arrival').value);
  const burst = Number(document.getElementById('burst').value);
  if (burst > 0) {
    processes.push({ id: pid++, arrivalTime: arrival, burstTime: burst });
    renderProcesses();
  }
};

document.getElementById('random-processes').onclick = function() {
  processes = [];
  pid = 1;
  for (let i = 0; i < 5 + Math.floor(Math.random() * 5); i++) {
    processes.push({
      id: pid++,
      arrivalTime: Math.floor(Math.random() * 10),
      burstTime: 1 + Math.floor(Math.random() * 10)
    });
  }
  renderProcesses();
};

document.getElementById('algorithm').onchange = function() {
  document.getElementById('rr-params').style.display = this.value === 'rr' ? '' : 'none';
  document.getElementById('mlfq-params').style.display = this.value === 'mlfq' ? '' : 'none';
};

document.getElementById('scheduler-form').onsubmit = function(e) {
  e.preventDefault();
  // For demo, just fake a Gantt chart and stats
  if (processes.length === 0) return;
  document.getElementById('results').style.display = '';
  // Fake Gantt: each process runs after previous
  let time = 0;
  let gantt = [];
  processes
    .slice()
    .sort((a, b) => a.arrivalTime - b.arrivalTime)
    .forEach(p => {
      if (time < p.arrivalTime) time = p.arrivalTime;
      gantt.push({ ...p, start: time, end: time + p.burstTime });
      time += p.burstTime;
    });
  // Render Gantt
  const ganttDiv = document.getElementById('gantt');
  ganttDiv.innerHTML = '';
  gantt.forEach((g, i) => {
    const block = document.createElement('div');
    block.className = 'gantt-block';
    block.style.width = `${g.burstTime * 40}px`;
    block.style.height = '40px';
    block.innerHTML = `P${g.id}<span>${g.start}</span>`;
    ganttDiv.appendChild(block);
    if (i === gantt.length - 1) {
      const end = document.createElement('span');
      end.textContent = g.end;
      end.style.position = 'absolute';
      end.style.right = '0';
      end.style.bottom = '-18px';
      block.appendChild(end);
    }
  });
  // Render Table
  let table = `<table><tr>
    <th>PID</th><th>Arrival</th><th>Burst</th><th>Completion</th><th>Turnaround</th><th>Response</th></tr>`;
  gantt.forEach(g => {
    table += `<tr>
      <td>P${g.id}</td>
      <td>${g.arrivalTime}</td>
      <td>${g.burstTime}</td>
      <td>${g.end}</td>
      <td>${g.end - g.arrivalTime}</td>
      <td>${g.start - g.arrivalTime}</td>
    </tr>`;
  });
  table += '</table>';
  document.getElementById('result-table').innerHTML = table;
  // Render Summary
  const avgTAT = (gantt.reduce((a, g) => a + (g.end - g.arrivalTime), 0) / gantt.length).toFixed(2);
  const avgRT = (gantt.reduce((a, g) => a + (g.start - g.arrivalTime), 0) / gantt.length).toFixed(2);
  document.getElementById('summary').innerHTML =
    `Average Turnaround Time: ${avgTAT}<br>Average Response Time: ${avgRT}`;
};

renderProcesses();