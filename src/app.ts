function getEl<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Element with id "${id}" not found`);
    }
    return el as T;
}

const player = getEl<HTMLAudioElement>("player");
const endSound = getEl<HTMLAudioElement>("endSound");
const answersDiv = getEl<HTMLDivElement>("answers");
const result = getEl<HTMLParagraphElement>("result");
const progress = getEl<HTMLParagraphElement>("progress");
const scoreText = getEl<HTMLParagraphElement>("score");
const streakText = getEl<HTMLParagraphElement>("streak");
const restartBtn = getEl<HTMLButtonElement>("restart");
const resultsTable = getEl<HTMLDivElement>("resultsTable");

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


//The end-screen song that I still need to get working
function playEndSong() {
    endSound.src = "'/Users/snyderkids/Music/Music/Media.localized/Music/Unknown Artist/Unknown Album/the_mountain-lofi-lofi-music-496553.mp3'"
    endSound.currentTime = 0;

    endSound.play().catch(() => {
        console.log("Autoplay blocked");
    });
}

//Results table
function showResultsTable() {
    const tableDiv = document.getElementById("resultsTable");

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
    tableDiv.innerHTML = html;
}

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

        // Shuffles the tracks
        const correctTrack = tracks[Math.floor(Math.random() * tracks.length)];

        player.src = correctTrack.previewUrl;
        player.currentTime = 0;

        try {
            await player.play();
            result.textContent = "🎵 Playing preview...";
        } catch (err) {
            result.textContent = "▶️ Press play to hear the clip";
        }
       

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
    } catch (err) {
        result.textContent = "⚠️ Error loading songs. Retrying...";
        setTimeout(loadQuestion, 1000);
    }
}

loadQuestion();