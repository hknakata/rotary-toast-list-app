const guestList = getGuestListFromCookie() || [];
let titleOrder = {};

// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + JSON.stringify(value) + ";" + expires + ";path=/";
}

// Function to get a cookie
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return JSON.parse(c.substring(nameEQ.length, c.length));
    }
    return null;
}

// Function to get the guest list from the cookie
function getGuestListFromCookie() {
    return getCookie('guestList');
}

// Fetch the club list from the JSON file
fetch('data/clubs.json')
    .then(response => response.json())
    .then(data => {
        const clubList = data.clubs;
        const clubSelect = document.getElementById('clubName');
        const myClubSelect = document.getElementById('myClub');
        clubList.forEach(club => {
            const option = document.createElement('option');
            option.value = JSON.stringify({ name: club.name, charterYear: club.charterYear });
            option.textContent = `${club.name} (Charter Year: ${club.charterYear})`;
            clubSelect.appendChild(option);
            myClubSelect.appendChild(option.cloneNode(true));
        });
        // Initialize Select2 for club list and my club list
        $('#clubName').select2({
            placeholder: "-- Select Club --",
            allowClear: true
        });
        $('#myClub').select2({
            placeholder: "-- Select My Club --",
            allowClear: true
        });
    })
    .catch(error => console.error('Error fetching club list:', error));

// Fetch the title list from the JSON file
fetch('data/titles.json')
    .then(response => response.json())
    .then(data => {
        const titleList = data.titles;
        const titleSelect = document.getElementById('title');
        titleList.forEach((title, index) => {
            const option = document.createElement('option');
            option.value = title;
            option.textContent = title;
            titleSelect.appendChild(option);
            titleOrder[title] = index; // Store the order of titles
        });
        // Initialize Select2 for title list
        $('#title').select2({
            placeholder: "-- Select Title --",
            allowClear: true
        });
    })
    .catch(error => console.error('Error fetching title list:', error));

document.getElementById('guestForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const guestName = document.getElementById('guestName').value;
    const club = JSON.parse(document.getElementById('clubName').value);
    const title = document.getElementById('title').value;
    
    // Add the new guest to the guest list
    guestList.push({ guestName, clubName: club.name, charterYear: club.charterYear, title });
    
    // Store the guest list in a cookie with 3 days expiry
    setCookie('guestList', guestList, 3);
    
    // Display the guest list in table format
    const guestTableBody = document.getElementById('guestTable').getElementsByTagName('tbody')[0];
    guestTableBody.innerHTML = ''; // Clear existing rows
    guestList.forEach((guest, index) => {
        const row = guestTableBody.insertRow();
        row.insertCell(0).textContent = guest.guestName;
        row.insertCell(1).textContent = guest.clubName;
        row.insertCell(2).textContent = guest.charterYear;
        row.insertCell(3).textContent = guest.title;
    });
    
    // Show or hide the "No record" message for the guest list
    document.getElementById('guestListEmpty').style.display = guestList.length ? 'none' : 'block';
    
    // Clear the form inputs and reset Select2 placeholders
    document.getElementById('guestForm').reset();
    $('#clubName').val(null).trigger('change'); // Reset Select2 for club list
    $('#title').val(null).trigger('change'); // Reset Select2 for title list
});

document.getElementById('generateToastList').addEventListener('click', function() {
    const myClubSelect = document.getElementById('myClub');
    if (!myClubSelect.value) {
        alert('Please select your club before generating the toast list.');
        return;
    }
    
    const myClub = JSON.parse(myClubSelect.value).name;
    const highPriorityTitles = ["District Governor", "District Governor Elect", "District Governor Nominee"];
    
    // Generate the toast list
    const clubMap = new Map();
    
    guestList.forEach(guest => {
        const clubKey = guest.clubName;
        if (!clubMap.has(clubKey)) {
            clubMap.set(clubKey, { clubName: guest.clubName, charterYear: guest.charterYear, title: guest.title });
        } else {
            const existingGuest = clubMap.get(clubKey);
            if (titleOrder[guest.title] < titleOrder[existingGuest.title]) {
                clubMap.set(clubKey, { clubName: guest.clubName, charterYear: guest.charterYear, title: guest.title });
            }
        }
    });

    const uniqueClubs = Array.from(clubMap.values());

    // Sort by title order and then by charter year
    uniqueClubs.sort((a, b) => {
        if (titleOrder[a.title] < titleOrder[b.title]) return -1;
        if (titleOrder[a.title] > titleOrder[b.title]) return 1;
        return a.charterYear - b.charterYear;
    });

    // Move my club to the end unless it has a high priority title
    const myClubIndex = uniqueClubs.findIndex(club => club.clubName === myClub);
    if (myClubIndex !== -1 && !highPriorityTitles.includes(uniqueClubs[myClubIndex].title)) {
        const myClub = uniqueClubs.splice(myClubIndex, 1)[0];
        uniqueClubs.push(myClub);
    }

    const toastListDiv = document.getElementById('toastList');
    toastListDiv.innerHTML = '';
    toastListDiv.innerHTML += `<p><strong>RI</strong></p>`; // Add RI at the top
    uniqueClubs.forEach(club => {
        toastListDiv.innerHTML += `<p><strong>${club.clubName}</strong></p>`;
    });
    
    // Show or hide the "No record" message for the toast list
    document.getElementById('toastListEmpty').style.display = uniqueClubs.length ? 'none' : 'block';
});

// Clear the guest list
document.getElementById('clearGuestList').addEventListener('click', function() {
    guestList.length = 0; // Clear the guest list array
    setCookie('guestList', guestList, 3); // Update the cookie

    // Clear the guest list display
    const guestTableBody = document.getElementById('guestTable').getElementsByTagName('tbody')[0];
    guestTableBody.innerHTML = '';
    
    // Show or hide the "No record" message for the guest list
    document.getElementById('guestListEmpty').style.display = 'block';
});

// Load the guest list from the cookie and display it
window.onload = function() {
    const guestTableBody = document.getElementById('guestTable').getElementsByTagName('tbody')[0];
    guestList.forEach((guest, index) => {
        const row = guestTableBody.insertRow();
        row.insertCell(0).textContent = guest.guestName;
        row.insertCell(1).textContent = guest.clubName;
        row.insertCell(2).textContent = guest.charterYear;
        row.insertCell(3).textContent = guest.title;
    });
    
    // Show or hide the "No record" message for the guest list
    document.getElementById('guestListEmpty').style.display = guestList.length ? 'none' : 'block';
};