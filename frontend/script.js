let currentQR = '';

async function checkStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        const status = data.status;

        const statusElement = document.getElementById('connectionStatus');
        statusElement.textContent = status.toUpperCase();
        statusElement.className = status; // For styling

        const qrContainer = document.getElementById('qrContainer');
        const qrCodeElement = document.getElementById('qrCode');

        if (status === 'connected') {
            qrContainer.style.display = 'none';
            statusElement.style.color = '#2ecc71';
        } else if (status === 'scanning') {
            statusElement.style.color = '#f39c12';
            // Fetch QR
            const qrResponse = await fetch('/api/qr');
            const qrData = await qrResponse.json();

            if (qrData.qr && qrData.qr !== currentQR) {
                currentQR = qrData.qr;
                qrContainer.style.display = 'block';
                qrCodeElement.innerHTML = ''; // Clear previous
                new QRCode(qrCodeElement, {
                    text: currentQR,
                    width: 256,
                    height: 256
                });
            } else if (!qrData.qr) {
                qrContainer.style.display = 'none';
            }
        } else {
            statusElement.style.color = '#e74c3c';
            qrContainer.style.display = 'none';
        }

    } catch (error) {
        console.error('Error checking status:', error);
    }
}

async function fetchStats() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();

        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('totalTokens').textContent = data.totalTokens.toLocaleString();

        // Calculate total interactions from recent users (approximation for now, or sum if available)
        let interactions = 0;
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';

        data.recentUsers.forEach(user => {
            interactions += (user.interactionCount || 0);

            const row = document.createElement('tr');
            const lastActive = user.lastActive ? new Date(user.lastActive.seconds * 1000).toLocaleString() : 'N/A';

            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.interactionCount || 0}</td>
                <td>${lastActive}</td>
            `;
            usersList.appendChild(row);
        });

        document.getElementById('totalInteractions').textContent = interactions + "+";

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Initial load
fetchStats();
checkStatus();

// Auto refresh
setInterval(fetchStats, 30000);
setInterval(checkStatus, 5000);
