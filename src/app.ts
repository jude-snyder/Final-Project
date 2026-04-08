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
let timerInterval: number | null = null;

// Store results history for the results table at the end
let history: {
    track: string;
    artist: string;
    userAnswer: string;
    correctAnswer: string;
}[] = [];

restartBtn.onclick = resetGame;

relaxBtn.onclick = () => startGame("relax");
stressBtn.onclick = () => startGame("stress");

// Start game with selected mode
function startGame(selected: "relax" | "stress") {
    mode = selected;
    modeSelect.style.display = "none";

    if (mode === "stress") {
        startTimer();
    }

    loadQuestion();
}

function startTimer() {
    timeLeft = 300;
    timerText.style.display = "block";

    timerInterval = setInterval(() => {
        timeLeft--;
        timerText.textContent = `⏱️ ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval!);
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
        endGame();
        return;
    }

    result.textContent = "";
    answersDiv.innerHTML = "";

    progress.textContent = `Question ${questionNumber + 1}`;
    scoreText.textContent = `Score: ${score}`;
    streakText.textContent = `🔥 Streak: ${streak}`;
    

    // Pick an unused artist
    let artist: string;
    do {
        artist = getRandomArtist();
    } while (usedArtists.has(artist));

    usedArtists.add(artist);

    
    try {
        // Call iTunes API
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=25`);
        const data = await res.json();

        l

        // Retry if no results or API error
        if (!data.results || data.results.length === 0) {
            result.textContent = "⚠️ Couldn't load songs. Retrying...";
            setTimeout(loadQuestion, 1000);
            return;
        }

        // Filter tracks to ensure they have previews and are not explicit
        let tracks = (data.results as Track[]).filter(t =>
            t.previewUrl &&
            t.artistName &&
            t.trackName &&
            t.trackExplicitness === "notExplicit"
        );

        if (tracks.length === 0) {
            result.textContent = "⚠️ No playable songs. Retrying...";
            setTimeout(loadQuestion, 1000);
            return;
        }

        // Pick correct answer
        const correctTrack = getRandomItem(tracks);

        // Load audio preview
        player.src = correctTrack.previewUrl;
        player.currentTime = 0;

        try {
            await player.play();
            result.textContent = "🎵 Playing preview...";
        } catch {
            result.textContent = "▶️ Press play to hear the clip";
        }
       

        // Build answer options
        const options: string[] = [correctTrack.artistName];

        while (options.length < 4) {
            const randomArtist = getRandomArtist();
            if (!options.includes(randomArtist)) {
                options.push(randomArtist);
            }
        }

        // Shuffle answers
        options.sort(() => Math.random() - 0.5);

        // Create buttons for each answer
        options.forEach(name => {
            const btn = document.createElement("button");
            btn.textContent = name;

            btn.onclick = () => {
              
              // Disable buttons after answering
                Array.from(answersDiv.children).forEach(b => {
                    (b as HTMLButtonElement).disabled = true;
                });

                // Save answer to history for results table
                history.push({
                    track:correctTrack.trackName,
                    artist: correctTrack.artistName,
                    userAnswer: name,
                    correctAnswer: correctTrack.artistName
                });

                // Check answer and update score/streak
                if (name === correctTrack.artistName) {
                    result.textContent = "✅ Correct!";
                    score++;
                    streak++;
                } else {
                    result.textContent = `❌ It was ${correctTrack.artistName}`;
                    streak = 0;
                }

                scoreText.textContent = `Score: ${score}`;
                streakText.textContent = `🔥 Streak: ${streak}`;

                questionNumber++;
                
                // Load next question after a short delay to let user see result
                setTimeout(loadQuestion, 1500);
            };

            answersDiv.appendChild(btn);
        });
    } catch {
        result.textContent = "⚠️ Error loading songs. Retrying...";
        setTimeout(loadQuestion, 1000);
    }
}

// Reset everything to start a new game
function resetGame() {
    usedArtists.clear();
    questionNumber = 0;
    score = 0;
    streak = 0;
    history = [];

    resultsTable.innerHTML = "";

    endSound.pause();
    endSound.currentTime = 0;

    player.pause();
    player.currentTime = 0;

    loadQuestion();
}

// Play applause sound at the end of the quiz, with error handling for autoplay restrictions
function playEndSong() {
    endSound.src = "/applause.mp3";
    endSound.currentTime = 0;
    endSound.muted = false;

    const playPromise = endSound.play();

    if (playPromise !== undefined) {
        playPromise
        .then(() => {
            console.log("End song is playing.");
        })
        .catch((error) => {
            console.log("Autoplay blocked or error:", error);
            // Autoplay failed, but don't show controls
        });
    }
}

// Build results table at the end of the quiz to show user's answers vs correct answers, with color coding for correct/incorrect answers
function showResultsTable() {
    let html = `
    <h2>📊 Results</h2>
    <table border="1" style="margin:auto; border-collapse:collapse;">
    <tr>
    <th>#</th>
    <th>Song</th>
    <th>Your Answer</th>
    <th>Correct Answer</th>
    <th>Result</th>
    </tr>
    `;

    //Saves your answers for the time being
    history.forEach((q, index) => {
        const correct = q.userAnswer === q.correctAnswer;

        html += `
        <tr style="background:${correct ? "#d4edda" : "#f8d7da"}; ">
        <td>${index + 1}</td>
        <td>${q.track}</td>
        <td>${q.userAnswer}</td>
        <td>${q.correctAnswer}</td>
        <td>${correct ? "✅" : "❌"}</td>
        </tr>
        `;
    });

    html += "</table>";
    resultsTable.innerHTML = html;
}

// Start game on load
window.onload = () => {
    loadQuestion();
};

