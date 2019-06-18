import React from "react";
import {State} from "../state";
import {Action} from "../react-root";
import {ChordsPage} from "./layouts/chords/chords-page";
import {LoginPage} from "./layouts/login/login-page";


export function RootPage(dispatch: (action: Action) => void) {

  const ChordsContent = ChordsPage(dispatch);
  const LoginContent = LoginPage(dispatch);
  return (state: State) => {
    return (
        <div className={"vw-100 vh-100 flex flex-column overflow-hidden"}>
          {(function () {
            switch (state.pathParts[0]) {
              case "login":
                return LoginContent(state);
              case "chords":
                return ChordsContent(state);
            }
          })()}
        </div>
    );
  }
}