
package cpu_visualization;

import java.util.*;

public class CPUScheduler {

    public static SchedulingResult fcfs(List<Process> processes) {
        resetProcesses(processes);
        List<GanttEvent> gantt = new ArrayList<>();
        processes.sort(Comparator.comparingInt(p -> p.arrivalTime));
        
        int currentTime = 0;
        for (Process p : processes) {
            if (currentTime < p.arrivalTime) {
                currentTime = p.arrivalTime;
            }
            if (p.responseTime == -1) {
                p.responseTime = currentTime - p.arrivalTime;
            }
            gantt.add(new GanttEvent(currentTime, currentTime + p.burstTime, p.id, -1));
            currentTime += p.burstTime;
            p.completionTime = currentTime;
        }
        return new SchedulingResult(new ArrayList<>(processes), gantt);
    }

    public static SchedulingResult sjf(List<Process> processes) {
        resetProcesses(processes);
        List<GanttEvent> gantt = new ArrayList<>();
        List<Process> queue = new ArrayList<>();
        processes.sort(Comparator.comparingInt(p -> p.arrivalTime));
        
        int currentTime = 0, index = 0;
        while (index < processes.size() || !queue.isEmpty()) {
            while (index < processes.size() && processes.get(index).arrivalTime <= currentTime) {
                queue.add(processes.get(index++));
            }
            
            if (queue.isEmpty()) {
                if (index < processes.size()) {
                    currentTime = processes.get(index).arrivalTime;
                }
                continue;
            }
            
            queue.sort(Comparator.comparingInt(p -> p.burstTime));
            Process p = queue.remove(0);
            if (p.responseTime == -1) {
                p.responseTime = currentTime - p.arrivalTime;
            }
            gantt.add(new GanttEvent(currentTime, currentTime + p.burstTime, p.id, -1));
            currentTime += p.burstTime;
            p.completionTime = currentTime;
        }
        return new SchedulingResult(new ArrayList<>(processes), gantt);
    }

    public static SchedulingResult srtf(List<Process> processes) {
        resetProcesses(processes);
        List<GanttEvent> gantt = new ArrayList<>();
        PriorityQueue<Process> queue = new PriorityQueue<>(
            Comparator.comparingInt((Process p) -> p.remainingBurst)
                .thenComparingInt(p -> p.arrivalTime)
        );
        
        processes.sort(Comparator.comparingInt(p -> p.arrivalTime));
        int currentTime = 0;
        int index = 0;
        Process current = null;
        
        while (index < processes.size() || !queue.isEmpty() || current != null) {
            while (index < processes.size() && processes.get(index).arrivalTime <= currentTime) {
                Process p = processes.get(index++);
                queue.add(p);
                if (current != null && p.remainingBurst < current.remainingBurst) {
                    queue.add(current);
                    current = null;
                }
            }
            
            if (current == null && !queue.isEmpty()) {
                current = queue.poll();
                if (current.responseTime == -1) {
                    current.responseTime = currentTime - current.arrivalTime;
                }
            }
            
            int nextTime = (index < processes.size()) ? processes.get(index).arrivalTime : Integer.MAX_VALUE;
            int runTime = (current == null) ? 
                nextTime - currentTime : 
                Math.min(current.remainingBurst, nextTime - currentTime);
            
            if (current != null) {
                gantt.add(new GanttEvent(currentTime, currentTime + runTime, current.id, -1));
                current.remainingBurst -= runTime;
                if (current.remainingBurst == 0) {
                    current.completionTime = currentTime + runTime;
                    current = null;
                }
            }
            currentTime += runTime;
        }
        return new SchedulingResult(new ArrayList<>(processes), gantt);
    }

    public static SchedulingResult roundRobin(List<Process> processes, int timeQuantum) {
        resetProcesses(processes);
        List<GanttEvent> gantt = new ArrayList<>();
        Queue<Process> queue = new LinkedList<>();
        processes.sort(Comparator.comparingInt(p -> p.arrivalTime));
        
        int currentTime = 0;
        int index = 0;
        while (index < processes.size() || !queue.isEmpty()) {
            while (index < processes.size() && processes.get(index).arrivalTime <= currentTime) {
                queue.add(processes.get(index++));
            }
            
            if (queue.isEmpty()) {
                if (index < processes.size()) {
                    currentTime = processes.get(index).arrivalTime;
                }
                continue;
            }
            
            Process p = queue.poll();
            if (p.responseTime == -1) {
                p.responseTime = currentTime - p.arrivalTime;
            }
            
            int runTime = Math.min(p.remainingBurst, timeQuantum);
            gantt.add(new GanttEvent(currentTime, currentTime + runTime, p.id, -1));
            currentTime += runTime;
            p.remainingBurst -= runTime;
            
            while (index < processes.size() && processes.get(index).arrivalTime <= currentTime) {
                queue.add(processes.get(index++));
            }
            
            if (p.remainingBurst > 0) {
                queue.add(p);
            } else {
                p.completionTime = currentTime;
            }
        }
        return new SchedulingResult(new ArrayList<>(processes), gantt);
    }

    public static SchedulingResult mlfq(
        List<Process> processes, int[] timeQuanta, int[] allotments
    ) {
        resetProcesses(processes);
        List<GanttEvent> gantt = new ArrayList<>();
        List<Queue<Process>> queues = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            queues.add(new LinkedList<Process>());
        }
        
        processes.sort(Comparator.comparingInt(p -> p.arrivalTime));
        int currentTime = 0;
        int index = 0;
        
        while (index < processes.size() || hasProcesses(queues)) {
            while (index < processes.size() && processes.get(index).arrivalTime <= currentTime) {
                Process p = processes.get(index++);
                queues.get(0).add(p);
            }
            
            int qIndex = -1;
            for (int i = 0; i < 4; i++) {
                if (!queues.get(i).isEmpty()) {
                    qIndex = i;
                    break;
                }
            }
            
            if (qIndex == -1) {
                if (index < processes.size()) {
                    currentTime = processes.get(index).arrivalTime;
                }
                continue;
            }
            
            Process p = queues.get(qIndex).poll();
            if (p.responseTime == -1) {
                p.responseTime = currentTime - p.arrivalTime;
            }
            
            int runTime = Math.min(
                p.remainingBurst,
                Math.min(
                    timeQuanta[qIndex],
                    allotments[qIndex] - p.timeUsedInQueue
                )
            );
            
            gantt.add(new GanttEvent(currentTime, currentTime + runTime, p.id, qIndex));
            currentTime += runTime;
            p.remainingBurst -= runTime;
            p.timeUsedInQueue += runTime;
            
            while (index < processes.size() && processes.get(index).arrivalTime <= currentTime) {
                queues.get(0).add(processes.get(index++));
            }
            
            if (p.remainingBurst > 0) {
                if (p.timeUsedInQueue >= allotments[qIndex] && qIndex < 3) {
                    p.currentQueue = qIndex + 1;
                    p.timeUsedInQueue = 0;
                    queues.get(qIndex + 1).add(p);
                } else {
                    queues.get(qIndex).add(p);
                }
            } else {
                p.completionTime = currentTime;
            }
        }
        return new SchedulingResult(new ArrayList<>(processes), gantt);
    }

    private static void resetProcesses(List<Process> processes) {
        for (Process p : processes) {
            p.reset();
        }
    }

    private static boolean hasProcesses(List<Queue<Process>> queues) {
        for (Queue<Process> q : queues) {
            if (!q.isEmpty()) return true;
        }
        return false;
    }
}