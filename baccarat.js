// Initialize game variables
let balance = 1000000;
let currentBet = 0;
let lastBet = 0;
let amountWon = 0;
let bets = { tie: 0, banker: 0, player: 0 };
let game;
let clearTimer = null;

// Function to update the balance bar
function updateBalanceBar() {
    document.getElementById('balance').textContent = balance.toLocaleString();
    document.getElementById('current-bet').textContent = currentBet.toLocaleString();
}

// Function to update the bet summary bar
function updateBetSummaryBar() {
    document.getElementById('last-bet').textContent = lastBet.toLocaleString();
    document.getElementById('amount-won').textContent = amountWon.toLocaleString();
}
/////////

// Function to handle placing a bet
function placeBet(amount, placeholderType) {
    if (balance >= amount) {
        // If this is the first bet of the round, reset lastBet
        if (currentBet === 0) {
            lastBet = amount;
        } else {
            // If not the first bet, add to lastBet
            lastBet += amount;
        }
        
        currentBet += amount;
        balance -= amount;
        bets[placeholderType] += amount;
        updateBalanceBar();
        updateBetSummaryBar();
        return true;
    } else {
        alert('Insufficient balance!');
        return false;
    }
}

// Function to reset the current bet
function resetCurrentBet() {
    // Reset only the current bet, keeping lastBet intact
    currentBet = 0;
    bets = { tie: 0, banker: 0, player: 0 };
    
    document.querySelectorAll('.chip-placeholder').forEach(placeholder => {
        placeholder.innerHTML = '';
    });
    
    updateBalanceBar();
}

// Optional: Function to reset last bet manually if needed
function resetLastBet() {
    lastBet = 0;
    amountWon = 0;
    updateBetSummaryBar();
}

// Function to double all current bets
function doubleBet() {
    if (currentBet === 0) {
        alert('No bets to double!');
        return;
    }
    
    if (balance < currentBet) {
        alert('Insufficient balance to double bet!');
        return;
    }
    
    for (const [type, amount] of Object.entries(bets)) {
        if (amount > 0) {
            const success = placeBet(amount, type);
            if (!success) return;
            
            const placeholderIndex = type === 'tie' ? 0 : type === 'banker' ? 1 : 2;
            const placeholder = document.querySelectorAll('.chip-placeholder')[placeholderIndex];
            const existingChip = placeholder.querySelector('.chip');
            
            if (existingChip) {
                const newChip = existingChip.cloneNode(true);
                placeholder.appendChild(newChip);
            }
        }
    }
}

// Function to handle win/loss outcome
function handleOutcome(payout) {
    amountWon = payout;
    balance += payout;
    
    // Update the UI
    updateBetSummaryBar();
    updateBalanceBar();
}

// Function to determine the payout
// Old version returned just winnings (always positive)
// New version returns NET outcome (winnings minus bet amount)
function calculatePayout(result) {
    let winnings = 0;
    switch (result) {
        case 'Player wins!':
            winnings = bets.player * 2; // Returns bet*2 (original + winnings)
            break;
        case 'Banker wins!':
            winnings = bets.banker * 1.95; // Returns bet*1.95
            break;
        case 'It\'s a tie!':
            winnings = bets.tie * 9; // Returns bet*9
            break;
    }
    return Math.floor(winnings - currentBet); // Now returns net change
}

// Function to completely clear the table
function clearTable() {
    if (clearTimer) {
        clearInterval(clearTimer);
        clearTimer = null;
    }

    const countdownElement = document.getElementById('countdown-timer');
    if (countdownElement) countdownElement.style.display = 'none';

    document.querySelectorAll('.chip-placeholder').forEach(placeholder => {
        placeholder.innerHTML = '';
    });

    ['player-card-1', 'player-card-2', 'player-card-3', 
     'banker-card-1', 'banker-card-2', 'banker-card-3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

    const resultElement = document.getElementById('result');
    if (resultElement) resultElement.textContent = '';
}

// Function to start the clear countdown
function startClearCountdown(seconds = 7) {
    const countdownElement = document.getElementById('countdown-timer');
    if (!countdownElement) return;
    
    let remaining = seconds;
    
    clearTimer = setInterval(() => {
        remaining--;
      
        if (remaining <= 0) {
            clearTable();
        }
    }, 1000);
}

// Function to deal cards and play a round
function dealCards() {
    // Clear any existing timers and reset table
    clearTable();
    
    if (!game) {
        game = new BaccaratGame();
    }
    
    const roundResult = game.playRound();
    
    // Display cards
    displayCards(roundResult.playerHand, ['player-card-1', 'player-card-2', 'player-card-3']);
    displayCards(roundResult.bankerHand, ['banker-card-1', 'banker-card-2', 'banker-card-3']);
    
    // Show result
    const resultElement = document.getElementById('result');
    if (resultElement) resultElement.textContent = roundResult.result;
    
    const payout = calculatePayout(roundResult.result);
    handleOutcome(payout);
    
    startClearCountdown(10);
    game = new BaccaratGame();
    
    // Reset for the next round
    resetCurrentBet();
}

// Drag and drop functionality
const chips = document.querySelectorAll('.chip-rack .chip');
const placeholders = document.querySelectorAll('.chip-placeholder');

chips.forEach(chip => {
    chip.setAttribute('draggable', 'true');
    
    chip.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', JSON.stringify({
            src: event.target.src,
            value: event.target.dataset.value
        }));
        event.target.style.opacity = '0.5';
    });

    chip.addEventListener('dragend', (event) => {
        event.target.style.opacity = '1';
    });
});

placeholders.forEach((placeholder, index) => {
    placeholder.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    placeholder.addEventListener('drop', (event) => {
        event.preventDefault();
        
        try {
            const chipData = JSON.parse(event.dataTransfer.getData('text/plain'));
            const newChip = document.createElement('img');
            newChip.src = chipData.src;
            newChip.className = 'chip';
            newChip.dataset.value = chipData.value;
            newChip.width = 50;
            newChip.height = 50;

            placeholder.innerHTML = '';
            placeholder.appendChild(newChip);

            const chipValue = parseInt(chipData.value);
            const placeholderType = ['tie', 'banker', 'player'][index];
            placeBet(chipValue, placeholderType);

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

// Function to inject CSS styles
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .card-placeholder {
            width: 80px;
            height: 90px;
            border-radius: 8px;
            transition: all 0.3s ease;
        }

        @keyframes easeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .card-img {
            width: 80px;
            height: 90px;
            animation: easeIn 0.5s ease-in-out;
        }
        
        #countdown-timer {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            display: none;
            font-size: 1.5rem;
        }
        
        .chip-placeholder {
            transition: opacity 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Function to display cards with animation
function displayCards(hand, placeholderIds) {
    hand.forEach((card, index) => {
        setTimeout(() => {
            const placeholder = document.getElementById(placeholderIds[index]);
            if (placeholder) {
                const img = document.createElement('img');
                img.src = getCardImagePath(card);
                img.classList.add('card-img');
                img.width = 80;
                img.height = 90;
                placeholder.innerHTML = '';
                placeholder.appendChild(img);
            }
        }, index * 500);
    });
}

// Initialize the game
function initGame() {
    injectStyles();

    if (!document.getElementById('countdown-timer')) {
        const countdown = document.createElement('div');
        countdown.id = 'countdown-timer';
        document.body.appendChild(countdown);
    }

    game = new BaccaratGame();

    document.getElementById('deal-btn').addEventListener('click', dealCards);
    document.getElementById('double-bet-btn').addEventListener('click', doubleBet);
    document.getElementById('clear-bet-btn').addEventListener('click', resetCurrentBet);

    updateBalanceBar();
    updateBetSummaryBar();
}

// Baccarat Game Class
class BaccaratGame {
    constructor() {
        this.deck = this.createDeck();
        this.shuffleDeck();
    }

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

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    getCardValue(card) {
        if (['J', 'Q', 'K', '10'].includes(card.value)) {
            return 0;
        } else if (card.value === 'A') {
            return 1;
        } else {
            return parseInt(card.value);
        }
    }

    calculateHandValue(hand) {
        let total = hand.reduce((sum, card) => sum + this.getCardValue(card), 0);
        return total % 10;
    }

    dealCard() {
        if (this.deck.length === 0) {
            this.deck = this.createDeck();
            this.shuffleDeck();
        }
        return this.deck.pop();
    }

    shouldDrawThirdCard(handValue) {
        return handValue <= 5;
    }

    playRound() {
        const playerHand = [this.dealCard(), this.dealCard()];
        const bankerHand = [this.dealCard(), this.dealCard()];

        let playerValue = this.calculateHandValue(playerHand);
        let bankerValue = this.calculateHandValue(bankerHand);

        if (this.shouldDrawThirdCard(playerValue)) {
            playerHand.push(this.dealCard());
            playerValue = this.calculateHandValue(playerHand);
        }

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