document.addEventListener('deviceready', onDeviceReady, false);

let callHistory = {
    incoming: [],
    outgoing: [],
    missed: []
};

function onDeviceReady() {
    console.log('Cordova is ready!');
    setupTabs();
    setupDialer();
    setupPhoneCallTrap();
    requestPermissions();
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
            makeCustomCall(number);
        } else {
            alert('Please enter a valid phone number.');
        }
    });
}

function makeCustomCall(number) {
    cordova.plugins.phonedialer.call(
        number,
        function(success) {
            console.log('Dialing succeeded');
            addCallToHistory('outgoing', number);
        },
        function(err) {
            console.error('Dialing failed', err);
            alert('Failed to make call. Please try again.');
        },
        true // Use custom dialer UI
    );
}

function setupPhoneCallTrap() {
    window.PhoneCallTrap.onCall((callState) => {
        console.log('Phone call state:', callState);
        switch(callState) {
            case "RINGING":
                addCallToHistory('incoming', "Unknown"); // Number would be available in a full implementation
                break;
            case "OFFHOOK":
                // Call is active
                break;
            case "IDLE":
                // Call ended
                break;
        }
        updateCallLists();
    });
}

function addCallToHistory(type, number) {
    const call = {
        number: number,
        timestamp: new Date().toISOString()
    };
    callHistory[type].unshift(call);
    updateCallLists();
}

function updateCallLists() {
    ['incoming', 'outgoing', 'missed'].forEach(type => {
        const container = document.querySelector(`#${type} .call-list`);
        container.innerHTML = '';
        callHistory[type].forEach(call => {
            const callElement = document.createElement('div');
            callElement.className = 'call-item';
            callElement.innerHTML = `
                <span>${call.number}</span>
                <span>${new Date(call.timestamp).toLocaleString()}</span>
            `;
            container.appendChild(callElement);
        });
    });
}

function requestPermissions() {
    const permissions = cordova.plugins.permissions;
    const requiredPermissions = [
        permissions.READ_PHONE_STATE,
        permissions.CALL_PHONE,
        permissions.READ_CALL_LOG
    ];

    permissions.requestPermissions(requiredPermissions, permissionSuccess, permissionError);
}

function permissionSuccess() {
    console.log('Permissions granted');
    // Fetch call logs here if needed
}

function permissionError() {
    console.error('Permissions not granted');
    alert('This app requires permissions to access call logs and make calls.');
}

