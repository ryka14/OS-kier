// Process "class"
function createProcess(id, arrivalTime, burstTime) {
  return {
    id: id,
    arrivalTime: arrivalTime,
    burstTime: burstTime,
    remainingBurst: burstTime,
    completionTime: 0,
    turnaroundTime: 0,
    responseTime: -1,
    currentQueue: 0,
    timeUsedInQueue: 0,
    reset: function() {
      this.remainingBurst = this.burstTime;
      this.responseTime = -1;
      this.completionTime = 0;
      this.currentQueue = 0;
      this.timeUsedInQueue = 0;
    }
  };
}

// GanttEvent "class"
function createGanttEvent(startTime, endTime, processId, queueIndex = -1) {
  return {
    startTime,
    endTime,
    processId,
    queueIndex
  };
}

// SchedulingResult "class"
function createSchedulingResult(processes, ganttChart) {
  let totalTAT = 0, totalRT = 0;
  processes.forEach(p => {
    p.turnaroundTime = p.completionTime - p.arrivalTime;
    totalTAT += p.turnaroundTime;
    totalRT += p.responseTime;
  });
  return {
    processes,
    ganttChart,
    avgTurnaround: totalTAT / processes.length,
    avgResponse: totalRT / processes.length
  };
}

// Reset all processes
function resetProcesses(processes) {
  processes.forEach(p => p.reset());
}

// FCFS
function fcfs(processes) {
  processes.forEach(p => p.reset());
  let gantt = [];
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

  let currentTime = 0;
  for (let p of processes) {
    if (currentTime < p.arrivalTime) currentTime = p.arrivalTime;
    if (p.responseTime === -1) p.responseTime = currentTime - p.arrivalTime;
    gantt.push(createGanttEvent(currentTime, currentTime + p.burstTime, p.id));
    currentTime += p.burstTime;
    p.completionTime = currentTime;
  }
  return createSchedulingResult(processes, gantt);
}

// SJF (Non-preemptive)
function sjf(processes) {
  processes.forEach(p => p.reset());
  let gantt = [];
  let queue = [];
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

  let currentTime = 0, index = 0;
  while (index < processes.length || queue.length > 0) {
    while (index < processes.length && processes[index].arrivalTime <= currentTime) {
      queue.push(processes[index++]);
    }
    if (queue.length === 0) {
      if (index < processes.length) currentTime = processes[index].arrivalTime;
      continue;
    }
    queue.sort((a, b) => a.burstTime - b.burstTime);
    let p = queue.shift();
    if (p.responseTime === -1) p.responseTime = currentTime - p.arrivalTime;
    gantt.push(createGanttEvent(currentTime, currentTime + p.burstTime, p.id));
    currentTime += p.burstTime;
    p.completionTime = currentTime;
  }
  return createSchedulingResult(processes, gantt);
}

// SRTF (Preemptive SJF)
function srtf(processes) {
  processes.forEach(p => p.reset());
  let gantt = [];
  let queue = [];
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

  let currentTime = 0, index = 0;
  let current = null;
  while (index < processes.length || queue.length > 0 || current !== null) {
    while (index < processes.length && processes[index].arrivalTime <= currentTime) {
      let p = processes[index++];
      queue.push(p);
      if (current && p.remainingBurst < current.remainingBurst) {
        queue.push(current);
        current = null;
      }
    }
    if (!current && queue.length > 0) {
      queue.sort((a, b) => a.remainingBurst - b.remainingBurst || a.arrivalTime - b.arrivalTime);
      current = queue.shift();
      if (current.responseTime === -1) current.responseTime = currentTime - current.arrivalTime;
    }
    let nextTime = (index < processes.length) ? processes[index].arrivalTime : Infinity;
    let runTime = current ? Math.min(current.remainingBurst, nextTime - currentTime) : nextTime - currentTime;
    if (current) {
      gantt.push(createGanttEvent(currentTime, currentTime + runTime, current.id));
      current.remainingBurst -= runTime;
      if (current.remainingBurst === 0) {
        current.completionTime = currentTime + runTime;
        current = null;
      }
    }
    currentTime += runTime;
  }
  return createSchedulingResult(processes, gantt);
}

// Round Robin
function roundRobin(processes, timeQuantum) {
  processes.forEach(p => p.reset());
  let gantt = [];
  let queue = [];
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

  let currentTime = 0, index = 0;
  while (index < processes.length || queue.length > 0) {
    while (index < processes.length && processes[index].arrivalTime <= currentTime) {
      queue.push(processes[index++]);
    }
    if (queue.length === 0) {
      if (index < processes.length) currentTime = processes[index].arrivalTime;
      continue;
    }
    let p = queue.shift();
    if (p.responseTime === -1) p.responseTime = currentTime - p.arrivalTime;
    let runTime = Math.min(p.remainingBurst, timeQuantum);
    gantt.push(createGanttEvent(currentTime, currentTime + runTime, p.id));
    currentTime += runTime;
    p.remainingBurst -= runTime;
    while (index < processes.length && processes[index].arrivalTime <= currentTime) {
      queue.push(processes[index++]);
    }
    if (p.remainingBurst > 0) {
      queue.push(p);
    } else {
      p.completionTime = currentTime;
    }
  }
  return createSchedulingResult(processes, gantt);
}

// MLFQ
function mlfq(processes, timeQuanta, allotments) {
  processes.forEach(p => p.reset());
  let gantt = [];
  let queues = [[], [], [], []];
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

  let currentTime = 0, index = 0;
  while (index < processes.length || queues.some(q => q.length > 0)) {
    while (index < processes.length && processes[index].arrivalTime <= currentTime) {
      queues[0].push(processes[index++]);
    }
    let qIndex = queues.findIndex(q => q.length > 0);
    if (qIndex === -1) {
      if (index < processes.length) currentTime = processes[index].arrivalTime;
      continue;
    }
    let p = queues[qIndex].shift();
    if (p.responseTime === -1) p.responseTime = currentTime - p.arrivalTime;
    let runTime = Math.min(
      p.remainingBurst,
      Math.min(timeQuanta[qIndex], allotments[qIndex] - p.timeUsedInQueue)
    );
    gantt.push(createGanttEvent(currentTime, currentTime + runTime, p.id, qIndex));
    currentTime += runTime;
    p.remainingBurst -= runTime;
    p.timeUsedInQueue += runTime;
    while (index < processes.length && processes[index].arrivalTime <= currentTime) {
      queues[0].push(processes[index++]);
    }
    if (p.remainingBurst > 0) {
      if (p.timeUsedInQueue >= allotments[qIndex] && qIndex < 3) {
        p.currentQueue = qIndex + 1;
        p.timeUsedInQueue = 0;
        queues[qIndex + 1].push(p);
      } else {
        queues[qIndex].push(p);
      }
    } else {
      p.completionTime = currentTime;
    }
  }
  return createSchedulingResult(processes, gantt);
}

