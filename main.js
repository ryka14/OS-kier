let processes = [];
let pid = 1;

// Render process table in the UI
function renderProcesses() {
  const tbody = document.getElementById('process-list');
  tbody.innerHTML = '';
  processes.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>P${p.id}</td>
      <td>${p.arrivalTime}</td>
      <td>${p.burstTime}</td>
      <td><button type="button" onclick="removeProcess(${i})" class="remove-btn">Remove</button></td>`;
    tbody.appendChild(tr);
  });
}

// Remove a process
window.removeProcess = function(i) {
  processes.splice(i, 1);
  renderProcesses();
};

// Add process manually
document.getElementById('add-process').onclick = function() {
  const arrivalInput = document.getElementById('arrival');
  const burstInput = document.getElementById('burst');
  const arrival = Number(arrivalInput.value);
  const burst = Number(burstInput.value);

  if (Number.isNaN(arrival) || arrival < 0) {
    showMessage('Arrival time must be 0 or greater.');
    return;
  }
  if (Number.isNaN(burst) || burst < 1) {
    showMessage('Burst time must be 1 or greater.');
    return;
  }

  processes.push({ id: pid++, arrivalTime: arrival, burstTime: burst });
  renderProcesses();
  showMessage('Process added!', 'success');
  arrivalInput.value = '';
  burstInput.value = '';
};

// Generate random processes
document.getElementById('random-processes').onclick = function() {
  processes = [];
  pid = 1;
  const n = 5 + Math.floor(Math.random() * 5);
  for (let i = 0; i < n; i++) {
    processes.push({
      id: pid++,
      arrivalTime: Math.floor(Math.random() * 10),
      burstTime: 1 + Math.floor(Math.random() * 10)
    });
  }
  renderProcesses();
  showMessage('Random processes generated!', 'success');
};

// Show/hide RR/MLFQ params
document.getElementById('algorithm').onchange = function() {
  document.getElementById('rr-params').style.display = this.value === 'rr' ? '' : 'none';
  document.getElementById('mlfq-params').style.display = this.value === 'mlfq' ? '' : 'none';
};

// Main scheduling and display logic
document.getElementById('scheduler-form').onsubmit = function(e) {
  e.preventDefault();
  if (processes.length === 0) {
    showMessage('No processes to schedule!');
    return;
  }
  document.getElementById('results').style.display = '';

  // Deep copy for simulation
  let procs = processes.map(p => ({
    id: p.id,
    arrivalTime: p.arrivalTime,
    burstTime: p.burstTime,
    remaining: p.burstTime,
    completion: 0,
    turnaround: 0,
    response: -1,
    queue: 0,
    timeUsed: 0
  }));

  let gantt = [];
  let algo = document.getElementById('algorithm').value;
  let rrQuantum = Number(document.getElementById('rr-quantum').value) || 2;
  let mlfqQuanta = (document.getElementById('mlfq-quanta').value || "2,4,8,16").split(',').map(Number);
  let mlfqAllot = (document.getElementById('mlfq-allot').value || "4,8,16,32").split(',').map(Number);

  if (algo === 'fcfs') simulateFCFS(procs, gantt);
  else if (algo === 'sjf') simulateSJF(procs, gantt);
  else if (algo === 'srtf') simulateSRTF(procs, gantt);
  else if (algo === 'rr') simulateRR(procs, gantt, rrQuantum);
  else if (algo === 'mlfq') simulateMLFQ(procs, gantt, mlfqQuanta, mlfqAllot);

  // Render Gantt Chart
  const colors = ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#f44336', '#8bc34a', '#ffc107', '#3f51b5'];
  const queueColors = ['#4caf50', '#2196f3', '#ff9800', '#e91e63'];
  const ganttDiv = document.getElementById('gantt');
  ganttDiv.innerHTML = '';
  gantt.forEach((g, i) => {
    const block = document.createElement('div');
    block.className = 'gantt-block';
    block.style.width = `${(g.end - g.start) * 40}px`;
    block.style.height = '40px';
    block.style.background = g.queue !== undefined && g.queue >= 0 ? queueColors[g.queue % 4] : colors[i % colors.length];
    block.innerHTML = `P${g.pid}${g.queue !== undefined && g.queue >= 0 ? `<sub>Q${g.queue}</sub>` : ''}<span>${g.start}</span>`;
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

  // Render Process Table
  let table = `<table><tr>
    <th>PID</th><th>Arrival</th><th>Burst</th><th>Completion</th><th>Turnaround</th><th>Response</th></tr>`;
  procs.forEach(g => {
    table += `<tr>
      <td>P${g.id}</td>
      <td>${g.arrivalTime}</td>
      <td>${g.burstTime}</td>
      <td>${g.completion}</td>
      <td>${g.turnaround}</td>
      <td>${g.response}</td>
    </tr>`;
  });
  table += '</table>';
  document.getElementById('result-table').innerHTML = table;

  // Render Summary Statistics
  const avgTAT = (procs.reduce((a, g) => a + g.turnaround, 0) / procs.length).toFixed(2);
  const avgRT = (procs.reduce((a, g) => a + g.response, 0) / procs.length).toFixed(2);
  document.getElementById('summary').innerHTML =
    `Average Turnaround Time: ${avgTAT}<br>Average Response Time: ${avgRT}`;
};

// Scheduling algorithms (same as your Java logic)
function simulateFCFS(procs, gantt) {
  procs.sort((a, b) => a.arrivalTime - b.arrivalTime);
  let time = 0;
  for (let p of procs) {
    if (time < p.arrivalTime) time = p.arrivalTime;
    if (p.response === -1) p.response = time - p.arrivalTime;
    gantt.push({ start: time, end: time + p.burstTime, pid: p.id });
    time += p.burstTime;
    p.completion = time;
    p.turnaround = p.completion - p.arrivalTime;
  }
}

function simulateSJF(procs, gantt) {
  let time = 0, done = 0, n = procs.length;
  let finished = Array(n).fill(false);
  while (done < n) {
    let idx = -1, minBurst = Infinity;
    for (let i = 0; i < n; i++) {
      let p = procs[i];
      if (!finished[i] && p.arrivalTime <= time && p.burstTime < minBurst) {
        minBurst = p.burstTime; idx = i;
      }
    }
    if (idx === -1) { time++; continue; }
    let p = procs[idx];
    if (p.response === -1) p.response = time - p.arrivalTime;
    gantt.push({ start: time, end: time + p.burstTime, pid: p.id });
    time += p.burstTime;
    p.completion = time;
    p.turnaround = p.completion - p.arrivalTime;
    finished[idx] = true; done++;
  }
}

function simulateSRTF(procs, gantt) {
  let time = 0, done = 0, n = procs.length;
  let rem = procs.map(p => p.burstTime);
  let started = Array(n).fill(false);
  while (done < n) {
    let idx = -1, minRem = Infinity;
    for (let i = 0; i < n; i++) {
      let p = procs[i];
      if (rem[i] > 0 && p.arrivalTime <= time && rem[i] < minRem) {
        minRem = rem[i]; idx = i;
      }
    }
    if (idx === -1) { time++; continue; }
    if (!started[idx]) {
      procs[idx].response = time - procs[idx].arrivalTime;
      started[idx] = true;
    }
    gantt.push({ start: time, end: time + 1, pid: procs[idx].id });
    rem[idx]--;
    time++;
    if (rem[idx] === 0) {
      procs[idx].completion = time;
      procs[idx].turnaround = procs[idx].completion - procs[idx].arrivalTime;
      done++;
    }
  }
}

function simulateRR(procs, gantt, quantum) {
  let q = [], time = 0, idx = 0, n = procs.length, done = 0;
  let inQ = Array(n).fill(false);
  procs.sort((a, b) => a.arrivalTime - b.arrivalTime);
  while (done < n) {
    while (idx < n && procs[idx].arrivalTime <= time) {
      q.push(idx); inQ[idx] = true; idx++;
    }
    if (q.length === 0) { time++; continue; }
    let i = q.shift();
    let p = procs[i];
    if (p.response === -1) p.response = time - p.arrivalTime;
    let run = Math.min(quantum, p.remaining);
    gantt.push({ start: time, end: time + run, pid: p.id });
    p.remaining -= run;
    time += run;
    while (idx < n && procs[idx].arrivalTime <= time) {
      q.push(idx); inQ[idx] = true; idx++;
    }
    if (p.remaining > 0) q.push(i);
    else {
      p.completion = time;
      p.turnaround = p.completion - p.arrivalTime;
      done++;
    }
  }
}

function simulateMLFQ(procs, gantt, quanta, allot) {
  let queues = [[], [], [], []];
  let time = 0, idx = 0, n = procs.length, done = 0;
  procs.sort((a, b) => a.arrivalTime - b.arrivalTime);
  while (done < n) {
    while (idx < n && procs[idx].arrivalTime <= time) queues[0].push(idx++);
    let qIdx = -1;
    for (let i = 0; i < 4; i++) if (queues[i].length) { qIdx = i; break; }
    if (qIdx === -1) { time++; continue; }
    let i = queues[qIdx].shift();
    let p = procs[i];
    if (p.response === -1) p.response = time - p.arrivalTime;
    let run = Math.min(p.remaining, Math.min(quanta[qIdx], allot[qIdx] - p.timeUsed));
    gantt.push({ start: time, end: time + run, pid: p.id, queue: qIdx });
    p.remaining -= run;
    p.timeUsed += run;
    time += run;
    while (idx < n && procs[idx].arrivalTime <= time) queues[0].push(idx++);
    if (p.remaining > 0) {
      if (p.timeUsed >= allot[qIdx] && qIdx < 3) {
        p.queue = qIdx + 1; p.timeUsed = 0;
        queues[qIdx + 1].push(i);
      } else {
        queues[qIdx].push(i);
      }
    } else {
      p.completion = time;
      p.turnaround = p.completion - p.arrivalTime;
      done++;
    }
  }
}

// Action message helper
function showMessage(msg, type = "error") {
  const msgDiv = document.getElementById('action-message');
  msgDiv.textContent = msg;
  msgDiv.className = 'action-message' + (type === "success" ? " success" : "");
  msgDiv.style.display = 'block';
  setTimeout(() => { msgDiv.style.display = 'none'; }, 3500);
}

// Initial render
renderProcesses();

