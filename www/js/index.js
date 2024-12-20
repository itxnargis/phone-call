// Call history storage structure
const callHistory = {
    incoming: [],
    outgoing: [],
    missed: []
};

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Cordova is ready!');
    loadCallHistory();
    setupTabs();
    setupDialer();
    displayCallHistory();
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');

            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Show selected tab content
            const tabId = tab.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function setupDialer() {
    const phoneNumberInput = document.getElementById('phone-number');
    const keypadButtons = document.querySelectorAll('.keypad-button');
    const callButton = document.getElementById('call-button');
    const statusMessage = document.getElementById('status-message');

    keypadButtons.forEach(button => {
        button.addEventListener('click', () => {
            phoneNumberInput.value += button.textContent;
        });
    });

    callButton.addEventListener('click', () => {
        const number = phoneNumberInput.value.trim();
        if (number) {
            makeCall(number);
        } else {
            showStatus('Please enter a valid phone number', 'error');
        }
    });
}

function makeCall(number) {
    try {
        // Add to outgoing calls history
        addCallToHistory('outgoing', number);

        // Use tel: protocol for making calls
        const telUrl = `tel:${number}`;
        window.location.href = telUrl;

        showStatus(`Calling ${number}...`);

        // Clear input after call initiation
        document.getElementById('phone-number').value = '';

    } catch (error) {
        console.error('Call failed:', error);
        showStatus('Failed to make call. Please try again.', 'error');
    }
}

function addCallToHistory(type, number) {
    const call = {
        number: number,
        timestamp: new Date().toISOString(),
        duration: '00:00' // Placeholder as we can't track actual duration
    };

    callHistory[type].unshift(call); // Add to beginning of array
    if (callHistory[type].length > 50) { // Limit history to 50 entries
        callHistory[type].pop();
    }

    saveCallHistory();
    displayCallHistory();
}

function loadCallHistory() {
    try {
        const saved = localStorage.getItem('callHistory');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(callHistory, parsed);
        }
    } catch (error) {
        console.error('Failed to load call history:', error);
    }
}

function saveCallHistory() {
    try {
        localStorage.setItem('callHistory', JSON.stringify(callHistory));
    } catch (error) {
        console.error('Failed to save call history:', error);
    }
}

function displayCallHistory() {
    ['incoming', 'outgoing', 'missed'].forEach(type => {
        const container = document.querySelector(`#${type} .call-list`);
        container.innerHTML = '';

        if (callHistory[type].length === 0) {
            container.innerHTML = `<div class="no-calls">No ${type} calls</div>`;
            return;
        }

        callHistory[type].forEach(call => {
            const callElement = document.createElement('div');
            callElement.className = 'call-item';

            const date = new Date(call.timestamp);
            const formattedDate = date.toLocaleString();

            callElement.innerHTML = `
                <div class="call-number">${call.number}</div>
                <div class="call-time">${formattedDate}</div>
            `;

            container.appendChild(callElement);
        });
    });
}

function showStatus(message, type = 'info') {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;

    setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }, 3000);
}

