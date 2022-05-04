// @flow
import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { add, isBefore, parseISO } from "date-fns";
import type { Duration } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";
import { accountsCountSelector } from "../reducers/accounts";
import {
  ratingsModalOpenSelector,
  ratingsCurrentRouteNameSelector,
  ratingsHappyMomentSelector,
  ratingsDataOfUserSelector,
} from "../reducers/ratings";
import {
  setRatingsModalOpen,
  setRatingsCurrentRouteName,
  setRatingsHappyMoment,
} from "../actions/ratings";
import { languageSelector } from "../reducers/settings";
import { track } from "../analytics";

export type HappyMoment = {
    route_name: string, // Name of the route that will trigger the rating flow
    timer: number, // In milliseconds, delay before triggering the rating flow
    type: "on_enter" | "on_leave", // Wether the rating flow is triggered when entering or leaving the screen
};

const ratingsDataOfUserAsyncStorageKey = "ratingsDataOfUser";

const getCurrentRouteName = (
  state: NavigationState | Required<NavigationState["routes"][0]>["state"],
): Routes | undefined => {
  if (state.index === undefined || state.index < 0) {
    return undefined;
  }
  const nestedState = state.routes[state.index].state;
  if (nestedState !== undefined) {
    return getCurrentRouteName(nestedState);
  }
  return state.routes[state.index].name;
};

export async function getRatingsDataOfUserFromStorage() {
  const ratingsDataOfUser = await AsyncStorage.getItem(
    ratingsDataOfUserAsyncStorageKey,
  );

  return JSON.parse(ratingsDataOfUser);
}

export async function setRatingsDataOfUserInStorage(ratingsDataOfUser) {
  await AsyncStorage.setItem(
    ratingsDataOfUserAsyncStorageKey,
    JSON.stringify(ratingsDataOfUser),
  );
}

const useRatings = () => {
  const ratingsFeature = useFeature("ratings");

  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const ratingsOldRoute = useSelector(ratingsCurrentRouteNameSelector);
  const ratingsHappyMoment = useSelector(ratingsHappyMomentSelector);
  const ratingsDataOfUser = useSelector(ratingsDataOfUserSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const currAppLanguage = useSelector(languageSelector);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const setRatingsModalOpenCallback = useCallback(
    isRatingsModalOpen => {
      dispatch(setRatingsModalOpen(isRatingsModalOpen));
    },
    [dispatch],
  );

  const areRatingsConditionsMet = useCallback(() => {
    if (currAppLanguage !== "en") return false;

    if (!ratingsDataOfUser) return false;

    // criterias depending on last answer to the ratings flow
    if (ratingsDataOfUser.doNotAskAgain) return false;

    if (
      ratingsDataOfUser.dateOfNextAllowedRequest &&
      isBefore(
        Date.now(),
        typeof ratingsDataOfUser.dateOfNextAllowedRequest === "string"
          ? parseISO(ratingsDataOfUser.dateOfNextAllowedRequest)
          : ratingsDataOfUser.dateOfNextAllowedRequest,
      )
    ) {
      return false;
    }

    // minimum accounts number criteria
    const minimumAccountsNumber: number =
      ratingsFeature?.params?.conditions?.minimum_accounts_number;
    if (minimumAccountsNumber && accountsCount < minimumAccountsNumber) {
      return false;
    }

    // minimum app start number criteria
    const minimumAppStartsNumber: number =
    ratingsFeature?.params?.conditions?.minimum_app_starts_number;
    if (ratingsDataOfUser.numberOfAppStarts < minimumAppStartsNumber) {
      return false;
    }

    // duration since first app start long enough criteria
    const minimumDurationSinceAppFirstStart: Duration =
      ratingsFeature?.params?.conditions?.minimum_duration_since_app_first_start;
    const dateAllowedAfterAppFirstStart = add(
      ratingsDataOfUser?.appFirstStartDate,
      minimumDurationSinceAppFirstStart,
    );
    if (
      ratingsDataOfUser?.appFirstStartDate &&
      isBefore(Date.now(), dateAllowedAfterAppFirstStart)
    ) {
      return false;
    }

    // No crash in last session criteria
    const minimumNumberOfAppStartsSinceLastCrash: number =
      ratingsFeature?.params?.conditions?.minimum_number_of_app_starts_since_last_crash;
    if (
      ratingsDataOfUser.numberOfAppStartsSinceLastCrash <
      minimumNumberOfAppStartsSinceLastCrash
    ) {
      return false;
    }

    return true;
  }, [
    currAppLanguage,
    ratingsDataOfUser,
    accountsCount,
    ratingsFeature?.params?.conditions?.minimum_accounts_number,
    ratingsFeature?.params?.conditions?.minimum_app_starts_number,
    ratingsFeature?.params?.conditions?.minimum_duration_since_app_first_start,
    ratingsFeature?.params?.conditions?.minimum_number_of_app_starts_since_last_crash,
  ]);

  const isHappyMomentTriggered = useCallback(
    (happyMoment: HappyMoment, ratingsNewRoute?: string) =>
      (happyMoment.type === "on_enter" &&
        happyMoment.route_name === ratingsNewRoute) ||
      (happyMoment.type === "on_leave" &&
        happyMoment.route_name === ratingsOldRoute),
    [ratingsOldRoute],
  );

  const triggerRouteChange = useCallback(
    ratingsNewRoute => {
      if (!areRatingsConditionsMet()) return;

      if (ratingsHappyMoment?.timeout) {
        clearTimeout(ratingsHappyMoment?.timeout);
      }

      for (const happyMoment of ratingsFeature?.params?.happy_moments) {
        if (isHappyMomentTriggered(happyMoment, ratingsNewRoute)) {
          const timeout = setTimeout(() => {
            track("ReviewPromptStarted", { source: happyMoment.route_name });
            setRatingsModalOpenCallback(true);
          }, happyMoment.timer);
          dispatch(
            setRatingsHappyMoment({
              ...happyMoment,
              timeout,
            }),
          );
        }
      }
      dispatch(setRatingsCurrentRouteName(ratingsNewRoute));
    },
    [
      areRatingsConditionsMet,
      ratingsHappyMoment,
      dispatch,
      ratingsFeature?.params?.happy_moments,
      isHappyMomentTriggered,
      setRatingsModalOpenCallback,
    ],
  );

  useEffect(() => {
    if (!ratingsFeature?.enabled) return;

    navigation.addListener("state", e => {
      const navState = e?.data?.state;
      if (navState && navState.routeNames) {
        const currentRouteName = getCurrentRouteName(navState);
        triggerRouteChange(currentRouteName);
      }
    });

    return () => {
      navigation.removeListener("state");
    };
  }, [navigation, ratingsFeature?.enabled, triggerRouteChange]);

  return [isRatingsModalOpen, setRatingsModalOpenCallback];
};

export default useRatings;
