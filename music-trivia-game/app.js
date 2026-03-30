const player = document.getElementById("player");
const answersDiv = document.getElementById("answers");
const result = document.getElementById("result");
const progress = document.getElementById("progress");
const scoreText = document.getElementById("score");
const streakText = document.getElementById("streak");
const restartBtn = document.getElementById("restart");

// 🎯 POPULAR ARTISTS (radio-style)
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
];

let questionNumber = 0
const totalQuestions = 20;
let usedArtists = new Set();

let score = 0;
let streak = 0;

function resetGame() {
    usedArtists.clear();
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

    progress.textContent = `Question ${questionNumber + 1} of ${totalQuestions}`;
    scoreText.textContent = `Score: ${score}`;
    streakText.textContent = `🔥 Streak: ${streak}`;

    let artist;
    do {
        artist = ARTISTS[Math.floor(Math.random() * ARTISTS.length)];
    } while (usedArtists.has(artist));

    usedArtists.add(artist);

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

        let tracks = data.results.filter(t =>
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

        const correctTrack = tracks[Math.floor(Math.random() * tracks.length)];

        player.src = correctTrack.previewUrl;
        player.currentTime = 0;
        result.textContent = "▶️ Press play to hear the clip";

        player.onplay = null;

        player.onplay = () => {
            setTimeout(() => {
                player.pause();
                player.currentTime = 0;
            }, 5000);
        };

        const options = [correctTrack.artistName];

        while (options.length < 4) {
            const randomArtist = ARTISTS[Math.floor(Math.random() * ARTISTS.length)];
            if (!options.includes(randomArtist)) {
                options.push(randomArtist);
            }
        }

        options.sort(() => 0.5 - Math.random());

        options.forEach(name => {
            const btn = document.createElement("button");
            btn.textContent = name;

            btn.onclick = () => {
                Array.from(answersDiv.children).forEach(b => b.disabled = true);

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
    } catch (err) {
        result.textContent = "⚠️ Error loading songs. Retrying...";
        setTimeout(loadQuestion, 1000);
    }
}

loadQuestion();