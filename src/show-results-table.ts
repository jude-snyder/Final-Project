import type { HistoryNode } from "./types";

export function showResultsTable(score: number, mode: "relax" | "stress" | null, totalQuestions: number, highestStreak: number, history: HistoryNode[], resultsTable: HTMLDivElement) {
    let html = `
          <h2>📊 Results</h2>
          <p>🏆 Final Score: ${score}${mode === "relax" ? ` / ${totalQuestions}` : ""}</p>
          <p>🔥 Highest Streak: ${highestStreak}</p>
        <table border="1" style="margin:auto; border-collapse: collapse;">
            <tr>
            <th>#</th>
            <th>Song</th>
            <th>Your Answer</th>
            <th>Correct Artist</th>
            <th>Result</th>
            </tr>
            `;

    history.forEach((q, index) => {
        const isCorrect = q.userAnswer === q.correctAnswer;

        // Use green for correct and red for wrong answers
        html += `
                <tr style="background: ${isCorrect ? "d4edda" : "f8d7da"};">
                    <td>${index + 1}</td>
                    <td>${q.track}</td>
                    <td>${q.userAnswer}</td>
                    <td>${q.correctAnswer}</td>
                    <td>${isCorrect ? "✅" : "❌"}</td>
                </tr>
                `;
    });

    html += "</table>";
    resultsTable.innerHTML = html;
}