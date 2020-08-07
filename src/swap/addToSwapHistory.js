// @flow
import type { AccountLike, SubAccount, Operation, Transaction } from "../types";
import type { Exchange, ExchangeRate } from "./types";
import { getAccountCurrency, getMainAccount } from "../account";
import type { SwapOperation } from "../swap/types";

export default ({
  account,
  operation,
  transaction,
  swap,
  swapId,
}: {
  account: AccountLike,
  operation: Operation,
  transaction: Transaction,
  swap: {
    exchange: $Shape<Exchange>,
    exchangeRate: ExchangeRate,
  },
  swapId: string,
}) => {
  const { exchange, exchangeRate } = swap;
  const { fromAccount, toAccount, toParentAccount } = exchange;
  const mainToAccount = getMainAccount(toAccount, toParentAccount);
  const toCurrency = getAccountCurrency(toAccount);
  const fromCurrency = getAccountCurrency(fromAccount);

  const subAccounts = account.type === "Account" && account.subAccounts;
  const tokenId =
    toCurrency.type === "TokenCurrency" ? toCurrency.id : undefined;
  const isFromToken = fromCurrency.type === "TokenCurrency";

  const swapOperation: SwapOperation = {
    status: "new",
    provider: exchangeRate.provider,
    operationId: operation.id,
    swapId,
    // NB We store the reciever main account + tokenId in case the token account doesn't exist yet.
    receiverAccountId: mainToAccount.id,
    tokenId,
    fromAmount: transaction.amount,
    toAmount: transaction.amount.times(exchangeRate.magnitudeAwareRate),
  };

  return isFromToken && subAccounts
    ? {
        ...account,
        subAccounts: subAccounts.map<SubAccount>((a: SubAccount) => {
          const subAccount = {
            ...a,
            swapHistory: [...a.swapHistory, swapOperation],
          };
          return a.id === fromAccount.id ? subAccount : a;
        }),
      }
    : {
        ...account,
        swapHistory: [...account.swapHistory, swapOperation],
      };
};
