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
    return fiats.length > 0 ? fiats[fiats.length - 1].asset : "MYR";
  },

  calculate(balances, tickers, tradesByPair, transactionsByAccount) {
    const tickerMap = {};
    (tickers.tickers || []).forEach((t) => {
      tickerMap[t.pair] = t;
    });

    balances.balance =
      balances.balance.filter(
        (b) => b.balance && parseFloat(b.balance).toFixed(2) > 0,
      ) || [];
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
          displayAsset: CONFIG.ASSET_DISPLAY_NAMES[asset] || asset,
          balance: bal.balance,
          accountId: bal.account_id,
          name: bal.name || "",
          averageCost: 1,
          currentPrice: 1,
          totalInvested: value,
          currentValue: value,
          realizedPnl: 0,
          unrealizedPnl: 0,
          stakingQty: 0,
          stakingValue: 0,
          depositQty: 0,
          depositValue: 0,
          tradeReceiveQty: 0,
          tradeReceiveValue: 0,
          pnl: 0,
          pnlPercent: 0,
          isFiat: true,
          totalMoneyIn: 0,
        });
        continue;
      }

      let currentPrice = 0;
      let tickerPair = "";

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
          displayAsset: CONFIG.ASSET_DISPLAY_NAMES[asset] || asset,
          balance: bal.balance,
          accountId: bal.account_id,
          name: bal.name || "",
          averageCost: 0,
          currentPrice: 0,
          totalInvested: 0,
          currentValue: 0,
          realizedPnl: 0,
          unrealizedPnl: 0,
          stakingQty: 0,
          stakingValue: 0,
          depositQty: 0,
          depositValue: 0,
          tradeReceiveQty: 0,
          tradeReceiveValue: 0,
          pnl: 0,
          pnlPercent: 0,
          isFiat: false,
          noPrice: true,
          totalMoneyIn: 0,
        });
        continue;
      }

      let totalCost = 0;
      let totalVolume = 0;
      let realizedPnl = 0;
      let totalMoneyIn = 0;

      const relevantPairs = Object.keys(tradesByPair).filter((pair) => {
        const p = this._parsePair(pair);
        return p && p.base === asset;
      });

      for (const pair of relevantPairs) {
        for (const trade of tradesByPair[pair]) {
          if (trade.is_buy) {
            totalCost +=
              parseFloat(trade.counter || 0) +
              parseFloat(trade.fee_counter || 0);
            totalVolume +=
              parseFloat(trade.base || 0) - parseFloat(trade.fee_base || 0);
            totalMoneyIn +=
              parseFloat(trade.counter || 0) +
              parseFloat(trade.fee_counter || 0);
          } else {
            const sellVol =
              parseFloat(trade.base || 0) + parseFloat(trade.fee_base || 0);
            const proceeds =
              parseFloat(trade.counter || 0) -
              parseFloat(trade.fee_counter || 0);
            if (totalVolume > 0) {
              const avgCost = totalCost / totalVolume;
              const costOfSold = avgCost * Math.min(sellVol, totalVolume);
              totalCost -= costOfSold;
              totalVolume -= Math.min(sellVol, totalVolume);
              realizedPnl += proceeds - costOfSold;
            }
          }
        }
      }

      let stakingQty = 0;
      let depositQty = 0;
      let sendTotal = 0;
      let tradeReceiveQty = 0;
      let exchangeInflow = 0;
      let exchangeOutflow = 0;
      let instantBuyCost = 0;

      const txsData =
        transactionsByAccount && transactionsByAccount[bal.account_id];
      if (txsData && txsData.transactions) {
        for (const tx of txsData.transactions) {
          const delta = parseFloat(tx.balance_delta || 0);
          if (tx.kind === "INTEREST") {
            stakingQty += delta;
          } else if (tx.kind === "TRANSFER") {
            if (delta > 0) depositQty += delta;
            else if (delta < 0) sendTotal += Math.abs(delta);
          } else if (tx.kind === "EXCHANGE") {
            if (delta > 0) {
              exchangeInflow += delta;
              var desc = tx.description || "";
              if (desc.indexOf("for RM") > -1 || desc.indexOf("for MYR") > -1) {
                var match = desc.match(/for\s*(?:RM|MYR)\s*([\d,.]+)/);
                if (match)
                  instantBuyCost += parseFloat(match[1].replace(/,/g, ""));
              }
            } else {
              exchangeOutflow += Math.abs(delta);
            }
          }
        }
      }

      totalCost += instantBuyCost;
      totalMoneyIn += instantBuyCost;
      if (exchangeInflow > 0 || exchangeOutflow > 0) {
        totalVolume = exchangeInflow - exchangeOutflow;
      }

      if (sendTotal > 0) {
        const totalQty =
          totalVolume + stakingQty + depositQty + tradeReceiveQty;
        if (totalQty > 0) {
          const sendRatio = Math.min(sendTotal / totalQty, 1);
          totalCost *= 1 - sendRatio;
          totalVolume *= 1 - sendRatio;
          stakingQty *= 1 - sendRatio;
          depositQty *= 1 - sendRatio;
          tradeReceiveQty *= 1 - sendRatio;
        }
      }

      let boughtQty = Math.max(0, totalVolume);
      tradeReceiveQty = Math.max(
        tradeReceiveQty,
        totalBal - boughtQty - stakingQty - depositQty,
      );

      const averageCost = boughtQty > 0 ? totalCost / boughtQty : 0;
      const currentValue = totalBal * currentPrice;
      const stakingValue = stakingQty * currentPrice;
      const depositValue = depositQty * currentPrice;
      const tradeReceiveValue = tradeReceiveQty * currentPrice;
      const tradingValue = boughtQty * currentPrice;
      const unrealizedPnl = tradingValue - totalCost;
      const pnl = realizedPnl + unrealizedPnl;
      const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

      if (totalMoneyIn > 0) totalInvested += totalCost;
      else if (totalBal > 0) totalInvested += currentValue;

      totalValue += currentValue;
      totalPnl += pnl;
      if (pnl > 0) profitCount++;
      if (pnl < 0) lossCount++;

      assets.push({
        asset,
        displayAsset: CONFIG.ASSET_DISPLAY_NAMES[asset] || asset,
        balance: bal.balance,
        reserved: bal.reserved,
        accountId: bal.account_id,
        name: bal.name || "",
        averageCost,
        currentPrice,
        totalInvested: totalCost || currentValue,
        currentValue,
        realizedPnl: realizedPnl || 0,
        unrealizedPnl: unrealizedPnl || 0,
        stakingQty: stakingQty || 0,
        stakingValue: stakingValue || 0,
        depositQty: depositQty || 0,
        depositValue: depositValue || 0,
        tradeReceiveQty: tradeReceiveQty || 0,
        tradeReceiveValue: tradeReceiveValue || 0,
        pnl,
        pnlPercent,
        isFiat: false,
        tickerPair,
        volumeTraded: totalVolume,
        totalMoneyIn,
        sendTotal: sendTotal || 0,
      });
    }

    const filteredAssets = assets.filter(
      (a) => parseFloat(a.currentValue).toFixed(2) > 0,
    );

    return {
      assets: filteredAssets,
      summary: {
        totalValue,
        totalInvested: totalInvested || totalValue,
        totalPnl,
        totalPnlPercent:
          totalInvested > 0
            ? (totalPnl / (totalInvested || totalValue)) * 100
            : 0,
        defaultFiat,
        nonFiatCount: filteredAssets.filter((a) => !a.isFiat).length,
        profitCount,
        lossCount,
      },
    };
  },
};
