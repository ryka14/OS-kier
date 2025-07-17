
package cpu_visualization;

public class Process {
    public int id;
    public int arrivalTime;
    public int burstTime;
    public int remainingBurst;
    public int completionTime;
    public int turnaroundTime;
    public int responseTime = -1;
    public int currentQueue = 0;
    public int timeUsedInQueue = 0;

    public Process(int id, int arrivalTime, int burstTime) {
        this.id = id;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.remainingBurst = burstTime;
    }

    public void reset() {
        remainingBurst = burstTime;
        responseTime = -1;
        completionTime = 0;
        currentQueue = 0;
        timeUsedInQueue = 0;
    }
}
