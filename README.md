# RevoFun Game Website

## Overview

RevoFun is a browser-based gaming website created for casual gamers who want to enjoy simple and entertaining games directly in the browser. The project combines a branded landing page, supporting information pages, and multiple JavaScript games in one interactive website.

The main goal of this project is to showcase a fictional gaming company called **RevoFun**, provide easy access to several mini games, and deliver a fun user experience through responsive design and simple gameplay mechanics.

## Features Implemented

### Website Features

- Responsive landing page for desktop, tablet, and mobile screens
- Branded hero section that introduces the RevoFun platform
- Featured games section with direct access to each game
- Mobile navigation overlay with burger menu
- About page for company introduction and mission
- Privacy Policy and Terms of Service page
- Root `index.html` redirect for easier deployment and GitHub Pages compatibility

### Game Features

#### 1. Modern Battleship War

- Player nickname input
- Difficulty selection: Easy, Medium, Hard
- Ship placement system with rotation support
- Enemy AI attack logic
- Score tracking and game-over modal
- Local leaderboard storage

#### 2. Avoid the Falling Objects

- Keyboard-based player movement
- Real-time falling object generation
- Score, level, and duration tracking
- Diamond bonus mechanic
- Game over overlay and leaderboard

#### 3. Memory Card Game

- Card matching gameplay using JavaScript DOM manipulation
- Move counter and timer
- Player nickname support
- Win overlay and final result message
- Local leaderboard storage

## Technologies Used

- **HTML5** for page structure and game layout
- **CSS3** for game styling and custom UI
- **Tailwind CSS v4** for the main website styling workflow
- **Responsive Design** using mobile-first breakpoints: `sm`, `md`, and `lg`
- **HTML5 Video Background** for animated hero section visuals (autoplay, muted, loop, responsive overlays)
- **JavaScript (Vanilla JS)** for interactivity and game logic
- **LocalStorage** for saving leaderboard data in the browser
- **Google Fonts** for branding and typography
- **GitHub Pages-ready structure** using a root `index.html` redirect

## Project Structure

```text
.
├── index.html
├── README.md
├── package.json
└── src/
	├── indeks.html
	├── about-us.html
	├── privacy.html
	├── input.css
	├── style.css
	├── mobile-menu.html
	├── mobile-menu.js
	├── indeks.js
	├── assets/
	├── battleship/
	├── fallingObject/
	└── memoryCard/
```

## Screenshots or Demo Links

### Demo Links

- Live deploy: [https://revou-fsse-feb26.github.io/milestone-2-AI-NovaNX/](https://ai-novanx.online/src/indeks.html)
- Website entry point: [index.html](index.html)
- Main landing page source: [src/indeks.html](src/indeks.html)
- About page: [src/about-us.html](src/about-us.html)
- Privacy page: [src/privacy.html](src/privacy.html)
- Battleship game: [src/battleship/battleship.html](src/battleship/battleship.html)
- Avoid the Falling Objects game: [src/fallingObject/fallingObject.html](src/fallingObject/fallingObject.html)
- Memory Card game: [src/memoryCard/memoryCard.html](src/memoryCard/memoryCard.html)

### Optional Live Demo

If GitHub Pages is enabled for this repository, the project can be published from the root entry page:

- [https://revou-fsse-feb26.github.io/milestone-2-AI-NovaNX/](https://revou-fsse-feb26.github.io/milestone-2-AI-NovaNX/)

## How to Run the Project

1. Clone this repository.
2. Install dependencies:

```bash
npm install
```

3. Build the Tailwind CSS output:

```bash
npm run build
```

4. Open the website from:

- `index.html` for the root entry point, or
- `src/indeks.html` for the main homepage source file.

## User Guide

### How to Open the Homepage

1. Open `index.html` from the root folder as the main entry point.
2. The root entry will redirect users to the main homepage in `src/indeks.html`.

### How to Navigate to About, Games, and Privacy

1. From the homepage header, use the navigation menu to open:
   - `Home`
   - `Games`
   - `About`
2. On mobile screens, open the burger menu to access the same navigation links through the mobile overlay.
3. To open the Privacy Policy or Terms of Service page, use the links in the footer section of the homepage.

### How to Open a Game

1. Scroll to the **Featured Games** section on the homepage.
2. Choose one of the available games:
   - Modern Battleship War
   - Avoid the Falling Objects
   - Memory Card Game
3. Click the game card or the `Play` button to open the selected game.

### How to Play Each Game

#### Modern Battleship War

1. Enter your nickname and save it.
2. Choose a difficulty level.
3. Place all ships on your board and rotate them when needed.
4. Start the battle.
5. Click cells on the enemy board to attack until all enemy ships are destroyed.

#### Avoid the Falling Objects

1. Enter your nickname.
2. Click `Start Game`.
3. Move the player using the keyboard left and right arrow keys.
4. Avoid falling objects to gain score.
5. Collect diamonds for bonus points and survive as long as possible.

#### Memory Card Game

1. Enter your nickname.
2. Click `Start Game`.
3. Click two cards to reveal them.
4. Match identical cards to keep them open.
5. Complete all card pairs using the fewest moves and shortest time possible.

## Notes

- Leaderboard data is stored locally in the browser using `localStorage`.
- The project is designed as a static website and does not require a backend server.
- The Battleship game is best experienced on tablet or desktop-sized screens.
