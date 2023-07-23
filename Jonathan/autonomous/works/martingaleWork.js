const martingaleWork = async (slackHandler, excelHandler, binanceHandler) => {
  const now = new Date();
  const slackChannelId = await slackHandler.findConversation("trading-test");
  const feeRate = 0.0003;
  const tempInitialBalance = 82.5;
  const ticker = "XRPBUSD";
  const tickerWithSlash = "XRP/BUSD";
  const currency = "BUSD";
  const timeframe = "15m";
  const tagetVolatilityMin = 0.005;
  const tagetVolatilityMax = 0.0088;

  try {
    // 스크립트처럼 돌아가야함 1회성.

    // constants

    // flags
    let isRoundLog = false;
    let isPositionLog = false;
    let initialOrder = false;
    let isPositionClosed = false;
    let isRoundClosed = false;

    // dtos
    const positionRowData = {
      "Position #": 0,
      "Round #": 0,
      Type: "",
      Side: "",
      Success: "",
      "Entry Liquidity": 0,
      "Exit Liquidity": 0,
      PNL: 0,
      "%": 0,
      Data: "",
      Datetime: "",
      Leverage: 0,
      TP: 0,
      TPPercent: 0,
      SL: 0,
      SLPercent: 0,
      Stage: 0,
      BuyWeight: 0,
      SellWeight: 0,
      Price: 0,
    };
    const roundRowData = {
      "Round #": 0,
      Liquidity: 0,
      Vault: 0,
      "Vault Delta": 0,
      "Transaction Count": 0,
      Datetime: "",
    };

    // 5초마다 가중치 계산해서, 사이드 정해서 오더 넣고 로깅하기
    // 전처리: 전 order가 클로징됐는지 확인하고 클로징됐으면 Position/Round Closing 로깅 데이터 생성. 안됐으면 return; 됐으면 1분? 정도 텀 두고 다음으로 넘어가기
    // 처리: 안됐으면 가중치 계산, 사이드 정하고, 오더 넣고 Position/Round Entry 로깅 데이터 생성.
    // 후처리: excelHandler 배치 로깅

    // 티커로 오더 히스토리 받고, 이전 오더 중 제일 마지막-최신 오더 확인 (해당 티커는 매뉴얼로 사이드 건드리지 말아야함!)
    const orderHistory = await binanceHandler.fetchClosedOrders(tickerWithSlash);
    if (orderHistory.length === 0) {
      initialOrder = true;
    }
    if (initialOrder || orderHistory.length > 0) {
      const lastOrder = orderHistory[orderHistory.length - 1];
      const secondLastOrder = orderHistory[orderHistory.length - 2];
      if (!initialOrder && lastOrder.timestamp >= new Date().getTime() - 5000 && lastOrder.remaining === 0 && lastOrder.reduceOnly) {
        await binanceHandler.cancelAllOrders(tickerWithSlash);

        // pnl 계산
        const openOrder = secondLastOrder;
        const closeOrder = lastOrder;

        const openPrice = openOrder.average;
        const closePrice = closeOrder.average;
        const quantity = openOrder.filled;

        const isBuy = openOrder.side === "buy";

        const openFee = openPrice * quantity * feeRate;
        const closeFee = closePrice * quantity * feeRate;

        const pnl = (closePrice - openPrice) * (isBuy ? 1 : -1) * quantity - openFee - closeFee;

        // vault 옮기기
        if (pnl > 0) {
          await binanceHandler.futuresTransfer(currency, pnl, 2);

          // Round Close 로깅 생성 트리거
          isRoundClosed = true;
          isRoundLog = true;
        }

        // Position Exit 로깅 생성
        positionRowData.Type = "Exit";
        positionRowData.Side = closeOrder.side;
        positionRowData.Success = pnl > 0;
        positionRowData["Exit Liquidity"] = closeOrder.cost;
        positionRowData.PNL = pnl;

        isPositionLog = true;
        isPositionClosed = true;

        //
      } else if (initialOrder || (lastOrder.remaining === 0 && lastOrder.reduceOnly)) {
        isPositionLog = true;
        // 포지션 엔트리 로깅 데이터 생성. 이전 pnl이 +면 라운드 엔트리 생성.
        const k = (await binanceHandler.getStochRSI(14, ticker, timeframe)).k;
        const adx = (await binanceHandler.getADX(12, ticker, timeframe)).adx;
        const bb = await binanceHandler.getBB(20, ticker, timeframe);
        const bbLower = bb.bbLower;
        const bbMiddle = bb.bbMiddle;
        const bbUpper = bb.bbUpper;

        const data = await binanceHandler.fetchOHLCVFormatted(ticker, timeframe);

        let price = data.close[data.close.length - 1];

        const cs = chooseSide(price, bbUpper, bbMiddle, bbLower, adx, k);
        const newSide = cs.side;
        positionRowData.BuyWeight = cs.buyWeight;
        positionRowData.SellWeight = cs.sellWeight;
        const isBuy = newSide === "buy";
        const contraNewSide = isBuy ? "sell" : "buy";

        const remainingBalance = (await binanceHandler.fetchBalance({ currency, type: "future" }))[currency].free;

        for (let i = 0; i < 4; i++) {
          const minBorder = tempInitialBalance * 0.865 ** (i + 1);
          const maxBorder = i === 0 ? Math.max(tempInitialBalance * 0.865 ** i, remainingBalance) : tempInitialBalance * 0.865 ** i;
          if (minBorder <= remainingBalance && remainingBalance <= maxBorder) {
            // TODO: Stage 이후 추가
            positionRowData.Stage = i;

            // amount 결정하고, sltp 결정
            const targetBalance = tempInitialBalance * 1.0103 * 0.865 ** i;
            const normalRatio = targetBalance / remainingBalance - 1;
            const leverage = Math.min(smallestDivisor(normalRatio, tagetVolatilityMin, tagetVolatilityMax), 19);
            await binanceHandler.setLeverage(leverage, ticker);

            const amount = +((remainingBalance * 0.99 * (1 - feeRate)) / price) * leverage;

            const order = await binanceHandler.createOrder(ticker, "market", newSide, amount);
            price = order.price;

            const tpPrice = isBuy ? price * (1 + normalRatio / leverage) : price * (1 - normalRatio / leverage);
            const slPrice = isBuy ? price * (1 - normalRatio / leverage) : price * (1 + normalRatio / leverage);

            const tpOrder = await binanceHandler.createOrder(ticker, "take_profit_market", contraNewSide, amount, tpPrice, {
              stopPrice: tpPrice,
              reduceOnly: true,
            });
            const slOrder = await binanceHandler.createOrder(ticker, "stop_market", contraNewSide, amount, slPrice, {
              stopPrice: slPrice,
              reduceOnly: true,
            });

            console.log("New Order Delivered!");
            console.log(leverage, price, amount.toFixed(2), (amount * price).toFixed(2), ((amount * price) / leverage).toFixed(2), newSide);
            console.log(
              tpPrice.toFixed(2),
              slPrice.toFixed(2),
              (normalRatio / leverage).toFixed(2),
              (1 + normalRatio / leverage).toFixed(2),
              (1 - normalRatio / leverage).toFixed(2)
            );

            // Position Open 로깅 데이터 생성
            positionRowData.Type = "Entry";
            positionRowData.Side = newSide;
            positionRowData.Price = price;
            positionRowData["Entry Liquidity"] = order.cost;
            positionRowData.Leverage = leverage;
            positionRowData.TP = tpOrder.stopPrice;
            positionRowData.TPPercent = normalRatio * (isBuy ? 1 : -1);
            positionRowData.SL = slOrder.stopPrice;
            positionRowData.SLPercent = normalRatio * (isBuy ? -1 : 1);
            positionRowData.Data = `Leverage: ${leverage}  TP: ${tpOrder.stopPrice}  SL: ${slOrder.stopPrice}`;

            isPositionLog = true;
            break;
          }
        }
      } else {
        return;
      }
    }

    let roundNumber = 1;

    if (isPositionLog) {
      // 포지션 로그에 추가해야하는 정보들 준비
      let positionNumber = 1;

      const lastRow = await excelHandler.getLastRow("Position Logs");
      if (lastRow) {
        if (lastRow.Type === "Exit") {
          positionNumber = +lastRow["Position #"] + 1;
        } else {
          positionNumber = +lastRow["Position #"];
        }

        if (+lastRow.PNL > 0) {
          roundNumber = +lastRow["Round #"] + 1;

          isRoundLog = true;
        } else {
          roundNumber = +lastRow["Round #"];
        }
      } else {
        isRoundLog = true;
      }

      positionRowData["Position #"] = positionNumber;
      positionRowData["Round #"] = roundNumber;
      positionRowData.Datetime = now.toLocaleString("kr-KR", { hour12: false });

      // excel
      await excelHandler.addRow("Position Logs", positionRowData);

      // slack
      const chatAlarm = slackHandler.createChatBlockChannelAlarm();
      const contentText = `*[Position ${isPositionClosed === false ? "Entry" : "Exit"} #${positionRowData["Position #"]}]*${
        isPositionClosed === false
          ? "\nAmount: $" +
            positionRowData["Entry Liquidity"].toFixed(2) +
            " (" +
            (positionRowData["Entry Liquidity"] / positionRowData.Leverage).toFixed(2) +
            ")"
          : "\nAmount: " + positionRowData["Exit Liquidity"].toFixed(2)
      } ${
        isPositionClosed === false
          ? "\nSide: " +
            positionRowData.Side +
            " (" +
            positionRowData.BuyWeight.toFixed(2) +
            " : " +
            positionRowData.SellWeight.toFixed(2) +
            ")" +
            "\nPrice: $" +
            positionRowData.price +
            "\nLeverage: " +
            positionRowData.Leverage +
            "\nTP: $" +
            positionRowData.TP +
            " (" +
            (positionRowData.TPPercent * 100).toFixed(2) +
            "%)" +
            "\nSL: $" +
            positionRowData.SL +
            " (" +
            (positionRowData.SLPercent * 100).toFixed(2) +
            "%)" +
            "\nTimestamp: " +
            positionRowData.Datetime +
            "\nRound: " +
            positionRowData["Round #"]
          : "\nSuccess: " +
            positionRowData.Success +
            "\nPNL: $" +
            positionRowData.PNL +
            "(" +
            (positionRowData["%"] * 100).toFixed(2) +
            "%)"
      }`;

      const chatAttachment = slackHandler.createChatAttachment(contentText, isPositionClosed ? "#CC0000" : "#00C851");

      //
      await slackHandler.publishMessage(slackChannelId, chatAlarm, chatAttachment);
    }
    if (isRoundLog) {
      // 라운드 로깅 시 필요한 데이터 준비
      // liqudiity using getbalance;
      // vault using getbalance;
      roundRowData["Round #"] = roundNumber;
      roundRowData.Liquidity = (await binanceHandler.fetchBalance({ currency, type: "future" }))[currency].total.toFixed(2);
      roundRowData.Vault = (await binanceHandler.fetchBalance({ type: "spot" }))[currency].free.toFixed(2);
      roundRowData.Datetime = now.toLocaleString("kr-KR", { hour12: false });

      // excel
      await excelHandler.addRow("Round Logs", roundRowData);

      // slack
      const chatAlarm = slackHandler.createChatBlockChannelAlarm();
      const contentText = `*[Round ${isRoundClosed === false ? "Open" : "Close"} #${roundRowData["Round #"]}]*\nLiquidity: $${
        roundRowData.Liquidity
      }\nVault: $${roundRowData.Vault}
      ${
        ""
        // isRoundClosed === true ? "  Vault Delta: " + roundRowData["Vault Delta"] + "\n Counts: " + (Math.floor(rowCount / 2) + 1) : ""
      }`;

      const chatAttachment = slackHandler.createChatAttachment(contentText, isRoundClosed ? "#008000" : "#FF0000");

      await slackHandler.publishMessage(slackChannelId, chatAlarm, chatAttachment);
    }
  } catch (err) {
    await slackHandler.publishText(slackChannelId, "Error Alert!!!");
    console.error(`Error in martingaleWork (${new Date()}): ${err}`);
  }
};

function chooseSide(price, upperBand, middleBand, lowerBand, adx, stochRsiK) {
  // Calculate weights
  const positionBB = (price - middleBand) / (upperBand - lowerBand);
  let bbBuyWeight = Math.max(0, 1 - positionBB);
  let bbSellWeight = Math.max(0, positionBB);

  const adxNormalized = Math.min(adx / 40, 1);

  let rsiBuyWeight = Math.max(0, (80 - stochRsiK) / 80);
  let rsiSellWeight = Math.max(0, stochRsiK / 80);

  // // Calculate MACD Histogram and derive weights
  // const macdHistogram = macdLine - signalLine;
  // const macdBuyWeight = Math.max(0, macdHistogram);
  // const macdSellWeight = Math.max(0, -macdHistogram);

  // Adjust BB and RSI weights for ADX
  if (adxNormalized > 0.5) {
    // Strong trend
    bbBuyWeight *= adxNormalized;
    bbSellWeight *= adxNormalized;
    rsiBuyWeight *= adxNormalized;
    rsiSellWeight *= adxNormalized;
  } else {
    // Weak trend
    bbBuyWeight *= 1 - adxNormalized;
    bbSellWeight *= 1 - adxNormalized;
    rsiBuyWeight *= 1 - adxNormalized;
    rsiSellWeight *= 1 - adxNormalized;
  }

  const overallBuyWeight = (bbBuyWeight + rsiBuyWeight) / 3;
  const overallSellWeight = (bbSellWeight + rsiSellWeight) / 3;

  // Randomly select side based on weights
  const totalWeight = overallBuyWeight + overallSellWeight;
  const randomValue = Math.random() * totalWeight;

  if (randomValue < overallBuyWeight) {
    return { side: "buy", buyWeight: overallBuyWeight, sellWeight: overallSellWeight };
  } else {
    return { side: "sell", buyWeight: overallBuyWeight, sellWeight: overallSellWeight };
  }
}

function smallestDivisor(num, min, max) {
  let i = 1;
  while (true) {
    const result = num / i;
    if (result >= min && result <= max) {
      return i;
    }
    i++;
  }
}

export default martingaleWork;
