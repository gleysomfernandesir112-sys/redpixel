/**
 * REDPIXEL NETWORK - APP CORE JAVASCRIPT
 * Features:
 * 1. Live server status polling (/api/status)
 * 2. 1-Click IP copying with toast feedback
 * 3. 100% Real BedWars Leaderboard fetching (/api/leaderboard)
 * 4. Interactive Store Checkout with direct Nubank PIX generation (/api/store/create-order)
 * 5. Real-time Order Approval Polling (/api/store/order-status)
 */

document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 1. MOBILE MENU TOGGLE
    // ========================================================
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // ========================================================
    // 2. TOAST NOTIFICATION UTILITY
    // ========================================================
    const toast = document.getElementById('toastNotification');
    const toastTitle = document.getElementById('toastTitle');
    const toastDesc = document.getElementById('toastDesc');
    let toastTimeout;

    function showToast(title, desc) {
        if (!toast) return;
        if (toastTitle) toastTitle.innerText = title;
        if (toastDesc) toastDesc.innerText = desc;

        toast.classList.add('active');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('active');
        }, 3200);
    }

    // ========================================================
    // 3. IP COPY FUNCTIONALITY
    // ========================================================
    const ipCard = document.getElementById('ipCard');
    const btnCopyIp = document.getElementById('btnCopyIp');
    const serverIpElem = document.getElementById('serverIp');
    const copyText = document.getElementById('copyText');
    const copyIcon = document.getElementById('copyIcon');
    const serverIp = serverIpElem ? serverIpElem.innerText.trim() : 'redpixel.cfd';

    function copyToClipboard() {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(serverIp).then(onCopySuccess).catch(fallbackCopy);
        } else {
            fallbackCopy();
        }
    }

    function fallbackCopy() {
        const temp = document.createElement('textarea');
        temp.value = serverIp;
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand('copy');
            onCopySuccess();
        } catch (e) {
            console.error('Falha ao copiar:', e);
        }
        document.body.removeChild(temp);
    }

    function onCopySuccess() {
        if (copyText) copyText.innerText = 'IP COPIADO!';
        if (copyIcon) copyIcon.className = 'fa-solid fa-check';
        if (btnCopyIp) btnCopyIp.classList.add('copied');

        showToast('IP Copiado com Sucesso!', `${serverIp} foi copiado para sua área de transferência.`);

        setTimeout(() => {
            if (copyText) copyText.innerText = 'CLIQUE PARA COPIAR';
            if (copyIcon) copyIcon.className = 'fa-regular fa-copy';
            if (btnCopyIp) btnCopyIp.classList.remove('copied');
        }, 2500);
    }

    if (btnCopyIp) {
        btnCopyIp.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard();
        });
    }

    if (ipCard) {
        ipCard.addEventListener('click', copyToClipboard);
    }

    const btnPlayHeader = document.getElementById('btnPlayHeader');
    if (btnPlayHeader && btnPlayHeader.tagName.toLowerCase() === 'button') {
        btnPlayHeader.addEventListener('click', () => {
            copyToClipboard();
            const hero = document.getElementById('inicio');
            if (hero) hero.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ========================================================
    // 4. LIVE SERVER STATUS POLLER (/api/status)
    // ========================================================
    const playerCountElem = document.getElementById('playerCount');
    const statusDot = document.getElementById('statusDot');
    const statusLabel = document.getElementById('statusLabel');

    async function updateServerStatus() {
        if (!playerCountElem && !statusDot) return;
        try {
            let data = null;
            try {
                const res = await fetch('/api/status');
                if (res.ok) data = await res.json();
            } catch(e) {}

            if (!data) {
                const res2 = await fetch('https://api.mcstatus.io/v2/status/java/redpixel.cfd');
                if (res2.ok) {
                    const d2 = await res2.json();
                    data = {
                        onlinePlayers: d2.players ? d2.players.online : 0,
                        status: d2.online ? 'online' : 'offline'
                    };
                }
            }

            if (data && data.status !== 'offline') {
                const count = data.onlinePlayers !== undefined ? data.onlinePlayers : 0;
                const formattedCount = count.toLocaleString('pt-BR');

                if (playerCountElem) playerCountElem.innerText = formattedCount;
                if (statusDot) statusDot.classList.remove('offline');
                if (statusLabel) {
                    statusLabel.innerText = count === 1 ? 'jogador conectado no servidor' : 'jogadores conectados no servidor';
                }
            } else {
                setServerOffline();
            }
        } catch (err) {
            setServerOffline();
        }
    }

    function setServerOffline() {
        if (playerCountElem) playerCountElem.innerText = '0';
        if (statusDot) statusDot.classList.add('offline');
        if (statusLabel) statusLabel.innerText = 'servidor offline ou reiniciando';
    }

    if (playerCountElem || statusDot) {
        updateServerStatus();
        setInterval(updateServerStatus, 7000);
    }


    // ========================================================
    // 6. INTERACTIVE STORE CHECKOUT & DIRECT PIX MODAL
    // ========================================================
    const modal = document.getElementById('checkoutModal');
    const modalClose = document.getElementById('modalClose');
    const stage1 = document.getElementById('checkoutStage1');
    const stage2 = document.getElementById('checkoutStage2');
    const inputNick = document.getElementById('inputNick');
    const avatarPreview = document.getElementById('avatarPreview');
    const selectGroup = document.getElementById('selectGroup');
    const summaryGroupName = document.getElementById('summaryGroupName');
    const summaryTotal = document.getElementById('summaryTotal');
    const btnGeneratePix = document.getElementById('btnGeneratePix');
    const checkoutError = document.getElementById('checkoutError');

    // Stage 2 elements
    const pixOrderId = document.getElementById('pixOrderId');
    const pixOrderStatus = document.getElementById('pixOrderStatus');
    const pixQrImg = document.getElementById('pixQrImg');
    const pixValue = document.getElementById('pixValue');
    const pixPayloadText = document.getElementById('pixPayloadText');
    const btnCopyPix = document.getElementById('btnCopyPix');
    const btnCopyPixText = document.getElementById('btnCopyPixText');
    const btnCopyPixIcon = document.getElementById('btnCopyPixIcon');
    const noticeOrderId = document.getElementById('noticeOrderId');
    const pollingIndicator = document.getElementById('pollingIndicator');
    const paymentSuccessBanner = document.getElementById('paymentSuccessBanner');

    // Autocomplete & Link Elements
    const autocompleteDropdown = document.getElementById('autocompleteDropdown');
    const linkStatusNotice = document.getElementById('linkStatusNotice');
    const ticketActionBox = document.getElementById('ticketActionBox');
    const btnDiscordTicket = document.getElementById('btnDiscordTicket');

    const groupPrices = {
        vip: { name: 'VIP', price: '12,00', formatted: 'R$ 12,00' },
        red: { name: 'RED', price: '30,00', formatted: 'R$ 30,00' },
        beta: { name: 'BETA (Temporária)', price: '50,00', formatted: 'R$ 50,00' }
    };

    let activeOrderId = null;
    let orderPollInterval = null;
    let isNickLinked = false;

    function openCheckoutModal(groupKey) {
        if (!modal) return;
        const key = (groupKey || 'red').toLowerCase();
        if (selectGroup) selectGroup.value = key;
        updateSummary();

        // Reset stages
        if (stage1) stage1.style.display = 'block';
        if (stage2) stage2.style.display = 'none';
        if (checkoutError) checkoutError.style.display = 'none';
        if (paymentSuccessBanner) paymentSuccessBanner.style.display = 'none';
        if (pollingIndicator) pollingIndicator.style.display = 'flex';
        if (autocompleteDropdown) autocompleteDropdown.style.display = 'none';
        if (ticketActionBox) ticketActionBox.style.display = 'none';

        clearInterval(orderPollInterval);
        activeOrderId = null;

        modal.classList.add('active');
        if (inputNick) {
            setTimeout(() => inputNick.focus(), 150);
            if (inputNick.value.trim().length >= 3) {
                checkPlayerLinkStatus(inputNick.value.trim());
            }
        }
    }

    function closeCheckoutModal() {
        if (!modal) return;
        modal.classList.remove('active');
        clearInterval(orderPollInterval);
        activeOrderId = null;
        if (autocompleteDropdown) autocompleteDropdown.style.display = 'none';
    }

    function updateSummary() {
        if (!selectGroup) return;
        const key = selectGroup.value.toLowerCase();
        const info = groupPrices[key] || groupPrices.vip;

        if (summaryGroupName) summaryGroupName.innerText = 'VIP ' + info.name;
        if (summaryTotal) summaryTotal.innerText = info.formatted;
    }

    // Bind buy buttons on package cards
    document.querySelectorAll('.btn-buy-package, .btn-mush-buy').forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.getAttribute('data-group');
            openCheckoutModal(group);
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', closeCheckoutModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeCheckoutModal();
        });
    }

    if (selectGroup) {
        selectGroup.addEventListener('change', updateSummary);
    }

    // ========================================================
    // AUTOCOMPLETE & DISCORD LINK VERIFICATION
    // ========================================================
    let nickDebounce;

    if (inputNick) {
        inputNick.addEventListener('input', () => {
            clearTimeout(nickDebounce);
            const val = inputNick.value.trim();

            if (val.length < 2) {
                if (autocompleteDropdown) autocompleteDropdown.style.display = 'none';
                if (linkStatusNotice) linkStatusNotice.style.display = 'none';
                if (avatarPreview) avatarPreview.src = 'https://mc-heads.net/avatar/Steve/36';
                setBtnGenerateState(false);
                return;
            }

            if (avatarPreview) {
                avatarPreview.src = `https://mc-heads.net/avatar/${encodeURIComponent(val)}/36`;
            }

            nickDebounce = setTimeout(() => {
                fetchAutocompleteSuggestions(val);
                checkPlayerLinkStatus(val);
            }, 250);
        });

        inputNick.addEventListener('focus', () => {
            const val = inputNick.value.trim();
            if (val.length >= 2) {
                fetchAutocompleteSuggestions(val);
            }
        });

        // Fechar autocomplete ao clicar fora
        document.addEventListener('click', (e) => {
            if (autocompleteDropdown && !inputNick.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
                autocompleteDropdown.style.display = 'none';
            }
        });
    }

    async function fetchAutocompleteSuggestions(query) {
        if (!autocompleteDropdown) return;
        try {
            const res = await fetch(`/api/players?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                renderAutocomplete(data.players || []);
            }
        } catch (e) {
            autocompleteDropdown.style.display = 'none';
        }
    }

    function renderAutocomplete(players) {
        if (!autocompleteDropdown) return;
        if (!players || players.length === 0) {
            autocompleteDropdown.style.display = 'none';
            return;
        }

        autocompleteDropdown.innerHTML = players.map(p => `
            <div class="autocomplete-item" data-nick="${p.name}">
                <img src="https://mc-heads.net/avatar/${encodeURIComponent(p.name)}/26" alt="${p.name}" class="ac-avatar">
                <div class="ac-info">
                    <span class="ac-name">${p.name}</span>
                    <span class="ac-tags">
                        ${p.online ? '<span class="ac-online-tag"><i class="fa-solid fa-circle"></i> Online</span>' : ''}
                        ${p.linked ? '<span class="ac-linked-tag"><i class="fa-brands fa-discord"></i> Vinculado</span>' : '<span class="ac-unlinked-tag">Não Vinculado</span>'}
                    </span>
                </div>
            </div>
        `).join('');

        autocompleteDropdown.style.display = 'block';

        autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const chosenNick = item.getAttribute('data-nick');
                inputNick.value = chosenNick;
                autocompleteDropdown.style.display = 'none';
                if (avatarPreview) {
                    avatarPreview.src = `https://mc-heads.net/avatar/${encodeURIComponent(chosenNick)}/36`;
                }
                checkPlayerLinkStatus(chosenNick);
            });
        });
    }

    async function checkPlayerLinkStatus(nick) {
        if (!linkStatusNotice || !nick || nick.length < 3) return;

        try {
            const res = await fetch(`/api/players/check?nick=${encodeURIComponent(nick)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.linked) {
                    isNickLinked = true;
                    linkStatusNotice.className = 'link-status-notice linked';
                    linkStatusNotice.innerHTML = `
                        <i class="fa-solid fa-circle-check"></i>
                        <div>
                            <strong>Discord Vinculado com Sucesso!</strong>
                            <span>Conta conectada: @${data.discordUsername || 'Discord Sincronizado'}</span>
                        </div>
                    `;
                    linkStatusNotice.style.display = 'flex';
                    setBtnGenerateState(true);
                    if (checkoutError) checkoutError.style.display = 'none';
                } else {
                    isNickLinked = false;
                    linkStatusNotice.className = 'link-status-notice unlinked';
                    linkStatusNotice.innerHTML = `
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <div>
                            <strong>Conta NÃO vinculada ao Discord!</strong>
                            <span>Entre no servidor (<code>${serverIp}</code>) e digite <strong>/vincular</strong> para sincronizar antes de comprar.</span>
                        </div>
                    `;
                    linkStatusNotice.style.display = 'flex';
                    setBtnGenerateState(false);
                }
            }
        } catch (e) {
            console.error('Erro ao verificar link do jogador:', e);
        }
    }

    function setBtnGenerateState(enabled) {
        if (!btnGeneratePix) return;
        btnGeneratePix.disabled = !enabled;
        if (enabled) {
            btnGeneratePix.style.opacity = '1';
            btnGeneratePix.style.cursor = 'pointer';
        } else {
            btnGeneratePix.style.opacity = '0.45';
            btnGeneratePix.style.cursor = 'not-allowed';
        }
    }

    // Generate PIX Submission
    if (btnGeneratePix) {
        btnGeneratePix.addEventListener('click', async () => {
            const nick = inputNick ? inputNick.value.trim() : '';
            const group = selectGroup ? selectGroup.value.toLowerCase() : 'vip';

            if (!nick || nick.length < 3 || nick.length > 16 || !/^[a-zA-Z0-9_]+$/.test(nick)) {
                showCheckoutError('Informe um nickname válido do Minecraft (3 a 16 caracteres alfanuméricos).');
                return;
            }

            if (!isNickLinked) {
                showCheckoutError('Você precisa vincular sua conta do Minecraft com nosso Discord antes de prosseguir! Entre no servidor e digite /vincular.');
                return;
            }

            if (checkoutError) checkoutError.style.display = 'none';
            btnGeneratePix.disabled = true;
            btnGeneratePix.innerHTML = '<div class="spinner"></div><span>Gerando PIX no Mercado Pago...</span>';

            try {
                const response = await fetch('/api/store/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ player: nick, group: group })
                });

                const data = await response.json();

                if (response.ok && data.success && data.order) {
                    displayPixOrder(data.order);
                } else {
                    showCheckoutError(data.message || data.error || 'Erro ao gerar o pedido. Tente novamente.');
                }
            } catch (err) {
                showCheckoutError('Não foi possível conectar com o servidor da loja. Verifique se o servidor está online.');
            } finally {
                setBtnGenerateState(isNickLinked);
                btnGeneratePix.innerHTML = '<i class="fa-brands fa-pix"></i><span>GERAR PIX NO MERCADO PAGO</span>';
            }
        });
    }

    function showCheckoutError(msg) {
        if (!checkoutError) return;
        checkoutError.innerText = msg;
        checkoutError.style.display = 'block';
    }

    function displayPixOrder(order) {
        activeOrderId = order.id;

        if (stage1) stage1.style.display = 'none';
        if (stage2) stage2.style.display = 'block';

        if (pixOrderId) pixOrderId.innerText = '#' + order.id;
        if (noticeOrderId) noticeOrderId.innerText = '#' + order.id;
        if (pixValue) pixValue.innerText = 'R$ ' + parseFloat(order.amount).toFixed(2).replace('.', ',');
        if (pixPayloadText) pixPayloadText.value = order.pixPayload;

        // Render QR Code: use base64 diretamente do Mercado Pago quando disponível!
        if (pixQrImg) {
            if (order.qrCodeBase64) {
                pixQrImg.src = `data:image/png;base64,${order.qrCodeBase64}`;
            } else if (order.pixPayload) {
                pixQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=2&data=${encodeURIComponent(order.pixPayload)}`;
            }
        }

        if (pixOrderStatus) {
            pixOrderStatus.innerHTML = '<span class="dot"></span> PENDENTE';
            pixOrderStatus.className = 'status-pending';
        }

        // Start polling for approval (Mercado Pago instant check)
        startOrderStatusPolling(order.id);
    }

    // PIX Payload Copy Button
    if (btnCopyPix && pixPayloadText) {
        btnCopyPix.addEventListener('click', () => {
            const payload = pixPayloadText.value;
            if (!payload) return;

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(payload).then(onPixCopied);
            } else {
                pixPayloadText.select();
                document.execCommand('copy');
                onPixCopied();
            }
        });
    }

    function onPixCopied() {
        if (btnCopyPixText) btnCopyPixText.innerText = 'Copiado!';
        if (btnCopyPixIcon) btnCopyPixIcon.className = 'fa-solid fa-check';
        showToast('Código PIX Copiado!', 'Cole no aplicativo do seu banco para pagar.');

        setTimeout(() => {
            if (btnCopyPixText) btnCopyPixText.innerText = 'Copiar';
            if (btnCopyPixIcon) btnCopyPixIcon.className = 'fa-regular fa-copy';
        }, 2500);
    }

    // Polling order status (a cada 3 segundos)
    function startOrderStatusPolling(orderId) {
        clearInterval(orderPollInterval);
        orderPollInterval = setInterval(async () => {
            if (!activeOrderId || activeOrderId !== orderId) {
                clearInterval(orderPollInterval);
                return;
            }

            try {
                const res = await fetch(`/api/store/order-status?id=${encodeURIComponent(orderId)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.status === 'APROVADO') {
                        onOrderApproved(data);
                    }
                }
            } catch (ignored) {}
        }, 3000);
    }

    function onOrderApproved(data) {
        clearInterval(orderPollInterval);

        if (pixOrderStatus) {
            pixOrderStatus.innerHTML = '<i class="fa-solid fa-check"></i> APROVADO!';
            pixOrderStatus.style.color = '#2ecc71';
        }

        if (pollingIndicator) pollingIndicator.style.display = 'none';
        if (paymentSuccessBanner) paymentSuccessBanner.style.display = 'block';
    }

    // ========================================================
    // 7. HALL DA FAMA & LEADERBOARDS (/api/hall & /api/leaderboard)
    // ========================================================
    const lbTableBody = document.getElementById('lbTableBody');
    const lbTabs = document.querySelectorAll('.lb-tab');
    const lbHeaderScore = document.getElementById('lbHeaderScore');
    let currentTab = 'hall';
    let hallData = null;
    let leaderboardData = null;
    let nextResetDate = null;

    if (lbTableBody) {
        initHallAndLeaderboards();
    }

    async function initHallAndLeaderboards() {
        lbTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabKey = tab.getAttribute('data-tab');
                if (tabKey === currentTab) return;
                lbTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTab = tabKey;
                renderCurrentLeaderboard();
            });
        });

        await Promise.all([loadHallData(), loadLeaderboardData()]);
        renderCurrentLeaderboard();

        setInterval(updateCountdownDisplay, 1000);
    }

    async function loadHallData() {
        try {
            const res = await fetch('/api/hall');
            if (res.ok) {
                hallData = await res.json();
                populateChampionCard(hallData);
            }
        } catch (e) {
            console.error('Erro ao carregar /api/hall:', e);
        }
    }

    async function loadLeaderboardData() {
        try {
            const res = await fetch('/api/leaderboard');
            if (res.ok) {
                leaderboardData = await res.json();
            }
        } catch (e) {
            console.error('Erro ao carregar /api/leaderboard:', e);
        }
    }

    function populateChampionCard(data) {
        if (!data || !data.success) return;

        const champ = data.current_champion;
        const champName = document.getElementById('champName');
        const champGroupBadge = document.getElementById('champGroupBadge');
        const champVkc = document.getElementById('champVkc');
        const champWins = document.getElementById('champWins');
        const champKills = document.getElementById('champKills');
        const champBeds = document.getElementById('champBeds');
        const champBodyImg = document.getElementById('champBodyImg');
        const champCountdown = document.getElementById('champCountdown');

        if (champ) {
            if (champName) champName.innerText = champ.name || 'q7_x';
            if (champGroupBadge) {
                champGroupBadge.innerText = (champ.groupDisplay || 'MASTER').toUpperCase();
                if (champ.groupColor) {
                    champGroupBadge.style.backgroundColor = champ.groupColor + '25';
                    champGroupBadge.style.color = champ.groupColor;
                    champGroupBadge.style.borderColor = champ.groupColor + '60';
                }
            }
            if (champVkc) champVkc.innerText = Number(champ.vkc || 0).toFixed(2);
            if (champWins) champWins.innerText = champ.wins || 0;
            if (champKills) champKills.innerText = champ.kills || 0;
            if (champBeds) champBeds.innerText = champ.beds || 0;
            if (champBodyImg && champ.name) {
                champBodyImg.src = `https://mc-heads.net/body/${encodeURIComponent(champ.name)}/320`;
                champBodyImg.alt = `Skin 3D de ${champ.name}`;
            }
        }

        if (data.next_reset) {
            nextResetDate = new Date(data.next_reset);
            updateCountdownDisplay();
        } else if (champCountdown && data.next_reset_formatted) {
            champCountdown.innerText = data.next_reset_formatted;
        }
    }

    function updateCountdownDisplay() {
        const champCountdown = document.getElementById('champCountdown');
        if (!champCountdown || !nextResetDate) return;

        const now = new Date();
        const diff = nextResetDate - now;

        if (diff <= 0) {
            champCountdown.innerText = 'Reset iminente ou em andamento!';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        const pad = (n) => String(n).padStart(2, '0');
        if (days > 0) {
            champCountdown.innerText = `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
        } else {
            champCountdown.innerText = `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
        }
    }

    function renderCurrentLeaderboard() {
        if (!lbTableBody) return;

        if (currentTab === 'hall') {
            if (lbHeaderScore) lbHeaderScore.innerText = 'PONTUAÇÃO';
            renderHallTable();
        } else if (currentTab === 'vitorias') {
            if (lbHeaderScore) lbHeaderScore.innerText = 'VITÓRIAS REAIS';
            renderGlobalTable('vitorias');
        } else if (currentTab === 'kills') {
            if (lbHeaderScore) lbHeaderScore.innerText = 'FINAL KILLS';
            renderGlobalTable('kills');
        } else if (currentTab === 'camas') {
            if (lbHeaderScore) lbHeaderScore.innerText = 'CAMAS DESTRUÍDAS';
            renderGlobalTable('camas');
        }
    }

    function renderHallTable() {
        if (!hallData || !hallData.weekly_ranking || hallData.weekly_ranking.length === 0) {
            lbTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="lb-empty">
                        <i class="fa-solid fa-trophy"></i>
                        <span>Nenhum jogador pontuou ainda nesta semana. Participe do BedWars para pontuar!</span>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        hallData.weekly_ranking.forEach((player, idx) => {
            const pos = idx + 1;
            const medal = getPosMedal(pos);
            const badgeColor = player.groupColor || '#747d8c';
            const vkcStr = Number(player.vkc || 0).toFixed(2);

            html += `
                <tr class="lb-row ${pos <= 3 ? 'top-rank-row' : ''}">
                    <td class="col-pos">${medal}</td>
                    <td class="col-player">
                        <div class="player-cell">
                            <img src="${player.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/36`}" alt="${player.name}" class="player-avatar" onerror="this.src='img/favicon.png'">
                            <span class="player-name">${escapeHtml(player.name)}</span>
                        </div>
                    </td>
                    <td class="col-group">
                        <span class="rank-tag" style="background: ${badgeColor}25; color: ${badgeColor}; border: 1px solid ${badgeColor}60;">
                            ${escapeHtml(player.groupDisplay || 'MEMBRO')}
                        </span>
                    </td>
                    <td class="col-score text-right">
                        <div class="score-vkc-box">
                            <strong class="vkc-main">${vkcStr}</strong>
                            <span class="vkc-sub">(${player.wins}V / ${player.kills}K / ${player.beds}C)</span>
                        </div>
                    </td>
                </tr>
            `;
        });
        lbTableBody.innerHTML = html;
    }

    function renderGlobalTable(type) {
        if (!leaderboardData || !leaderboardData[type] || leaderboardData[type].length === 0) {
            lbTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="lb-empty">
                        <i class="fa-solid fa-gamepad"></i>
                        <span>Nenhuma pontuação registrada ainda nesta categoria.</span>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        leaderboardData[type].forEach((player, idx) => {
            const pos = idx + 1;
            const medal = getPosMedal(pos);
            const groupName = player.groupDisplay || 'MEMBRO';
            const badgeColor = getGroupBadgeColor(player.group);

            html += `
                <tr class="lb-row ${pos <= 3 ? 'top-rank-row' : ''}">
                    <td class="col-pos">${medal}</td>
                    <td class="col-player">
                        <div class="player-cell">
                            <img src="https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/36" alt="${player.name}" class="player-avatar" onerror="this.src='img/favicon.png'">
                            <span class="player-name">${escapeHtml(player.name)}</span>
                        </div>
                    </td>
                    <td class="col-group">
                        <span class="rank-tag" style="background: ${badgeColor}25; color: ${badgeColor}; border: 1px solid ${badgeColor}60;">
                            ${escapeHtml(groupName)}
                        </span>
                    </td>
                    <td class="col-score text-right">
                        <span class="score-global-bold">${player.value.toLocaleString('pt-BR')}</span>
                        <span class="score-global-label">${escapeHtml(player.scoreLabel || '')}</span>
                    </td>
                </tr>
            `;
        });
        lbTableBody.innerHTML = html;
    }

    function getPosMedal(pos) {
        if (pos === 1) return '<span class="pos-badge pos-1"><i class="fa-solid fa-medal"></i> #1</span>';
        if (pos === 2) return '<span class="pos-badge pos-2"><i class="fa-solid fa-medal"></i> #2</span>';
        if (pos === 3) return '<span class="pos-badge pos-3"><i class="fa-solid fa-medal"></i> #3</span>';
        return `<span class="pos-badge pos-regular">#${pos}</span>`;
    }

    function getGroupBadgeColor(group) {
        if (!group) return '#747d8c';
        switch (group.toLowerCase()) {
            case 'master': return '#ff2a42';
            case 'admin': return '#e74c3c';
            case 'gerente': return '#e67e22';
            case 'mod': return '#2ecc71';
            case 'ajudante': return '#f1c40f';
            case 'mvp_plus': return '#00cec9';
            case 'mvp': return '#0984e3';
            case 'vip_plus': return '#27ae60';
            case 'vip': return '#2ecc71';
            default: return '#747d8c';
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

});

