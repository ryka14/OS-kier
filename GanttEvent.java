
package cpu_visualization;

public class GanttEvent {
    public int startTime;
    public int endTime;
    public int processId;
    public int queueIndex;

    public GanttEvent(int startTime, int endTime, int processId, int queueIndex) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.processId = processId;
        this.queueIndex = queueIndex;
    }
}

