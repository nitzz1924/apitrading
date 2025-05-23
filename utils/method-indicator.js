export const calculateIndicators = (stocks) => {
    const calculateEMA = (prices, period) => {
        const k = 2 / (period + 1);
        return prices.reduce((ema, price, i) => i === 0 ? price : (price * k) + (ema * (1 - k)));
    };
        const prices = stocks.slice(0, index + 1).map(s => s.CLOSE);
        const volumes = stocks.slice(0, index + 1).map(s => s.TOTALQTYTRADED);
        // VWAP Calculation
        const cumulativePriceVolume = prices.reduce((sum, price, i) => sum + price * volumes[i], 0);
        const cumulativeVolume = volumes.reduce((sum, vol) => sum + vol, 0);
        const VWAP = (cumulativePriceVolume / cumulativeVolume).toFixed(2);
        // RSI Calculation
        let gains = [], losses = [];
        for (let i = 1; i < prices.length; i++) {
            let change = prices[i] - prices[i - 1];
            change > 0 ? gains.push(change) : losses.push(Math.abs(change));
        }
        const avgGain = gains.length ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
        const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / 14 : 1;
        const RS = avgGain / avgLoss;
        const RSI = 100 - (100 / (1 + RS));
        // MACD Calculation
        const shortEMA = calculateEMA(prices, 12);
        const longEMA = calculateEMA(prices, 26);
        const MACD = shortEMA - longEMA;
        const signal = calculateEMA([MACD], 9);
        // Stochastic %K Calculation
        const highPeriod = arr.slice(-14).map(s => s.HIGH);
        const lowPeriod = arr.slice(-14).map(s => s.LOW);
        const percentK = ((stock.CLOSE - Math.min(...lowPeriod)) / (Math.max(...highPeriod) - Math.min(...lowPeriod))) * 100;
        return {
            ...stock,
            VWAP,
            RSI: RSI.toFixed(2),
            MACD: MACD.toFixed(2),
            MACD_Signal: signal.toFixed(2),
            EMA_20: calculateEMA(prices, 20).toFixed(2),
            EMA_50: calculateEMA(prices, 50).toFixed(2),
            Bollinger_Upper: (stock.CLOSE + (2 * RSI)).toFixed(2),
            Bollinger_Lower: (stock.CLOSE - (2 * RSI)).toFixed(2),
            Stochastic_K: percentK.toFixed(2),
            Volume_Surge: (stock.TOTALQTYTRADED / (volumes.reduce((a, b) => a + b, 0) / volumes.length)).toFixed(2)
        };
};
