import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { isAccountEmpty } from "@ledgerhq/live-common/lib/account";

import { Flex, Icons, Text, Box } from "@ledgerhq/native-ui";
import { ScrollView } from "react-native";
import { NavigatorName, ScreenName } from "../../const";
import {
  accountsCountSelector,
  hasLendEnabledAccountsSelector,
  accountsSelector,
} from "../../reducers/accounts";
import {
  discreetModeSelector,
  hasOrderedNanoSelector,
} from "../../reducers/settings";
import { Props as ModalProps } from "../BottomModal";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import TransferButton from "./TransferButton";
import BuyDeviceBanner, { IMAGE_PROPS_SMALL_NANO } from "../BuyDeviceBanner";
import SetupDeviceBanner from "../components/SetupDeviceBanner";
import { track, TrackScreen, useAnalytics } from "../../analytics";
import { useCurrentRouteName } from "../../helpers/routeHooks";

export default function TransferDrawer({ onClose }: ModalProps) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const { page } = useAnalytics();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const lendingEnabled = useSelector(hasLendEnabledAccountsSelector);
  const accounts = useSelector(accountsSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);
  const areAccountsEmpty = useMemo(() => accounts.every(isAccountEmpty), [
    accounts,
  ]);
  const currentRoute = useCurrentRouteName();
  const discreetMode = useSelector(discreetModeSelector);

  const onNavigate = useCallback(
    (name: string, options?: { [key: string]: any }) => {
      navigation.navigate(name, options);

      if (onClose) {
        onClose();
      }
    },
    [navigation, onClose],
  );

  const trackClick = useCallback(
    (buttonTitle: string) => {
      discreetMode &&
        track("button_clicked", {
          button: buttonTitle,
          screen: currentRoute,
          drawer: "trade",
        });
    },
    [currentRoute, discreetMode],
  );

  const onSendFunds = useCallback(() => {
    trackClick("Send");
    onNavigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendCoin,
    });
  }, [onNavigate, trackClick]);

  const onReceiveFunds = useCallback(() => {
    trackClick("Receive");
    onNavigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveSelectAccount,
    });
  }, [onNavigate, trackClick]);

  const onSwap = useCallback(() => {
    trackClick("Swap");
    onNavigate(NavigatorName.Swap, {
      screen: ScreenName.Swap,
    });
  }, [onNavigate, trackClick]);

  const onBuy = useCallback(() => {
    trackClick("Buy");
    onNavigate(NavigatorName.Exchange, { screen: ScreenName.ExchangeBuy });
  }, [onNavigate, trackClick]);

  const onSell = useCallback(() => {
    trackClick("Sell");
    onNavigate(NavigatorName.Exchange, { screen: ScreenName.ExchangeSell });
  }, [onNavigate, trackClick]);

  const onLending = useCallback(() => {
    trackClick("Lending");
    onNavigate(NavigatorName.Lending, {
      screen: ScreenName.LendingDashboard,
    });
  }, [onNavigate, trackClick]);

  const onManageCard = useCallback(() => {
    trackClick("Manage Card");
    onNavigate(ScreenName.PlatformApp, {
      platform: "cl-card",
      name: "CL Card Powered by Ledger",
    });
  }, [trackClick, onNavigate]);

  const buttons = (
    <>
      <Box mb={8}>
        <TransferButton
          eventProperties={{
            button: "transfer_send",
            page,
            drawer: "trade",
          }}
          title={t("transfer.send.title")}
          description={t("transfer.send.description")}
          onPress={
            accountsCount > 0 && !readOnlyModeEnabled && !areAccountsEmpty
              ? onSendFunds
              : null
          }
          Icon={Icons.ArrowTopMedium}
          disabled={readOnlyModeEnabled}
        />
      </Box>
      <Box mb={8}>
        <TransferButton
          eventProperties={{
            button: "transfer_receive",
            page,
            drawer: "trade",
          }}
          title={t("transfer.receive.title")}
          description={t("transfer.receive.description")}
          onPress={accountsCount > 0 ? onReceiveFunds : null}
          Icon={Icons.ArrowBottomMedium}
          disabled={readOnlyModeEnabled}
        />
      </Box>
      <Box mb={8}>
        <TransferButton
          eventProperties={{
            button: "transfer_buy",
            page,
            drawer: "trade",
          }}
          title={t("transfer.buy.title")}
          description={t("transfer.buy.description")}
          Icon={Icons.PlusMedium}
          onPress={onBuy}
          disabled={readOnlyModeEnabled}
        />
      </Box>
      <Box mb={8}>
        <TransferButton
          eventProperties={{
            button: "transfer_sell",
            page,
            drawer: "trade",
          }}
          title={t("transfer.sell.title")}
          description={t("transfer.sell.description")}
          Icon={Icons.MinusMedium}
          onPress={onSell}
          disabled={readOnlyModeEnabled}
        />
      </Box>
      <Box mb={8}>
        <TransferButton
          eventProperties={{
            button: "transfer_swap",
            page,
            drawer: "trade",
          }}
          title={t("transfer.swap.title")}
          description={t("transfer.swap.description")}
          Icon={Icons.BuyCryptoMedium}
          onPress={accountsCount > 0 && !readOnlyModeEnabled ? onSwap : null}
          disabled={readOnlyModeEnabled}
        />
      </Box>
      {lendingEnabled ? (
        <Box mb={8}>
          <TransferButton
            eventProperties={{
              button: "transfer_lending",
              page,
              drawer: "trade",
            }}
            title={t("transfer.lending.titleTransferTab")}
            description={t("transfer.lending.descriptionTransferTab")}
            tag={t("common.popular")}
            Icon={Icons.LendMedium}
            onPress={
              accountsCount > 0 && !readOnlyModeEnabled ? onLending : null
            }
            disabled={readOnlyModeEnabled}
          />
        </Box>
      ) : null}
      <Box>
        <TransferButton
          title={t("transfer.manageCard.title")}
          description={t("transfer.manageCard.description")}
          Icon={Icons.CardMedium}
          onPress={onManageCard}
          disabled={readOnlyModeEnabled}
        />
      </Box>
    </>
  );

  const bannerEventProperties = useMemo(
    () => ({
      banner: "You'll need a nano",
      button: "Buy a device",
      drawer: "transfer",
      page,
      screen: currentRoute,
    }),
    [page, currentRoute],
  );

  return (
    <Flex flexDirection="column" alignItems="flex-start" p={7} pt={9}>
      <TrackScreen
        category="ReadOnly"
        name="Trade"
        source={currentRoute}
        type="drawer"
      />
      <ScrollView
        alwaysBounceVertical={false}
        style={{ opacity: readOnlyModeEnabled ? 0.3 : 1, width: "100%" }}
      >
        {buttons}
      </ScrollView>
      {readOnlyModeEnabled && !hasOrderedNano && (
        <BuyDeviceBanner
          topLeft={
            <Text
              color="#6358B7"
              uppercase
              mb={3}
              fontSize="11px"
              fontWeight="semiBold"
            >
              {t("buyDevice.bannerTitle2")}
            </Text>
          }
          style={{ marginTop: 36, paddingTop: 13.5, paddingBottom: 13.5 }}
          buttonLabel={t("buyDevice.bannerButtonTitle2")}
          buttonSize="small"
          event="button_clicked"
          eventProperties={bannerEventProperties}
          {...IMAGE_PROPS_SMALL_NANO}
        />
      )}
      {readOnlyModeEnabled && hasOrderedNano ? (
        <Box mt={8} width={"100%"}>
          <SetupDeviceBanner />
        </Box>
      ) : null}
    </Flex>
  );
}
