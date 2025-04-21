console.log("Let's Write JavaScript");

let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    let minutes = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function getSongs(folder) {
    try {
        currFolder = folder;
        let response = await fetch(`/${folder}/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        songs = [];

        for (let element of as) {
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
            }
        }

        // Show all the songs in the playlist
        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";
        for (const song of songs) {
            songUL.innerHTML += `<li>
                <img class="invert" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song}</div>
                    <div>Arijit Singh</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                </div>
            </li>`;
        }

        // Attach event listener to play songs
        document.querySelectorAll(".songList li").forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info div").innerText.trim());
            });
        });
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
    return songs;
}

function playMusic(track, pause = false) {
    if (!track) return;
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "img/pause.svg";
    }

    document.querySelector(".songinfo").innerText = track;
    document.querySelector(".songtime").innerText = "00:00 / 00:00";

    // Automatically play next song when current song ends
    currentSong.onended = () => {
        playNextSong();
    };
}

 // Add event listener for next
function playNextSong() {
    let currentIndex = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
    if (currentIndex < songs.length - 1) {
        playMusic(songs[currentIndex + 1]);
    }
}

// Add event listener for previous 
function playPreviousSong() {
    let currentIndex = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
    if (currentIndex > 0) {
        playMusic(songs[currentIndex - 1]);
    }
}

async function displayAlbums() {
    try {
        
        let response = await fetch(`/songs/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");

        for (let e of anchors) {
            if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
                let folder = e.href.split("/").slice(-1)[0];

                try {
                    let metadata = await fetch(`/songs/${folder}/info.json`);
                    let data = await metadata.json();
                    cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg class="play-button" width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="45" fill="#1fdf64" />
                                <polygon points="40,30 40,70 70,50" fill="black" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${data.title}</h2>
                        <p>${data.description}</p>
                    </div>`;
                } catch (err) {
                    
                }
            }
        }

         // Load the playlist whenever the album is clicked.
        document.querySelectorAll(".card").forEach(e => {
            e.addEventListener("click", async () => {
                console.log("Fetching Songs...");
                await getSongs(`songs/${e.dataset.folder}`);
                playMusic(songs[0]);
            });
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

async function main() {
    // get the list of all songs
    await getSongs("songs/cs");
    if (songs.length > 0) playMusic(songs[0], true);

    // Display all the albums
    displayAlbums();

    // Attach eventlistener play, pause and next
    let playButton = document.getElementById("play");
    let previousButton = document.getElementById("previous");
    let nextButton = document.getElementById("next");

    playButton.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playButton.src = "img/pause.svg";
        } else {
            currentSong.pause();
            playButton.src = "img/play.svg";
        }
    });

    // Listen for time updates events
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerText = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration * 100) + "%";
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Add event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-125%";
    });

    //Add event listener for previous and next song
    previousButton.addEventListener("click", playPreviousSong);
    nextButton.addEventListener("click", playNextSong);

    // Add event listener for volume change
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume >0){
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
    });

    // Add evnetlistener to mute a volume
    document.querySelector(".volume>img").addEventListener("click", (e) => {
        if (e.target.src.includes("volume.svg")){
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })
}

main();
