import {historyPush, navigationReducer, PathLocation} from "../core/services/navigation-service";
import {State} from "../state";
import {ReductionWithEffect} from "../core/reducers";
import {Effect} from "../core/services/service";
import {AuthHeaders} from "./login-reducer";
import {getCookie} from "../utils/cookies";
import {requestAjax} from "../core/services/ajax-service";
import {ApiV1UsersPath, StripePath} from "../resources/routes";
import {getLoggedInUserRequestName} from "./footer-reducer";

export type PathPart = '' | 'home' | 'sign-up' | 'chords' | 'song'

export function routerReducer(state: State,
                              location: PathLocation): ReductionWithEffect<State> {
  let effects: Effect[] = [];
  state = {...state};

  if (!state.stripe.publishableKey || state.stripe.plans.length === 0) {
    effects = effects.concat(requestAjax([getStripePublishableKeyRequestName], {
      headers: state.headers,
      url: StripePath + '/data',
      method: 'GET'
    }));
  }

  let nextPathParts: PathPart[] = location.pathname.split("/").slice(1) as PathPart[];
  if (!nextPathParts[0]) nextPathParts[0] = "home";

  switch (nextPathParts[0]) {

    case "sign-up":
      if (state.loggedInUser) {
        nextPathParts = ["home"];
        effects = effects.concat(historyPush({pathname: "home"}));
      }

      break;

    case "home":
      if (!nextPathParts[1]) nextPathParts[1] = "chords";

      if (state.loggedInUser) break;

      state.headers = {...state.headers};

      AuthHeaders.map(header => {
        let value = getCookie(header);
        if (!value) return null;
        state.headers[header] = value;
        return value;
      });
      let userId = getCookie("id");

      if(userId && Object.keys(state.headers).length === AuthHeaders.length) {
        effects.push(requestAjax([getLoggedInUserRequestName], {
          url: `${ApiV1UsersPath}/${userId}`, method: "GET", headers: state.headers
        }));
        break;
      }

      let parameters = location.search.split('&');

      parameters = parameters.filter(p => p);
      if (parameters.length === 0) break;

      parameters[0] = parameters[0].split('?')[1];
      parameters.map(param => {
        let [key, value] = param.split('=');

        if (key === "account_confirmation_success" && value) {
          state = {...state};
          state.toggles = {...state.toggles};
          state.toggles.showLogInModal = true;

          state.loginPage = {...state.loginPage};
          state.loginPage.success = {...state.loginPage.success};
          state.loginPage.success.signUp = "Account Confirmed! Try logging in now";
        }
        return param;
      });


      break;

  }


  state.pathParts = nextPathParts;

  return {state, effects};
}

export const getStripePublishableKeyRequestName = "get-stripe-publishable-key";

export const reduceNavigation = navigationReducer(routerReducer);
