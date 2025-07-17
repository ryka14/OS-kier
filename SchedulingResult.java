
package cpu_visualization;

import java.util.List;

public class SchedulingResult {
    public List<Process> processes;
    public List<GanttEvent> ganttChart;
    public double avgTurnaround;
    public double avgResponse;

    public SchedulingResult(List<Process> processes, List<GanttEvent> ganttChart) {
        this.processes = processes;
        this.ganttChart = ganttChart;
        calculateMetrics();
    }

    private void calculateMetrics() {
        double totalTAT = 0;
        double totalRT = 0;
        for (Process p : processes) {
            p.turnaroundTime = p.completionTime - p.arrivalTime;
            totalTAT += p.turnaroundTime;
            totalRT += p.responseTime;
        }
        avgTurnaround = totalTAT / processes.size();
        avgResponse = totalRT / processes.size();
    }
}