document.addEventListener('deviceready', onDeviceReady, false);

const callHistory = {
    incoming: [],
    outgoing: [],
    missed: []
};

function onDeviceReady() {
    console.log('Cordova is ready!');
    setupTabs();
    setupDialer();
    startCallMonitoring();
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

function setupDialer() {
    const phoneNumberInput = document.getElementById('phone-number');
    const keypadButtons = document.querySelectorAll('.keypad-button');
    const callButton = document.getElementById('call-button');

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
            alert('Please enter a valid phone number');
        }
    });
}

function makeCall(number) {
    cordova.exec(
        function(success) {
            console.log(success);
            addCallToHistory('outgoing', number);
            document.getElementById('phone-number').value = '';
        },
        function(error) {
            console.error(error);
            alert('Failed to make call. Please try again.');
        },
        'CallManager',
        'makeCall',
        [number]
    );
}

function startCallMonitoring() {
    cordova.exec(
        function(result) {
            handleCallStateChange(result);
        },
        function(error) {
            console.error('Call monitoring error:', error);
        },
        'CallManager',
        'startCallMonitoring',
        []
    );
}

function handleCallStateChange(result) {
    const { state, number } = result;

    switch(state) {
        case 'RINGING':
            addCallToHistory('incoming', number);
            break;
        case 'OFFHOOK':
            // Call is active
            break;
        case 'IDLE':
            // If last state was RINGING, it was a missed call
            if (lastState === 'RINGING') {
                addCallToHistory('missed', lastNumber);
            }
            break;
    }

    lastState = state;
    lastNumber = number;
}

function addCallToHistory(type, number) {
    const call = {
        number: number || 'Unknown',
        timestamp: new Date().toISOString()
    };

    callHistory[type].unshift(call);
    if (callHistory[type].length > 50) {
        callHistory[type].pop();
    }

    updateCallList(type);
}

function updateCallList(type) {
    const container = document.querySelector(`#${type} .call-list`);
    container.innerHTML = '';

    if (callHistory[type].length === 0) {
        container.innerHTML = `<div class="no-calls">No ${type} calls</div>`;
        return;
    }

    callHistory[type].forEach(call => {
        const callElement = document.createElement('div');
        callElement.className = 'call-item';
        callElement.innerHTML = `
            <div class="call-number">${call.number}</div>
            <div class="call-time">${new Date(call.timestamp).toLocaleString()}</div>
        `;
        container.appendChild(callElement);
    });
}

