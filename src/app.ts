// Helper function to safely grab an HTML element by ID
function getEl<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Element with ID "${id}" not found`);   
    }
    return el as T;
}

// Import confetti
import confetti from 'canvas-confetti';

// Grabs all DOM elements
const player = getEl<HTMLAudioElement>("player");
const endSound = getEl<HTMLAudioElement>("endSound");
const answersDiv = getEl<HTMLDivElement>("answers");
const result = getEl<HTMLParagraphElement>("result");
const progress = getEl<HTMLParagraphElement>("progress");
const scoreText = getEl<HTMLParagraphElement>("score");
const streakText = getEl<HTMLParagraphElement>("streak");
const restartBtn = getEl<HTMLButtonElement>("restart");
const resultsTable = getEl<HTMLDivElement>("resultsTable");
const modeSelect = getEl<HTMLDivElement>("modeSelect");
const timerText = getEl<HTMLParagraphElement>("timer");
const relaxBtn = getEl<HTMLButtonElement>("relaxBtn");
const stressBtn = getEl<HTMLButtonElement>("stressBtn");
const setupScreen = getEl<HTMLDivElement>("setupScreen");
const setupTitle = getEl<HTMLHeadingElement>("setupTitle");
const questionOptions = getEl<HTMLDivElement>("questionOptions");
const startBtn = getEl<HTMLButtonElement>("startBtn");
const qButtons = document.querySelectorAll<HTMLButtonElement>(".qBtn");

// Hide audio controls from user
player.style.display = 'none';
endSound.style.display = 'none';

// List of possible artists
const ARTISTS = [
  "Taylor Swift",
  "Drake",
  "The Weeknd",
  "Ariana Grande",
  "Ed Sheeran",
  "Olivia Rodrigo",
  "Dua Lipa",
  "Justin Bieber",
  "Harry Styles",
  "Billie Eilish",
  "Post Malone",
  "Doja Cat",
  "SZA",
  "Khalid",
  "Shawn Mendes",
  "Maroon 5",
  "Bruno Mars",
  "Rihanna",
  "Katy Perry",
  "Imagine Dragons",
  "Twenty One Pilots",
  "Arctic Monkeys",
  "Charlie Puth",
  "David Guetta",
  "OneRepublic",
  "Marshmello",
  "Juice WRLD",
  "Coldplay",
  "Benson Boone",
  "HUNTR/X",
  "Avicii",
  "Weezer",
  "Bastille",
  "Michael Jackson",
  "Myles Smith",
  "Panic! At The Disco",
  "U2",
  "Usher",
  "Ava Max",
  "Daft Punk",
  "Snoop Dogg",
];

// Random picker helper function
function getRandomItem<T>(items: T[]): T {
    const index = Math.floor(Math.random() * items.length);
    return items[index]!;
}

// Shortcut for artists
function getRandomArtist(): string {
    return getRandomItem(ARTISTS);
}

// Type for iTunes API response
type Track = {
    previewUrl: string;
    artistName: string;
    trackName: string;
    trackExplicitness: string;
}

// Game state variables
let questionNumber = 0
let totalQuestions = 20
let usedArtists = new Set<string>();
let score = 0;
let streak = 0;

let mode: "relax" | "stress" | null = null;
let timeLeft = 300; // 5 minutes in seconds
let timerInterval: ReturnType<typeof setInterval> | null = null;

// Store results history for the results table at the end
let history: {
    track: string;
    artist: string;
    userAnswer: string;
    correctAnswer: string;
}[] = [];

restartBtn.onclick = resetGame;

relaxBtn.onclick = () => selectMode("relax");
stressBtn.onclick = () => selectMode("stress");

function selectMode(selected: "relax" | "stress") {
    mode = selected;

    modeSelect.style.display = "none";
    setupScreen.style.display = "block";

    document.body.classList.remove("relax-mode", "stress-mode");
    document.body.classList.add(
        selected === "relax" ? "relax-mode" : "stress-mode"
    );

    if (selected === "relax") {
        setupTitle.textContent = "😌 Relax Mode";
        questionOptions.style.display = "block";
        startBtn.disabled = true;
    } else {
        setupTitle.textContent = "😰 Stress Mode (5 min)";
        questionOptions.style.display = "none";
        startBtn.disabled = false;
    }

    qButtons.forEach(btn => {
        btn.onclick = () => {
            totalQuestions = Number(btn.dataset.q);

            qButtons.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            
            startBtn.disabled = false;
        };
    });

    startBtn.onclick = () => startGame();
};



// Start game with selected mode
function startGame() {
    setupScreen.style.display = "none";

    if (mode === "stress") {
        startTimer();
    }

    loadQuestion();
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function startTimer() {
    timeLeft = 300;
    timerText.style.display = "block";

    timerInterval = setInterval(() => {
        timeLeft--;
        timerText.textContent = `⏱️ ${formatTime(timeLeft)}`;

        if (timerInterval !== null && timeLeft <= 0) {
            clearInterval(timerInterval);
            timerText.textContent = "⏱️ Time's up!";
            endGame();
        }
    }, 1000);
}

    function endGame() {
        player.pause();
        player.currentTime = 0;
        progress.textContent = "⏰ Time's Up!";
        result.textContent = `Score: ${score}`;
        answersDiv.innerHTML = "";
        showResultsTable();
        playEndSong();
        confetti();
    }

// Main game loop
async function loadQuestion() {
    if (mode === "relax" && questionNumber >= totalQuestions) {
      player.pause();
      player.currentTime = 0;
        progress.textContent = "🎉 Quiz Complete!";
        result.textContent = `Final Score: ${score}/${totalQuestions}`;
        answersDiv.innerHTML = "";
        showResultsTable();
        playEndSong();
        confetti();
        return;
    }

    result.textContent = "";
    answersDiv.innerHTML = "";

    progress.textContent = `Question ${questionNumber + 1}`;
    scoreText.textContent = `Score: ${score}`;
    streakText.textContent = `🔥 Streak: ${streak}`;
    

    // Pick an unused artist
    let artist: string;
    if (usedArtists.size >= ARTISTS.length) {
        usedArtists.clear(); // Reset if we've used all artists
    }
    
    do {
        artist = getRandomArtist();
    } while (usedArtists.has(artist));

    usedArtists.add(artist);

    // Fetch songs for the artist from iTunes API
    try {
        const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=50`
        );

        const data = await res.json();

        let tracks = (data.results as Track[]).filter(t =>
            t.previewUrl && 
            t.artistName && 
            t.trackName && 
            t.trackExplicitness === "notExplicit"
        );

        const correctTrack = getRandomItem(tracks);

        player.src = correctTrack.previewUrl;
        player.currentTime = 0;

        // Try to play the preview (some browsers require user interaction first)
        try {
            await player.play();
            result.textContent = "🎵 Playing preview...";
        } catch {
            result.textContent = "▶️ Press play to hear the clip";
        }

        const options: string[] = [correctTrack.artistName];

        while (options.length < 4) {
            const randomArtist = getRandomArtist();
            if (!options.includes(randomArtist)) {
                options.push(randomArtist);
            }
        }

        options.sort(() => Math.random() - 0.5);

        // Create answer buttons
        options.forEach(name => {
            const btn = document.createElement("button");
            btn.textContent = name;
            btn.onclick = () => {
                Array.from(answersDiv.children).forEach(b => {
                    (b as HTMLButtonElement).disabled = true;
                });

                // Save to history for results table
                history.push({
                    track: correctTrack.trackName,
                    artist: correctTrack.artistName,
                    userAnswer: name,
                    correctAnswer: correctTrack.artistName
                });

                // Check answer and update score/streak
                if (name === correctTrack.artistName) {
                    score++;
                    streak++;
                    result.textContent = "✅ Correct!";
                } else {
                    streak = 0;
                    result.textContent = `❌ Wrong! It was ${correctTrack.artistName}`;
                }

                scoreText.textContent = `Score: ${score}`;
                streakText.textContent = `🔥 Streak: ${streak}`;

                questionNumber++;

                setTimeout(loadQuestion, 1500);
            };

            answersDiv.appendChild(btn);
        });
    } catch {
        result.textContent = "⚠️ Error loading songs. Retrying...";
        setTimeout(loadQuestion, 1000);
    }
}

    // Reset game state and reload page
    function resetGame() {
        document.body.classList.remove("relax-mode", "stress-mode");
        location.reload();
    }

    // Play applause sound at the end of the game
    function playEndSong() {
        endSound.src = "/applause.mp3";
        endSound.currentTime = 0;
        endSound.muted = false;

        endSound.play().catch(() => {});
    }

    // Generate results table HTML and display it
    function showResultsTable() {
        let html = `
          <h2>📊 Results</h2>
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

    // Start with mode selection screen
    window.onload = () => {};
