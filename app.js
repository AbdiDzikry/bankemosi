document.addEventListener('DOMContentLoaded', () => {
    // === ELEMEN DOM ===
    const peopleList = document.getElementById('people-list');
    const historyList = document.getElementById('history-list');
    const emotionChartCanvas = document.getElementById('emotion-chart');
    
    // Tombol Aksi Utama
    const openPersonModalBtn = document.getElementById('open-person-modal-btn');
    const openTransactionModalBtn = document.getElementById('open-transaction-modal-btn');

    // Modal Relasi
    const personModal = document.getElementById('person-modal');
    const addPersonForm = document.getElementById('add-person-form');
    const personNameInput = document.getElementById('person-name');

    // Modal Transaksi
    const transactionModal = document.getElementById('transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const personSelect = document.getElementById('person-select');
    const transactionTypeInput = document.getElementById('transaction-type');
    const transactionAmountInput = document.getElementById('transaction-amount');
    const transactionDescriptionInput = document.getElementById('transaction-description');
    const withdrawalWarning = document.getElementById('withdrawal-warning');
    
    // Tombol tutup semua modal
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');

    // === STATE APLIKASI ===
    let people = [];
    let emotionChart = null;

    // === FUNGSI MODAL ===
    const openModal = (modal) => {
        const modalBackdrop = modal.closest('.modal-backdrop');
        const modalPanel = modal.querySelector('.modal-panel');
        
        modalBackdrop.classList.remove('hidden');
        setTimeout(() => {
            modalBackdrop.classList.remove('opacity-0');
            modalPanel.classList.remove('opacity-0', 'scale-95');
        }, 10); // delay kecil untuk memulai transisi
    };

    const closeModal = (modal) => {
        const modalBackdrop = modal.closest('.modal-backdrop');
        const modalPanel = modal.querySelector('.modal-panel');

        modalBackdrop.classList.add('opacity-0');
        modalPanel.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            modalBackdrop.classList.add('hidden');
        }, 300); // Sesuaikan dengan durasi transisi
    };

    // === FUNGSI LOCALSTORAGE ===
    const saveToLocalStorage = () => {
        localStorage.setItem('emotionBank', JSON.stringify(people));
    };

    const loadFromLocalStorage = () => {
        const data = localStorage.getItem('emotionBank');
        if (data) {
            people = JSON.parse(data);
        }
    };

    // === LOGIKA UTAMA ===
    const addPerson = (name) => {
        if (name && !people.some(p => p.name === name)) {
            const newPerson = { id: Date.now(), name: name, balance: 0, history: [] };
            people.push(newPerson);
            saveAndRender();
            personSelect.value = newPerson.id;
            closeModal(personModal);
            setTimeout(() => openModal(transactionModal), 400); // Buka modal transaksi setelahnya
        } else {
            alert('Nama relasi tidak boleh kosong atau sudah ada.');
        }
    };

    const addTransaction = (personId, type, amount, description) => {
        const person = people.find(p => p.id == personId);
        if (!person) return false;

        amount = parseInt(amount);
        
        if (type === 'withdrawal') {
            if (person.balance < -10) {
                showWarning('❌ Saldo sudah terlalu rendah. Lakukan deposit dulu.', 'error');
                return false;
            }
            if (person.balance <= 0) {
                showWarning('⚠️ Peringatan: Saldo Anda 0 atau negatif.', 'warning');
            } else {
                hideWarning();
            }
            person.balance -= amount;
        } else {
            person.balance += amount;
            hideWarning();
        }

        person.history.unshift({ type: type, amount: amount, description: description, date: new Date().toISOString() });
        saveAndRender();
        return true;
    };

    // === FUNGSI RENDER/UI ===
    const renderUI = () => {
        updatePeopleList();
        updatePersonSelect();
        updateHistoryList();
        updateChart();
    };
    
    const animateListItem = (item) => {
        item.classList.add('list-item-enter');
        requestAnimationFrame(() => {
            item.classList.remove('list-item-enter');
        });
    };

    const updatePeopleList = () => {
        peopleList.innerHTML = '';
        if (people.length === 0) {
            peopleList.innerHTML = `
                <li class="text-center text-gray-700 py-4">
                    <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    <p class="mt-2 font-semibold">Belum ada relasi</p>
                </li>`;
            return;
        }
        people.forEach(person => {
            const balanceClass = person.balance >= 0 ? 'text-emerald-600' : 'text-rose-600';
            const item = document.createElement('li');
            item.className = 'flex justify-between items-center py-2';
            item.innerHTML = `<span class="text-gray-900">${person.name}</span><span class="text-lg font-bold ${balanceClass}">${person.balance}</span>`;
            peopleList.appendChild(item);
            animateListItem(item);
        });
    };

    const updatePersonSelect = () => {
        const currentSelection = personSelect.value;
        personSelect.innerHTML = '<option value="">Pilih Relasi...</option>';
        people.forEach(person => {
            const option = document.createElement('option');
            option.value = person.id;
            option.textContent = person.name;
            personSelect.appendChild(option);
        });
        if (people.some(p => p.id == currentSelection)) {
            personSelect.value = currentSelection;
        }
    };
    
    const populateScoreOptions = () => {
        const scores = [5, 10, 15];
        transactionAmountInput.innerHTML = '<option value="">Pilih Skor...</option>';
        scores.forEach(score => {
            const option = document.createElement('option');
            option.value = score;
            option.textContent = score;
            transactionAmountInput.appendChild(option);
        });
    };

    const updateHistoryList = () => {
        historyList.innerHTML = '';
        const allHistory = people.flatMap(p => p.history.map(h => ({ ...h, personName: p.name }))).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (allHistory.length === 0) {
            historyList.innerHTML = `
                <li class="text-center text-gray-700 py-4">
                    <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p class="mt-2 font-semibold">Belum ada riwayat</p>
                </li>`;
            return;
        }

        allHistory.slice(0, 10).forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = 'flex justify-between items-start py-2 border-b last:border-b-0';
            const isDeposit = item.type === 'deposit';
            const amountClass = isDeposit ? 'text-emerald-600' : 'text-rose-600';
            const sign = isDeposit ? '+' : '-';
            const icon = isDeposit 
                ? `<svg class="w-5 h-5 mr-1 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg>`
                : `<svg class="w-5 h-5 mr-1 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m0 0l-7-7m7 7l7-7" /></svg>`;

            listItem.innerHTML = `
                <div class="flex flex-col"><span class="font-semibold">${item.personName}: <span class="font-normal">${item.description || 'Tanpa deskripsi'}</span></span><span class="text-sm text-gray-700">${new Date(item.date).toLocaleString('id-ID')}</span></div>
                <div class="flex items-center font-semibold ${amountClass}">${icon}<span>${sign}${item.amount}</span></div>`;
            historyList.appendChild(listItem);
            animateListItem(listItem);
        });
    };

    const updateChart = () => {
        const labels = people.map(p => p.name);
        const data = people.map(p => p.balance);

        const backgroundColors = data.map(balance => balance >= 0 ? 'rgba(52, 211, 153, 0.6)' : 'rgba(251, 113, 133, 0.6)'); // Emerald-400 & Rose-400
        const borderColors = data.map(balance => balance >= 0 ? 'rgba(52, 211, 153, 1)' : 'rgba(251, 113, 133, 1)'); // Emerald-400 & Rose-400

        if (emotionChart) {
            emotionChart.destroy();
        }

        emotionChart = new Chart(emotionChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Saldo Emosi',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    };

    const showWarning = (message, type = 'warning') => {
        withdrawalWarning.textContent = message;
        withdrawalWarning.classList.remove('bg-yellow-100', 'text-yellow-800', 'bg-red-100', 'text-red-800');
        if (type === 'error') {
            withdrawalWarning.classList.add('bg-red-100', 'text-red-800');
        } else {
            withdrawalWarning.classList.add('bg-yellow-100', 'text-yellow-800');
        }
        withdrawalWarning.style.display = 'block';
    };

    const hideWarning = () => {
        withdrawalWarning.style.display = 'none';
    };
    
    const saveAndRender = () => {
        saveToLocalStorage();
        renderUI();
    };

    // === EVENT LISTENERS ===
    openPersonModalBtn.addEventListener('click', () => openModal(personModal));
    openTransactionModalBtn.addEventListener('click', () => openModal(transactionModal));

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-backdrop');
            closeModal(modal);
        });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeModal(backdrop);
            }
        });
    });

    addPersonForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = personNameInput.value.trim();
        addPerson(name);
        personNameInput.value = '';
    });

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const personId = personSelect.value;
        const type = transactionTypeInput.value;
        const amount = transactionAmountInput.value;
        const description = transactionDescriptionInput.value.trim();

        if (!personId || !amount) {
            alert('Pastikan relasi dan skor sudah terisi.');
            return;
        }

        const success = addTransaction(personId, type, amount, description);
        if (success) {
            transactionForm.reset();
            personSelect.value = personId; // Pertahankan pilihan relasi
            closeModal(transactionModal);
        }
    });

    // === INISIALISASI ===
    const init = () => {
        loadFromLocalStorage();
        populateScoreOptions();
        renderUI();
    };

    init();
});