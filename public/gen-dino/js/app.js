/*
 * GEN DINO mobile shell
 * This layer keeps the original runner intact and adds a local, virtual-coin
 * arcade experience around it. No payments or real-money wagering are used.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'gen-dino-mobile-profile-v1';
    var IS_EMBEDDED = new URLSearchParams(window.location.search).get('embedded') === '1';
    var AUTH_TOKEN_KEY = 'pg_auth_token';
    var BASE_COIN_VALUE_CENTS = 100;
    var WITHDRAW_MIN_CENTS = 10000;
    var BET_MIN_CENTS = 100;
    var formatter = new Intl.NumberFormat('pt-BR');
    var currencyFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    var profileDateFormatter = new Intl.DateTimeFormat('pt-BR', {
        month: 'short',
        year: '2-digit'
    });
    var state = {
        authMode: 'login',
        currentScreen: 'auth',
        profile: null,
        runner: null,
        runCoins: 0,
        runWinnings: 0,
        cashoutSettled: false,
        betCents: 500,
        currentBetCents: 0,
        lastBetCents: 0,
        depositCents: 2500,
        withdrawCents: WITHDRAW_MIN_CENTS,
        currentScore: 0,
        lastRewardMilestone: 0,
        resultShown: false,
        gamePatched: false,
        trackCoins: [],
        trackLastFrame: 0,
        nextCoinSpawnAt: 0,
        pendingLeaveDestination: 'home',
        resumeAfterLeaveDialog: false,
        returnToPauseAfterLeaveDialog: false,
        betModalReturnToResult: false
        ,currentBetId: ''
        ,settling: false
    };

    var elements = {};

    function byId(id) {
        return document.getElementById(id);
    }

    function number(value) {
        var parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function format(value) {
        return formatter.format(Math.max(0, Math.round(number(value))));
    }

    function formatCash(cents) {
        return currencyFormatter.format(Math.max(0, Math.round(number(cents))) / 100);
    }

    function cashoutValue() {
        return state.runWinnings;
    }

    function notifyShell(event, payload) {
        if (!IS_EMBEDDED || window.parent === window) return;
        window.parent.postMessage(Object.assign({ source: 'gen-dino-shell', event: event }, payload || {}), window.location.origin);
    }

    async function platformApi(path, options) {
        var token = window.localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) throw new Error('Sessão expirada. Entre novamente no sistema.');
        var response = await window.fetch(path, Object.assign({}, options || {}, {
            headers: Object.assign({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }, (options && options.headers) || {})
        }));
        var data = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(data.error || 'Não foi possível sincronizar o jogo.');
        return data;
    }

    function hasActiveBet() {
        return state.currentScreen === 'game' && Boolean(state.currentBetCents) && !state.cashoutSettled && !state.resultShown;
    }

    function createProfile(name, email, password) {
        return {
            name: String(name || 'Explorador').trim().slice(0, 24) || 'Explorador',
            email: String(email || '').trim().toLowerCase(),
            password: String(password || ''),
            balance: 2500,
            cashBalance: 18460,
            totalCoins: 0,
            bestScore: 0,
            createdAt: Date.now()
        };
    }

    function normaliseProfile(profile) {
        if (!profile || typeof profile !== 'object') {
            return null;
        }

        var hasCashBalance = Object.prototype.hasOwnProperty.call(profile, 'cashBalance');
        return {
            name: String(profile.name || 'Explorador').trim().slice(0, 24) || 'Explorador',
            email: String(profile.email || '').trim().toLowerCase(),
            password: String(profile.password || ''),
            balance: Math.max(0, Math.round(number(profile.balance))),
            cashBalance: hasCashBalance ? Math.max(0, Math.round(number(profile.cashBalance))) : 18460,
            totalCoins: Math.max(0, Math.round(number(profile.totalCoins))),
            bestScore: Math.max(0, Math.round(number(profile.bestScore))),
            createdAt: number(profile.createdAt) || Date.now()
        };
    }

    function readProfile() {
        try {
            return normaliseProfile(JSON.parse(window.localStorage.getItem(STORAGE_KEY)));
        } catch (error) {
            return null;
        }
    }

    function saveProfile() {
        if (!state.profile) {
            return;
        }

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profile));
        } catch (error) {
            // The demo still works in memory if local storage is unavailable.
        }
    }

    function levelFor(profile) {
        return Math.max(1, Math.floor(number(profile && profile.totalCoins) / 25) + 1);
    }

    function profileInitials(name) {
        var pieces = String(name || 'Jogador').trim().split(/\s+/).filter(Boolean);
        var initials = pieces.slice(0, 2).map(function (piece) {
            return piece.charAt(0).toUpperCase();
        }).join('');
        return initials || 'JD';
    }

    function profileSince(timestamp) {
        try {
            return profileDateFormatter.format(new Date(number(timestamp) || Date.now())).replace(' de ', ' ');
        } catch (error) {
            return 'hoje';
        }
    }

    function setText(selector, value) {
        document.querySelectorAll(selector).forEach(function (node) {
            node.textContent = value;
        });
    }

    function renderAppIcons(scope) {
        if (window.GenDinoLucide && typeof window.GenDinoLucide.render === 'function') {
            window.GenDinoLucide.render(scope || document);
        }
    }

    function updateProfileUI() {
        var profile = state.profile || createProfile('Jogador');
        var level = levelFor(profile);
        setText('[data-balance]', formatCash(profile.cashBalance));
        setText('[data-user-name]', profile.name);
        setText('[data-level]', format(level));
        setText('[data-best-score]', format(profile.bestScore));
        setText('[data-total-coins]', format(profile.totalCoins));
        setText('[data-cash-balance]', formatCash(profile.cashBalance));
        setText('[data-bet-balance]', formatCash(profile.cashBalance));
        setText('[data-profile-name]', profile.name);
        setText('[data-profile-email]', profile.email || 'Conta local');
        setText('[data-profile-initials]', profileInitials(profile.name));
        setText('[data-profile-since]', profileSince(profile.createdAt));

        if (elements.profileNameInput && document.activeElement !== elements.profileNameInput) {
            elements.profileNameInput.value = profile.name;
        }
        if (elements.profileEmailInput && document.activeElement !== elements.profileEmailInput) {
            elements.profileEmailInput.value = profile.email;
        }
        document.querySelectorAll('.profile-level-progress i').forEach(function (segment, index) {
            segment.classList.toggle('is-filled', index < Math.min(5, ((level - 1) % 5) + 1));
        });

    }

    function updateRunUI() {
        setText('[data-current-score]', format(state.currentScore));
        setText('[data-run-coins]', format(state.runCoins));
        setText('[data-cashout-value]', formatCash(cashoutValue()));

        if (elements.cashoutButton) {
            elements.cashoutButton.setAttribute('aria-disabled', String(!state.currentBetCents));
        }
    }

    function updateBetUI() {
        setText('[data-bet-value]', formatCash(state.betCents));
        document.querySelectorAll('[data-bet-cents]').forEach(function (button) {
            button.classList.toggle(
                'is-selected',
                Math.round(number(button.getAttribute('data-bet-cents'))) === state.betCents
            );
        });

        if (elements.betAmountInput && document.activeElement !== elements.betAmountInput) {
            elements.betAmountInput.value = (state.betCents / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    }

    function setBetAmount(cents) {
        state.betCents = Math.max(BET_MIN_CENTS, Math.min(1000000, Math.round(number(cents))));
        updateBetUI();
    }

    function updateDepositUI() {
        var hasBonus = state.depositCents === 5000 || state.depositCents === 10000;
        var isGoldBonus = state.depositCents === 10000;
        var creditedCents = depositCreditCents();
        setText('[data-deposit-value]', formatCash(state.depositCents));
        document.querySelectorAll('[data-deposit-cents]').forEach(function (button) {
            button.classList.toggle(
                'is-selected',
                Math.round(number(button.getAttribute('data-deposit-cents'))) === state.depositCents
            );
        });

        if (elements.depositAmountInput && document.activeElement !== elements.depositAmountInput) {
            elements.depositAmountInput.value = (state.depositCents / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        if (elements.depositCard) {
            elements.depositCard.classList.toggle('has-bonus', hasBonus);
        }
        if (elements.depositBonusPreview) {
            elements.depositBonusPreview.hidden = !hasBonus;
            elements.depositBonusPreview.classList.toggle('is-gold-bonus', isGoldBonus);
        }
        if (elements.depositBonusChestImage) {
            elements.depositBonusChestImage.src = isGoldBonus
                ? 'images/bonus-chest-100.png'
                : 'images/bonus-chest.png';
            elements.depositBonusChestImage.alt = isGoldBonus
                ? 'Baú dourado de bônus de R$ 100'
                : 'Baú de bônus de R$ 50';
        }
        if (hasBonus) {
            setText('[data-deposit-bonus-value]', formatCash(creditedCents));
            setText(
                '[data-deposit-bonus-copy]',
                'Você deposita ' + formatCash(state.depositCents) + ' e entra com ' + formatCash(creditedCents) + '.'
            );
        }
    }

    function setDepositAmount(cents) {
        state.depositCents = Math.max(100, Math.min(1000000, Math.round(number(cents))));
        updateDepositUI();
    }

    function isBonusDeposit() {
        return state.depositCents === 5000 || state.depositCents === 10000;
    }

    function depositBonusMultiplier() {
        if (state.depositCents === 10000) {
            return 3;
        }
        if (state.depositCents === 5000) {
            return 2;
        }
        return 1;
    }

    function depositCreditCents() {
        return state.depositCents * depositBonusMultiplier();
    }

    function updateWalletUI() {
        setText('[data-withdraw-value]', formatCash(state.withdrawCents));
        document.querySelectorAll('[data-withdraw-cents]').forEach(function (button) {
            button.classList.toggle(
                'is-selected',
                Math.round(number(button.getAttribute('data-withdraw-cents'))) === state.withdrawCents
            );
        });

        if (elements.withdrawAmountInput && document.activeElement !== elements.withdrawAmountInput) {
            elements.withdrawAmountInput.value = (state.withdrawCents / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    }

    function setWithdrawAmount(cents) {
        state.withdrawCents = Math.max(0, Math.min(1000000, Math.round(number(cents))));
        updateWalletUI();
    }

    function setAuthMessage(message, isSuccess) {
        if (!elements.authMessage) {
            return;
        }

        elements.authMessage.textContent = message || '';
        elements.authMessage.classList.toggle('is-success', Boolean(isSuccess));
    }

    function showToast(message, useCoin) {
        if (!elements.appShell) {
            return;
        }

        var existing = elements.appShell.querySelector('.coin-toast');
        if (existing) {
            existing.remove();
        }

        var toast = document.createElement('div');
        toast.className = 'coin-toast';

        if (useCoin !== false) {
            var coin = document.createElement('img');
            coin.src = 'images/moeda.png';
            coin.alt = '';
            toast.appendChild(coin);
        }

        var label = document.createElement('span');
        label.textContent = message;
        toast.appendChild(label);
        elements.appShell.appendChild(toast);

        window.setTimeout(function () {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 900);
    }

    function hideOverlays() {
        if (elements.pauseOverlay) {
            elements.pauseOverlay.hidden = true;
        }
        if (elements.resultOverlay) {
            elements.resultOverlay.hidden = true;
        }
        if (elements.betOverlay) {
            elements.betOverlay.hidden = true;
        }
        if (elements.leaveGameOverlay) {
            elements.leaveGameOverlay.hidden = true;
        }
    }

    function setGameMessage(visible) {
        if (elements.gameMessage) {
            elements.gameMessage.classList.toggle('is-hidden', !visible);
        }
    }

    function showScreen(name) {
        var target = byId(name + '-screen');
        if (!target) {
            return;
        }

        document.querySelectorAll('.screen').forEach(function (screen) {
            screen.classList.toggle('is-active', screen === target);
        });
        state.currentScreen = name;
        document.querySelectorAll('[data-nav]').forEach(function (button) {
            button.classList.toggle('is-active', button.getAttribute('data-nav') === name);
        });

        if (name !== 'game') {
            document.body.classList.remove('arcade-mode');
        }
    }

    function clearRun() {
        state.runCoins = 0;
        state.runWinnings = 0;
        state.cashoutSettled = false;
        state.currentScore = 0;
        state.lastRewardMilestone = 0;
        state.resultShown = false;
        clearTrackCoins();
        updateRunUI();
    }

    function scoreForRunner(runner) {
        if (!runner || !runner.distanceMeter) {
            return state.currentScore;
        }

        return Math.max(0, Math.round(number(
            runner.distanceMeter.getActualDistance(Math.ceil(number(runner.distanceRan)))
        )));
    }

    function syncRunProgress(score) {
        state.currentScore = Math.max(state.currentScore, Math.round(number(score)));
        updateRunUI();
    }

    function clearTrackCoins() {
        state.trackCoins.forEach(function (coin) {
            if (coin.element && coin.element.parentNode) {
                coin.element.remove();
            }
        });
        state.trackCoins = [];
        state.trackLastFrame = 0;
        state.nextCoinSpawnAt = 0;
    }

    function coinValueCents() {
        return BASE_COIN_VALUE_CENTS;
    }

    function collectTrackCoin(coin) {
        if (!coin || coin.collected) {
            return;
        }

        coin.collected = true;
        if (coin.element) {
            coin.element.classList.add('is-collected');
        }

        if (!state.profile) {
            return;
        }

        var rewardCents = coinValueCents();
        state.runCoins += 1;
        state.runWinnings += rewardCents;
        state.profile.totalCoins += 1;
        saveProfile();
        updateProfileUI();
        updateRunUI();
        showToast('+' + formatCash(rewardCents), true);
    }

    function addTrackCoin(x) {
        if (!elements.coinTrack) {
            return;
        }

        var element = document.createElement('img');
        element.className = 'runner-track-coin';
        element.src = 'images/moeda.png';
        element.alt = '';
        element.style.setProperty('--coin-x', x + 'px');
        elements.coinTrack.appendChild(element);
        state.trackCoins.push({
            x: x,
            element: element,
            collected: false
        });
    }

    function spawnTrackCoins() {
        if (!elements.coinTrack) {
            return;
        }

        var width = elements.coinTrack.clientWidth || 360;
        var count = Math.random() > 0.45 ? 4 : 3;
        for (var index = 0; index < count; index += 1) {
            addTrackCoin(width + 30 + index * 50);
        }
    }

    function updateTrackCoins(runner) {
        if (!runner || !elements.coinTrack) {
            return;
        }

        var now = window.performance.now();
        if (!state.trackLastFrame) {
            state.trackLastFrame = now;
        }

        var delta = Math.min(45, Math.max(0, now - state.trackLastFrame));
        state.trackLastFrame = now;

        if (!state.nextCoinSpawnAt || now >= state.nextCoinSpawnAt) {
            spawnTrackCoins();
            state.nextCoinSpawnAt = now + 1300 + Math.random() * 700;
        }

        var speed = Math.max(4, number(runner.currentSpeed));
        var displacement = speed * (delta / (runner.msPerFrame || (1000 / 60)));
        var collectX = number(runner.tRex && runner.tRex.xPos) + 47;

        for (var index = state.trackCoins.length - 1; index >= 0; index -= 1) {
            var coin = state.trackCoins[index];
            coin.x -= displacement;
            if (coin.element) {
                coin.element.style.setProperty('--coin-x', coin.x + 'px');
            }

            if (!coin.collected && coin.x <= collectX) {
                collectTrackCoin(coin);
            }

            if (coin.x < -48 || coin.collected) {
                state.trackCoins.splice(index, 1);
                window.setTimeout(function (node) {
                    if (node && node.parentNode) {
                        node.remove();
                    }
                }.bind(null, coin.element), coin.collected ? 190 : 0);
            }
        }
    }

    async function finishRun(didCashout) {
        var runner = state.runner;
        var wasCashout = Boolean(didCashout);
        var bet = state.currentBetCents;
        var winnings = wasCashout ? cashoutValue() : 0;
        if (state.resultShown || state.settling || state.currentScreen !== 'game') {
            return;
        }

        state.resultShown = true;
        state.settling = true;
        syncRunProgress(scoreForRunner(runner));

        if (IS_EMBEDDED && state.currentBetId) {
            try {
                var settled = await platformApi('/api/game/gen-dino/settle', {
                    method: 'POST',
                    body: JSON.stringify({
                        betId: state.currentBetId,
                        outcome: wasCashout ? 'cashout' : 'loss',
                        coins: state.runCoins,
                        score: state.currentScore
                    })
                });
                winnings = Math.round(Number(settled.payout || 0) * 100);
                state.runCoins = Number(settled.coins || 0);
                if (state.profile) state.profile.cashBalance = Math.round(Number(settled.balance || 0) * 100);
                notifyShell('balance', { balance: Number(settled.balance || 0) });
            } catch (error) {
                state.resultShown = false;
                showToast(error.message || 'Não foi possível finalizar a corrida.', false);
                notifyShell('error', { message: error.message });
                state.settling = false;
                return;
            }
        }

        if (state.profile) {
            if (!IS_EMBEDDED && wasCashout && !state.cashoutSettled) {
                if (winnings > 0) {
                    state.profile.cashBalance += winnings;
                }
                state.cashoutSettled = true;
            }
            state.profile.bestScore = Math.max(state.profile.bestScore, state.currentScore);
            saveProfile();
            updateProfileUI();
        }

        state.lastBetCents = bet;
        state.currentBetCents = 0;
        state.currentBetId = '';
        state.settling = false;
        setText('[data-result-score]', format(state.currentScore));
        setText('[data-result-coins]', format(state.runCoins));
        setText('[data-result-bet]', formatCash(bet));
        setText('[data-result-cashout]', formatCash(winnings));
        setText('[data-result-kicker]', wasCashout ? 'CASHOUT CONFIRMADO' : 'APOSTA PERDIDA');
        setText('[data-result-title]', wasCashout ? (winnings > 0 ? 'Você ganhou!' : 'Corrida encerrada') : 'Sem Cashout desta vez');
        updateRunUI();
        setGameMessage(false);

        if (elements.pauseOverlay) {
            elements.pauseOverlay.hidden = true;
        }
        if (elements.resultOverlay) {
            elements.resultOverlay.hidden = false;
        }
    }

    function stopRunner() {
        if (state.runner && state.runner.playing) {
            state.runner.stop();
        }
    }

    function prepareRunnerForNewRun() {
        var runner = state.runner;
        if (!runner) {
            return;
        }

        stopRunner();
        if (runner.crashed || runner.distanceRan > 0 || runner.activated) {
            // restart() is part of the original game; stopping immediately puts
            // the clean track behind the "toque para saltar" prompt.
            runner.restart();
            runner.stop();
        }

        document.body.classList.remove('arcade-mode');
        window.requestAnimationFrame(function () {
            if (state.currentScreen === 'game' && runner.adjustDimensions) {
                runner.adjustDimensions();
            }
        });
    }

    function openBetModal() {
        if (!state.profile) {
            showScreen('auth');
            setAuthMessage('Entre ou crie uma conta local para jogar.');
            return;
        }

        if (hasActiveBet()) {
            showScreen('game');
            return;
        }

        state.betModalReturnToResult = Boolean(elements.resultOverlay && !elements.resultOverlay.hidden);
        if (elements.pauseOverlay) {
            elements.pauseOverlay.hidden = true;
        }
        if (elements.resultOverlay) {
            elements.resultOverlay.hidden = true;
        }
        updateProfileUI();
        updateBetUI();
        if (elements.betOverlay) {
            elements.betOverlay.hidden = false;
        }
    }

    function closeBetModal() {
        if (elements.betOverlay) {
            elements.betOverlay.hidden = true;
        }
        if (state.betModalReturnToResult && elements.resultOverlay) {
            elements.resultOverlay.hidden = false;
        }
        state.betModalReturnToResult = false;
    }

    async function startGameWithBet() {
        if (!state.profile) {
            showScreen('auth');
            return;
        }
        if (state.betCents < BET_MIN_CENTS) {
            showToast('A aposta mínima é ' + formatCash(BET_MIN_CENTS) + '.', false);
            return;
        }
        if (state.betCents > state.profile.cashBalance) {
            showToast('Saldo insuficiente para essa aposta.', false);
            return;
        }

        if (state.settling) return;
        if (IS_EMBEDDED) {
            state.settling = true;
            try {
                var started = await platformApi('/api/game/gen-dino/start', {
                    method: 'POST',
                    body: JSON.stringify({
                        betAmount: state.betCents / 100,
                        sessionId: 'dino_' + Date.now().toString(36),
                        deviceId: window.navigator.userAgent.slice(0, 72)
                    })
                });
                state.currentBetId = started.betId;
                state.profile.cashBalance = Math.round(Number(started.balance || 0) * 100);
                notifyShell('balance', { balance: Number(started.balance || 0) });
            } catch (error) {
                showToast(error.message || 'Não foi possível iniciar a corrida.', false);
                notifyShell('error', { message: error.message });
                return;
            } finally {
                state.settling = false;
            }
        } else {
            state.profile.cashBalance -= state.betCents;
        }
        state.currentBetCents = state.betCents;
        state.lastBetCents = state.betCents;
        saveProfile();
        updateProfileUI();
        clearRun();
        hideOverlays();
        state.betModalReturnToResult = false;
        showScreen('game');
        setGameMessage(true);
        prepareRunnerForNewRun();
        showToast('Aposta confirmada: ' + formatCash(state.currentBetCents), false);
    }

    function openDeposit() {
        if (IS_EMBEDDED) {
            notifyShell('deposit');
            return;
        }
        if (!state.profile) {
            showScreen('auth');
            setAuthMessage('Entre ou crie uma conta local para acessar o depósito.');
            return;
        }
        if (hasActiveBet()) {
            requestLeaveGame('deposit');
            return;
        }
        if (state.currentScreen === 'game') {
            navigateAwayFromGame('deposit');
            return;
        }

        stopRunner();
        hideOverlays();
        showScreen('deposit');
        updateProfileUI();
        updateDepositUI();
    }

    function openWallet() {
        if (!state.profile) {
            showScreen('auth');
            setAuthMessage('Entre ou crie uma conta local para abrir a carteira.');
            return;
        }
        if (hasActiveBet()) {
            requestLeaveGame('wallet');
            return;
        }
        if (state.currentScreen === 'game') {
            navigateAwayFromGame('wallet');
            return;
        }

        stopRunner();
        hideOverlays();
        showScreen('wallet');
        updateProfileUI();
        updateWalletUI();
    }

    function setProfileFormMessage(message, success) {
        if (!elements.profileFormMessage) {
            return;
        }
        elements.profileFormMessage.textContent = message || '';
        elements.profileFormMessage.classList.toggle('is-success', Boolean(success));
    }

    function openProfile() {
        if (!state.profile) {
            showScreen('auth');
            setAuthMessage('Entre ou crie uma conta local para acessar o perfil.');
            return;
        }
        if (hasActiveBet()) {
            requestLeaveGame('profile');
            return;
        }
        if (state.currentScreen === 'game') {
            navigateAwayFromGame('profile');
            return;
        }

        stopRunner();
        hideOverlays();
        showScreen('profile');
        updateProfileUI();
        setProfileFormMessage('', false);
    }

    function handleProfileForm(event) {
        event.preventDefault();

        if (!state.profile) {
            showScreen('auth');
            return;
        }

        var name = String((elements.profileNameInput || {}).value || '').trim();
        var email = String((elements.profileEmailInput || {}).value || '').trim().toLowerCase();
        var password = String((elements.profilePasswordInput || {}).value || '');

        if (name.length < 2) {
            setProfileFormMessage('Escolha um nome com pelo menos 2 caracteres.', false);
            if (elements.profileNameInput) {
                elements.profileNameInput.focus();
            }
            return;
        }
        if (email && !validEmail(email)) {
            setProfileFormMessage('Informe um e-mail válido ou deixe o campo vazio.', false);
            if (elements.profileEmailInput) {
                elements.profileEmailInput.focus();
            }
            return;
        }
        if (password && password.length < 4) {
            setProfileFormMessage('A nova senha precisa ter pelo menos 4 caracteres.', false);
            if (elements.profilePasswordInput) {
                elements.profilePasswordInput.focus();
            }
            return;
        }

        state.profile.name = name.slice(0, 24);
        state.profile.email = email;
        if (password) {
            state.profile.password = password;
        }
        saveProfile();
        updateProfileUI();
        if (elements.profilePasswordInput) {
            elements.profilePasswordInput.value = '';
        }
        setProfileFormMessage('Perfil atualizado com sucesso.', true);
        showToast('Alterações salvas.', true);
    }

    function logout() {
        if (!state.profile) {
            showScreen('auth');
            return;
        }

        if (!window.confirm('Deseja sair desta conta neste dispositivo?')) {
            return;
        }

        stopRunner();
        hideOverlays();
        clearRun();
        state.currentBetCents = 0;
        state.lastBetCents = 0;
        state.profile = null;
        if (elements.profileForm) {
            elements.profileForm.reset();
        }
        showScreen('auth');
        setAuthMode('login');
        setAuthMessage('Sessão encerrada. Entre novamente quando quiser.');
    }

    function continueDeposit() {
        if (!state.profile) {
            showScreen('auth');
            return;
        }

        var credit = depositCreditCents();
        state.profile.cashBalance += credit;
        saveProfile();
        updateProfileUI();
        openWallet();

        if (elements.walletWithdrawStatus) {
            elements.walletWithdrawStatus.hidden = false;
            elements.walletWithdrawStatus.textContent = isBonusDeposit()
                ? 'PIX demonstrativo confirmado: ' + formatCash(state.depositCents) + ' + bônus de ' + ((depositBonusMultiplier() - 1) * 100) + '%. Saldo liberado: ' + formatCash(credit) + '.'
                : 'PIX demonstrativo confirmado: ' + formatCash(credit) + ' liberado na carteira.';
        }
        showToast('Saldo adicionado: ' + formatCash(credit), true);
    }

    function focusWithdraw() {
        openWallet();
        if (elements.walletWithdrawCard) {
            window.setTimeout(function () {
                elements.walletWithdrawCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 40);
        }
    }

    function requestWithdrawal() {
        if (!state.profile) {
            showScreen('auth');
            return;
        }
        if (state.withdrawCents < WITHDRAW_MIN_CENTS) {
            showToast('O saque mínimo via PIX é ' + formatCash(WITHDRAW_MIN_CENTS) + '.', false);
            return;
        }
        if (state.withdrawCents > state.profile.cashBalance) {
            showToast('Saldo insuficiente para esse saque.', false);
            return;
        }

        state.profile.cashBalance -= state.withdrawCents;
        saveProfile();
        updateProfileUI();
        updateWalletUI();

        if (elements.walletWithdrawStatus) {
            elements.walletWithdrawStatus.hidden = false;
            elements.walletWithdrawStatus.textContent = 'Solicitação demonstrativa de ' + formatCash(state.withdrawCents) + ' criada. Conecte uma chave PIX para concluir o pagamento real.';
        }
        showToast('Saque solicitado: ' + formatCash(state.withdrawCents), true);
    }

    function navigateAwayFromGame(destination) {
        if (state.runner && state.runner.playing) {
            syncRunProgress(scoreForRunner(state.runner));
        }
        stopRunner();
        clearTrackCoins();
        hideOverlays();
        clearRun();
        setGameMessage(true);

        if (destination === 'deposit') {
            showScreen('deposit');
            updateProfileUI();
            updateDepositUI();
            return;
        }
        if (destination === 'wallet') {
            showScreen('wallet');
            updateProfileUI();
            updateWalletUI();
            return;
        }
        if (destination === 'profile') {
            showScreen('profile');
            updateProfileUI();
            setProfileFormMessage('', false);
            return;
        }

        showScreen('home');
        updateProfileUI();
    }

    function requestLeaveGame(destination) {
        if (!hasActiveBet()) {
            navigateAwayFromGame(destination || 'home');
            return;
        }

        var runner = state.runner;
        state.pendingLeaveDestination = destination || 'home';
        state.resumeAfterLeaveDialog = Boolean(runner && runner.playing && !runner.crashed);
        state.returnToPauseAfterLeaveDialog = Boolean(elements.pauseOverlay && !elements.pauseOverlay.hidden);
        if (state.resumeAfterLeaveDialog) {
            runner.stop();
        }
        if (elements.pauseOverlay) {
            elements.pauseOverlay.hidden = true;
        }
        setGameMessage(false);
        setText('[data-leave-bet]', formatCash(state.currentBetCents));
        if (elements.leaveGameOverlay) {
            elements.leaveGameOverlay.hidden = false;
        }
    }

    function cancelExitGame() {
        if (elements.leaveGameOverlay) {
            elements.leaveGameOverlay.hidden = true;
        }

        if (state.returnToPauseAfterLeaveDialog && elements.pauseOverlay) {
            elements.pauseOverlay.hidden = false;
        } else if (state.resumeAfterLeaveDialog && state.runner && !state.runner.crashed) {
            state.runner.play();
        }

        state.pendingLeaveDestination = 'home';
        state.resumeAfterLeaveDialog = false;
        state.returnToPauseAfterLeaveDialog = false;
        setGameMessage(false);
    }

    async function confirmExitGame() {
        var lostBet = state.currentBetCents;
        var destination = state.pendingLeaveDestination || 'home';
        if (IS_EMBEDDED && state.currentBetId && !state.settling) {
            state.settling = true;
            try {
                var settled = await platformApi('/api/game/gen-dino/settle', {
                    method: 'POST',
                    body: JSON.stringify({ betId: state.currentBetId, outcome: 'loss', coins: 0, score: state.currentScore })
                });
                if (state.profile) state.profile.cashBalance = Math.round(Number(settled.balance || 0) * 100);
                notifyShell('balance', { balance: Number(settled.balance || 0) });
            } catch (error) {
                showToast(error.message || 'Não foi possível encerrar a corrida.', false);
                state.settling = false;
                return;
            }
            state.settling = false;
        }
        state.lastBetCents = lostBet;
        state.currentBetCents = 0;
        state.currentBetId = '';
        state.pendingLeaveDestination = 'home';
        state.resumeAfterLeaveDialog = false;
        state.returnToPauseAfterLeaveDialog = false;
        navigateAwayFromGame(destination);
        showToast('Aposta encerrada: ' + formatCash(lostBet) + ' não foi recuperada.', false);
    }

    function returnHome() {
        if (hasActiveBet()) {
            requestLeaveGame('home');
            return;
        }
        navigateAwayFromGame('home');
    }

    function pauseGame() {
        var runner = state.runner;
        if (!runner || !runner.playing || runner.crashed) {
            showToast('Toque na pista para começar a corrida.', false);
            return;
        }

        runner.stop();
        setGameMessage(false);
        if (elements.pauseOverlay) {
            elements.pauseOverlay.hidden = false;
        }
    }

    function resumeGame() {
        var runner = state.runner;
        if (!runner || runner.crashed) {
            return;
        }

        if (elements.pauseOverlay) {
            elements.pauseOverlay.hidden = true;
        }
        setGameMessage(false);
        runner.play();
    }

    function retryGame() {
        openBetModal();
    }

    function cashoutGame() {
        var runner = state.runner;
        if (state.resultShown) {
            return;
        }
        if (!state.currentBetCents) {
            showToast('Defina uma aposta antes de iniciar a corrida.', false);
            return;
        }
        if (!runner || !runner.playing) {
            showToast('Toque na pista para começar a corrida.', false);
            return;
        }
        runner.stop();
        finishRun(true);
    }

    function setAuthMode(mode) {
        state.authMode = mode === 'register' ? 'register' : 'login';
        var isRegister = state.authMode === 'register';

        if (elements.authScreen) {
            elements.authScreen.classList.toggle('is-register', isRegister);
        }
        document.querySelectorAll('[data-auth-tab]').forEach(function (tab) {
            var active = tab.getAttribute('data-auth-tab') === state.authMode;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', String(active));
        });

        if (elements.authSubmit) {
            elements.authSubmit.innerHTML = isRegister
                ? 'Criar conta <span>→</span>'
                : 'Entrar na conta <span>→</span>';
        }
        if (elements.authPassword) {
            elements.authPassword.autocomplete = isRegister ? 'new-password' : 'current-password';
        }
        setAuthMessage('');
    }

    function validEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function handleAuth(event) {
        event.preventDefault();

        var email = String(elements.authEmail.value || '').trim().toLowerCase();
        var password = String(elements.authPassword.value || '');
        var saved = readProfile();

        if (!validEmail(email)) {
            setAuthMessage('Informe um e-mail válido.');
            elements.authEmail.focus();
            return;
        }
        if (password.length < 4) {
            setAuthMessage('A senha deve ter pelo menos 4 caracteres.');
            elements.authPassword.focus();
            return;
        }

        if (state.authMode === 'register') {
            var name = String(elements.authName.value || '').trim();
            if (name.length < 2) {
                setAuthMessage('Escolha um nome com pelo menos 2 caracteres.');
                elements.authName.focus();
                return;
            }
            if (saved && saved.email === email) {
                setAuthMessage('Essa conta já existe. Use a aba Entrar.');
                return;
            }

            state.profile = createProfile(name, email, password);
            saveProfile();
            updateProfileUI();
            elements.authForm.reset();
            showScreen('home');
            return;
        }

        if (!saved || !saved.email || saved.email !== email || saved.password !== password) {
            setAuthMessage('E-mail ou senha não encontrados neste navegador.');
            return;
        }

        state.profile = saved;
        updateProfileUI();
        elements.authForm.reset();
        showScreen('home');
    }

    function enterAsGuest() {
        state.profile = createProfile('Explorador', '', 'guest');
        saveProfile();
        updateProfileUI();
        elements.authForm.reset();
        showScreen('home');
    }

    function patchRunner(runner) {
        if (!runner || state.gamePatched) {
            return;
        }

        state.runner = runner;
        state.gamePatched = true;

        // The base project normally grows the game to the entire browser. The
        // mobile shell owns its dimensions, so arcade mode intentionally does
        // nothing here.
        runner.setArcadeMode = function () {};
        document.body.classList.remove('arcade-mode');

        var originalGameOver = runner.gameOver;
        runner.gameOver = function () {
            originalGameOver.call(runner);
            window.setTimeout(function () {
                if (state.currentScreen === 'game' && runner.crashed) {
                    finishRun();
                }
            }, 100);
        };
    }

    function locateRunner() {
        var runner = window.Runner && window.Runner.instance_;
        if (runner && runner.canvas && runner.distanceMeter && runner.tRex) {
            patchRunner(runner);
            return;
        }
        window.setTimeout(locateRunner, 80);
    }

    function monitorRun() {
        var runner = state.runner;
        if (state.currentScreen === 'game' && runner && runner.playing && !runner.crashed) {
            syncRunProgress(scoreForRunner(runner));
            updateTrackCoins(runner);
            setGameMessage(false);
        }
        window.requestAnimationFrame(monitorRun);
    }

    function blockRunnerOutsideTrack(event) {
        var target = event.target;
        var isInteractive = target && target.closest && target.closest('button, input, form, .bottom-nav, .game-header, .game-cashout-dock, .game-overlay');
        if (state.currentScreen !== 'game' || isInteractive) {
            event.stopImmediatePropagation();
        }
    }

    function bindActions() {
        document.querySelectorAll('[data-auth-tab]').forEach(function (tab) {
            tab.addEventListener('click', function () {
                setAuthMode(tab.getAttribute('data-auth-tab'));
            });
        });

        elements.authForm.addEventListener('submit', handleAuth);
        elements.guestButton.addEventListener('click', enterAsGuest);

        document.querySelectorAll('[data-action]').forEach(function (button) {
            button.addEventListener('click', function () {
                var action = button.getAttribute('data-action');
                if (action === 'play') {
                    openBetModal();
                } else if (action === 'bet-amount') {
                    setBetAmount(button.getAttribute('data-bet-cents'));
                } else if (action === 'confirm-bet') {
                    startGameWithBet();
                } else if (action === 'cancel-bet') {
                    closeBetModal();
                } else if (action === 'deposit') {
                    openDeposit();
                } else if (action === 'deposit-amount') {
                    setDepositAmount(button.getAttribute('data-deposit-cents'));
                } else if (action === 'deposit-continue') {
                    continueDeposit();
                } else if (action === 'withdraw-amount') {
                    setWithdrawAmount(button.getAttribute('data-withdraw-cents'));
                } else if (action === 'withdraw-continue') {
                    requestWithdrawal();
                } else if (action === 'focus-withdraw') {
                    focusWithdraw();
                } else if (action === 'back-home') {
                    returnHome();
                } else if (action === 'pause') {
                    pauseGame();
                } else if (action === 'resume') {
                    resumeGame();
                } else if (action === 'cancel-exit') {
                    cancelExitGame();
                } else if (action === 'confirm-exit') {
                    confirmExitGame();
                } else if (action === 'retry') {
                    retryGame();
                } else if (action === 'cashout') {
                    cashoutGame();
                } else if (action === 'wallet') {
                    openWallet();
                } else if (action === 'profile') {
                    openProfile();
                } else if (action === 'logout') {
                    logout();
                } else if (action === 'favorite') {
                    var selected = button.classList.toggle('is-favorite');
                    button.setAttribute('aria-pressed', String(selected));
                    showToast(selected ? 'GEN DINO salvo nos favoritos.' : 'Removido dos favoritos.', false);
                }
            });
        });

        document.querySelectorAll('[data-nav="home"]').forEach(function (button) {
            button.addEventListener('click', returnHome);
        });
        document.querySelectorAll('[data-nav="deposit"]').forEach(function (button) {
            button.addEventListener('click', openDeposit);
        });
        document.querySelectorAll('[data-nav="wallet"]').forEach(function (button) {
            button.addEventListener('click', openWallet);
        });
        document.querySelectorAll('[data-nav="profile"]').forEach(function (button) {
            button.addEventListener('click', openProfile);
        });

        if (elements.profileForm) {
            elements.profileForm.addEventListener('submit', handleProfileForm);
        }

        if (elements.depositAmountInput) {
            elements.depositAmountInput.addEventListener('change', function () {
                var typedAmount = Number(
                    elements.depositAmountInput.value.replace(/\./g, '').replace(',', '.')
                );
                if (!Number.isFinite(typedAmount) || typedAmount < 1) {
                    setDepositAmount(100);
                    showToast('O depósito mínimo demonstrativo é R$ 1,00.', false);
                    return;
                }
                setDepositAmount(typedAmount * 100);
            });
        }

        if (elements.withdrawAmountInput) {
            elements.withdrawAmountInput.addEventListener('change', function () {
                var typedAmount = Number(
                    elements.withdrawAmountInput.value.replace(/\./g, '').replace(',', '.')
                );
                if (!Number.isFinite(typedAmount) || typedAmount < 1) {
                    setWithdrawAmount(0);
                    showToast('Informe um valor válido para o saque.', false);
                    return;
                }
                setWithdrawAmount(typedAmount * 100);
            });
        }

        if (elements.betAmountInput) {
            elements.betAmountInput.addEventListener('change', function () {
                var typedAmount = Number(
                    elements.betAmountInput.value.replace(/\./g, '').replace(',', '.')
                );
                if (!Number.isFinite(typedAmount) || typedAmount < 1) {
                    setBetAmount(BET_MIN_CENTS);
                    showToast('A aposta mínima é ' + formatCash(BET_MIN_CENTS) + '.', false);
                    return;
                }
                setBetAmount(typedAmount * 100);
            });
        }

        // The original game listens on the document. Capturing these events
        // keeps a login tap or a wallet click from accidentally starting a run.
        document.addEventListener('touchstart', blockRunnerOutsideTrack, true);
        document.addEventListener('mousedown', blockRunnerOutsideTrack, true);
        document.addEventListener('mouseup', blockRunnerOutsideTrack, true);
        document.addEventListener('keydown', blockRunnerOutsideTrack, true);
    }

    async function initEmbeddedProfile() {
        if (!IS_EMBEDDED) return;
        try {
            var data = await platformApi('/api/game/gen-dino/state');
            state.profile = {
                name: String(data.user.name || 'Jogador'),
                email: String(data.user.email || ''),
                password: '',
                balance: 0,
                cashBalance: Math.round(Number(data.user.balance || 0) * 100),
                totalCoins: 0,
                bestScore: 0,
                createdAt: Date.now()
            };
            updateProfileUI();
            showScreen('home');
            notifyShell('balance', { balance: Number(data.user.balance || 0) });
        } catch (error) {
            setAuthMessage(error.message || 'Não foi possível conectar sua conta.');
            notifyShell('error', { message: error.message });
        }
    }

    function init() {
        elements = {
            appShell: byId('app-shell'),
            authScreen: byId('auth-screen'),
            authForm: byId('auth-form'),
            authName: byId('auth-name'),
            authEmail: byId('auth-email'),
            authPassword: byId('auth-password'),
            authMessage: byId('auth-message'),
            authSubmit: byId('auth-submit'),
            guestButton: byId('guest-button'),
            pauseOverlay: byId('pause-overlay'),
            resultOverlay: byId('result-overlay'),
            betOverlay: byId('bet-overlay'),
            leaveGameOverlay: byId('leave-game-overlay'),
            gameMessage: byId('game-message'),
            coinTrack: byId('runner-coin-track'),
            cashoutButton: document.querySelector('.game-cashout-button'),
            betAmountInput: byId('bet-amount-input'),
            depositAmountInput: byId('deposit-amount-input'),
            depositCard: document.querySelector('.deposit-card'),
            depositBonusPreview: byId('deposit-bonus-preview'),
            depositBonusChestImage: byId('deposit-bonus-chest-image'),
            withdrawAmountInput: byId('withdraw-amount-input'),
            walletWithdrawCard: byId('wallet-withdraw-card'),
            walletWithdrawStatus: byId('wallet-withdraw-status'),
            profileForm: byId('profile-form'),
            profileNameInput: byId('profile-name-input'),
            profileEmailInput: byId('profile-email-input'),
            profilePasswordInput: byId('profile-password-input'),
            profileFormMessage: byId('profile-form-message')
        };

        updateProfileUI();
        updateRunUI();
        updateBetUI();
        updateDepositUI();
        updateWalletUI();
        renderAppIcons();
        bindActions();
        locateRunner();
        monitorRun();
        initEmbeddedProfile();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
