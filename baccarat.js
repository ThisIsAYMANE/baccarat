// Initialize game variables
let balance = 1000000; // Starting balance
let currentBet = 0; // Current bet amount
let lastBet = 0; // Last bet amount
let amountWon = 0; // Amount won in the last round
let bets = { tie: 0, banker: 0, player: 0 }; // Track bets for each placeholder

// Function to update the balance bar
function updateBalanceBar() {
    document.getElementById('balance').textContent = balance.toFixed(2);
    document.getElementById('current-bet').textContent = currentBet.toFixed(2);
}

// Function to update the bet summary bar
function updateBetSummaryBar() {
    document.getElementById('last-bet').textContent = lastBet.toFixed(2);
    document.getElementById('amount-won').textContent = amountWon.toFixed(2);
}

// Function to handle placing a bet
function placeBet(amount, placeholderType) {
    if (balance >= amount) {
        currentBet += amount;
        balance -= amount;
        bets[placeholderType] += amount; // Track the bet for the specific placeholder
        updateBalanceBar();
    } else {
        alert('Insufficient balance!');
    }
}

// Function to reset the current bet
function resetCurrentBet() {
    currentBet = 0;
    bets = { tie: 0, banker: 0, player: 0 }; // Reset all bets
    updateBalanceBar();
}

// Function to handle a win
function handleWin(winAmount) {
    balance += winAmount;
    amountWon = winAmount;
    lastBet = currentBet;
    resetCurrentBet();
    updateBetSummaryBar();
}

// Function to handle a loss
function handleLoss() {
    amountWon = 0;
    lastBet = currentBet;
    resetCurrentBet();
    updateBetSummaryBar();
}

// Function to determine the payout based on the game result
function calculatePayout(result) {
    let payout = 0;
    switch (result) {
        case 'Player wins!':
            payout = bets.player * 1; // Player pays 1:1
            break;
        case 'Banker wins!':
            payout = bets.banker * 0.95; // Banker pays 0.95:1 (5% commission)
            break;
        case 'It\'s a tie!':
            payout = bets.tie * 8; // Tie pays 8:1
            break;
    }
    return payout;
}

// Get only the chips inside the chip-rack
const chips = document.querySelectorAll('.chip-rack .chip');
const placeholders = document.querySelectorAll('.chip-placeholder');

// Add event listeners for dragging and dropping
chips.forEach(chip => {
    // Make the element draggable
    chip.setAttribute('draggable', 'true');
    
    chip.addEventListener('dragstart', (event) => {
        // Store both the image source and the chip value
        event.dataTransfer.setData('text/plain', JSON.stringify({
            src: event.target.src,
            value: event.target.dataset.value
        }));
        event.target.style.opacity = '0.5'; // Make the chip semi-transparent while dragging
    });

    chip.addEventListener('dragend', (event) => {
        event.target.style.opacity = '1'; // Reset the opacity after dragging
    });
});

placeholders.forEach((placeholder, index) => {
    placeholder.addEventListener('dragover', (event) => {
        event.preventDefault(); // Necessary to allow dropping
    });

    placeholder.addEventListener('drop', (event) => {
        event.preventDefault();
        
        try {
            const chipData = JSON.parse(event.dataTransfer.getData('text/plain'));
            const newChip = document.createElement('img');
            newChip.src = chipData.src;
            newChip.className = 'chip';
            newChip.dataset.value = chipData.value;
            newChip.width = 50; // Adjust the size of the dropped chip
            newChip.height = 50;

            // Append the chip to the placeholder
            placeholder.innerHTML = ''; // Clear any previous chip
            placeholder.appendChild(newChip); // Add the new chip to the placeholder

            // Update the bet amount and balance
            const chipValue = parseInt(chipData.value);
            const placeholderType = ['tie', 'banker', 'player'][index]; // Tie, Banker, Player
            placeBet(chipValue, placeholderType);

            // Log the placeholder type and chip value
            console.log(`Chip placed on ${placeholderType} with value: ${chipValue}`);
        } catch (e) {
            console.error('Error processing dropped data:', e);
        }
    });
});

// Helper function to get the image path for a card
function getCardImagePath(card) {
    let value;
    switch (card.value) {
        case 'J': value = 'jack'; break;
        case 'Q': value = 'queen'; break;
        case 'K': value = 'king'; break;
        case 'A': value = 'ace'; break;
        default: value = card.value;
    }
    return `assets/svg-cards/${value}_of_${card.suit}.svg`;
}

// Function to inject CSS styles into the DOM
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Card Placeholder Styles */
        .card-placeholder {
            width: 80px; /* Match image width */
            height: 90px; /* Match image height */
            border-radius: 8px;
            transition: all 0.3s ease;
        }

        /* Card Animation */
        @keyframes easeIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .card-img {
            width: 80px; /* Set width */
            height: 90px; /* Set height */
            animation: easeIn 0.5s ease-in-out; /* Apply animation */
        }
    `;
    document.head.appendChild(style);
}

// Function to display cards with a delay and animation
function displayCards(hand, placeholderIds) {
    hand.forEach((card, index) => {
        setTimeout(() => {
            const placeholder = document.getElementById(placeholderIds[index]);
            if (placeholder) {
                // Create an image element
                const img = document.createElement('img');
                img.src = getCardImagePath(card);
                img.classList.add('card-img');

                // Set the size of the image
                img.width = 80; // Set width in pixels
                img.height = 90; // Set height in pixels

                // Append the image to the placeholder
                placeholder.innerHTML = ''; // Clear previous content
                placeholder.appendChild(img);
            }
        }, index * 500); // Delay each card by 500ms
    });
}

// Initialize the game
function initGame() {
    // Inject CSS styles
    injectStyles();

    // Create and shuffle the deck
    const game = new BaccaratGame();

    // Automatically deal cards when the page loads
    const roundResult = game.playRound();

    // Display player cards
    displayCards(roundResult.playerHand, ['player-card-1', 'player-card-2', 'player-card-3']);

    // Display banker cards
    displayCards(roundResult.bankerHand, ['banker-card-1', 'banker-card-2', 'banker-card-3']);

    // Display result
    document.getElementById('result').textContent = roundResult.result;

    // Calculate payout and update balance
    const payout = calculatePayout(roundResult.result);
    if (payout > 0) {
        handleWin(payout);
    } else {
        handleLoss();
    }
}

// Baccarat Game Class
class BaccaratGame {
    constructor() {
        this.deck = this.createDeck();
        this.shuffleDeck();
    }

    // Create a standard deck of 52 cards
    createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck = [];
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ value, suit });
            }
        }
        return deck;
    }

    // Shuffle the deck using Fisher-Yates algorithm
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    // Get the value of a card in Baccarat
    getCardValue(card) {
        if (['J', 'Q', 'K', '10'].includes(card.value)) {
            return 0;
        } else if (card.value === 'A') {
            return 1;
        } else {
            return parseInt(card.value);
        }
    }

    // Calculate the total value of a hand
    calculateHandValue(hand) {
        let total = hand.reduce((sum, card) => sum + this.getCardValue(card), 0);
        return total % 10; // Only the last digit counts
    }

    // Deal a card from the deck
    dealCard() {
        if (this.deck.length === 0) {
            console.warn('Deck is empty! Reshuffling...');
            this.deck = this.createDeck(); // Reshuffle if deck is empty
            this.shuffleDeck();
        }
        return this.deck.pop();
    }

    // Determine if a third card should be drawn
    shouldDrawThirdCard(handValue) {
        return handValue <= 5;
    }

    // Play a round of Baccarat
    playRound() {
        const playerHand = [this.dealCard(), this.dealCard()];
        const bankerHand = [this.dealCard(), this.dealCard()];

        let playerValue = this.calculateHandValue(playerHand);
        let bankerValue = this.calculateHandValue(bankerHand);

        // Player draws a third card if necessary
        if (this.shouldDrawThirdCard(playerValue)) {
            playerHand.push(this.dealCard());
            playerValue = this.calculateHandValue(playerHand);
        }

        // Banker draws a third card based on rules
        if (this.shouldDrawThirdCard(bankerValue)) {
            bankerHand.push(this.dealCard());
            bankerValue = this.calculateHandValue(bankerHand);
        }

        return {
            playerHand,
            bankerHand,
            playerValue,
            bankerValue,
            result: playerValue > bankerValue ? 'Player wins!' :
                   bankerValue > playerValue ? 'Banker wins!' :
                   'It\'s a tie!'
        };
    }
}

// Start the game when the page loads
window.onload = initGame;