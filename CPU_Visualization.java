
package cpu_visualization;

import java.util.*;

public class CPU_Visualization {
    private static final Scanner scanner = new Scanner(System.in);
    private static List<Process> processes = new ArrayList<>();
    private static int algorithmChoice;
    private static int timeQuantumRR;
    private static int[] mlfqQuanta = new int[4];
    private static int[] mlfqAllotments = new int[4];

    public static void main(String[] args) {
        // Step 1: Select scheduling algorithm
        selectSchedulingAlgorithm();
        
        // Step 2: Choose input method
        chooseInputMethod();
        
        // Step 3: Run scheduling and display results
        runSchedulingAndDisplay();
    }

    private static void selectSchedulingAlgorithm() {
        System.out.println("CPU Scheduling Simulator");
        System.out.println("Select Scheduling Algorithm:");
        System.out.println("1. First-Come First-Served (FCFS)");
        System.out.println("2. Shortest Job First (SJF) - Non-Preemptive");
        System.out.println("3. Shortest Remaining Time First (SRTF) - Preemptive");
        System.out.println("4. Round Robin (RR)");
        System.out.println("5. Multilevel Feedback Queue (MLFQ)");
        System.out.print("Enter your choice: ");
        
        algorithmChoice = scanner.nextInt();
        
        // Get additional parameters if needed
        if (algorithmChoice == 4) {
            System.out.print("Enter time quantum for Round Robin: ");
            timeQuantumRR = scanner.nextInt();
        } else if (algorithmChoice == 5) {
            System.out.println("Enter time quanta for 4 queues (Q0 highest priority):");
            for (int i = 0; i < 4; i++) {
                System.out.print("Q" + i + " quantum: ");
                mlfqQuanta[i] = scanner.nextInt();
            }
            System.out.println("Enter allotment times for 4 queues:");
            for (int i = 0; i < 4; i++) {
                System.out.print("Q" + i + " allotment: ");
                mlfqAllotments[i] = scanner.nextInt();
            }
        }
    }

    private static void chooseInputMethod() {
        System.out.println("\nChoose Input Method:");
        System.out.println("1. Input processes manually");
        System.out.println("2. Generate processes randomly");
        System.out.print("Enter your choice: ");
        
        int choice = scanner.nextInt();
        
        switch (choice) {
            case 1:
                inputProcessesManually();
                break;
            case 2:
                generateProcessesRandomly();
                break;
            default:
                System.out.println("Invalid choice. Generating processes randomly.");
                generateProcessesRandomly();
        }
    }

    private static void inputProcessesManually() {
        processes.clear();
        System.out.print("\nEnter number of processes: ");
        int n = scanner.nextInt();
        
        for (int i = 0; i < n; i++) {
            System.out.println("\nProcess " + (i + 1) + ":");
            System.out.print("Arrival Time: ");
            int arrival = scanner.nextInt();
            System.out.print("Burst Time: ");
            int burst = scanner.nextInt();
            processes.add(new Process(i + 1, arrival, burst));
        }
        System.out.println(n + " processes added successfully.");
    }

    private static void generateProcessesRandomly() {
        processes.clear();
        Random rand = new Random();
        System.out.print("\nEnter number of processes: ");
        int n = scanner.nextInt();
        
        for (int i = 0; i < n; i++) {
            int arrival = rand.nextInt(10); // 0-9
            int burst = rand.nextInt(10) + 1; // 1-10
            processes.add(new Process(i + 1, arrival, burst));
        }
        System.out.println(n + " processes generated randomly.");
    }

    private static void runSchedulingAndDisplay() {
        if (processes.isEmpty()) {
            System.out.println("No processes available. Exiting.");
            return;
        }
        
        SchedulingResult result = null;
        
        switch (algorithmChoice) {
            case 1:
                result = CPUScheduler.fcfs(new ArrayList<>(processes));
                break;
            case 2:
                result = CPUScheduler.sjf(new ArrayList<>(processes));
                break;
            case 3:
                result = CPUScheduler.srtf(new ArrayList<>(processes));
                break;
            case 4:
                result = CPUScheduler.roundRobin(new ArrayList<>(processes), timeQuantumRR);
                break;
            case 5:
                result = CPUScheduler.mlfq(new ArrayList<>(processes), mlfqQuanta, mlfqAllotments);
                break;
            default:
                System.out.println("Invalid algorithm choice. Using FCFS.");
                result = CPUScheduler.fcfs(new ArrayList<>(processes));
        }
        
        displayResults(result);
    }

    private static void displayResults(SchedulingResult result) {
        // Display Gantt Chart
        System.out.println("\nGANTT CHART");
        System.out.println("-----------");
        for (GanttEvent event : result.ganttChart) {
            String queueLabel = (event.queueIndex >= 0) ? " (Q" + event.queueIndex + ")" : "";
            System.out.printf("| %d - P%d%s ", event.startTime, event.processId, queueLabel);
        }
        System.out.println("|");
        
        // Display process table
        System.out.println("\nPROCESS TABLE");
        System.out.println("-------------");
        System.out.println("PID | Arrival | Burst | Completion | Turnaround | Response");
        System.out.println("----------------------------------------------------------");
        for (Process p : result.processes) {
            System.out.printf("%2d  | %6d  | %5d | %10d | %10d | %8d\n",
                p.id, p.arrivalTime, p.burstTime, p.completionTime,
                p.turnaroundTime, p.responseTime);
        }
        
        // Display averages
        System.out.println("\nSUMMARY STATISTICS");
        System.out.println("-------------------");
        System.out.printf("Average Turnaround Time: %.2f\n", result.avgTurnaround);
        System.out.printf("Average Response Time:   %.2f\n", result.avgResponse);
    }
}