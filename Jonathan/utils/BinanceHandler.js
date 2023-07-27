/* eslint-disable new-cap */
import ccxt from "ccxt";
import tulind from "tulind";

class BinanceHandler {
  constructor(config) {
    this.binance = new ccxt.binance({
      apiKey: config.binanceAPIKey,
      secret: config.binanceSecret,
      enableRateLimit: false,
    });
    this.binanceFuture = new ccxt.binance({
      apiKey: config.binanceAPIKey,
      secret: config.binanceSecret,
      enableRateLimit: false,
      options: {
        defaultType: "future",
      },
    });
  }

  ///
  // binance api wrapper functions
  ///

  async futuresTransfer(code, amount, type) {
    const result = await this.binance.futuresTransfer(code, amount, type);
    return result;
  }

  async fetchOHLCVFormatted(tickerWithoutSlash, timeframe) {
    const result = await this.binanceFuture.fetchOHLCV(tickerWithoutSlash, timeframe, undefined, 300);

    const dataFormat = {
      timestamp: [],
      open: [],
      high: [],
      low: [],
      close: [],
      volume: [],
    };

    for (const d of result) {
      dataFormat.timestamp.push(d[0]);
      dataFormat.open.push(d[1]);
      dataFormat.high.push(d[2]);
      dataFormat.low.push(d[3]);
      dataFormat.close.push(d[4]);
      dataFormat.volume.push(d[5]);
    }

    return dataFormat;
  }

  async fetchBalance(params = {}) {
    const result = await this.binanceFuture.fetchBalance(params);
    return result;
  }

  async fetchClosedOrders(ticker) {
    const result = await this.binanceFuture.fetchClosedOrders(ticker, undefined, 4);
    return result;
  }

  async fetchLastClosedOrder(ticker) {
    const orderArray = await this.binanceFuture.fetchClosedOrders(ticker);
    const lastOrder = orderArray[orderArray.length - 1];
    return lastOrder;
  }

  async fetchOrder(orderId, ticker) {
    const fetchedOrder = await this.binanceFuture.fetchOrder(orderId, ticker);
    return fetchedOrder;
  }

  async createOrder(ticker, type, side, amount, price = undefined, option = {}) {
    const newOrder = await this.binanceFuture.createOrder(ticker, type, side, amount, price, option);
    return newOrder;
  }

  async cancelOrder(orderId, ticker) {
    const canceledOrder = await this.binanceFuture.cancelOrder(orderId, ticker);
    return canceledOrder;
  }

  async cancelAllOrders(ticker) {
    const res = await this.binanceFuture.cancelAllOrders(ticker);
    return res;
  }

  async closeAllPositions(ticker) {
    try {
      // Load markets
      await this.binanceFuture.loadMarkets();
      const positions = await this.binanceFuture.fetchPositionsRisk();

      for (const position of positions) {
        const symbol = position.symbol;
        const side = position.positionAmt > 0 ? "sell" : "buy";
        const amount = Math.abs(position.positionAmt);

        if (amount > 0 && symbol === ticker) {
          await this.binanceFuture.createOrder(symbol, "market", side, amount, undefined, { reduceOnly: true });
          console.log(`Instant Closing Position placed for ${ticker}.`);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async setLeverage(leverage, symbol) {
    const res = await this.binanceFuture.setLeverage(leverage, symbol);
    return res;
  }

  ///
  // tulind library wrapper functions
  ///

  async getStochRSI(n, ticker, timeframe) {
    const stochRsiCal = {};
    let kList = [1];
    let dList = [1];

    const obj = await this.fetchOHLCVFormatted(ticker, timeframe);
    tulind.indicators.rsi.indicator([obj.close], [n], (err, res) => {
      if (err) {
        console.error(err);
      }
      stochRsiCal.close = res[0];
    });
    tulind.indicators.rsi.indicator([obj.high], [n], (err, res) => {
      if (err) {
        console.error(err);
      }
      stochRsiCal.high = res[0];
    });
    tulind.indicators.rsi.indicator([obj.low], [n], (err, res) => {
      if (err) {
        console.error(err);
      }
      stochRsiCal.low = res[0];
    });
    tulind.indicators.stoch.indicator([stochRsiCal.high, stochRsiCal.low, stochRsiCal.close], [14, 3, 3], (err, res) => {
      if (err) {
        console.error(err);
      }
      kList = res[0];
      dList = res[1];
    });
    return { k: kList[kList.length - 1], d: dList[dList.length - 1] };
  }

  async getADX(n, ticker, timeframe) {
    const obj = await this.fetchOHLCVFormatted(ticker, timeframe);
    let adxList = [1];
    tulind.indicators.adx.indicator([obj.high, obj.low, obj.close], [n], (err, res) => {
      if (err) {
        console.error(err);
      }
      adxList = res[0];
    });

    return { adx: adxList[adxList.length - 1] };
  }

  async getBB(n, ticker, timeframe) {
    const obj = await this.fetchOHLCVFormatted(ticker, timeframe);
    let bbLowerList = [1];
    let bbMiddleList = [1];
    let bbUpperList = [1];
    tulind.indicators.bbands.indicator([obj.close], [n, 2], (err, res) => {
      if (err) {
        console.error(err);
      }

      bbLowerList = res[0];
      bbMiddleList = res[1];
      bbUpperList = res[2];
    });

    return {
      bbLower: bbLowerList[bbLowerList.length - 1],
      bbMiddle: bbMiddleList[bbMiddleList.length - 1],
      bbUpper: bbUpperList[bbUpperList.length - 1],
    };
  }

  // async getEMA() {
  //   return result;
  // }
}

export default BinanceHandler;
