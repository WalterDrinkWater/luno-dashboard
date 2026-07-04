const Calculator = {
  _parsePair(pair) {
    for (const fiat of CONFIG.FIAT_CURRENCIES) {
      if (pair.endsWith(fiat)) {
        return { base: pair.slice(0, -fiat.length), counter: fiat };
      }
    }
    return null;
  },

  _isFiat(code) {
    return CONFIG.FIAT_CURRENCIES.includes(code);
  },

  _detectFiat(balances) {
    const fiats = balances
      .filter((b) => this._isFiat(b.asset))
      .sort((a, b) => parseFloat(b.balance || 0) - parseFloat(a.balance || 0));
    return fiats.length > 0 ? fiats[fiats.length - 1].asset : 'MYR';
  },

  calculate(balances, tickers, tradesByPair) {
    const tickerMap = {};
    (tickers.tickers || []).forEach((t) => {
      tickerMap[t.pair] = t;
    });

    const defaultFiat = this._detectFiat(balances.balance || []);

    const assets = [];
    let totalInvested = 0;
    let totalValue = 0;
    let totalPnl = 0;
    let profitCount = 0;
    let lossCount = 0;

    for (const bal of balances.balance || []) {
      const asset = bal.asset;
      const balance = parseFloat(bal.balance || 0);
      const reserved = parseFloat(bal.reserved || 0);
      const totalBal = balance + reserved;

      if (totalBal <= 0 && !this._isFiat(asset)) continue;

      if (this._isFiat(asset)) {
        const value = balance;
        totalValue += value;
        assets.push({
          asset,
          balance: bal.balance,
          accountId: bal.account_id,
          name: bal.name || '',
          averageCost: 1,
          currentPrice: 1,
          totalInvested: value,
          currentValue: value,
          pnl: 0,
          pnlPercent: 0,
          isFiat: true,
        });
        continue;
      }

      let currentPrice = 0;
      let tickerPair = '';

      for (const fiat of CONFIG.FIAT_CURRENCIES) {
        const pair = asset + fiat;
        if (tickerMap[pair]) {
          currentPrice = parseFloat(tickerMap[pair].last_trade || 0);
          tickerPair = pair;
          break;
        }
      }

      if (!currentPrice || currentPrice <= 0) {
        assets.push({
          asset,
          balance: bal.balance,
          accountId: bal.account_id,
          name: bal.name || '',
          averageCost: 0,
          currentPrice: 0,
          totalInvested: 0,
          currentValue: 0,
          pnl: 0,
          pnlPercent: 0,
          isFiat: false,
          noPrice: true,
        });
        continue;
      }

      let totalCost = 0;
      let totalVolume = 0;

      const relevantPairs = Object.keys(tradesByPair).filter((pair) => {
        const p = this._parsePair(pair);
        return p && p.base === asset;
      });

      for (const pair of relevantPairs) {
        for (const trade of tradesByPair[pair]) {
          if (trade.is_buy) {
            totalCost +=
              (parseFloat(trade.counter || 0)) +
              (parseFloat(trade.fee_counter || 0));
            totalVolume +=
              (parseFloat(trade.base || 0)) -
              (parseFloat(trade.fee_base || 0));
          }
        }
      }

      const averageCost = totalVolume > 0 ? totalCost / totalVolume : 0;
      const currentValue = totalBal * currentPrice;
      const invested = averageCost * totalBal;
      const pnl = currentValue - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

      if (invested > 0) totalInvested += invested;
      else if (totalBal > 0) totalInvested += currentValue;

      totalValue += currentValue;
      totalPnl += pnl;
      if (pnl > 0) profitCount++;
      if (pnl < 0) lossCount++;

      assets.push({
        asset,
        balance: bal.balance,
        reserved: bal.reserved,
        accountId: bal.account_id,
        name: bal.name || '',
        averageCost,
        currentPrice,
        totalInvested: invested || currentValue,
        currentValue,
        pnl,
        pnlPercent,
        isFiat: false,
        tickerPair,
        volumeTraded: totalVolume,
      });
    }

    return {
      assets,
      summary: {
        totalValue,
        totalInvested: totalInvested || totalValue,
        totalPnl,
        totalPnlPercent:
          totalInvested > 0
            ? (totalPnl / (totalInvested || totalValue)) * 100
            : 0,
        defaultFiat,
        nonFiatCount: assets.filter((a) => !a.isFiat).length,
        profitCount,
        lossCount,
      },
    };
  },
};
