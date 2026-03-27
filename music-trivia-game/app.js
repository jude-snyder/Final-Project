const player = document.getElementById("player");
const answersDiv = document.getElementById("answers");
const result = document.getElementById("result");
const progress = document.getElementById("progress");
const scoreText = document.getElementById("score");
const streakText = document.getElementById("streak");
const restartBtn = document.getElementById("restart");

const GENRES = ["pop", "Christian Hip-Hop", "jazz", "alternative", "lofi"];

let usedTrackIds = new Set();
let questionNumber = 0
const totalQuestions = 10;

let score = 0;
let streak = 0;

function resetGame() {
    usedTrackIds.clear();
    questionNumber = 0;
    score = 0;
    streak = 0;
    loadQuestion();
}

restartBtn.onclick = resetGame;

async function loadQuestion() {
    if (questionNumber >= totalQuestions) {
        progress.textContent = "🎉 Quiz Complete!";
        result.textContent = `Final Score: ${score} / ${totalQuestions}`;
        answersDiv.innerHTML = "";
        return;
    }

    result.textContent = "";
    answersDiv.innerHTML = "";

    progress.textContent = `Question ${questionNumber + 1} / ${}`
}