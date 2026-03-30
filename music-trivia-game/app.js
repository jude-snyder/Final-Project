const player = document.getElementById("player");
const answersDiv = document.getElementById("answers");
const result = document.getElementById("result");
const progress = document.getElementById("progress");
const scoreText = document.getElementById("score");
const streakText = document.getElementById("streak");
const restartBtn = document.getElementById("restart");

const GENRES = [
  "billboard hot 100",
  "top 40 hits",
  "today's hits",
  "pop radio hits",
  "best pop songs",
  "viral hits"
];

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

    progress.textContent = `Question ${questionNumber + 1} / ${totalQuestions}`;
    scoreText.textContent = `Score: ${score}`;
    streakText.textContent = `🔥 Streak: ${streak}`;

    const genre = GENRES[Math.floor(Math.random() * GENRES.length)];

    const randomOffset = Math.floor(Math.random() * 100);

    const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(genre)}&entity=song&limit=50&offset=${randomOffset}`
    );

    const data = await res.json();

    let tracks = data.results.filter(t =>
        t.wrapperType === "track" &&
        t.kind === "song" &&
        t.artistName &&
        t.trackName &&
        t.previewUrl &&
        t.trackExplicitness === "notExplicit" &&
        t.primaryGenreName !== "Podcast" &&
        t.artistName.length < 30 &&
        t.trackName.length < 50 &&
        !usedTrackIds.has(t.trackId) &&
        !usedArtistsGlobal.has(t.artistName)
    );

    tracks.sort(() => 0.5 - Math.random());

    if (tracks.length < 4) {
        result.textContent = "⚠️ Couldn't load songs. Trying again...";
        setTimeout(loadQuestion, 1000);
        return;
    }


    const correctTrack = tracks[0];
    usedTrackIds.add(correctTrack.trackId);

    player.src = correctTrack.previewUrl;
    player.play().catch(() => {
        result.textContent = "▶️ Click play to hear the song";
    });

    const options = [];
    const usedArtists = new Set();

    for (let track of tracks) {
        if (!usedArtists.has(track.artistName)) {
            options.push(track);
            usedArtists.add(track.artistName);
        }

        if (options.length === 4) break;
    }

    options.sort(() => 0.5 - Math.random());

    options.forEach(track => {
        const btn = document.createElement("button");
        btn.textContent = track.artistName;

        btn.onclick = () => {
            Array.from(answersDiv.children).forEach(b => b.disabled = true);

            if (track.artistName === correctTrack.artistName) {
                result.textContent = "✅ Correct!";
                score++;
                streak++;
            } else {
                result.textContent = `❌ It was ${correctTrack.artistName}`;
                streak = 0;
            }

            questionNumber++;

            setTimeout(loadQuestion, 1500);
        };

        answersDiv.appendChild(btn);
    });
}

loadQuestion();