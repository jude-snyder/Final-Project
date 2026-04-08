function getEl<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Element with id "${id}" not found`);
    }
    return el as T;
}

import confetti from 'canvas-confetti';

const player = getEl<HTMLAudioElement>("player");
const endSound = getEl<HTMLAudioElement>("endSound");
const answersDiv = getEl<HTMLDivElement>("answers");
const result = getEl<HTMLParagraphElement>("result");
const progress = getEl<HTMLParagraphElement>("progress");
const scoreText = getEl<HTMLParagraphElement>("score");
const streakText = getEl<HTMLParagraphElement>("streak");
const restartBtn = getEl<HTMLButtonElement>("restart");
const resultsTable = getEl<HTMLDivElement>("resultsTable");

// Hide audio elements to prevent showing controls
player.style.display = 'none';
endSound.style.display = 'none';

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

function getRandomItem<T>(items: T[]): T {
    if (items.length === 0) {
        throw new Error("No items available to select.");
    }
    const index = Math.floor(Math.random() * items.length);
    return items[index]!;
}

function getRandomArtist(): string {
    return getRandomItem(ARTISTS);
}

type Track = {
    previewUrl: string;
    artistName: string;
    trackName: string;
    trackExplicitness: string;
}

//The amount of questions in the quiz (needs editing)
let questionNumber = 0
const totalQuestions = 20
let usedArtists = new Set<string>();

let score = 0;
let streak = 0;

let history: {
    track: string;
    artist: string;
    userAnswer: string;
    correctAnswer: string;
}[] = [];

restartBtn.onclick = resetGame;

// A quick summary of the whole quiz
async function loadQuestion() {
    if (questionNumber >= totalQuestions) {
        player.pause();
        player.currentTime = 0;

        progress.textContent = "🎉 Quiz Complete!";
        result.textContent = `Final Score: ${score} / ${totalQuestions}`;
        answersDiv.innerHTML = "";

        showResultsTable();
        playEndSong();
        // Confetti celebration!
        for (let i = 0; i <= 1; i += 0.1) {
            confetti({
                particleCount: 90,
                spread: 0,
                angle: 90,
                origin: { x: i, y: 0 },
                colors: ['#ff0055', '#00ff88', '#0055ff', '#ffbb00', '#ff00dd', '#00ffee'],
                gravity: 0.2,
                decay: 1,
                ticks: 600,
                shapes: ['square', 'circle'],
                scalar: 1.2,
                drift: 0.02,
            });
        }
        return;
    }

    result.textContent = "";
    answersDiv.innerHTML = "";

    progress.textContent = `Question ${questionNumber + 1} of ${totalQuestions}`;
    scoreText.textContent = `Score: ${score}`;
    streakText.textContent = `🔥 Streak: ${streak}`;

    let artist: string;
    do {
        artist = getRandomArtist();
    } while (usedArtists.has(artist));

    usedArtists.add(artist);

    //Fetches the songs
    try {
        const res = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=25`
        );

        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            result.textContent = "⚠️ Couldn't load songs. Retrying...";
            setTimeout(loadQuestion, 1000);
            return;
        }

        // Filter for the songs
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

        // Shuffles the tracks
        const correctTrack = getRandomItem(tracks);

        player.src = correctTrack.previewUrl;
        player.currentTime = 0;

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

        options.forEach(name => {
            const btn = document.createElement("button");
            btn.textContent = name;

            btn.onclick = () => {
                Array.from(answersDiv.children).forEach(b => {
                    (b as HTMLButtonElement).disabled = true;
                });

                history.push({
                    track:correctTrack.trackName,
                    artist: correctTrack.artistName,
                    userAnswer: name,
                    correctAnswer: correctTrack.artistName
                });

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
                
                setTimeout(loadQuestion, 1500);
            };

            answersDiv.appendChild(btn);
        });
    } catch {
        result.textContent = "⚠️ Error loading songs. Retrying...";
        setTimeout(loadQuestion, 1000);
    }
}

//Reset function
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

//The end-screen sound effect, with a fallback for autoplay restrictions
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

//Results table
function showResultsTable() {
    let html = `
    <h2>📊 Results</h2>
    <table border="1" style="margin:auto; border-collapse:collapse;">
    <tr>
    <th>#</th>
    <th>Song</th>
    <th>Artist</th>
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
        <td>${q.artist}</td>
        <td>${q.userAnswer}</td>
        <td>${q.correctAnswer}</td>
        <td>${correct ? "✅" : "❌"}</td>
        </tr>
        `;
    });

    html += "</table>";
    resultsTable.innerHTML = html;
}

window.onload = () => {
    loadQuestion();
};

