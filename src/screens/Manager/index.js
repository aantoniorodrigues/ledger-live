/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, Image } from "react-native";
import { withNavigationFocus } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import {
  connectingStep,
  dashboard,
  genuineCheck,
} from "../../components/SelectDevice/steps";
import SelectDevice from "../../components/SelectDevice";
import colors from "../../colors";
import ToggleManagerEdition from "./ToggleManagerEdition";
import manager from "../../logic/manager";

class Manager extends Component<{
  navigation: NavigationScreenProp<*>,
  isFocused: boolean,
}> {
  static navigationOptions = {
    title: "Manager",
    headerRight: <ToggleManagerEdition />,
  };

  onSelect = (deviceId: string, meta: Object) => {
    this.props.navigation.navigate("ManagerMain", {
      deviceId,
      meta,
    });
  };

  onStepEntered = (i: number, meta: Object) => {
    if (i === 2) {
      // Step dashboard, we preload the applist before entering manager while we're still doing the genuine check
      manager
        .getAppsList(meta.deviceInfo)
        .then(apps =>
          Promise.all(
            apps.map(app => Image.prefetch(manager.getIconUrl(app.icon))),
          ),
        )
        .catch(e => {
          console.warn(e);
        });
    }
  };

  render() {
    const { isFocused } = this.props;
    if (!isFocused) return null;
    const editMode = this.props.navigation.getParam("editMode");
    return (
      <View style={styles.root}>
        <SelectDevice
          onSelect={this.onSelect}
          editMode={editMode}
          steps={[connectingStep, dashboard, genuineCheck]}
          onStepEntered={this.onStepEntered}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default translate()(withNavigationFocus(Manager));
