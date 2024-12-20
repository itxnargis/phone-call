document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Cordova is ready!');
    requestPermissions();
    setupTabs();
    setupDialer();
    setupPhoneCallTrap();
    fetchCallLogs();
}

function requestPermissions() {
    const permissions = cordova.plugins.permissions;
    const requiredPermissions = [
        permissions.READ_CALL_LOG,
        permissions.READ_PHONE_STATE,
        permissions.CALL_PHONE,
        permissions.PROCESS_OUTGOING_CALLS
    ];

    permissions.requestPermissions(requiredPermissions, permissionSuccess, permissionError);
}

function permissionSuccess() {
    console.log('Permissions granted');
    fetchCallLogs();
}

function permissionError() {
    console.error('Permissions not granted');
    alert('This app requires permissions to access call logs and make calls.');
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
            makePhoneCall(number);
        } else {
            alert('Please enter a valid phone number.');
        }
    });
}

function makePhoneCall(number) {
    window.plugins.CallNumber.callNumber(callSuccess, callError, number, true);
}

function callSuccess(result) {
    console.log('Call successful: ' + result);
}

function callError(error) {
    console.error('Call failed: ' + error);
    alert('Failed to make the call. Please try again.');
}

function setupPhoneCallTrap() {
    window.PhoneCallTrap.onCall((callState) => {
        console.log('Phone call state:', callState);
        let callType;
        switch (callState.state) {
            case 'RINGING':
                callType = 'incoming';
                break;
            case 'OFFHOOK':
                callType = 'outgoing';
                break;
            case 'IDLE':
                // Check if it was a missed call
                if (callState.prevState === 'RINGING') {
                    callType = 'missed';
                }
                break;
        }
        if (callType) {
            updateCallList(callType, callState.phoneNumber);
        }
    });
}

function fetchCallLogs() {
    window.plugins.calllog.list(callLogSuccess, callLogError);
}

function callLogSuccess(calls) {
    calls.forEach(call => {
        let callType;
        switch (call.type) {
            case 1: // Incoming
                callType = 'incoming';
                break;
            case 2: // Outgoing
                callType = 'outgoing';
                break;
            case 3: // Missed
                callType = 'missed';
                break;
        }
        if (callType) {
            updateCallList(callType, call.number, new Date(call.date));
        }
    });
}

function callLogError(error) {
    console.error('Error fetching call logs:', error);
    alert('Failed to fetch call logs. Please check app permissions.');
}

function updateCallList(type, number, date = new Date()) {
    const tabContent = document.getElementById(type);
    const callItem = document.createElement('div');
    callItem.className = 'call-item';
    callItem.innerHTML = `
        <span class="number">${number || 'Unknown'}</span>
        <span class="date">${date.toLocaleString()}</span>
    `;
    tabContent.insertBefore(callItem, tabContent.firstChild);
}

