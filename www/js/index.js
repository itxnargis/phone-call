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
    permissions.requestPermissions(
        [
            permissions.READ_CALL_LOG,
            permissions.READ_PHONE_STATE,
            permissions.CALL_PHONE
        ],
        () => console.log('Permissions granted'),
        (err) => console.error('Permissions denied:', err)
    );
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
            window.plugins.CallNumber.callNumber(
                () => console.log('Calling:', number),
                (err) => console.error('Call failed:', err),
                number,
                true
            );
        } else {
            alert('Please enter a valid phone number.');
        }
    });
}

function setupPhoneCallTrap() {
    PhoneCallTrap.onCall((state) => {
        console.log('Phone call state:', state);
        const callInfo = {
            number: state.phoneNumber || 'Unknown',
            type: state.state,
            date: new Date().toLocaleString()
        };
        updateCallList(callInfo);
    });
}

function fetchCallLogs() {
    const callLog = window.plugins.calllog;
    if (callLog) {
        callLog.list({}, (logs) => {
            displayCalls('incoming', logs.filter(log => log.type === 'INCOMING'));
            displayCalls('outgoing', logs.filter(log => log.type === 'OUTGOING'));
            displayCalls('missed', logs.filter(log => log.type === 'MISSED'));
        }, (err) => console.error('Failed to fetch call logs:', err));
    } else {
        console.error('Calllog plugin is not available.');
    }
}

function displayCalls(tabId, calls) {
    const tabContent = document.getElementById(tabId);
    tabContent.innerHTML = calls.map(call => `
        <div class="call-item">
            <span class="number">${call.number}</span>
            <span class="date">${new Date(call.date).toLocaleString()}</span>
        </div>
    `).join('');
}

function updateCallList(callInfo) {
    const { type, number, date } = callInfo;
    let tabId = type === 'RINGING' ? 'incoming' : type === 'OFFHOOK' ? 'outgoing' : 'missed';

    if (tabId) {
        const tabContent = document.getElementById(tabId);
        const callItem = `<div class="call-item">
            <span class="number">${number}</span>
            <span class="date">${date}</span>
        </div>`;
        tabContent.innerHTML += callItem;
    }
}
