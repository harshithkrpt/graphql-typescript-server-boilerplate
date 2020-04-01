import {
  invalidlogin,
  confirmEmailError,
  accountLockedError
} from "./error-messages";

export const errorResponse = [
  {
    path: "email",
    message: invalidlogin
  }
];

export const emailErrorResponse = [
  {
    path: "email",
    message: confirmEmailError
  }
];

export const accountLockedResponse = [
  {
    path: "email",
    message: accountLockedError
  }
];
