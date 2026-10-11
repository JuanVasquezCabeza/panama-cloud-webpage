// ==========================================
        // 1. MMM DIMINISHING RETURNS MODEL LOGIC
        // ==========================================
        const spendInput = document.getElementById('spend-input');
        const spendLbl = document.getElementById('spend-lbl');
        const metricRev = document.getElementById('metric-rev');
        const metricMroi = document.getElementById('metric-mroi');
        const curvePath = document.getElementById('curve-path');
        const pulsingDot = document.getElementById('pulsing-dot');

        const channels = {
            social: { max_return: 130000, alpha: 0.000035 }, // Quick saturation, high early ROI
            search: { max_return: 170000, alpha: 0.000018 }, // Moderate saturation, highly consistent
            brand: { max_return: 240000, alpha: 0.000007 }   // High threshold, slow ramp-up, huge ceiling
        };

        let currentChannel = 'social';

        function formatCurrency(amount) {
            return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
        }

        function calculateMMM() {
            const spend = parseFloat(spendInput.value);
            const { max_return, alpha } = channels[currentChannel];

            const revenue = max_return * (1 - Math.exp(-alpha * spend));
            const marginalRoi = max_return * alpha * Math.exp(-alpha * spend);

            spendLbl.textContent = formatCurrency(spend);
            metricRev.textContent = formatCurrency(revenue);
            metricMroi.textContent = marginalRoi.toFixed(2) + 'x';

            if (marginalRoi >= 1.2) {
                metricMroi.style.color = 'var(--accent-green)';
            } else if (marginalRoi >= 1.0) {
                metricMroi.style.color = '#d97706';
            } else {
                metricMroi.style.color = '#ef4444';
            }

            const xStart = 35;
            const xRange = 255;
            const yStart = 110;
            const yRange = 100;
            const maxValY = 240000;

            let pathD = '';
            const steps = 30;
            for (let i = 0; i <= steps; i++) {
                const sVal = (i / steps) * 100000;
                const rVal = max_return * (1 - Math.exp(-alpha * sVal));

                const xSvg = xStart + (sVal / 100000) * xRange;
                const ySvg = yStart - (rVal / maxValY) * yRange;

                if (i === 0) {
                    pathD += `M ${xSvg} ${ySvg}`;
                } else {
                    pathD += ` L ${xSvg} ${ySvg}`;
                }
            }
            curvePath.setAttribute('d', pathD);

            const dotX = xStart + (spend / 100000) * xRange;
            const dotY = yStart - (revenue / maxValY) * yRange;
            pulsingDot.setAttribute('cx', dotX);
            pulsingDot.setAttribute('cy', dotY);
        }

        function selectChannel(channelId) {
            currentChannel = channelId;
            const buttons = ['social', 'search', 'brand'];
            buttons.forEach(id => {
                const btn = document.getElementById('btn-' + id);
                if (id === channelId) {
                    btn.style.background = 'var(--accent-indigo)';
                    btn.style.color = '#ffffff';
                    btn.style.borderColor = 'var(--accent-indigo)';
                } else {
                    btn.style.background = '#ffffff';
                    btn.style.color = 'var(--text-primary)';
                    btn.style.borderColor = 'var(--border-color)';
                }
            });
            calculateMMM();
        }
