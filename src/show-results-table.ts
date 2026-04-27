import type { HistoryNode } from "./types";

/**
 * Displays the results table at the end of the game, showing the final score, highest streak, and a breakdown of each question with user answers and correct answers.
 * @param {number} score - The final score of the player.
 * @param {"relax" | "stress" | null} mode - The game mode, which affects how the score is displayed.
 * @param {number} totalQuestions - The total number of questions asked (used in relax mode).
 * @param {number} highestStreak - The highest streak of correct answers achieved by the player.
 * @param {HistoryNode[]} history - An array of history nodes containing details of each question, user answer, and correct answer.
 * @param {HTMLDivElement} resultsTable - The div element where the results table will be rendered.
 */

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